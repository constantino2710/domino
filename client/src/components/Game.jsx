import React from 'react';
import TopBar from './TopBar.jsx';
import Board from './Board.jsx';
import Hand from './Hand.jsx';
import SideSelector from './SideSelector.jsx';
import RoundEndOverlay from './RoundEndOverlay.jsx';

const styles = {
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--green-dark)',
    overflow: 'hidden',
  },
  boardArea: {
    flex: 1,
    overflow: 'auto',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: '16px',
    minHeight: 0,
  },
  boardWrapper: {
    background: 'rgba(0,0,0,0.15)',
    borderRadius: '12px',
    padding: '12px',
    boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)',
    minWidth: '100%',
    overflow: 'hidden',
  },
  turnBanner: {
    textAlign: 'center',
    padding: '6px 16px',
    background: 'rgba(0,0,0,0.2)',
    fontSize: '0.82rem',
    color: 'var(--text-muted)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    flexShrink: 0,
  },
  turnBannerActive: {
    background: 'rgba(245,197,24,0.12)',
    color: 'var(--gold)',
    fontWeight: '700',
  },
};

export default function Game({
  board,
  boardEnds,
  currentTurn,
  players,
  hand,
  selectedPiece,
  roundEnd,
  isHost,
  myName,
  roomId,
  onSelectPiece,
  onPlayPiece,
  onPass,
  onCancelSelection,
  onPlayAgain,
  onDisconnect,
}) {
  const me = players.find(p => p.isYou);
  const isMyTurn = me && players[currentTurn]?.isYou;
  const currentPlayerName = players[currentTurn]?.name || '?';

  const bannerStyle = isMyTurn
    ? { ...styles.turnBanner, ...styles.turnBannerActive }
    : styles.turnBanner;

  return (
    <div style={styles.root}>
      <TopBar
        players={players}
        currentTurn={currentTurn}
        roomId={roomId}
        onDisconnect={onDisconnect}
      />

      <div style={bannerStyle}>
        {isMyTurn
          ? 'Sua vez — selecione uma peça da sua mão'
          : `Vez de ${currentPlayerName}...`}
      </div>

      <div style={styles.boardArea}>
        <div style={styles.boardWrapper}>
          <Board board={board} boardEnds={boardEnds} />
        </div>
      </div>

      <Hand
        hand={hand}
        selectedPiece={selectedPiece}
        boardEnds={boardEnds}
        isMyTurn={isMyTurn}
        onSelectPiece={onSelectPiece}
        onPass={onPass}
      />

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
    </div>
  );
}
