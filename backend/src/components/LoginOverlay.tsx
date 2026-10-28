import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';

interface LoginOverlayProps {
  isOpen: boolean;
  onSuccess?: () => void;
}

export const LoginOverlay: React.FC<LoginOverlayProps> = ({ isOpen, onSuccess }) => {
  const { login } = useAdmin();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin@999999');
  const [alertMsg, setAlertMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlertMsg(null);
    setIsLoading(true);

    const result = await login(username, password, true);
    setIsLoading(false);

    if (result.success) {
      if (onSuccess) onSuccess();
    } else {
      setAlertMsg(result.message || 'Incorrect credentials. Please use "admin" and "admin@999999"');
    }
  };

  return (
    <div className="login-overlay">
      <div className="login-modal-card">
        <div className="login-modal-header">
          <div className="sidebar__logo" style={{ color: 'var(--navy)', fontSize: '1.35rem', fontWeight: 700 }}>
            The First Seven Years
          </div>
          <div style={{ marginTop: '0.4rem' }}>
            <span className="sidebar__badge">CMS PORTAL</span>
          </div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--navy)', marginTop: '0.75rem' }}>
            Sign In to CMS
          </h2>
          <p style={{ fontSize: '0.88rem', color: 'var(--ink-2)', marginTop: '0.25rem' }}>
            Enter your username and password to proceed.
          </p>
        </div>

        {alertMsg && (
          <div
            style={{
              padding: '0.6rem 0.8rem',
              borderRadius: '6px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
              background: '#fde8e8',
              color: '#d94f4f',
              border: '1px solid #f8b4b4'
            }}
          >
            {alertMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '0.85rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem', color: 'var(--navy)' }}>
              Username
            </label>
            <input
              type="text"
              className="form-control"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{ width: '100%', padding: '0.65rem 0.8rem', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ fontSize: '0.82rem', fontWeight: 600, display: 'block', marginBottom: '0.3rem', color: 'var(--navy)' }}>
              Password
            </label>
            <input
              type="password"
              className="form-control"
              placeholder="admin@999999"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '0.65rem 0.8rem', border: '1px solid var(--line)', borderRadius: '6px', fontSize: '0.9rem' }}
            />
          </div>

          <button
            type="submit"
            className="btn btn--primary"
            style={{ width: '100%', padding: '0.75rem', justifyContent: 'center', fontWeight: 600 }}
            disabled={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Sign In →'}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          <a
            href="http://localhost:3000/"
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: '0.84rem', color: 'var(--navy)', textDecoration: 'none', fontWeight: 500 }}
          >
            ← Return to Public Website
          </a>
        </div>
      </div>
    </div>
  );
};
