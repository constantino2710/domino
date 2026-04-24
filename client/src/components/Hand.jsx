import React from 'react';
import Tile from './Tile.jsx';

const styles = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 16px',
    background: 'var(--green-darker)',
    borderTop: '1px solid rgba(255,255,255,0.08)',
    flexShrink: 0,
  },
  label: {
    fontSize: '0.72rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  tilesRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    justifyContent: 'center',
    alignItems: 'center',
  },
  passBtn: {
    marginTop: '4px',
    padding: '6px 20px',
    borderRadius: '6px',
    background: 'rgba(255,100,100,0.2)',
    color: '#ff8080',
    fontWeight: '600',
    fontSize: '0.85rem',
    border: '1px solid rgba(255,100,100,0.3)',
  },
  notYourTurn: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
    marginTop: '2px',
  },
};

export default function Hand({
  hand,
  selectedPiece,
  boardEnds,
  isMyTurn,
  onSelectPiece,
  onPass,
}) {
  // Determine which pieces can be played
  const canPlayPiece = (piece) => {
    if (!boardEnds) return true; // first piece
    return (
      piece[0] === boardEnds.left ||
      piece[1] === boardEnds.left ||
      piece[0] === boardEnds.right ||
      piece[1] === boardEnds.right
    );
  };

  const hasAnyPlay = hand.some(canPlayPiece);
  const isSelected = (piece) =>
    selectedPiece && piece[0] === selectedPiece[0] && piece[1] === selectedPiece[1];

  return (
    <div style={styles.root}>
      <div style={styles.label}>
        Sua mão ({hand.length} {hand.length === 1 ? 'peça' : 'peças'})
        {isMyTurn && ' — sua vez!'}
      </div>

      <div style={styles.tilesRow}>
        {hand.map((piece, i) => {
          const playable = isMyTurn && canPlayPiece(piece);
          return (
            <Tile
              key={`${piece[0]}-${piece[1]}-${i}`}
              piece={piece}
              selected={isSelected(piece)}
              dimmed={isMyTurn && !playable}
              onClick={playable ? () => onSelectPiece(piece) : undefined}
              size={0.95}
              vertical={false}
            />
          );
        })}
      </div>

      {isMyTurn && !hasAnyPlay && (
        <button style={styles.passBtn} onClick={onPass}>
          Passar vez
        </button>
      )}

      {!isMyTurn && (
        <div style={styles.notYourTurn}>Aguardando outros jogadores...</div>
      )}
    </div>
  );
}
