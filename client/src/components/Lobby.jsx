import React, { useEffect, useState } from 'react';

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

const identityStyles = {
  bar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '8px',
    padding: '10px 14px',
    marginBottom: '18px',
    fontSize: '0.85rem',
  },
  who: { color: 'var(--text-muted)' },
  name: { color: 'var(--gold)', fontWeight: 600 },
  stats: { color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '2px' },
  link: {
    background: 'transparent',
    border: 'none',
    color: 'var(--text-muted)',
    fontSize: '0.8rem',
    cursor: 'pointer',
    textDecoration: 'underline',
    padding: 0,
  },
};

const roomBrowserStyles = {
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px',
    marginTop: '8px',
  },
  headerTitle: {
    fontSize: '0.8rem',
    fontWeight: 600,
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
  },
  createToggle: {
    background: 'transparent',
    border: '1px solid rgba(245,197,24,0.4)',
    color: 'var(--gold)',
    fontSize: '0.8rem',
    fontWeight: 600,
    padding: '6px 12px',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  createForm: {
    background: 'rgba(0,0,0,0.18)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    padding: '12px',
    marginBottom: '14px',
  },
  empty: {
    background: 'rgba(0,0,0,0.18)',
    border: '1px dashed rgba(255,255,255,0.12)',
    borderRadius: '8px',
    padding: '24px 16px',
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
  },
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '320px',
    overflowY: 'auto',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    padding: '10px 14px',
  },
  itemMain: {
    flex: 1,
    minWidth: 0,
  },
  itemName: {
    fontWeight: 600,
    fontSize: '0.95rem',
    color: 'var(--white)',
    marginBottom: '2px',
    wordBreak: 'break-word',
  },
  itemMeta: {
    fontSize: '0.78rem',
    color: 'var(--text-muted)',
  },
  btnJoin: {
    background: 'var(--gold)',
    color: '#1a1a00',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 700,
    fontSize: '0.85rem',
    padding: '8px 16px',
    cursor: 'pointer',
    flexShrink: 0,
  },
  btnJoinDisabled: {
    background: 'rgba(255,255,255,0.08)',
    color: 'var(--text-muted)',
    border: 'none',
    borderRadius: '6px',
    fontWeight: 600,
    fontSize: '0.8rem',
    padding: '8px 14px',
    cursor: 'not-allowed',
    flexShrink: 0,
  },
};

export default function Lobby({
  phase,
  connected,
  isHost,
  lobbyPlayers,
  availableRooms = [],
  roomId,
  myName,
  authedUsername,
  isGuest,
  profile,
  onConnect,
  onStart,
  onLogout,
}) {
  const [name, setName] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [joining, setJoining] = useState(false);

  const join = (roomName) => {
    const trimmedName = authedUsername || name.trim() || 'Jogador';
    const trimmedRoom = (roomName || '').trim() || 'default';
    setJoining(true);
    onConnect(trimmedName, trimmedRoom);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newRoom.trim()) return;
    join(newRoom);
  };

  // Se a sala recebida pelo servidor renovar a lista (caso o join falhe) ou
  // se a fase mudar, libera o botão pra tentar de novo.
  useEffect(() => {
    if (phase !== 'connect') return;
    setJoining(false);
  }, [phase, availableRooms]);

  const canStart = isHost && lobbyPlayers.length >= 2;

  const identityBar = (
    <div style={identityStyles.bar}>
      <div>
        {authedUsername ? (
          <>
            <div>
              <span style={identityStyles.who}>Logado como </span>
              <span style={identityStyles.name}>{authedUsername}</span>
            </div>
            {profile && (
              <div style={identityStyles.stats}>
                {profile.wins}V · {profile.losses}D · {profile.games_played} partidas
              </div>
            )}
          </>
        ) : (
          <span style={identityStyles.who}>Jogando como visitante</span>
        )}
      </div>
      <button type="button" style={identityStyles.link} onClick={onLogout}>
        {authedUsername ? 'Sair' : 'Entrar / Cadastrar'}
      </button>
    </div>
  );

  if (phase === 'connect') {
    const cardStyle = { ...styles.card, maxWidth: '520px' };
    return (
      <div style={styles.root}>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={cardStyle}>
          <div style={styles.title}>DOMINÓ</div>
          <div style={styles.subtitle}>Escolha uma sala para jogar</div>

          {identityBar}

          {!authedUsername && (
            <>
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
            </>
          )}

          <div style={roomBrowserStyles.header}>
            <span style={roomBrowserStyles.headerTitle}>
              Salas disponíveis ({availableRooms.length})
            </span>
            <button
              type="button"
              style={roomBrowserStyles.createToggle}
              onClick={() => setShowCreate(s => !s)}
              disabled={joining}
            >
              {showCreate ? 'Cancelar' : '+ Nova sala'}
            </button>
          </div>

          {showCreate && (
            <form onSubmit={handleCreate} style={roomBrowserStyles.createForm}>
              <input
                style={{ ...styles.input, marginBottom: '8px' }}
                type="text"
                value={newRoom}
                onChange={e => setNewRoom(e.target.value)}
                placeholder="Nome da sala (ex: sala-do-joao)"
                maxLength={30}
                autoFocus
                onFocus={e => (e.target.style.borderColor = 'var(--gold)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.18)')}
              />
              <button
                type="submit"
                style={joining || !newRoom.trim() ? styles.btnDisabled : styles.btnPrimary}
                disabled={joining || !newRoom.trim()}
              >
                {joining ? <><span style={styles.spinner} />Criando...</> : 'Criar e entrar'}
              </button>
            </form>
          )}

          {availableRooms.length === 0 ? (
            <div style={roomBrowserStyles.empty}>
              {connected
                ? 'Nenhuma sala ativa. Clique em "+ Nova sala" para criar a primeira.'
                : <><span style={styles.spinner} />Conectando ao servidor...</>}
            </div>
          ) : (
            <ul style={roomBrowserStyles.list}>
              {availableRooms.map(r => {
                const full = r.playerCount >= 4;
                const locked = r.started || full;
                const reason = r.started ? 'Em partida' : full ? 'Sala cheia' : null;
                return (
                  <li key={r.id} style={roomBrowserStyles.item}>
                    <div style={roomBrowserStyles.itemMain}>
                      <div style={roomBrowserStyles.itemName}>{r.id}</div>
                      <div style={roomBrowserStyles.itemMeta}>
                        {r.playerCount}/4 jogadores
                        {r.players?.length > 0 && ` · ${r.players.join(', ')}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      style={locked || joining ? roomBrowserStyles.btnJoinDisabled : roomBrowserStyles.btnJoin}
                      onClick={() => join(r.id)}
                      disabled={locked || joining}
                      title={reason || 'Entrar'}
                    >
                      {reason || 'Entrar'}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
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
