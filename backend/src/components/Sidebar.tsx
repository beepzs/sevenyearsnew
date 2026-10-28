import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

export const Sidebar: React.FC = () => {
  const { data, isSidebarOpen, closeSidebar, canView } = useAdmin();

  const answersCount = Array.isArray(data.answers)
    ? data.answers.length
    : Object.keys(data.answers || {}).length;
  const videosCount = Array.isArray(data.videos)
    ? data.videos.length
    : Object.keys(data.videos || {}).length;
  const expertsCount = Array.isArray(data.experts)
    ? data.experts.length
    : Object.keys(data.experts || {}).length;
  const submissionsCount = data.ask_submissions?.length || 0;
  const pagesCount = data.pages?.length || 0;
  const faqsCount = data.faqs?.length || 0;
  const topicsCount = data.topics?.length || 0;
  const headerMenuCount = data.menus?.header?.length || 0;
  const footerMenuCount = data.menus?.footer?.length || 0;
  const usersCount = data.users?.length || 0;

  return (
    <>
      <aside className={`sidebar ${isSidebarOpen ? 'is-open' : ''}`}>
        <NavLink to="/" className="sidebar__brand" onClick={closeSidebar}>
          <div className="sidebar__logo">The First Seven Years</div>
          <span className="sidebar__badge">CMS</span>
          <button
            className="sidebar__close-btn"
            id="sidebar-close-btn"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              closeSidebar();
            }}
            aria-label="Close navigation menu"
          >
            &times;
          </button>
        </NavLink>

        <div className="sidebar__nav">
          {canView('dashboard') && (
            <NavLink
              to="/"
              end
              className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
              onClick={closeSidebar}
            >
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect width="7" height="9" x="3" y="3" rx="1" />
                <rect width="7" height="5" x="14" y="3" rx="1" />
                <rect width="7" height="9" x="14" y="12" rx="1" />
                <rect width="7" height="5" x="3" y="16" rx="1" />
              </svg>
              <span>Dashboard</span>
            </NavLink>
          )}

          {canView('topics') && (
            <NavLink
              to="/topics"
              className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
              onClick={closeSidebar}
            >
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
                <path d="M7 7h.01" />
              </svg>
              <span>Topic Master</span>
              <span className="pill-count">{topicsCount}</span>
            </NavLink>
          )}

          {canView('answers') && (
            <NavLink
              to="/answers"
              className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
              onClick={closeSidebar}
            >
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <span>Question &amp; Answer</span>
              <span className="pill-count">{answersCount}</span>
            </NavLink>
          )}

          {canView('faqs') && (
            <NavLink
              to="/faqs"
              className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
              onClick={closeSidebar}
            >
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <path d="M12 17h.01" />
              </svg>
              <span>FAQ Management</span>
              <span className="pill-count">{faqsCount}</span>
            </NavLink>
          )}

          {canView('videos') && (
            <NavLink
              to="/videos"
              className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
              onClick={closeSidebar}
            >
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polygon points="23 7 16 12 23 17 23 7" />
                <rect width="14" height="14" x="2" y="5" rx="2" />
              </svg>
              <span>Video Library</span>
              <span className="pill-count">{videosCount}</span>
            </NavLink>
          )}

          {canView('youtube') && (
            <NavLink
              to="/youtube"
              className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
              onClick={closeSidebar}
            >
              <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
              </svg>
              <span>YouTube Reports</span>
              <span className="pill-count" style={{ background: '#ff0000', color: '#fff' }}>
                LIVE
              </span>
            </NavLink>
          )}

          {canView('submissions') && (
            <NavLink
              to="/submissions"
              className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
              onClick={closeSidebar}
            >
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="m22 2-7 20-4-9-9-4Z" />
                <path d="M22 2 11 13" />
              </svg>
              <span>Ask the Doctor Inbox</span>
              <span className="pill-count" style={{ background: 'var(--mint)', color: 'var(--navy-deep)' }}>
                {submissionsCount}
              </span>
            </NavLink>
          )}

          {canView('experts') && (
            <NavLink
              to="/experts"
              className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
              onClick={closeSidebar}
            >
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span>Experts &amp; Hosts</span>
              <span className="pill-count">{expertsCount}</span>
            </NavLink>
          )}

          {canView('pages') && (
            <NavLink
              to="/pages"
              className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
              onClick={closeSidebar}
            >
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" x2="8" y1="13" y2="13" />
                <line x1="16" x2="8" y1="17" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              <span>Page Management</span>
              <span className="pill-count">{pagesCount}</span>
            </NavLink>
          )}

          {canView('book') && (
            <NavLink
              to="/book"
              className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
              onClick={closeSidebar}
            >
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
                <path d="M6 6h10" />
                <path d="M6 10h10" />
              </svg>
              <span>The Book</span>
              <span className="pill-count" style={{ background: '#fbe7ac', color: '#101c2d' }}>
                PRINT
              </span>
            </NavLink>
          )}

          {canView('menus') && (
            <NavLink
              to="/menus"
              className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
              onClick={closeSidebar}
            >
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg>
              <span>Menu Management</span>
              <span className="pill-count">{headerMenuCount + footerMenuCount}</span>
            </NavLink>
          )}

          {canView('roles') && (
            <NavLink
              to="/roles"
              className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
              onClick={closeSidebar}
            >
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
              <span>Roles &amp; Permissions</span>
              <span className="pill-count">{usersCount}</span>
            </NavLink>
          )}

          {canView('settings') && (
            <NavLink
              to="/settings"
              className={({ isActive }) => `nav-item ${isActive ? 'is-active' : ''}`}
              onClick={closeSidebar}
            >
              <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Settings</span>
            </NavLink>
          )}
        </div>

        <div className="sidebar__footer">
          <a href="http://localhost:3000/" target="_blank" rel="noreferrer">
            <span>↗</span> View Public Website
          </a>
        </div>
      </aside>
      <div
        className={`sidebar-backdrop ${isSidebarOpen ? 'is-open' : ''}`}
        onClick={closeSidebar}
      />
    </>
  );
};
