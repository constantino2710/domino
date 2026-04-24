import { useCallback, useEffect, useRef, useState } from 'react';

const RECONNECT_DELAY = 2000;
const MAX_RECONNECT = 5;

function getWsUrl() {
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  return `${proto}://${location.host}/ws`;
}

export default function useGame() {
  // Connection
  const wsRef = useRef(null);
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef(null);
  const intentionalClose = useRef(false);

  // Identity
  const [playerIndex, setPlayerIndex] = useState(-1);
  const [isHost, setIsHost] = useState(false);
  const [myName, setMyName] = useState('');
  const [roomId, setRoomId] = useState('');

  // UI phase
  const [phase, setPhase] = useState('connect'); // connect | lobby | game
  const [connected, setConnected] = useState(false);

  // Lobby
  const [lobbyPlayers, setLobbyPlayers] = useState([]);

  // Game state (from 'state' messages)
  const [board, setBoard] = useState([]);
  const [boardEnds, setBoardEnds] = useState(null);
  const [currentTurn, setCurrentTurn] = useState(0);
  const [players, setPlayers] = useState([]);
  const [hand, setHand] = useState([]);

  // Round end
  const [roundEnd, setRoundEnd] = useState(null); // { winner, reason, points, scores }

  // Piece selection
  const [selectedPiece, setSelectedPiece] = useState(null); // [a,b] awaiting side choice

  // Notifications
  const [notifications, setNotifications] = useState([]);
  const notifIdRef = useRef(0);

  const notify = useCallback((message, type = 'info') => {
    const id = ++notifIdRef.current;
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 3500);
  }, []);

  const dismissNotif = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // --- WebSocket send helper ---
  const send = useCallback((msg) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // --- Connect ---
  const connect = useCallback((name, room) => {
    if (wsRef.current) {
      intentionalClose.current = true;
      wsRef.current.close();
    }
    intentionalClose.current = false;
    reconnectCount.current = 0;

    const ws = new WebSocket(getWsUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      reconnectCount.current = 0;
      ws.send(JSON.stringify({ type: 'join', name, room }));
    };

    ws.onmessage = (evt) => {
      let msg;
      try { msg = JSON.parse(evt.data); } catch { return; }
      handleMessage(msg);
    };

    ws.onerror = () => {
      setConnected(false);
    };

    ws.onclose = () => {
      setConnected(false);
      if (intentionalClose.current) return;
      if (reconnectCount.current < MAX_RECONNECT) {
        reconnectCount.current++;
        reconnectTimer.current = setTimeout(() => {
          connect(name, room);
        }, RECONNECT_DELAY);
      } else {
        notify('Conexão perdida com o servidor.', 'error');
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notify]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleMessage = useCallback((msg) => {
    switch (msg.type) {
      case 'joined':
        setPlayerIndex(msg.playerIndex);
        setIsHost(msg.playerIndex === 0);
        setMyName(msg.name);
        setRoomId(msg.roomId);
        setPhase('lobby');
        break;

      case 'lobby':
        setLobbyPlayers(msg.players);
        break;

      case 'started':
        setPhase('game');
        setRoundEnd(null);
        setSelectedPiece(null);
        break;

      case 'state':
        setBoard(msg.board);
        setBoardEnds(msg.boardEnds);
        setCurrentTurn(msg.currentTurn);
        setPlayers(msg.players);
        setHand(msg.hand);
        if (!msg.started) {
          setPhase('lobby');
        }
        break;

      case 'passed':
        notify(`${msg.player} passou a vez.`, 'info');
        break;

      case 'roundEnd':
        setRoundEnd(msg);
        break;

      case 'playerLeft':
        setLobbyPlayers(msg.players);
        if (phase === 'game') {
          notify('Um jogador saiu. A partida foi encerrada.', 'error');
          setPhase('lobby');
        }
        break;

      case 'error':
        notify(msg.message, 'error');
        break;

      default:
        break;
    }
  // phase is captured via closure; we reference it below safely
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notify]);

  // Keep handleMessage reference fresh for the ws.onmessage callback
  const handleMessageRef = useRef(handleMessage);
  useEffect(() => { handleMessageRef.current = handleMessage; }, [handleMessage]);

  // Wire onmessage to always use latest handler
  useEffect(() => {
    if (!wsRef.current) return;
    wsRef.current.onmessage = (evt) => {
      let msg;
      try { msg = JSON.parse(evt.data); } catch { return; }
      handleMessageRef.current(msg);
    };
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      intentionalClose.current = true;
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // --- Game actions ---
  const startGame = useCallback(() => {
    send({ type: 'start' });
  }, [send]);

  const playPiece = useCallback((piece, side) => {
    send({ type: 'play', piece, side });
    setSelectedPiece(null);
  }, [send]);

  const passTurn = useCallback(() => {
    send({ type: 'pass' });
  }, [send]);

  const playAgain = useCallback(() => {
    send({ type: 'playAgain' });
    setRoundEnd(null);
    setSelectedPiece(null);
  }, [send]);

  // --- Piece selection logic ---
  const selectPiece = useCallback((piece) => {
    // Find the player marked as isYou
    const me = players.find(p => p.isYou);
    const myTurn = me && players[currentTurn]?.isYou;

    if (!myTurn) {
      notify('Não é sua vez!', 'error');
      return;
    }

    if (!boardEnds) {
      // First piece of the round — play immediately
      playPiece(piece, 'right');
      return;
    }

    const fitsLeft =
      piece[0] === boardEnds.left || piece[1] === boardEnds.left;
    const fitsRight =
      piece[0] === boardEnds.right || piece[1] === boardEnds.right;

    if (!fitsLeft && !fitsRight) {
      notify('Esta peça não encaixa em nenhum lado!', 'error');
      return;
    }

    if (fitsLeft && fitsRight) {
      // Ambiguous — ask player to choose
      setSelectedPiece(piece);
      return;
    }

    playPiece(piece, fitsLeft ? 'left' : 'right');
  }, [players, currentTurn, boardEnds, playPiece, notify]);

  const cancelSelection = useCallback(() => {
    setSelectedPiece(null);
  }, []);

  const disconnect = useCallback(() => {
    intentionalClose.current = true;
    clearTimeout(reconnectTimer.current);
    if (wsRef.current) wsRef.current.close();
    // Reset state
    setPhase('connect');
    setConnected(false);
    setPlayerIndex(-1);
    setIsHost(false);
    setMyName('');
    setRoomId('');
    setLobbyPlayers([]);
    setBoard([]);
    setBoardEnds(null);
    setCurrentTurn(0);
    setPlayers([]);
    setHand([]);
    setRoundEnd(null);
    setSelectedPiece(null);
  }, []);

  return {
    // state
    phase,
    connected,
    playerIndex,
    isHost,
    myName,
    roomId,
    lobbyPlayers,
    board,
    boardEnds,
    currentTurn,
    players,
    hand,
    roundEnd,
    selectedPiece,
    notifications,
    // actions
    connect,
    startGame,
    selectPiece,
    playPiece,
    passTurn,
    playAgain,
    cancelSelection,
    dismissNotif,
    disconnect,
  };
}
