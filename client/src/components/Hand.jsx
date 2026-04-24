import { useRef } from 'react';
import Tile from './Tile.jsx';

export default function Hand({ hand, selectedPiece, boardEnds, isMyTurn, onSelectPiece, onPass }) {
  const tileRefs = useRef({});

  const canPlay = (piece) => {
    if (!boardEnds) return true;
    return piece[0] === boardEnds.left  || piece[1] === boardEnds.left ||
           piece[0] === boardEnds.right || piece[1] === boardEnds.right;
  };

  const hasAnyPlay   = hand.some(canPlay);
  const isSelected   = (p) => selectedPiece && p[0] === selectedPiece[0] && p[1] === selectedPiece[1];

  const handleClick  = (piece, key) => {
    const el      = tileRefs.current[key];
    const fromRect = el ? el.getBoundingClientRect() : null;
    onSelectPiece(piece, fromRect);
  };

  return (
    <div style={S.root}>
      <div style={S.label}>
        Mão
        <span style={S.count}>{hand.length}</span>
      </div>

      <div style={S.tiles}>
        {hand.map((piece, i) => {
          const key      = `${piece[0]}-${piece[1]}-${i}`;
          const playable = isMyTurn && canPlay(piece);
          return (
            <div key={key} ref={el => { tileRefs.current[key] = el; }} style={S.tileWrap}>
              <Tile
                piece={piece}
                selected={isSelected(piece)}
                dimmed={isMyTurn && !playable}
                onClick={playable ? () => handleClick(piece, key) : undefined}
                size={1}
                vertical
              />
            </div>
          );
        })}
      </div>

      {isMyTurn && !hasAnyPlay && (
        <button style={S.passBtn} onClick={onPass}>Passar</button>
      )}

      {!isMyTurn && (
        <div style={S.waiting}>Aguardando…</div>
      )}
    </div>
  );
}

const S = {
  root: {
    flexShrink:     0,
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            '8px',
    padding:        '10px 12px',
    background:     'var(--green-darker)',
    borderTop:      '1px solid rgba(255,255,255,0.08)',
  },
  label: {
    fontSize:      '0.65rem',
    fontWeight:    '700',
    color:         'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    textAlign:     'center',
    display:       'flex',
    gap:           '6px',
    alignItems:    'center',
  },
  count: {
    fontSize:   '0.85rem',
    fontWeight: '700',
    color:      'var(--gold)',
  },
  tiles: {
    display:        'flex',
    flexDirection:  'row',
    flexWrap:       'wrap',
    gap:            '7px',
    justifyContent: 'center',
    alignItems:     'flex-end',
  },
  tileWrap: {
    display:    'flex',
    transition: 'transform 0.15s',
  },
  passBtn: {
    padding:      '6px 20px',
    borderRadius: '6px',
    background:   'rgba(255,100,100,0.2)',
    color:        '#ff8080',
    fontWeight:   '600',
    fontSize:     '0.8rem',
    border:       '1px solid rgba(255,100,100,0.3)',
    cursor:       'pointer',
  },
  waiting: {
    fontSize:  '0.75rem',
    color:     'var(--text-muted)',
    fontStyle: 'italic',
  },
};
