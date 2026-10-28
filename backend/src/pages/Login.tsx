import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

export const Login: React.FC = () => {
  const { login } = useAdmin();
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin@999999');
  const [alert, setAlert] = useState<{ message: string; isError: boolean } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAlert(null);
    setIsLoading(true);

    try {
      const result = await login(username, password, true);
      setIsLoading(false);

      if (result.success) {
        setAlert({ message: 'Welcome! Opening Admin CMS...', isError: false });
        setTimeout(() => {
          navigate(from, { replace: true });
        }, 300);
      } else {
        setAlert({
          message: result.message || 'Incorrect credentials. Please use "admin" and "admin@999999"',
          isError: true
        });
      }
    } catch (err: any) {
      setIsLoading(false);
      setAlert({
        message: err?.message || 'Login failed',
        isError: true
      });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* BLURRED DASHBOARD SILHOUETTE (MATCHING EXACT PYTHON CMS LOGIN OVERLAY BACKGROUND) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          filter: 'blur(6px)',
          opacity: 0.7,
          pointerEvents: 'none',
          userSelect: 'none',
          background: 'var(--cream)'
        }}
      >
        {/* Sidebar silhouette */}
        <div
          style={{
            width: '260px',
            background: 'var(--navy)',
            height: '100%',
            padding: '1.5rem 1.25rem',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            flexShrink: 0
          }}
        >
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.1rem' }}>
            The First Seven Years
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '1rem' }}>
            <div style={{ height: '36px', background: 'var(--mint)', borderRadius: '6px' }}></div>
            <div style={{ height: '36px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px' }}></div>
            <div style={{ height: '36px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px' }}></div>
            <div style={{ height: '36px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px' }}></div>
            <div style={{ height: '36px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px' }}></div>
            <div style={{ height: '36px', background: 'rgba(255,255,255,0.08)', borderRadius: '6px' }}></div>
          </div>
        </div>

        {/* Content area silhouette */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              height: '62px',
              background: '#fff',
              borderBottom: '1px solid var(--line)',
              padding: '0 2rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ width: '240px', height: '34px', background: 'var(--cream)', borderRadius: '6px' }}></div>
            <div style={{ width: '130px', height: '34px', background: 'var(--cream)', borderRadius: '6px' }}></div>
          </div>
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ width: '280px', height: '38px', background: '#cbd5e1', borderRadius: '6px' }}></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem' }}>
              <div style={{ height: '110px', background: '#fff', borderRadius: '10px', border: '1px solid var(--line)' }}></div>
              <div style={{ height: '110px', background: '#fff', borderRadius: '10px', border: '1px solid var(--line)' }}></div>
              <div style={{ height: '110px', background: '#fff', borderRadius: '10px', border: '1px solid var(--line)' }}></div>
              <div style={{ height: '110px', background: '#fff', borderRadius: '10px', border: '1px solid var(--line)' }}></div>
            </div>
            <div style={{ height: '260px', background: '#fff', borderRadius: '10px', border: '1px solid var(--line)' }}></div>
          </div>
        </div>
      </div>

      {/* DARK FROSTED GLASS OVERLAY & CENTERED LOGIN CARD */}
      <div className="login-overlay">
        <div className="login-modal-card">
          {/* MODAL HEADER */}
          <div className="login-modal-header">
            <div
              className="sidebar__logo"
              style={{
                color: 'var(--navy)',
                fontSize: '1.35rem',
                fontWeight: 700,
                letterSpacing: '-0.01em'
              }}
            >
              The First Seven Years
            </div>
            <div style={{ marginTop: '0.4rem' }}>
              <span className="sidebar__badge">CMS PORTAL</span>
            </div>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '1.4rem',
                color: 'var(--navy)',
                marginTop: '0.75rem',
                fontWeight: 700
              }}
            >
              Sign In to CMS
            </h2>
            <p style={{ fontSize: '0.88rem', color: 'var(--ink-2)', marginTop: '0.25rem' }}>
              Enter your username and password to proceed.
            </p>
          </div>

          {/* ALERT NOTIFICATION */}
          {alert && (
            <div
              style={{
                padding: '0.65rem 0.85rem',
                borderRadius: '6px',
                fontSize: '0.85rem',
                marginBottom: '1rem',
                background: alert.isError ? '#fde8e8' : '#eaf7ed',
                color: alert.isError ? '#d94f4f' : '#1b4d2e',
                border: `1px solid ${alert.isError ? '#f8b4b4' : '#b7e4c3'}`,
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem'
              }}
            >
              <span>{alert.isError ? '⚠️' : '✅'}</span>
              <span>{alert.message}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          <form onSubmit={handleSubmit}>
            <div className="form-group" style={{ marginBottom: '0.85rem' }}>
              <label
                htmlFor="username"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.3rem',
                  color: 'var(--navy)'
                }}
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                className="form-control"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  background: '#fff'
                }}
              />
            </div>

            <div className="form-group" style={{ marginBottom: '1rem' }}>
              <label
                htmlFor="password"
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  display: 'block',
                  marginBottom: '0.3rem',
                  color: 'var(--navy)'
                }}
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                className="form-control"
                placeholder="admin@999999"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.8rem',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  background: '#fff'
                }}
              />
            </div>

            <button
              type="submit"
              className="btn btn--primary"
              style={{
                width: '100%',
                padding: '0.75rem',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '0.92rem',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Verifying...' : 'Sign In →'}
            </button>
          </form>

          {/* FOOTER LINK */}
          <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
            <a
              href="http://localhost:3000/"
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: '0.84rem',
                color: 'var(--navy)',
                textDecoration: 'none',
                fontWeight: 500
              }}
            >
              ← Return to Public Website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
