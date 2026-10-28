import React from 'react';
import { useAdmin } from '../context/AdminContext';

export const ToastContainer: React.FC = () => {
  const { toasts } = useAdmin();

  if (toasts.length === 0) return null;

  return (
    <div
      id="toast-container"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.6rem'
      }}
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast--${t.type}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-md)',
            background: t.type === 'error' ? 'var(--danger-soft)' : t.type === 'info' ? 'var(--info-soft)' : 'var(--mint-soft)',
            color: t.type === 'error' ? 'var(--danger)' : t.type === 'info' ? 'var(--info)' : 'var(--mint-dark)',
            border: `1px solid ${t.type === 'error' ? 'var(--danger)' : t.type === 'info' ? 'var(--info)' : 'var(--mint)'}`,
            fontWeight: 500,
            fontSize: '0.88rem'
          }}
        >
          <span>{t.type === 'success' ? '✓' : t.type === 'error' ? '⚠️' : 'ℹ️'}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
};
