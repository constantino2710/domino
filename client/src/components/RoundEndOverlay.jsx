import React from 'react';

const REASON_LABELS = {
  empty: 'Mão vazia',
  blocked: 'Jogo bloqueado',
};

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.72)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 200,
    backdropFilter: 'blur(4px)',
  },
  card: {
    background: 'var(--green-darker)',
    borderRadius: '18px',
    padding: '36px 40px',
    minWidth: '320px',
    maxWidth: '480px',
    width: '90vw',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  trophy: {
    fontSize: '3rem',
    lineHeight: 1,
  },
  winnerName: {
    fontSize: '1.6rem',
    fontWeight: '800',
    color: 'var(--gold)',
    textAlign: 'center',
  },
  winnerSub: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    marginTop: '-10px',
    textAlign: 'center',
  },
  reasonBadge: {
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '4px 14px',
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
    letterSpacing: '0.05em',
  },
  pointsBadge: {
    background: 'rgba(245,197,24,0.15)',
    border: '1px solid rgba(245,197,24,0.4)',
    borderRadius: '8px',
    padding: '8px 20px',
    fontSize: '1.1rem',
    fontWeight: '700',
    color: 'var(--gold)',
  },
  divider: {
    width: '100%',
    borderTop: '1px solid rgba(255,255,255,0.1)',
  },
  tableTitle: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    alignSelf: 'flex-start',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '5px 8px',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
    textTransform: 'uppercase',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  td: {
    padding: '8px',
    fontSize: '0.9rem',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  tdScore: {
    padding: '8px',
    fontSize: '0.9rem',
    fontWeight: '700',
    color: 'var(--gold)',
    textAlign: 'right',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  btnPlayAgain: {
    marginTop: '8px',
    padding: '12px 32px',
    borderRadius: '10px',
    background: 'var(--gold)',
    color: '#1a1a00',
    fontWeight: '800',
    fontSize: '1rem',
    boxShadow: '0 2px 10px rgba(245,197,24,0.35)',
    border: 'none',
  },
  btnWaiting: {
    marginTop: '8px',
    padding: '10px 24px',
    borderRadius: '10px',
    background: 'rgba(255,255,255,0.07)',
    color: 'var(--text-muted)',
    fontWeight: '600',
    fontSize: '0.9rem',
    border: '1px solid rgba(255,255,255,0.1)',
    cursor: 'default',
  },
};

export default function RoundEndOverlay({ roundEnd, isHost, onPlayAgain }) {
  if (!roundEnd) return null;

  const { winner, reason, points, scores } = roundEnd;
  const reasonLabel = REASON_LABELS[reason] || reason;

  // Sort scores descending
  const sortedScores = [...scores].sort((a, b) => b.score - a.score);

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <div style={styles.trophy}>🏆</div>

        <div style={styles.winnerName}>{winner}</div>
        <div style={styles.winnerSub}>venceu a rodada!</div>

        <div style={styles.reasonBadge}>{reasonLabel}</div>

        {points > 0 && (
          <div style={styles.pointsBadge}>
            +{points} {points === 1 ? 'ponto' : 'pontos'}
          </div>
        )}

        <div style={styles.divider} />
        <div style={styles.tableTitle}>Placar geral</div>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Jogador</th>
              <th style={{ ...styles.th, textAlign: 'right' }}>Pontos</th>
            </tr>
          </thead>
          <tbody>
            {sortedScores.map((entry, i) => (
              <tr
                key={i}
                style={{
                  background: entry.name === winner
                    ? 'rgba(245,197,24,0.07)'
                    : 'transparent',
                }}
              >
                <td style={styles.td}>
                  {i === 0 && (
                    <span style={{ marginRight: '6px', fontSize: '0.85rem' }}>🥇</span>
                  )}
                  {i === 1 && (
                    <span style={{ marginRight: '6px', fontSize: '0.85rem' }}>🥈</span>
                  )}
                  {i >= 2 && (
                    <span style={{ marginRight: '6px', opacity: 0.4, fontSize: '0.85rem' }}>  </span>
                  )}
                  {entry.name}
                </td>
                <td style={styles.tdScore}>{entry.score}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {isHost ? (
          <button
            style={styles.btnPlayAgain}
            onClick={onPlayAgain}
            onMouseEnter={e => (e.currentTarget.style.background = '#d4a800')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--gold)')}
          >
            Jogar Novamente
          </button>
        ) : (
          <div style={styles.btnWaiting}>
            Aguardando host iniciar nova rodada...
          </div>
        )}
      </div>
    </div>
  );
}
