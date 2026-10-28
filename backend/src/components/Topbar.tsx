import React, { useState, useRef, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { AlertItem } from '../types';

export const Topbar: React.FC = () => {
  const {
    data,
    currentUser,
    searchQuery,
    setSearchQuery,
    switchUser,
    toggleAlertRead,
    markAllAlertsRead,
    toggleSidebar,
    isSidebarOpen,
    logout
  } = useAdmin();

  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'red_flag' | 'clinical' | 'submission'>('all');
  const notifRef = useRef<HTMLDivElement>(null);

  const alerts = data.alerts || [];
  const unreadCount = alerts.filter((a) => a.unread).length;

  const filteredAlerts = alerts.filter((a) => {
    if (notifFilter === 'all') return true;
    return a.type === notifFilter;
  });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar__left">
        <button
          className={`sidebar-toggle-btn ${isSidebarOpen ? 'is-active' : ''}`}
          onClick={toggleSidebar}
          aria-label="Toggle navigation menu"
        >
          <span className="hamburger-box">
            <span className="hamburger-inner" />
          </span>
          <span className="sidebar-toggle-text">Menu</span>
        </button>

        {/* Quick Search commented out */}
        {/*
        <div className="topbar__search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Quick search topics, Q&amp;As, videos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        */}
      </div>

      <div className="topbar__right">
        {/* User Switcher */}
        <div className="role-badge-box">
          <label htmlFor="user-select">Viewing as:</label>
          <select
            id="user-select"
            value={currentUser.id}
            onChange={(e) => switchUser(e.target.value)}
          >
            {data.users?.map((u) => (
              <option key={u.id} value={u.id}>
                {u.role === 'super_admin' ? '👑 ' : u.role === 'editor' ? '✍️ ' : u.role === 'clinical_reviewer' ? '🩺 ' : '📝 '}
                {u.name} ({data.roles?.[u.role]?.name || u.role})
              </option>
            ))}
          </select>
        </div>

        {/* Notifications Dropdown */}
        <div className="notif-bell-wrap" ref={notifRef} style={{ position: 'relative' }}>
          <button
            className="notif-bell-btn"
            onClick={() => setIsNotifOpen((prev) => !prev)}
            title="Notifications &amp; Alerts"
            aria-label="Notifications"
          >
            <span>🔔</span>
            {unreadCount > 0 && <span className="notif-bell-badge">{unreadCount}</span>}
          </button>

          {isNotifOpen && (
            <div
              className="notif-dropdown"
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '360px',
                background: '#fff',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--line)',
                zIndex: 1000,
                padding: '1rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
                  Notifications &amp; Alerts ({unreadCount} unread)
                </b>
                {unreadCount > 0 && (
                  <button
                    className="btn btn--sm"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                    onClick={markAllAlertsRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              {/* Filter tabs */}
              <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
                {(['all', 'red_flag', 'clinical', 'submission'] as const).map((filter) => (
                  <button
                    key={filter}
                    className={`btn btn--sm ${notifFilter === filter ? 'btn--primary' : 'btn--outline'}`}
                    style={{ fontSize: '0.72rem', padding: '0.2rem 0.45rem', textTransform: 'capitalize' }}
                    onClick={() => setNotifFilter(filter)}
                  >
                    {filter === 'all' ? 'All' : filter.replace('_', ' ')}
                  </button>
                ))}
              </div>

              {/* Alert items list */}
              <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {filteredAlerts.length === 0 ? (
                  <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--ink-3)', fontSize: '0.85rem' }}>
                    No alerts in this category
                  </div>
                ) : (
                  filteredAlerts.map((alt) => (
                    <div
                      key={alt.id}
                      onClick={() => toggleAlertRead(alt.id)}
                      style={{
                        padding: '0.65rem 0.75rem',
                        borderRadius: 'var(--radius-sm)',
                        background: alt.unread ? 'var(--cream)' : '#fff',
                        border: alt.unread ? '1px solid var(--line)' : '1px solid var(--line-light)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.25rem',
                        position: 'relative'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
                        <span
                          style={{
                            fontWeight: alt.unread ? 700 : 500,
                            fontSize: '0.84rem',
                            color: alt.type === 'red_flag' ? 'var(--danger)' : 'var(--ink)'
                          }}
                        >
                          {alt.type === 'red_flag' ? '🚨 ' : alt.type === 'clinical' ? '🩺 ' : '📥 '}
                          {alt.title}
                        </span>
                        {alt.unread && (
                          <span
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              background: 'var(--danger)',
                              flexShrink: 0,
                              marginTop: '4px'
                            }}
                          />
                        )}
                      </div>
                      <span style={{ fontSize: '0.74rem', color: 'var(--ink-3)' }}>{alt.meta}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--ink-3)', alignSelf: 'flex-end' }}>{alt.time}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Topbar Logout Button */}
        <button
          className="btn btn--outline"
          style={{ padding: '0.35rem 0.75rem', fontSize: '0.82rem', gap: '0.35rem' }}
          onClick={logout}
          title="Sign out of Admin CMS"
        >
          <span>🚪</span>
          <span>Log Out</span>
        </button>
      </div>
    </header>
  );
};
