function TileBack() {
  return (
    <div style={S.tile}>
      <div style={S.half} />
      <div style={S.divider} />
      <div style={S.half} />
    </div>
  );
}

function OpponentRow({ player, isCurrentTurn, onTilesRef }) {
  return (
    <div style={S.row}>
      <div style={S.name(isCurrentTurn)}>
        {isCurrentTurn && '🎯 '}{player.name}
      </div>
      <div style={S.tiles} ref={onTilesRef}>
        {Array.from({ length: player.handSize }, (_, i) => (
          <TileBack key={i} />
        ))}
        {player.handSize === 0 && (
          <span style={S.empty}>sem peças</span>
        )}
      </div>
    </div>
  );
}

export default function OpponentsArea({ players, currentTurn, onTilesRef }) {
  const opponents = players
    .map((p, i) => ({ ...p, idx: i }))
    .filter(p => !p.isYou);

  if (opponents.length === 0) return null;

  return (
    <div style={S.root}>
      {opponents.map(p => (
        <OpponentRow
          key={p.idx}
          player={p}
          isCurrentTurn={p.idx === currentTurn}
          onTilesRef={(el) => onTilesRef?.(p.idx, el)}
        />
      ))}
    </div>
  );
}

const S = {
  root: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '6px',
    padding:       '10px 14px',
    borderBottom:  '1px solid rgba(255,255,255,0.07)',
    background:    'var(--green-darker)',
    flexShrink:    0,
  },
  row: {
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            '10px',
    flexWrap:       'wrap',
  },
  name: (active) => ({
    fontSize:    '0.72rem',
    fontWeight:  700,
    color:       active ? '#f5c518' : 'rgba(255,255,255,0.6)',
    whiteSpace:  'nowrap',
    minWidth:    '70px',
    textAlign:   'right',
    transition:  'color 0.3s',
  }),
  tiles: {
    display:    'flex',
    gap:        '5px',
    flexWrap:   'wrap',
    alignItems: 'center',
  },
  empty: {
    fontSize:  '0.65rem',
    color:     'rgba(255,255,255,0.25)',
    fontStyle: 'italic',
  },
  tile: {
    width:         '22px',
    height:        '40px',
    borderRadius:  '3px',
    border:        '1.5px solid rgba(255,255,255,0.15)',
    background:    'linear-gradient(160deg, #1d6a2f 0%, #0b3015 100%)',
    boxShadow:     '0 2px 4px rgba(0,0,0,0.45)',
    display:       'flex',
    flexDirection: 'column',
    overflow:      'hidden',
    flexShrink:    0,
  },
  half: {
    flex: 1,
  },
  divider: {
    height:     '1.5px',
    margin:     '0 3px',
    background: 'rgba(255,255,255,0.2)',
    flexShrink: 0,
  },
};
