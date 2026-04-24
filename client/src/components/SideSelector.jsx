import React from 'react';
import Tile from './Tile.jsx';

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
    backdropFilter: 'blur(3px)',
  },
  card: {
    background: 'var(--green-darker)',
    borderRadius: '14px',
    padding: '28px 32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    boxShadow: 'var(--shadow-lg)',
    border: '1px solid rgba(255,255,255,0.1)',
    minWidth: '280px',
  },
  title: {
    fontWeight: '700',
    fontSize: '1rem',
    color: 'var(--white)',
    textAlign: 'center',
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '0.82rem',
    marginTop: '-12px',
    textAlign: 'center',
  },
  buttonsRow: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  btnLeft: {
    padding: '10px 20px',
    borderRadius: '8px',
    background: 'rgba(245,197,24,0.15)',
    color: 'var(--gold)',
    fontWeight: '700',
    fontSize: '0.95rem',
    border: '1px solid rgba(245,197,24,0.4)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  btnRight: {
    padding: '10px 20px',
    borderRadius: '8px',
    background: 'rgba(245,197,24,0.15)',
    color: 'var(--gold)',
    fontWeight: '700',
    fontSize: '0.95rem',
    border: '1px solid rgba(245,197,24,0.4)',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  btnCancel: {
    padding: '8px 16px',
    borderRadius: '8px',
    background: 'rgba(255,100,100,0.15)',
    color: '#ff8080',
    fontWeight: '600',
    fontSize: '0.85rem',
    border: '1px solid rgba(255,100,100,0.3)',
  },
};

export default function SideSelector({ piece, boardEnds, onPlay, onCancel }) {
  if (!piece) return null;

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.card} onClick={e => e.stopPropagation()}>
        <div style={styles.title}>Escolha o lado</div>
        <div style={styles.subtitle}>
          Esta peça encaixa nos dois lados do tabuleiro
        </div>

        <Tile piece={piece} size={1.1} vertical={false} />

        {boardEnds && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5 }}>
            Extremidade esquerda:{' '}
            <strong style={{ color: 'var(--gold)' }}>{boardEnds.left}</strong>
            {'  |  '}
            Extremidade direita:{' '}
            <strong style={{ color: 'var(--gold)' }}>{boardEnds.right}</strong>
          </div>
        )}

        <div style={styles.buttonsRow}>
          <button
            style={styles.btnLeft}
            onClick={() => onPlay(piece, 'left')}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,197,24,0.28)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,197,24,0.15)')}
          >
            ← Esquerda
          </button>

          <button
            style={styles.btnRight}
            onClick={() => onPlay(piece, 'right')}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(245,197,24,0.28)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(245,197,24,0.15)')}
          >
            Direita →
          </button>
        </div>

        <button
          style={styles.btnCancel}
          onClick={onCancel}
          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,100,100,0.28)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,100,100,0.15)')}
        >
          ✕ Cancelar
        </button>
      </div>
    </div>
  );
}
