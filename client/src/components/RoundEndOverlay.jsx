import { useState, useEffect } from 'react';
import Tile from './Tile.jsx';

const WIN_TYPE_LABEL = {
  simple:          { text: 'Batida',                 pts: 1, color: 'var(--text-muted)' },
  carroca:         { text: 'Carroça!',               pts: 2, color: '#a78bfa' },
  laeelou:         { text: 'Lá e lô!',               pts: 3, color: '#34d399' },
  carroca_laeelou: { text: 'Carroça de lá e lô!',    pts: 5, color: '#f5c518' },
};

const REVEAL_SECONDS = 5;

// ── Phase 1: reveal all hands ─────────────────────────────────────────────────
function RevealPhase({ hands, winner, onDone }) {
  const [remaining, setRemaining] = useState(REVEAL_SECONDS);

  useEffect(() => {
    if (remaining <= 0) { onDone(); return; }
    const t = setTimeout(() => setRemaining(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [remaining, onDone]);

  return (
    <div style={S.overlay}>
      <div style={{ ...S.card, maxWidth: '600px' }}>
        <div style={S.revealTitle}>🂠 Pedras de todos</div>

        <div style={S.handsList}>
          {hands.map(({ name, hand }) => (
            <div key={name} style={S.handRow}>
              <div style={S.handName(name === winner)}>
                {name === winner && '🏆 '}{name}
              </div>
              <div style={S.handTiles}>
                {hand.length === 0
                  ? <span style={S.bateu}>✓ Bateu!</span>
                  : hand.map((piece, i) => (
                      <Tile key={i} piece={piece} vertical size={0.75} />
                    ))
                }
              </div>
            </div>
          ))}
        </div>

        <button style={S.btnReveal} onClick={onDone}>
          Ver resultado ({remaining}s)
        </button>
      </div>
    </div>
  );
}

// ── Phase 2: result ───────────────────────────────────────────────────────────
function ResultPhase({ roundEnd, isHost, onPlayAgain }) {
  const { winner, reason, points, winType = 'simple', scores } = roundEnd;
  const wt = WIN_TYPE_LABEL[winType] || WIN_TYPE_LABEL.simple;
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  return (
    <div style={S.overlay}>
      <div style={S.card}>
        <div style={S.trophy}>🏆</div>
        <div style={S.winnerName}>{winner}</div>
        <div style={S.winnerSub}>venceu a rodada!</div>

        <div style={S.winTypeBadge(wt.color)}>
          {wt.text}
        </div>

        <div style={S.pointsBadge}>
          +{points} {points === 1 ? 'ponto' : 'pontos'}
        </div>

        {reason === 'blocked' && (
          <div style={S.reasonNote}>Jogo bloqueado — menor soma</div>
        )}

        <div style={S.divider} />
        <div style={S.tableTitle}>Placar geral</div>

        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Jogador</th>
              <th style={{ ...S.th, textAlign: 'right' }}>Pontos</th>
            </tr>
          </thead>
          <tbody>
            {sortedScores.map((entry, i) => (
              <tr key={i} style={{ background: entry.name === winner ? 'rgba(245,197,24,0.07)' : 'transparent' }}>
                <td style={S.td}>
                  {['🥇','🥈','🥉'][i] ?? ''} {entry.name}
                </td>
                <td style={S.tdScore}>{entry.score}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {isHost
          ? <button style={S.btnPlay} onClick={onPlayAgain}
              onMouseEnter={e => e.currentTarget.style.background = '#d4a800'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--gold)'}>
              Jogar Novamente
            </button>
          : <div style={S.btnWait}>Aguardando host…</div>
        }
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function RoundEndOverlay({ roundEnd, isHost, onPlayAgain }) {
  const [phase, setPhase] = useState('reveal');

  // Reset to reveal phase when a new round ends
  useEffect(() => { setPhase('reveal'); }, [roundEnd]);

  if (!roundEnd) return null;

  const hands = roundEnd.hands ?? roundEnd.scores.map(s => ({ name: s.name, hand: [] }));

  if (phase === 'reveal') {
    return (
      <RevealPhase
        hands={hands}
        winner={roundEnd.winner}
        onDone={() => setPhase('result')}
      />
    );
  }

  return (
    <ResultPhase
      roundEnd={roundEnd}
      isHost={isHost}
      onPlayAgain={onPlayAgain}
    />
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  overlay: {
    position:       'fixed',
    inset:          0,
    background:     'rgba(0,0,0,0.78)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    zIndex:         200,
    backdropFilter: 'blur(4px)',
  },
  card: {
    background:    'var(--green-darker)',
    borderRadius:  '18px',
    padding:       '32px 36px',
    minWidth:      '320px',
    maxWidth:      '480px',
    width:         '92vw',
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'center',
    gap:           '14px',
    boxShadow:     'var(--shadow-lg)',
    border:        '1px solid rgba(255,255,255,0.1)',
    maxHeight:     '90vh',
    overflowY:     'auto',
  },

  // Reveal phase
  revealTitle: {
    fontSize:   '1.2rem',
    fontWeight: 800,
    color:      'var(--gold)',
  },
  handsList: {
    width:         '100%',
    display:       'flex',
    flexDirection: 'column',
    gap:           '14px',
  },
  handRow: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '6px',
  },
  handName: (isWinner) => ({
    fontSize:   '0.8rem',
    fontWeight: 700,
    color:      isWinner ? '#f5c518' : 'rgba(255,255,255,0.7)',
  }),
  handTiles: {
    display:    'flex',
    flexWrap:   'wrap',
    gap:        '5px',
    alignItems: 'flex-end',
  },
  bateu: {
    fontSize:  '0.85rem',
    color:     '#34d399',
    fontWeight: 700,
  },
  btnReveal: {
    padding:      '10px 28px',
    borderRadius: '10px',
    background:   'var(--gold)',
    color:        '#1a1a00',
    fontWeight:   800,
    fontSize:     '0.95rem',
    border:       'none',
    cursor:       'pointer',
    marginTop:    '4px',
  },

  // Result phase
  trophy:     { fontSize: '3rem', lineHeight: 1 },
  winnerName: { fontSize: '1.5rem', fontWeight: 800, color: 'var(--gold)', textAlign: 'center' },
  winnerSub:  { fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '-8px' },

  winTypeBadge: (color) => ({
    padding:      '5px 16px',
    borderRadius: '20px',
    fontSize:     '0.85rem',
    fontWeight:   700,
    color,
    background:   'rgba(255,255,255,0.07)',
    border:       `1px solid ${color}55`,
  }),
  pointsBadge: {
    background:   'rgba(245,197,24,0.15)',
    border:       '1px solid rgba(245,197,24,0.4)',
    borderRadius: '8px',
    padding:      '7px 20px',
    fontSize:     '1.1rem',
    fontWeight:   700,
    color:        'var(--gold)',
  },
  reasonNote: {
    fontSize:  '0.75rem',
    color:     'var(--text-muted)',
    fontStyle: 'italic',
  },
  divider:    { width: '100%', borderTop: '1px solid rgba(255,255,255,0.1)' },
  tableTitle: {
    fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.08em', alignSelf: 'flex-start',
  },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: {
    textAlign: 'left', padding: '5px 8px', fontSize: '0.75rem',
    color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  td:      { padding: '8px', fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  tdScore: {
    padding: '8px', fontSize: '0.9rem', fontWeight: 700,
    color: 'var(--gold)', textAlign: 'right', borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  btnPlay: {
    marginTop: '8px', padding: '12px 32px', borderRadius: '10px',
    background: 'var(--gold)', color: '#1a1a00', fontWeight: 800,
    fontSize: '1rem', border: 'none', cursor: 'pointer',
    boxShadow: '0 2px 10px rgba(245,197,24,0.35)',
  },
  btnWait: {
    marginTop: '8px', padding: '10px 24px', borderRadius: '10px',
    background: 'rgba(255,255,255,0.07)', color: 'var(--text-muted)',
    fontWeight: 600, fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.1)',
  },
};
