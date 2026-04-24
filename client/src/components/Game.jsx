import { useRef, useEffect, useState, useCallback } from 'react';
import TopBar from './TopBar.jsx';
import Board from './Board.jsx';
import Hand from './Hand.jsx';
import OpponentsArea from './OpponentsArea.jsx';
import SideSelector from './SideSelector.jsx';
import RoundEndOverlay from './RoundEndOverlay.jsx';
import FlyingTile from './FlyingTile.jsx';

export default function Game({
  board, boardEnds, currentTurn, players, hand,
  selectedPiece, roundEnd, isHost, myName, roomId,
  onSelectPiece, onPlayPiece, onPass, onCancelSelection, onPlayAgain, onDisconnect,
}) {
  const me          = players.find(p => p.isYou);
  const isMyTurn    = !!(me && players[currentTurn]?.isYou);
  const currentName = players[currentTurn]?.name || '?';

  const boardRef           = useRef(null);   // exposes getPieceScreenRect
  const pendingAnimRef     = useRef(null);   // { piece, fromRect } — our own play
  const opponentTileRefs   = useRef({});     // { playerIdx: DOMElement }
  const prevBoardRef       = useRef([]);
  const prevCurrentTurnRef = useRef(0);
  const [flyAnim, setFlyAnim] = useState(null);

  const handleOpponentTilesRef = useCallback((idx, el) => {
    opponentTileRefs.current[idx] = el;
  }, []);

  const handleSelectPiece = (piece, fromRect) => {
    pendingAnimRef.current = { piece, fromRect };
    onSelectPiece(piece);
  };

  useEffect(() => {
    const prevBoard = prevBoardRef.current;
    const prevTurn  = prevCurrentTurnRef.current;

    if (board.length > prevBoard.length) {
      // Detect whether the new piece was added to the left or right end
      const addedLeft =
        prevBoard.length > 0 &&
        (board[0].piece[0] !== prevBoard[0].piece[0] ||
         board[0].piece[1] !== prevBoard[0].piece[1]);
      const newIdx = addedLeft ? 0 : board.length - 1;

      // Get exact screen rect of that piece from the Board canvas
      const toRect = boardRef.current?.getPieceScreenRect(newIdx);

      if (pendingAnimRef.current) {
        // ── Our piece ────────────────────────────────────────────────
        const { piece, fromRect } = pendingAnimRef.current;
        if (fromRect && toRect) setFlyAnim({ piece, fromRect, toRect, faceDown: false });
        pendingAnimRef.current = null;
      } else {
        // ── Opponent piece ───────────────────────────────────────────
        const tilesEl = opponentTileRefs.current[prevTurn];
        if (tilesEl && toRect) {
          setFlyAnim({ piece: null, fromRect: tilesEl.getBoundingClientRect(), toRect, faceDown: true });
        }
      }
    }

    prevBoardRef.current       = board;
    prevCurrentTurnRef.current = currentTurn;
  }, [board, currentTurn]);

  return (
    <div style={S.root}>
      <TopBar
        players={players}
        currentTurn={currentTurn}
        roomId={roomId}
        onDisconnect={onDisconnect}
      />

      <div style={S.banner(isMyTurn)}>
        {isMyTurn ? '🎯 Sua vez — selecione uma peça' : `Vez de ${currentName}…`}
      </div>

      <div style={S.main}>
        <OpponentsArea
          players={players}
          currentTurn={currentTurn}
          onTilesRef={handleOpponentTilesRef}
        />

        <div style={S.boardArea}>
          <Board ref={boardRef} board={board} boardEnds={boardEnds} />
        </div>

        <Hand
          hand={hand}
          selectedPiece={selectedPiece}
          boardEnds={boardEnds}
          isMyTurn={isMyTurn}
          onSelectPiece={handleSelectPiece}
          onPass={onPass}
        />
      </div>

      {selectedPiece && (
        <SideSelector
          piece={selectedPiece}
          boardEnds={boardEnds}
          onPlay={onPlayPiece}
          onCancel={onCancelSelection}
        />
      )}

      {roundEnd && (
        <RoundEndOverlay
          roundEnd={roundEnd}
          isHost={isHost}
          onPlayAgain={onPlayAgain}
        />
      )}

      {flyAnim && (
        <FlyingTile
          piece={flyAnim.piece}
          fromRect={flyAnim.fromRect}
          toRect={flyAnim.toRect}
          faceDown={flyAnim.faceDown}
          onDone={() => setFlyAnim(null)}
        />
      )}
    </div>
  );
}

const S = {
  root: {
    height:        '100%',
    display:       'flex',
    flexDirection: 'column',
    background:    'var(--green-dark)',
    overflow:      'hidden',
  },
  banner: (myTurn) => ({
    textAlign:    'center',
    padding:      '5px 16px',
    background:   myTurn ? 'rgba(245,197,24,0.12)' : 'rgba(0,0,0,0.2)',
    fontSize:     '0.82rem',
    color:        myTurn ? 'var(--gold)' : 'var(--text-muted)',
    fontWeight:   myTurn ? '700' : '400',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    flexShrink:   0,
  }),
  main: {
    flex:          1,
    display:       'flex',
    flexDirection: 'column',
    overflow:      'hidden',
    minHeight:     0,
  },
  boardArea: {
    flex:      1,
    minHeight: 0,
    display:   'flex',
    overflow:  'hidden',
  },
};
