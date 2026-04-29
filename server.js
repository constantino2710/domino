require('dotenv').config();
const { WebSocketServer } = require('ws');
const http = require('http');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const PORT = process.env.PORT || 8080;

const supabase = process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
  ? createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  : null;

if (!supabase) {
  console.warn('⚠ SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY não configurados — rodando sem persistência.');
}

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
  const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);

  // Endpoint de diagnóstico — mostra o que o servidor tem em memória.
  if (urlPath === '/api/rooms') {
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({
      pid: process.pid,
      uptime: Math.round(process.uptime()),
      subscribers: roomListSubscribers.size,
      rooms: Object.values(rooms).map(r => ({
        id: r.id,
        playerCount: r.players.length,
        started: r.started,
        players: r.players.map(p => p.name),
      })),
    }, null, 2));
    return;
  }

  const safePath = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const filePath = path.join(DIST, safePath === '/' || safePath === '\\' ? 'index.html' : safePath);
  const ext = path.extname(filePath).toLowerCase();

  fs.readFile(filePath, (err, data) => {
    if (err) {
      // Only fall back to index.html for SPA routes (no file extension).
      // Requests for .js/.css/etc. must return 404, not HTML — otherwise the
      // browser gets text/html where it expects a module and blocks it.
      if (ext) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
        return;
      }
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

// Salas vazias só são deletadas após esse período, pra sobreviver a reloads.
const EMPTY_ROOM_TTL_MS = 60_000;

// Sockets que querem receber updates da lista de salas (estão na tela de browse).
const roomListSubscribers = new Set();

function getRoomListPayload() {
  return {
    type: 'roomList',
    rooms: Object.values(rooms).map(r => ({
      id: r.id,
      playerCount: r.players.length,
      started: r.started,
      players: r.players.map(p => p.name),
    })),
  };
}

function broadcastRoomList() {
  const list = getRoomListPayload();
  const payload = JSON.stringify(list);
  let delivered = 0;
  for (const sub of roomListSubscribers) {
    if (sub.readyState === 1) {
      sub.send(payload);
      delivered++;
    }
  }
  console.log(`[rooms] broadcast → ${delivered}/${roomListSubscribers.size} subscribers, salas=[${list.rooms.map(r => `${r.id}(${r.playerCount}/${r.started?'started':'lobby'})`).join(', ') || '∅'}]`);
}

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
    board: [],
    boardEnds: null,  // { left, right } current open ends
    currentTurn: 0,
    started: false,
    passCount: 0,
    lastPiece: null,  // { piece: [a,b] } — last piece played (for win-type detection)
    deleteTimer: null, // setTimeout ref para deletar sala vazia após TTL
  };
}

function scheduleRoomDeletion(room) {
  if (room.deleteTimer) clearTimeout(room.deleteTimer);
  room.deleteTimer = setTimeout(() => {
    if (rooms[room.id] && rooms[room.id].players.length === 0) {
      delete rooms[room.id];
      console.log(`[rooms] deletada após TTL: "${room.id}"`);
      broadcastRoomList();
    }
  }, EMPTY_ROOM_TTL_MS);
}

function cancelRoomDeletion(room) {
  if (room.deleteTimer) {
    clearTimeout(room.deleteTimer);
    room.deleteTimer = null;
  }
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
  room.lastPiece = null;

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
  broadcastRoomList();
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
  room.lastPiece = { piece };
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
  // Determine win type and point value
  let points = 1;
  let winType = 'simple';

  if (reason === 'empty' && room.lastPiece) {
    const { piece } = room.lastPiece;
    const isCarroca = piece[0] === piece[1];
    const isLaeLou  = room.boardEnds != null &&
                      room.boardEnds.left === room.boardEnds.right;

    if (isCarroca && isLaeLou) { points = 5; winType = 'carroca_laeelou'; }
    else if (isCarroca)        { points = 2; winType = 'carroca'; }
    else if (isLaeLou)         { points = 3; winType = 'laeelou'; }
  }

  room.players[winnerIdx].score += points;

  broadcast(room, {
    type: 'roundEnd',
    winner:  room.players[winnerIdx].name,
    reason,
    points,
    winType,
    scores: room.players.map(p => ({ name: p.name, score: p.score })),
    hands:  room.players.map(p => ({ name: p.name, hand: [...p.hand] })),
  });

  room.started = false;
  broadcastRoomList();

  persistMatch(room, winnerIdx, reason, points, winType);
}

function persistMatch(room, winnerIdx, reason, points, winType) {
  if (!supabase) return;

  const winner = room.players[winnerIdx];
  const playersJson = room.players.map(p => ({
    name: p.name,
    profile_id: p.profileId,
    is_guest: p.isGuest,
    final_score: p.score,
    final_hand_sum: p.hand.reduce((s, piece) => s + piece[0] + piece[1], 0),
  }));

  supabase.from('matches').insert({
    room_id: room.id,
    winner_profile_id: winner.profileId,
    winner_name: winner.name,
    win_type: winType,
    points,
    reason,
    players: playersJson,
  }).then(({ error }) => {
    if (error) console.error('Erro salvando partida:', error.message);
  });

  for (let i = 0; i < room.players.length; i++) {
    const p = room.players[i];
    if (!p.profileId) continue;
    supabase.rpc('increment_stats', {
      p_profile_id: p.profileId,
      p_won: i === winnerIdx,
    }).then(({ error }) => {
      if (error) console.error('Erro atualizando stats:', error.message);
    });
  }
}

function nextTurn(room) {
  room.currentTurn = (room.currentTurn + 1) % room.players.length;
}

async function resolveIdentity(msg) {
  // Returns { name, profileId, isGuest } or throws an Error with user message.
  if (msg.token && supabase) {
    console.log('[auth] validando token...');
    const { data, error } = await supabase.auth.getUser(msg.token);
    if (error || !data?.user) {
      console.warn('[auth] token inválido:', error?.message || '(sem user)');
      throw new Error('Sessão inválida. Faça login novamente.');
    }
    const userId = data.user.id;
    const userEmail = data.user.email;
    const metaUsername = data.user.user_metadata?.username;
    console.log(`[auth] token ok — user_id=${userId} email=${userEmail} meta.username=${metaUsername || '(nenhum)'}`);

    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', userId)
      .maybeSingle();

    if (pErr) {
      console.error('[auth] erro ao buscar profile:', pErr.message, pErr);
      throw new Error('Erro ao buscar perfil.');
    }
    if (!profile) {
      console.warn(`[auth] profile NÃO encontrado para user_id=${userId}. ` +
        'Causa provável: migration/trigger não aplicado, ou usuário criado antes do trigger. ' +
        'Veja o backfill no SQL Editor do Supabase.');
      throw new Error('Perfil não encontrado.');
    }

    console.log(`[auth] profile ok — username=${profile.username}`);
    return { name: profile.username, profileId: profile.id, isGuest: false };
  }
  const rawName = (msg.name || 'Convidado').slice(0, 20).trim() || 'Convidado';
  console.log(`[auth] visitante — name=${rawName}`);
  return { name: rawName, profileId: null, isGuest: true };
}

wss.on('connection', ws => {
  let myRoom = null;
  let myIndex = -1;

  ws.on('message', async raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    if (msg.type === 'subscribeRooms') {
      roomListSubscribers.add(ws);
      const payload = getRoomListPayload();
      sendTo(ws, payload);
      console.log(`[rooms] novo subscriber (total=${roomListSubscribers.size}). Enviando ${payload.rooms.length} sala(s).`);
      return;
    }

    if (msg.type === 'join') {
      const roomId = (msg.room || 'default').slice(0, 30).trim() || 'default';

      let identity;
      try {
        identity = await resolveIdentity(msg);
      } catch (e) {
        sendTo(ws, { type: 'error', message: e.message });
        return;
      }

      const isNewRoom = !rooms[roomId];
      if (isNewRoom) {
        rooms[roomId] = createRoom(roomId);
        console.log(`[rooms] criada: "${roomId}" por ${identity.name}`);
      }
      const room = rooms[roomId];
      // Alguém está entrando — cancela qualquer agendamento de deleção pendente.
      cancelRoomDeletion(room);

      // Reconexão graciosa: se já existe um jogador com a mesma identidade
      // (token/profileId, ou mesmo nome pra visitantes), substitui o WS antigo
      // em vez de rejeitar. Cobre o caso de reload (Ctrl+Shift+R) onde o
      // socket antigo ainda não foi limpo.
      const existingIdx = room.players.findIndex(p =>
        (identity.profileId && p.profileId === identity.profileId) ||
        (!identity.profileId && p.name === identity.name)
      );

      if (existingIdx !== -1) {
        const existing = room.players[existingIdx];
        console.log(`[rooms] reconexão de "${identity.name}" em "${roomId}" — substituindo socket antigo`);
        // Fecha o socket zumbi pra liberar recursos (sem disparar nosso close handler com efeito colateral)
        if (existing.ws !== ws && existing.ws.readyState === 1) {
          try { existing.ws.close(); } catch {}
        }
        existing.ws = ws;
        roomListSubscribers.delete(ws);
        myRoom = room;
        myIndex = existingIdx;
        sendTo(ws, { type: 'joined', roomId, playerIndex: myIndex, name: identity.name });
        // Reenvia estado completo (lobby + state se já em jogo)
        broadcast(room, {
          type: 'lobby',
          players: room.players.map(p => p.name),
          count: room.players.length,
        });
        if (room.started) sendTo(ws, buildStateFor(room, myIndex));
        broadcastRoomList();
        return;
      }

      if (room.started) {
        sendTo(ws, { type: 'error', message: 'Partida já em andamento' });
        return;
      }
      if (room.players.length >= 4) {
        sendTo(ws, { type: 'error', message: 'Sala cheia (máx 4 jogadores)' });
        return;
      }
      if (room.players.some(p => p.name === identity.name)) {
        sendTo(ws, { type: 'error', message: 'Já existe um jogador com esse nome nesta sala' });
        return;
      }

      // Quem entra numa sala não recebe mais updates da lista global.
      roomListSubscribers.delete(ws);

      myRoom = room;
      myIndex = room.players.length;
      room.players.push({
        ws,
        name: identity.name,
        profileId: identity.profileId,
        isGuest: identity.isGuest,
        hand: [],
        score: 0,
      });

      sendTo(ws, { type: 'joined', roomId, playerIndex: myIndex, name: identity.name });
      broadcast(room, {
        type: 'lobby',
        players: room.players.map(p => p.name),
        count: room.players.length,
      });
      broadcastRoomList();
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
    roomListSubscribers.delete(ws);
    if (!myRoom) return;

    // Se o slot deste jogador já foi assumido por outra WS (reconexão graciosa),
    // não removemos — o close é do socket "zumbi" antigo.
    const slot = myRoom.players[myIndex];
    if (!slot || slot.ws !== ws) {
      console.log(`[rooms] close do socket antigo de "${myRoom.id}" ignorado (já reconectado)`);
      return;
    }

    myRoom.players.splice(myIndex, 1);
    // re-index remaining
    for (let i = 0; i < myRoom.players.length; i++)
      myRoom.players[i].ws._myIndex = i;
    if (myRoom.players.length === 0) {
      // Não deleta na hora — agenda. Se ninguém voltar em EMPTY_ROOM_TTL_MS, deleta.
      console.log(`[rooms] "${myRoom.id}" ficou vazia, deletando em ${EMPTY_ROOM_TTL_MS/1000}s`);
      scheduleRoomDeletion(myRoom);
      // Se a partida estava em andamento, encerra (não faz sentido reiniciar do nada)
      if (myRoom.started) myRoom.started = false;
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
    broadcastRoomList();
  });
});

httpServer.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`PID=${process.pid} (se aparecerem dois PIDs nos logs, há mais de uma instância)`);
});
