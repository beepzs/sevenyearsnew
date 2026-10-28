import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Modal } from '../components/Modal';
import { UserItem } from '../types';

interface ModuleDef {
  id: string;
  name: string;
  desc: string;
  route: string;
  icon: string;
}

interface CategoryDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  modules: ModuleDef[];
}

const CATEGORIES: CategoryDef[] = [
  {
    id: 'content',
    name: 'Content & Editorial',
    desc: 'Pediatric hubs, Q&A library, FAQs, and static articles',
    icon: '📝',
    modules: [
      { id: 'topics', name: 'Topic Master', desc: 'Core 13 pediatric topic hubs & ordering', route: '/admin/topics/', icon: '🏷️' },
      { id: 'answers', name: 'Question & Answer', desc: 'Clinically verified parent Q&A library', route: '/admin/answers/', icon: '💬' },
      { id: 'faqs', name: 'FAQ Management', desc: 'General & operational FAQs', route: '/admin/faqs/', icon: '❓' },
      { id: 'pages', name: 'Page Management', desc: 'Static & policy content pages', route: '/admin/pages/', icon: '📄' },
    ],
  },
  {
    id: 'media',
    name: 'Media & Public Community',
    desc: 'Episodes, channel reports, ask-the-doctor inbox, and specialist profiles',
    icon: '🎬',
    modules: [
      { id: 'videos', name: 'Video Library', desc: 'Episodes, clips & video assets', route: '/admin/videos/', icon: '🎬' },
      { id: 'youtube', name: 'YouTube Reports & Analytics', desc: 'Live channel sync & metrics', route: '/admin/youtube/', icon: '▶️' },
      { id: 'submissions', name: 'Ask the Doctor Inbox', desc: 'Parent questions & urgent red-flag triage', route: '/admin/submissions/', icon: '📥' },
      { id: 'experts', name: 'Experts & Hosts', desc: 'Host bios, headshots & credentials', route: '/admin/experts/', icon: '🩺' },
    ],
  },
  {
    id: 'admin',
    name: 'Platform & Security',
    desc: 'High-level dashboard, navigation structure, team roles, and system settings',
    icon: '⚙️',
    modules: [
      { id: 'dashboard', name: 'Dashboard Overview', desc: 'Platform analytics, triage status & quick actions', route: '/admin/', icon: '📊' },
      { id: 'menus', name: 'Menu & Navigation', desc: 'Header bar, mobile drawer & footer directory columns', route: '/admin/menus/', icon: '🧭' },
      { id: 'roles', name: 'Roles & User Permissions', desc: 'Team members, granular permissions & access control', route: '/admin/roles/', icon: '👥' },
      { id: 'settings', name: 'Settings & Security', desc: 'Brand colors, site metadata & security credentials', route: '/admin/settings/', icon: '⚙️' },
    ],
  },
];

const ALL_MODULES = CATEGORIES.flatMap((c) => c.modules);

export const Roles: React.FC = () => {
  const { data, currentUser, switchUser, saveItem, deleteItem, showToast, canEdit } = useAdmin();
  const hasEdit = canEdit('roles');

  const users = data.users || [];
  const [activeTab, setActiveTab] = useState<'members' | 'permissions'>('members');
  const [selectedUserId, setSelectedUserId] = useState<string>(users[0]?.id || 'usr-1');
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const selUser = users.find((u) => u.id === selectedUserId) || users[0];

  const getUserInitials = (name?: string) => {
    if (!name) return 'U';
    const clean = name.replace(/^(Dr\.|Mr\.|Mrs\.|Ms\.)\s+/i, '').trim();
    const parts = clean.split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return clean.slice(0, 2).toUpperCase();
  };

  const getUserPermission = (user: UserItem, moduleId: string): 'edit' | 'view' | 'hide' => {
    if (user.role === 'super_admin') return 'edit';
    return (user.permissions?.[moduleId] as any) || (user.role === 'editor' ? 'edit' : 'view');
  };

  const handleSetPermission = (moduleId: string, level: 'edit' | 'view' | 'hide') => {
    if (!selUser) return;
    if (selUser.id === 'usr-1' && (moduleId === 'roles' || moduleId === 'dashboard') && level === 'hide') {
      showToast('Cannot hide Roles or Dashboard for Primary Super Admin!', 'error');
      return;
    }
    const updatedUser: UserItem = {
      ...selUser,
      permissions: {
        ...(selUser.permissions || {}),
        [moduleId]: level,
      },
    };
    saveItem('users', updatedUser, 'id');
    showToast(`Updated ${selUser.name}: ${moduleId.toUpperCase()} → ${level.toUpperCase()}`, 'success');
  };

  const handleApplyPreset = (presetName: string) => {
    if (!selUser) return;
    const newPerms: Record<string, 'edit' | 'view' | 'hide'> = {};
    ALL_MODULES.forEach((m) => {
      if (presetName === 'super_admin') {
        newPerms[m.id] = 'edit';
      } else if (presetName === 'editor') {
        newPerms[m.id] = ['roles', 'settings'].includes(m.id) ? 'hide' : 'edit';
      } else if (presetName === 'clinical_reviewer') {
        newPerms[m.id] = ['answers', 'submissions'].includes(m.id)
          ? 'edit'
          : ['menus', 'roles', 'settings'].includes(m.id)
          ? 'hide'
          : 'view';
      } else if (presetName === 'author') {
        newPerms[m.id] = ['answers', 'faqs'].includes(m.id)
          ? 'edit'
          : ['submissions', 'pages', 'menus', 'roles', 'settings'].includes(m.id)
          ? 'hide'
          : 'view';
      }
    });

    const updatedUser: UserItem = {
      ...selUser,
      role: presetName as any,
      permissions: newPerms,
    };
    saveItem('users', updatedUser, 'id');
    showToast(`Applied preset "${presetName}" to ${selUser.name}`, 'success');
  };

  const handleBatchSet = (level: 'edit' | 'view' | 'hide') => {
    if (!selUser) return;
    const newPerms: Record<string, 'edit' | 'view' | 'hide'> = {};
    ALL_MODULES.forEach((m) => {
      if (selUser.id === 'usr-1' && (m.id === 'roles' || m.id === 'dashboard') && level === 'hide') {
        newPerms[m.id] = 'edit';
      } else {
        newPerms[m.id] = level;
      }
    });

    const updatedUser: UserItem = {
      ...selUser,
      permissions: newPerms,
    };
    saveItem('users', updatedUser, 'id');
    showToast(`Set all permissions to ${level.toUpperCase()} for ${selUser.name}`, 'success');
  };

  const handleQuickRoleChange = (userId: string, newRole: string) => {
    const userToUpdate = users.find((u) => u.id === userId);
    if (!userToUpdate) return;
    const newPerms: Record<string, 'edit' | 'view' | 'hide'> = {};
    ALL_MODULES.forEach((m) => {
      if (newRole === 'super_admin') {
        newPerms[m.id] = 'edit';
      } else if (newRole === 'editor') {
        newPerms[m.id] = ['roles', 'settings'].includes(m.id) ? 'hide' : 'edit';
      } else if (newRole === 'clinical_reviewer') {
        newPerms[m.id] = ['answers', 'submissions'].includes(m.id)
          ? 'edit'
          : ['menus', 'roles', 'settings'].includes(m.id)
          ? 'hide'
          : 'view';
      } else if (newRole === 'author') {
        newPerms[m.id] = ['answers', 'faqs'].includes(m.id)
          ? 'edit'
          : ['submissions', 'pages', 'menus', 'roles', 'settings'].includes(m.id)
          ? 'hide'
          : 'view';
      }
    });

    saveItem('users', { ...userToUpdate, role: newRole as any, permissions: newPerms }, 'id');
    showToast(`Changed role for ${userToUpdate.name} to ${newRole.replace('_', ' ')}`, 'success');
  };

  const handleOpenAdd = () => {
    setFormErrors({});
    setEditingUser({
      id: 'usr-' + Date.now(),
      name: '',
      email: '',
      role: 'author',
      status: 'Active',
      last_active: 'Just now',
      permissions: {},
    });
    setIsModalOpen(true);
  };

  const handleEdit = (u: UserItem) => {
    setFormErrors({});
    setEditingUser({ ...u });
    setIsModalOpen(true);
  };

  const handleSaveUser = () => {
    if (!editingUser) return;
    const errs: Record<string, string> = {};
    if (!editingUser.name?.trim()) {
      errs.name = 'Please provide a full name';
    }
    const cleanEmail = (editingUser.email || '').trim();
    if (!cleanEmail) {
      errs.email = 'Please provide an email address';
    } else if (!cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      errs.email = 'Please provide a valid email address (e.g. name@domain.com)';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setFormErrors({});
    const toSave: UserItem = {
      ...editingUser,
      name: editingUser.name.trim(),
      email: cleanEmail
    };
    saveItem('users', toSave, 'id');
    setIsModalOpen(false);
    showToast(`Saved user: ${toSave.name}`, 'success');
  };

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    }
    return true;
  });

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'super_admin':
        return <span className="role-badge role-badge--super_admin">👑 Super Admin</span>;
      case 'editor':
        return <span className="role-badge role-badge--editor">✍️ Editor</span>;
      case 'clinical_reviewer':
        return <span className="role-badge role-badge--clinical_reviewer">🩺 Medical Reviewer</span>;
      case 'author':
        return <span className="role-badge role-badge--author">📝 Author</span>;
      default:
        return <span className="badge">{role}</span>;
    }
  };

  return (
    <div className="content-area">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Team &amp; Access Control</h1>
        </div>
        {hasEdit && (
          <button className="btn btn--primary" onClick={handleOpenAdd}>
            + Add Team Member
          </button>
        )}
      </div>

      {/* KPI / Quick Summary Cards */}
      <div className="roles-stats-bar">
        <div className="roles-stat-card">
          <div className="roles-stat-icon">👥</div>
          <div>
            <div className="roles-stat-title">Team Members</div>
            <div className="roles-stat-value">{users.length} Active</div>
          </div>
        </div>

        <div className="roles-stat-card">
          <div className="roles-stat-icon">👑</div>
          <div>
            <div className="roles-stat-title">Super Admins</div>
            <div className="roles-stat-value">
              {users.filter((u) => u.role === 'super_admin').length} Active
            </div>
          </div>
        </div>

        <div className="roles-stat-card">
          <div className="roles-stat-icon">👁️</div>
          <div>
            <div className="roles-stat-title">Current Active View</div>
            <div className="roles-stat-value" style={{ fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser.name}
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="roles-nav-tabs">
        <button
          className={`roles-nav-tab ${activeTab === 'members' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          👥 Team Members
          <span className="roles-tab-badge">{users.length}</span>
        </button>
        <button
          className={`roles-nav-tab ${activeTab === 'permissions' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('permissions')}
        >
          ⚡ Custom Permissions
        </button>
      </div>

      {/* =========================================================================
          TAB 1: TEAM MEMBERS (Simple, Intuitive & Clean)
          ========================================================================= */}
      {activeTab === 'members' && (
        <div className="card">
          <div className="card__header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            {/* Search */}
            <div className="roles-search-box">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search member by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--ink-3)' }}
                  onClick={() => setSearchTerm('')}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Pills */}
            <div className="filter-pills">
              <button
                className={`filter-pill ${roleFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setRoleFilter('all')}
              >
                All ({users.length})
              </button>
              <button
                className={`filter-pill ${roleFilter === 'super_admin' ? 'is-active' : ''}`}
                onClick={() => setRoleFilter('super_admin')}
              >
                Super Admins
              </button>
              <button
                className={`filter-pill ${roleFilter === 'editor' ? 'is-active' : ''}`}
                onClick={() => setRoleFilter('editor')}
              >
                Editors
              </button>
              <button
                className={`filter-pill ${roleFilter === 'clinical_reviewer' ? 'is-active' : ''}`}
                onClick={() => setRoleFilter('clinical_reviewer')}
              >
                Reviewers
              </button>
              <button
                className={`filter-pill ${roleFilter === 'author' ? 'is-active' : ''}`}
                onClick={() => setRoleFilter('author')}
              >
                Authors
              </button>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>TEAM MEMBER</th>
                  <th>ROLE &amp; CAPABILITY</th>
                  <th>PERMISSIONS OVERVIEW</th>
                  <th>STATUS</th>
                  <th style={{ width: '220px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ink-3)' }}>
                      <div style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>👥</div>
                      <strong style={{ color: 'var(--navy)', fontSize: '1rem' }}>No team members match your filter</strong>
                      <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 1rem' }}>Try clearing the search or role filter.</p>
                      <button className="btn btn--sm btn--primary" onClick={() => { setSearchTerm(''); setRoleFilter('all'); }}>
                        Reset Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isCurrent = u.id === currentUser.id;
                    let editCount = 0;
                    let viewCount = 0;
                    let hideCount = 0;

                    ALL_MODULES.forEach((m) => {
                      const p = getUserPermission(u, m.id);
                      if (p === 'edit') editCount++;
                      else if (p === 'view') viewCount++;
                      else hideCount++;
                    });

                    return (
                      <tr key={u.id}>
                        <td className="table-cell-title">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              className="user-board-avatar"
                              style={{
                                width: '38px',
                                height: '38px',
                                fontSize: '0.85rem',
                                background: isCurrent ? 'var(--mint)' : 'var(--cream-deep)',
                                color: isCurrent ? 'var(--navy-deep)' : 'var(--navy)',
                              }}
                            >
                              {getUserInitials(u.name)}
                            </div>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                <strong style={{ color: 'var(--navy)', fontSize: '0.92rem' }}>{u.name}</strong>
                                {isCurrent && (
                                  <span className="badge" style={{ background: 'var(--mint)', color: 'var(--navy-deep)', fontSize: '0.7rem' }}>
                                    You (Viewing)
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--ink-3)' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>

                        <td>
                          {/* Quick Role Selector */}
                          <select
                            className="form-control"
                            style={{
                              padding: '0.3rem 0.6rem',
                              fontSize: '0.82rem',
                              fontWeight: 600,
                              borderRadius: '6px',
                              width: 'auto',
                              minWidth: '150px',
                            }}
                            value={u.role}
                            disabled={!hasEdit || u.id === 'usr-1'}
                            onChange={(e) => handleQuickRoleChange(u.id, e.target.value)}
                            title={!hasEdit ? 'Requires admin edit permissions to change role' : (u.id === 'usr-1' ? 'Primary Super Admin role is locked' : 'Change member role')}
                          >
                            <option value="super_admin">👑 Super Admin</option>
                            <option value="editor">✍️ Editor</option>
                            <option value="clinical_reviewer">🩺 Medical Reviewer</option>
                            <option value="author">📝 Author</option>
                          </select>
                        </td>

                        <td>
                          {u.role === 'super_admin' ? (
                            <span className="badge" style={{ background: '#dcfce7', color: '#15803d', fontWeight: 700 }}>
                              🟢 Unrestricted (Full Access)
                            </span>
                          ) : (
                            <div style={{ display: 'flex', gap: '0.35rem', alignItems: 'center', fontSize: '0.75rem' }}>
                              <span style={{ color: '#2f6b44', fontWeight: 700 }}>{editCount} Edit</span>
                              <span style={{ color: 'var(--ink-3)' }}>&bull;</span>
                              <span style={{ color: '#d97706', fontWeight: 700 }}>{viewCount} View</span>
                              <span style={{ color: 'var(--ink-3)' }}>&bull;</span>
                              <span style={{ color: '#dc2626', fontWeight: 700 }}>{hideCount} Hidden</span>
                            </div>
                          )}
                        </td>

                        <td>
                          <span className="badge badge--published">{u.status || 'Active'}</span>
                        </td>

                        <td className="table-actions-cell" style={{ textAlign: 'right' }}>
                          <div className="table-actions" style={{ justifyContent: 'flex-end', gap: '0.35rem' }}>
                            <button
                              type="button"
                              className="btn btn--sm btn--outline"
                              onClick={() => {
                                setSelectedUserId(u.id);
                                setActiveTab('permissions');
                              }}
                              title="Inspect & customize granular permissions"
                            >
                              ⚡ Permissions
                            </button>

                            {!isCurrent && (
                              <button
                                type="button"
                                className="icon-btn"
                                onClick={() => {
                                  switchUser(u.id);
                                  showToast(`Switched active view to: ${u.name}`, 'info');
                                }}
                                title="Test live view as this user"
                              >
                                👁️
                              </button>
                            )}

                            {hasEdit ? (
                              <>
                                <button
                                  type="button"
                                  className="icon-btn"
                                  onClick={() => handleEdit(u)}
                                  title="Edit user details"
                                >
                                  ✏️
                                </button>

                                {u.id !== 'usr-1' ? (
                                  <button
                                    type="button"
                                    className="icon-btn icon-btn--danger"
                                    onClick={() => {
                                      deleteItem('users', 'id', u.id);
                                    }}
                                    title="Remove team member"
                                  >
                                    🗑️
                                  </button>
                                ) : (
                                  <span className="icon-btn" style={{ opacity: 0.3, cursor: 'not-allowed' }} title="Primary Super Admin cannot be removed">
                                    🔒
                                  </span>
                                )}
                              </>
                            ) : (
                              <button
                                type="button"
                                className="icon-btn"
                                onClick={() => handleEdit(u)}
                                title="View member details"
                              >
                                🔍
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: CUSTOM PERMISSIONS (Categorized, Simple & Clear)
          ========================================================================= */}
      {activeTab === 'permissions' && selUser && (
        <div>
          {/* User Selector Strip */}
          <div style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong style={{ color: 'var(--navy)', fontSize: '0.92rem' }}>Customizing Permissions For:</strong>
            <small style={{ color: 'var(--ink-3)' }}>Click a member to switch their board</small>
          </div>

          <div className="roles-user-selector-strip">
            {users.map((u) => {
              const isSelected = u.id === selectedUserId;
              return (
                <div
                  key={u.id}
                  className={`roles-user-selector-card ${isSelected ? 'is-active' : ''}`}
                  onClick={() => setSelectedUserId(u.id)}
                >
                  <div
                    className="user-board-avatar"
                    style={{
                      width: '36px',
                      height: '36px',
                      fontSize: '0.8rem',
                      background: isSelected ? 'var(--navy)' : 'var(--cream-deep)',
                      color: isSelected ? '#fff' : 'var(--navy)',
                    }}
                  >
                    {getUserInitials(u.name)}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {u.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--ink-3)' }}>
                      {data.roles?.[u.role]?.name || u.role}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Member Banner & Quick Presets */}
          <div className="card" style={{ marginBottom: '1.5rem', background: '#f8fafc', border: '1px solid var(--line)' }}>
            <div style={{ padding: '1rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div className="user-board-avatar" style={{ width: '42px', height: '42px', fontSize: '0.95rem' }}>
                  {getUserInitials(selUser.name)}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--navy)' }}>{selUser.name}</h2>
                    {getRoleBadge(selUser.role)}
                    <span className="badge badge--published">{selUser.status || 'Active'}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--ink-3)', marginTop: '2px' }}>
                    {selUser.email} &bull; Adjust permissions per category below or apply a quick preset.
                  </div>
                </div>
              </div>

              {/* Quick Presets Bar */}
              {hasEdit && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase' }}>
                    Role Presets:
                  </span>
                  <button type="button" className="board-preset-btn" onClick={() => handleApplyPreset('super_admin')}>
                    👑 Super Admin
                  </button>
                  <button type="button" className="board-preset-btn" onClick={() => handleApplyPreset('editor')}>
                    ✍️ Editor
                  </button>
                  <button type="button" className="board-preset-btn" onClick={() => handleApplyPreset('clinical_reviewer')}>
                    🩺 Reviewer
                  </button>
                  <button type="button" className="board-preset-btn" onClick={() => handleApplyPreset('author')}>
                    📝 Author
                  </button>
                  <button type="button" className="board-preset-btn" onClick={() => handleBatchSet('edit')} title="Set all to Full Edit">
                    All Edit
                  </button>
                  <button type="button" className="board-preset-btn" onClick={() => handleBatchSet('view')} title="Set all to View Only">
                    All View
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Categorized Permissions Groups */}
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className="perm-category-group">
              <div className="perm-category-header">
                <div className="perm-category-title">
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </div>
                <div className="perm-category-subtitle">{cat.desc}</div>
              </div>

              <div>
                {cat.modules.map((mod) => {
                  const perm = getUserPermission(selUser, mod.id);
                  const isLockedPrimary = selUser.id === 'usr-1' && (mod.id === 'roles' || mod.id === 'dashboard');

                  return (
                    <div key={mod.id} className="perm-module-row">
                      <div className="perm-module-info">
                        <span className="perm-module-icon">{mod.icon}</span>
                        <div>
                          <div className="perm-module-name">{mod.name}</div>
                          <div className="perm-module-desc">
                            {mod.desc} &bull; <code style={{ fontSize: '0.7rem' }}>{mod.route}</code>
                          </div>
                        </div>
                      </div>

                      <div className="perm-segmented-control" role="group">
                        <button
                          type="button"
                          className={`perm-seg-btn perm-seg-btn--edit ${perm === 'edit' ? 'is-active' : ''}`}
                          disabled={!hasEdit}
                          onClick={() => handleSetPermission(mod.id, 'edit')}
                        >
                          🟢 Full Edit
                        </button>
                        <button
                          type="button"
                          className={`perm-seg-btn perm-seg-btn--view ${perm === 'view' ? 'is-active' : ''}`}
                          disabled={!hasEdit}
                          onClick={() => handleSetPermission(mod.id, 'view')}
                        >
                          🟡 View Only
                        </button>
                        <button
                          type="button"
                          className={`perm-seg-btn perm-seg-btn--hide ${perm === 'hide' ? 'is-active' : ''}`}
                          disabled={!hasEdit || isLockedPrimary}
                          onClick={() => handleSetPermission(mod.id, 'hide')}
                          title={isLockedPrimary ? 'Primary Super Admin requires Full Edit on this module' : undefined}
                        >
                          {isLockedPrimary ? '🔒 Locked' : '🔴 Hidden'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Add User Modal */}
      {editingUser && (
        <Modal
          isOpen={isModalOpen}
          title={!hasEdit ? (editingUser.name ? `View Member: ${editingUser.name}` : 'View Team Member') : (editingUser.name ? `Edit Member: ${editingUser.name}` : 'Add New Team Member')}
          onClose={() => setIsModalOpen(false)}
          onSave={hasEdit ? handleSaveUser : undefined}
        >
          <fieldset disabled={!hasEdit} style={{ border: 'none', margin: 0, padding: 0 }}>
            <div className="form-group">
              <label>
                Full Name <span style={{ color: 'var(--danger)', fontWeight: 700 }}>*</span>
              </label>
              <input
                type="text"
                className={`form-control ${formErrors.name ? 'is-invalid' : ''}`}
                value={editingUser.name}
                onChange={(e) => {
                  setEditingUser({ ...editingUser, name: e.target.value });
                  if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
                }}
                placeholder="e.g. Dr. Jane Foster"
              />
              {formErrors.name && (
                <div className="field-error-msg">⚠️ {formErrors.name}</div>
              )}
            </div>

            <div className="form-group">
              <label>
                Email Address <span style={{ color: 'var(--danger)', fontWeight: 700 }}>*</span>
              </label>
              <input
                type="email"
                className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                value={editingUser.email}
                onChange={(e) => {
                  setEditingUser({ ...editingUser, email: e.target.value });
                  if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: '' }));
                }}
                placeholder="jane@thefirstsevenyears.com"
              />
              {formErrors.email && (
                <div className="field-error-msg">⚠️ {formErrors.email}</div>
              )}
            </div>

            <div className="form-group">
              <label>Designated Role</label>
              <select
                className="form-control"
                value={editingUser.role}
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
              >
                <option value="super_admin">👑 Super Admin (Full Unrestricted Access)</option>
                <option value="editor">✍️ Editor (Content &amp; Media Management)</option>
                <option value="clinical_reviewer">🩺 Medical Reviewer (Clinical Approvals &amp; Triage)</option>
                <option value="author">📝 Author (Drafts Q&amp;As and FAQs)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Member Status</label>
              <select
                className="form-control"
                value={editingUser.status || 'Active'}
                onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Invited">Invited (Pending Confirmation)</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </fieldset>
        </Modal>
      )}
    </div>
  );
};

export default Roles;
