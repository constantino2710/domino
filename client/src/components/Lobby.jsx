import React, { useState } from 'react';

const styles = {
  root: {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--green-dark)',
  },
  card: {
    background: 'var(--green-darker)',
    borderRadius: '16px',
    padding: '36px 40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    textAlign: 'center',
    color: 'var(--gold)',
    letterSpacing: '0.05em',
    marginBottom: '8px',
  },
  subtitle: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    marginBottom: '28px',
  },
  label: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '6px',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.18)',
    background: 'rgba(255,255,255,0.07)',
    color: 'var(--white)',
    fontSize: '1rem',
    outline: 'none',
    marginBottom: '16px',
    transition: 'border-color 0.15s',
  },
  btnPrimary: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    background: 'var(--gold)',
    color: '#1a1a00',
    fontWeight: '700',
    fontSize: '1rem',
    marginTop: '4px',
    boxShadow: '0 2px 8px rgba(245,197,24,0.3)',
  },
  btnDisabled: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    background: 'rgba(245,197,24,0.3)',
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
    fontSize: '1rem',
    marginTop: '4px',
    cursor: 'not-allowed',
  },
  divider: {
    borderTop: '1px solid rgba(255,255,255,0.1)',
    margin: '24px 0',
  },
  waitingTitle: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: 'var(--gold)',
    marginBottom: '4px',
  },
  roomBadge: {
    display: 'inline-block',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '6px',
    padding: '2px 10px',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginBottom: '20px',
    letterSpacing: '0.05em',
  },
  playerList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '20px',
  },
  playerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(255,255,255,0.07)',
    borderRadius: '8px',
    padding: '8px 12px',
  },
  playerDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    background: '#4caf50',
    flexShrink: 0,
  },
  playerName: {
    fontWeight: '600',
    fontSize: '0.95rem',
  },
  hostTag: {
    marginLeft: 'auto',
    fontSize: '0.7rem',
    background: 'var(--gold)',
    color: '#1a1a00',
    borderRadius: '4px',
    padding: '2px 6px',
    fontWeight: '700',
  },
  waitMsg: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.85rem',
    marginTop: '12px',
  },
  spinner: {
    display: 'inline-block',
    width: '14px',
    height: '14px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTopColor: 'var(--gold)',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    marginRight: '8px',
    verticalAlign: 'middle',
  },
};

export default function Lobby({
  phase,
  connected,
  isHost,
  lobbyPlayers,
  roomId,
  myName,
  onConnect,
  onStart,
}) {
  const [name, setName] = useState('');
  const [room, setRoom] = useState('default');
  const [joining, setJoining] = useState(false);

  const handleJoin = (e) => {
    e.preventDefault();
    const trimmedName = name.trim() || 'Jogador';
    const trimmedRoom = room.trim() || 'default';
    setJoining(true);
    onConnect(trimmedName, trimmedRoom);
  };

  const canStart = isHost && lobbyPlayers.length >= 2;

  if (phase === 'connect') {
    return (
      <div style={styles.root}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={styles.card}>
          <div style={styles.title}>DOMINÓ</div>
          <div style={styles.subtitle}>Jogo multiplayer em tempo real</div>

          <form onSubmit={handleJoin}>
            <label style={styles.label}>Seu nome</label>
            <input
              style={styles.input}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: João"
              maxLength={20}
              autoFocus
              onFocus={e => (e.target.style.borderColor = 'var(--gold)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.18)')}
            />

            <label style={styles.label}>Sala</label>
            <input
              style={styles.input}
              type="text"
              value={room}
              onChange={e => setRoom(e.target.value)}
              placeholder="Ex: sala1"
              maxLength={30}
              onFocus={e => (e.target.style.borderColor = 'var(--gold)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.18)')}
            />

            <button
              type="submit"
              style={joining ? styles.btnDisabled : styles.btnPrimary}
              disabled={joining}
            >
              {joining ? (
                <>
                  <span style={styles.spinner} />
                  Conectando...
                </>
              ) : 'Entrar na sala'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // phase === 'lobby'
  return (
    <div style={styles.root}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={styles.card}>
        <div style={styles.waitingTitle}>Aguardando jogadores</div>
        <div style={{ marginBottom: '6px' }}>
          <span style={styles.roomBadge}>Sala: {roomId}</span>
        </div>

        <ul style={styles.playerList}>
          {lobbyPlayers.map((pName, i) => (
            <li key={i} style={styles.playerItem}>
              <span style={styles.playerDot} />
              <span style={styles.playerName}>
                {pName}
                {pName === myName && (
                  <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>
                    {' '}(você)
                  </span>
                )}
              </span>
              {i === 0 && <span style={styles.hostTag}>HOST</span>}
            </li>
          ))}
        </ul>

        {isHost ? (
          <button
            style={canStart ? styles.btnPrimary : styles.btnDisabled}
            onClick={onStart}
            disabled={!canStart}
          >
            {canStart ? 'Iniciar Partida' : `Aguardando mais jogadores (${lobbyPlayers.length}/2 mínimo)`}
          </button>
        ) : (
          <p style={styles.waitMsg}>
            <span style={styles.spinner} />
            Aguardando o host iniciar a partida...
          </p>
        )}

        <p style={{ ...styles.waitMsg, marginTop: '16px' }}>
          {lobbyPlayers.length}/4 jogadores — máximo 4
        </p>
      </div>
    </div>
  );
}
