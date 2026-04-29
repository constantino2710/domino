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
    fontWeight: 700,
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
  tabs: {
    display: 'flex',
    gap: '4px',
    marginBottom: '20px',
    background: 'rgba(0,0,0,0.2)',
    padding: '4px',
    borderRadius: '8px',
  },
  tab: (active) => ({
    flex: 1,
    padding: '8px 12px',
    borderRadius: '6px',
    border: 'none',
    background: active ? 'var(--gold)' : 'transparent',
    color: active ? '#1a1a00' : 'var(--text-muted)',
    fontWeight: 600,
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'background 0.15s',
  }),
  label: {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: 600,
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
    marginBottom: '14px',
  },
  btnPrimary: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    background: 'var(--gold)',
    color: '#1a1a00',
    fontWeight: 700,
    fontSize: '1rem',
    marginTop: '4px',
    boxShadow: '0 2px 8px rgba(245,197,24,0.3)',
    border: 'none',
    cursor: 'pointer',
  },
  btnDisabled: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    background: 'rgba(245,197,24,0.3)',
    color: 'rgba(255,255,255,0.4)',
    fontWeight: 700,
    fontSize: '1rem',
    marginTop: '4px',
    cursor: 'not-allowed',
    border: 'none',
  },
  btnSecondary: {
    width: '100%',
    padding: '10px',
    borderRadius: '8px',
    background: 'transparent',
    color: 'var(--text-muted)',
    fontWeight: 600,
    fontSize: '0.9rem',
    border: '1px solid rgba(255,255,255,0.18)',
    cursor: 'pointer',
    marginTop: '10px',
  },
  divider: {
    textAlign: 'center',
    color: 'var(--text-muted)',
    fontSize: '0.75rem',
    margin: '18px 0 12px',
    letterSpacing: '0.1em',
  },
  error: {
    background: 'rgba(244, 67, 54, 0.15)',
    border: '1px solid rgba(244, 67, 54, 0.4)',
    color: '#ff8b80',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    marginBottom: '14px',
  },
  success: {
    background: 'rgba(76, 175, 80, 0.15)',
    border: '1px solid rgba(76, 175, 80, 0.4)',
    color: '#9fd89f',
    padding: '8px 12px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    marginBottom: '14px',
  },
};

export default function Auth({ onSignIn, onSignUp, onResendConfirmation, onGuest, hasSupabase }) {
  const [mode, setMode] = useState('login'); // login | signup | verify
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [info, setInfo] = useState(null);
  const [pendingEmail, setPendingEmail] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setError(null); setInfo(null);

    if (!hasSupabase) {
      setError('Supabase não configurado. Use "Jogar como visitante".');
      return;
    }

    setLoading(true);
    if (mode === 'login') {
      const { error: err } = await onSignIn({ email, password });
      setLoading(false);
      if (err) { setError(err.message); return; }
    } else {
      const { error: err, needsEmailConfirmation } = await onSignUp({ email, password, username });
      setLoading(false);
      if (err) { setError(err.message); return; }
      if (needsEmailConfirmation) {
        setPendingEmail(email);
        setMode('verify');
        setPassword('');
      } else {
        setInfo('Conta criada! Faça login para continuar.');
        setMode('login');
        setPassword('');
      }
    }
  };

  const resend = async () => {
    setError(null); setInfo(null);
    setLoading(true);
    const { error: err } = await onResendConfirmation(pendingEmail);
    setLoading(false);
    if (err) { setError(err.message); return; }
    setInfo('Email de confirmação reenviado. Verifique sua caixa de entrada.');
  };

  if (mode === 'verify') {
    return (
      <div style={styles.root}>
        <div style={styles.card}>
          <div style={styles.title}>VERIFIQUE SEU EMAIL</div>
          <div style={styles.subtitle}>
            Enviamos um link de confirmação para<br/>
            <strong style={{ color: 'var(--white)' }}>{pendingEmail}</strong>
          </div>

          {error && <div style={styles.error}>{error}</div>}
          {info  && <div style={styles.success}>{info}</div>}

          <div style={{ ...styles.success, marginBottom: '20px' }}>
            Abra o email e clique no link para ativar sua conta. Depois volte aqui para entrar.
          </div>

          <button
            type="button"
            style={loading ? styles.btnDisabled : styles.btnPrimary}
            disabled={loading}
            onClick={resend}
          >
            {loading ? 'Enviando...' : 'Reenviar email de confirmação'}
          </button>

          <button
            type="button"
            style={styles.btnSecondary}
            onClick={() => { setMode('login'); setError(null); setInfo(null); }}
          >
            Voltar para o login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.root}>
      <div style={styles.card}>
        <div style={styles.title}>DOMINÓ</div>
        <div style={styles.subtitle}>Entre para salvar suas estatísticas</div>

        <div style={styles.tabs}>
          <button type="button" style={styles.tab(mode === 'login')}  onClick={() => { setMode('login');  setError(null); setInfo(null); }}>Entrar</button>
          <button type="button" style={styles.tab(mode === 'signup')} onClick={() => { setMode('signup'); setError(null); setInfo(null); }}>Cadastrar</button>
        </div>

        {error && <div style={styles.error}>{error}</div>}
        {info  && <div style={styles.success}>{info}</div>}

        <form onSubmit={submit}>
          {mode === 'signup' && (
            <>
              <label style={styles.label}>Username</label>
              <input
                style={styles.input}
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="3-20 caracteres, a-z 0-9 _"
                maxLength={20}
                required
              />
            </>
          )}

          <label style={styles.label}>Email</label>
          <input
            style={styles.input}
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            required
          />

          <label style={styles.label}>Senha</label>
          <input
            style={styles.input}
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder={mode === 'signup' ? 'Mínimo 6 caracteres' : '••••••••'}
            minLength={6}
            required
          />

          <button
            type="submit"
            style={loading ? styles.btnDisabled : styles.btnPrimary}
            disabled={loading}
          >
            {loading ? 'Processando...' : (mode === 'login' ? 'Entrar' : 'Criar conta')}
          </button>
        </form>

        <div style={styles.divider}>OU</div>

        <button type="button" style={styles.btnSecondary} onClick={onGuest}>
          Jogar como visitante
        </button>
      </div>
    </div>
  );
}
