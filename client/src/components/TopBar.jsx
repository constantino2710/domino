import React from 'react';

const styles = {
  bar: {
    background: 'var(--green-darker)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    padding: '0 16px',
    height: '52px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexShrink: 0,
    gap: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
    zIndex: 10,
  },
  left: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontWeight: '800',
    fontSize: '1.1rem',
    color: 'var(--gold)',
    letterSpacing: '0.1em',
    flexShrink: 0,
  },
  roomTag: {
    background: 'rgba(255,255,255,0.08)',
    borderRadius: '5px',
    padding: '2px 8px',
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    flexShrink: 0,
  },
  players: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    overflow: 'hidden',
    flex: 1,
    minWidth: 0,
  },
  playerChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    background: 'rgba(255,255,255,0.07)',
    borderRadius: '20px',
    padding: '3px 10px 3px 7px',
    fontSize: '0.78rem',
    whiteSpace: 'nowrap',
    border: '1px solid transparent',
    transition: 'all 0.2s',
  },
  playerChipActive: {
    borderColor: 'var(--gold)',
    background: 'rgba(245,197,24,0.12)',
    color: 'var(--gold)',
  },
  dot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  score: {
    fontWeight: '700',
    marginLeft: '3px',
    color: 'var(--gold)',
  },
  btnLeave: {
    background: 'rgba(220,50,50,0.2)',
    color: '#ff8080',
    borderRadius: '6px',
    padding: '5px 12px',
    fontSize: '0.8rem',
    fontWeight: '600',
    border: '1px solid rgba(220,50,50,0.3)',
    flexShrink: 0,
  },
};

export default function TopBar({ players, currentTurn, roomId, onDisconnect }) {
  return (
    <div style={styles.bar}>
      <div style={styles.left}>
        <span style={styles.title}>DOMINÓ</span>
        {roomId && <span style={styles.roomTag}>#{roomId}</span>}
        <div style={styles.players}>
          {players.map((p, i) => {
            const isActive = i === currentTurn;
            return (
              <div
                key={i}
                style={{
                  ...styles.playerChip,
                  ...(isActive ? styles.playerChipActive : {}),
                }}
              >
                <span
                  style={{
                    ...styles.dot,
                    background: isActive ? 'var(--gold)' : 'rgba(255,255,255,0.3)',
                  }}
                />
                <span>{p.name}{p.isYou ? ' (você)' : ''}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  [{p.handSize}]
                </span>
                <span style={styles.score}>{p.score}</span>
              </div>
            );
          })}
        </div>
      </div>

      <button style={styles.btnLeave} onClick={onDisconnect}>
        Sair
      </button>
    </div>
  );
}
