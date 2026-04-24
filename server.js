const { WebSocketServer } = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;

const DIST = path.join(__dirname, 'client', 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.png':  'image/png',
  '.woff2':'font/woff2',
};

const httpServer = http.createServer((req, res) => {
  let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url);
  const ext = path.extname(filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // SPA fallback
      fs.readFile(path.join(DIST, 'index.html'), (err2, html) => {
        if (err2) { res.writeHead(404); res.end('Not found'); return; }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
      });
      return;
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

// rooms: { roomId: Room }
const rooms = {};

function createDeck() {
  const deck = [];
  for (let i = 0; i <= 6; i++)
    for (let j = i; j <= 6; j++)
      deck.push([i, j]);
  return shuffle(deck);
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function createRoom(id) {
  return {
    id,
    players: [],      // { ws, name, hand, score }
    board: [],        // { piece, flipped, x, y } — for layout
    boardEnds: null,  // { left, right } current open ends
    currentTurn: 0,
    started: false,
    passCount: 0,
  };
}

function broadcast(room, msg) {
  for (const p of room.players)
    if (p.ws.readyState === 1)
      p.ws.send(JSON.stringify(msg));
}

function sendTo(ws, msg) {
  if (ws.readyState === 1) ws.send(JSON.stringify(msg));
}

function buildStateFor(room, playerIndex) {
  return {
    type: 'state',
    board: room.board,
    boardEnds: room.boardEnds,
    currentTurn: room.currentTurn,
    players: room.players.map((p, i) => ({
      name: p.name,
      handSize: p.hand.length,
      score: p.score,
      isYou: i === playerIndex,
    })),
    hand: room.players[playerIndex].hand,
    started: room.started,
  };
}

function sendState(room) {
  for (let i = 0; i < room.players.length; i++)
    sendTo(room.players[i].ws, buildStateFor(room, i));
}

function startGame(room) {
  const deck = createDeck();
  const handSize = room.players.length <= 2 ? 7 : 7;
  for (const p of room.players) {
    p.hand = deck.splice(0, handSize);
    p.score = 0;
  }
  room.board = [];
  room.boardEnds = null;
  room.started = true;
  room.passCount = 0;

  // player with [6,6] starts, else [5,5], etc.
  let startPlayer = 0;
  outer:
  for (let d = 6; d >= 0; d--) {
    for (let pi = 0; pi < room.players.length; pi++) {
      if (room.players[pi].hand.some(p => p[0] === d && p[1] === d)) {
        startPlayer = pi;
        break outer;
      }
    }
  }
  room.currentTurn = startPlayer;

  broadcast(room, { type: 'started', playerCount: room.players.length });
  sendState(room);
}

function canPlay(hand, boardEnds) {
  if (!boardEnds) return true;
  return hand.some(p =>
    p[0] === boardEnds.left || p[1] === boardEnds.left ||
    p[0] === boardEnds.right || p[1] === boardEnds.right
  );
}

function placePiece(room, playerIndex, piece, side) {
  const player = room.players[playerIndex];
  const handIdx = player.hand.findIndex(p => p[0] === piece[0] && p[1] === piece[1]);
  if (handIdx === -1) return { ok: false, error: 'Peça não encontrada na mão' };

  if (!room.boardEnds) {
    // first piece
    room.board.push({ piece, flipped: false });
    room.boardEnds = { left: piece[0], right: piece[1] };
  } else {
    if (side === 'left') {
      const end = room.boardEnds.left;
      let flipped = false;
      if (piece[1] === end) {
        room.boardEnds.left = piece[0];
        flipped = false;
      } else if (piece[0] === end) {
        room.boardEnds.left = piece[1];
        flipped = true;
      } else {
        return { ok: false, error: 'Peça não encaixa nesse lado' };
      }
      room.board.unshift({ piece, flipped });
    } else {
      const end = room.boardEnds.right;
      let flipped = false;
      if (piece[0] === end) {
        room.boardEnds.right = piece[1];
        flipped = false;
      } else if (piece[1] === end) {
        room.boardEnds.right = piece[0];
        flipped = true;
      } else {
        return { ok: false, error: 'Peça não encaixa nesse lado' };
      }
      room.board.push({ piece, flipped });
    }
  }

  player.hand.splice(handIdx, 1);
  room.passCount = 0;
  return { ok: true };
}

function checkEndRound(room) {
  // someone emptied hand
  for (let i = 0; i < room.players.length; i++) {
    if (room.players[i].hand.length === 0) {
      endRound(room, i, 'empty');
      return true;
    }
  }
  // all passed consecutively (blocked)
  if (room.passCount >= room.players.length) {
    // lowest sum wins
    let minSum = Infinity, winner = 0;
    for (let i = 0; i < room.players.length; i++) {
      const sum = room.players[i].hand.reduce((s, p) => s + p[0] + p[1], 0);
      if (sum < minSum) { minSum = sum; winner = i; }
    }
    endRound(room, winner, 'blocked');
    return true;
  }
  return false;
}

function endRound(room, winnerIdx, reason) {
  // winner scores sum of all other hands
  let points = 0;
  for (let i = 0; i < room.players.length; i++) {
    if (i !== winnerIdx)
      points += room.players[i].hand.reduce((s, p) => s + p[0] + p[1], 0);
  }
  room.players[winnerIdx].score += points;

  broadcast(room, {
    type: 'roundEnd',
    winner: room.players[winnerIdx].name,
    reason,
    points,
    scores: room.players.map(p => ({ name: p.name, score: p.score })),
  });

  room.started = false;
}

function nextTurn(room) {
  room.currentTurn = (room.currentTurn + 1) % room.players.length;
}

wss.on('connection', ws => {
  let myRoom = null;
  let myIndex = -1;

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'join') {
      const roomId = msg.room || 'default';
      const name = (msg.name || 'Jogador').slice(0, 20);

      if (!rooms[roomId]) rooms[roomId] = createRoom(roomId);
      const room = rooms[roomId];

      if (room.started) {
        sendTo(ws, { type: 'error', message: 'Partida já em andamento' });
        return;
      }
      if (room.players.length >= 4) {
        sendTo(ws, { type: 'error', message: 'Sala cheia (máx 4 jogadores)' });
        return;
      }

      myRoom = room;
      myIndex = room.players.length;
      room.players.push({ ws, name, hand: [], score: 0 });

      sendTo(ws, { type: 'joined', roomId, playerIndex: myIndex, name });
      broadcast(room, {
        type: 'lobby',
        players: room.players.map(p => p.name),
        count: room.players.length,
      });
    }

    else if (msg.type === 'start') {
      if (!myRoom || myIndex !== 0) return;
      if (myRoom.players.length < 2) {
        sendTo(ws, { type: 'error', message: 'Precisa de pelo menos 2 jogadores' });
        return;
      }
      startGame(myRoom);
    }

    else if (msg.type === 'play') {
      if (!myRoom || !myRoom.started) return;
      if (myRoom.currentTurn !== myIndex) {
        sendTo(ws, { type: 'error', message: 'Não é sua vez' });
        return;
      }
      const { piece, side } = msg;
      const result = placePiece(myRoom, myIndex, piece, side || 'right');
      if (!result.ok) {
        sendTo(ws, { type: 'error', message: result.error });
        return;
      }
      if (!checkEndRound(myRoom)) {
        nextTurn(myRoom);
        sendState(myRoom);
      }
    }

    else if (msg.type === 'pass') {
      if (!myRoom || !myRoom.started) return;
      if (myRoom.currentTurn !== myIndex) {
        sendTo(ws, { type: 'error', message: 'Não é sua vez' });
        return;
      }
      if (canPlay(myRoom.players[myIndex].hand, myRoom.boardEnds)) {
        sendTo(ws, { type: 'error', message: 'Você tem peças para jogar, não pode passar' });
        return;
      }
      myRoom.passCount++;
      broadcast(myRoom, { type: 'passed', player: myRoom.players[myIndex].name });
      if (!checkEndRound(myRoom)) {
        nextTurn(myRoom);
        sendState(myRoom);
      }
    }

    else if (msg.type === 'playAgain') {
      if (!myRoom || myRoom.started || myIndex !== 0) return;
      startGame(myRoom);
    }
  });

  ws.on('close', () => {
    if (!myRoom) return;
    myRoom.players.splice(myIndex, 1);
    // re-index remaining
    for (let i = 0; i < myRoom.players.length; i++)
      myRoom.players[i].ws._myIndex = i;
    if (myRoom.players.length === 0) {
      delete rooms[myRoom.id];
    } else {
      broadcast(myRoom, {
        type: 'playerLeft',
        players: myRoom.players.map(p => p.name),
      });
      if (myRoom.started) {
        myRoom.started = false;
        broadcast(myRoom, { type: 'error', message: 'Um jogador saiu. Partida encerrada.' });
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
