import React, { useEffect, useRef } from 'react';

const TYPE_STYLES = {
  info: {
    background: 'rgba(30,60,90,0.97)',
    border: '1px solid rgba(100,160,255,0.35)',
    color: '#c8e0ff',
    icon: 'ℹ',
    iconColor: '#7ab8ff',
  },
  error: {
    background: 'rgba(90,20,20,0.97)',
    border: '1px solid rgba(255,80,80,0.4)',
    color: '#ffb0b0',
    icon: '✕',
    iconColor: '#ff6060',
  },
  success: {
    background: 'rgba(20,70,30,0.97)',
    border: '1px solid rgba(60,200,80,0.35)',
    color: '#a8f0b0',
    icon: '✓',
    iconColor: '#60e070',
  },
};

function NotifItem({ notif, onDismiss }) {
  const t = TYPE_STYLES[notif.type] || TYPE_STYLES.info;
  const ref = useRef(null);

  useEffect(() => {
    // Animate in
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateX(40px)';
    requestAnimationFrame(() => {
      el.style.transition = 'opacity 0.2s, transform 0.2s';
      el.style.opacity = '1';
      el.style.transform = 'translateX(0)';
    });
  }, []);

  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: t.background,
        border: t.border,
        borderRadius: '9px',
        padding: '10px 14px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
        color: t.color,
        fontSize: '0.88rem',
        fontWeight: '500',
        maxWidth: '320px',
        wordBreak: 'break-word',
        pointerEvents: 'auto',
        cursor: 'pointer',
      }}
      onClick={() => onDismiss(notif.id)}
      title="Clique para fechar"
    >
      <span
        style={{
          color: t.iconColor,
          fontWeight: '700',
          fontSize: '1rem',
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        {t.icon}
      </span>
      <span style={{ flex: 1 }}>{notif.message}</span>
      <span
        style={{
          color: 'rgba(255,255,255,0.3)',
          fontSize: '0.8rem',
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        ×
      </span>
    </div>
  );
}

export default function Notification({ notifications, onDismiss }) {
  if (notifications.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '80px',
        right: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        zIndex: 300,
        pointerEvents: 'none',
        maxWidth: '340px',
      }}
    >
      {notifications.map(n => (
        <NotifItem key={n.id} notif={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
