import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Modal } from '../components/Modal';
import { MenuItem } from '../types';

export const Menus: React.FC = () => {
  const { data, togglePublish, deleteItem, saveItem, showToast, canEdit } = useAdmin();
  const hasEdit = canEdit('menus');

  const [activeSubtab, setActiveSubtab] = useState<'header' | 'footer'>('header');
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewItem, setIsNewItem] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [footerColFilter, setFooterColFilter] = useState<string>('all');

  const headerItems = [...(data.menus?.header || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  let footerItems = [...(data.menus?.footer || [])].sort((a, b) => {
    if (a.col === b.col) return (a.order || 0) - (b.order || 0);
    return (a.col || '').localeCompare(b.col || '');
  });

  if (footerColFilter !== 'all') {
    footerItems = footerItems.filter((f) => f.col === footerColFilter);
  }

  const handleOpenAdd = () => {
    setIsNewItem(true);
    setFormErrors({});
    setEditingItem({
      id: (activeSubtab === 'header' ? 'nav-' : 'fn-') + Date.now(),
      label: '',
      url: '/',
      order: (activeSubtab === 'header' ? headerItems.length : footerItems.length) + 1,
      published: true,
      badge: activeSubtab === 'header' ? '' : undefined,
      col: activeSubtab === 'footer' ? 'Topics' : undefined
    });
    setIsModalOpen(true);
  };

  const handleEdit = (item: MenuItem) => {
    setIsNewItem(false);
    setFormErrors({});
    setEditingItem({ ...item });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!editingItem) return;
    const errs: Record<string, string> = {};
    if (!editingItem.label?.trim()) {
      errs.label = 'Please provide a link label';
    }
    if (!editingItem.url?.trim()) {
      errs.url = 'Please provide a destination route URL';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setFormErrors({});
    const collectionType = activeSubtab === 'header' ? 'menu_header' : 'menu_footer';
    saveItem(collectionType, {
      ...editingItem,
      label: editingItem.label.trim(),
      url: editingItem.url.trim()
    }, 'id');
    setIsModalOpen(false);
    showToast('Menu item saved successfully!', 'success');
  };

  const moveOrder = (index: number, direction: 'up' | 'down') => {
    const list = activeSubtab === 'header' ? headerItems : footerItems;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;
    const current = list[index];
    const target = list[targetIdx];
    const tempOrder = current.order;
    current.order = target.order;
    target.order = tempOrder;
    const collectionType = activeSubtab === 'header' ? 'menu_header' : 'menu_footer';
    saveItem(collectionType, current, 'id');
    saveItem(collectionType, target, 'id');
    showToast(`Reordered menu item`, 'info');
  };

  return (
    <div className="content-area">
      {/* 8. MENU MANAGEMENT TAB HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Menu &amp; Navigation Management</h1>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {hasEdit && (
            <button className="btn btn--primary" onClick={handleOpenAdd}>
              {activeSubtab === 'header' ? '+ Add Header Link' : '+ Add Footer Link'}
            </button>
          )}
        </div>
      </div>

      <div className="subtab-bar">
        <button
          className={`subtab-btn ${activeSubtab === 'header' ? 'is-active' : ''}`}
          onClick={() => setActiveSubtab('header')}
        >
          🧭 Header Navigation Menu ({data.menus?.header?.length || 0})
        </button>
        <button
          className={`subtab-btn ${activeSubtab === 'footer' ? 'is-active' : ''}`}
          onClick={() => setActiveSubtab('footer')}
        >
          📑 Footer Directory Columns ({data.menus?.footer?.length || 0})
        </button>
      </div>

      {activeSubtab === 'header' ? (
        <div className="card">
          <div className="card__header">
            <h2 className="card__title" style={{ margin: 0 }}>Primary Navigation Bar &amp; Mobile Drawer Links</h2>
            <div className="card__toolbar">
              <small style={{ color: 'var(--ink-3)' }}>Drag handles or up/down controls reorder navigation sequence</small>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>ORDER</th>
                  <th>LINK LABEL</th>
                  <th>DESTINATION URL</th>
                  <th>MOBILE BADGE</th>
                  <th>TARGET WINDOW</th>
                  <th>STATUS</th>
                  <th style={{ width: '90px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {headerItems.map((item, idx) => (
                  <tr key={item.id}>
                    <td data-label="Order">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        <span style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.9rem' }}>{item.order || idx + 1}</span>
                        {hasEdit && (
                          <div className="menu-reorder-btns" style={{ display: 'flex', gap: '2px' }}>
                            <button
                              type="button"
                              className="btn btn--sm btn--reorder"
                              title="Move Up"
                              disabled={idx === 0}
                              onClick={() => moveOrder(idx, 'up')}
                              style={{ padding: '2px 4px', fontSize: '10px' }}
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              className="btn btn--sm btn--reorder"
                              title="Move Down"
                              disabled={idx === headerItems.length - 1}
                              onClick={() => moveOrder(idx, 'down')}
                              style={{ padding: '2px 4px', fontSize: '10px' }}
                            >
                              ▼
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="table-cell-title">
                      <strong>{item.label}</strong>
                    </td>
                    <td data-label="URL">
                      <code style={{ fontSize: '0.8rem', background: 'var(--cream-deep)', padding: '2px 6px', borderRadius: '4px' }}>
                        {item.url}
                      </code>
                    </td>
                    <td data-label="Badge">
                      {item.badge ? (
                        <span className="badge" style={{ background: 'var(--mint)', color: 'var(--navy)', fontWeight: 700 }}>
                          {item.badge}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--ink-3)' }}>—</span>
                      )}
                    </td>
                    <td data-label="Target">
                      <span style={{ fontSize: '0.8rem', color: 'var(--ink-2)' }}>Same window (_self)</span>
                    </td>
                    <td data-label="Status">
                      <span
                        className={`badge ${item.published ? 'badge--published' : 'badge--draft'}`}
                        onClick={() => hasEdit && togglePublish('menu_header', 'id', item.id)}
                        style={{ cursor: hasEdit ? 'pointer' : 'default' }}
                        title={hasEdit ? "Click to toggle publish" : undefined}
                      >
                        <span className="badge--dot" />
                        {item.published ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </td>
                    <td className="table-actions-cell" style={{ textAlign: 'right' }}>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        {hasEdit ? (
                          <>
                            <button className="icon-btn" onClick={() => handleEdit(item)} title="Edit Menu Item">
                              ✏️
                            </button>
                            <button
                              className="icon-btn icon-btn--danger"
                              onClick={() => deleteItem('menu_header', 'id', item.id)}
                              title="Delete Menu Item"
                            >
                              🗑️
                            </button>
                          </>
                        ) : (
                          <button className="icon-btn" onClick={() => handleEdit(item)} title="View Menu Item">
                            👁️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="card__header">
            <h2 className="card__title" style={{ margin: 0 }}>Footer Navigation Directory Columns</h2>
            <div className="card__toolbar">
              <div className="filter-pills">
                {['all', 'Topics', 'Library', 'About & Standards'].map((col) => (
                  <button
                    key={col}
                    className={`filter-pill ${footerColFilter === col ? 'is-active' : ''}`}
                    onClick={() => setFooterColFilter(col)}
                  >
                    {col === 'all' ? 'All Columns' : col}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '130px' }}>COLUMN</th>
                  <th style={{ width: '70px' }}>ORDER</th>
                  <th>LINK LABEL</th>
                  <th>DESTINATION URL</th>
                  <th>TARGET</th>
                  <th>STATUS</th>
                  <th style={{ width: '90px', textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {footerItems.map((item, idx) => {
                  let colBadgeColor = 'var(--mint)';
                  if (item.col === 'Library') colBadgeColor = 'var(--peach)';
                  if (item.col === 'About & Standards') colBadgeColor = 'var(--lilac)';

                  return (
                    <tr key={item.id}>
                      <td data-label="Column">
                        <span className="badge" style={{ background: colBadgeColor, color: 'var(--navy)', fontWeight: 700 }}>
                          {item.col || 'General'}
                        </span>
                      </td>
                      <td data-label="Order">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--navy)', fontSize: '0.9rem' }}>{item.order || idx + 1}</span>
                          {hasEdit && (
                            <div className="menu-reorder-btns" style={{ display: 'flex', gap: '2px' }}>
                              <button
                                type="button"
                                className="btn btn--sm btn--reorder"
                                title="Move Up"
                                disabled={idx === 0}
                                onClick={() => moveOrder(idx, 'up')}
                                style={{ padding: '2px 4px', fontSize: '10px' }}
                              >
                                ▲
                              </button>
                              <button
                                type="button"
                                className="btn btn--sm btn--reorder"
                                title="Move Down"
                                disabled={idx === footerItems.length - 1}
                                onClick={() => moveOrder(idx, 'down')}
                                style={{ padding: '2px 4px', fontSize: '10px' }}
                              >
                                ▼
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="table-cell-title">
                        <strong>{item.label}</strong>
                      </td>
                      <td data-label="URL">
                        <code style={{ fontSize: '0.8rem', background: 'var(--cream-deep)', padding: '2px 6px', borderRadius: '4px' }}>
                          {item.url}
                        </code>
                      </td>
                      <td data-label="Target">
                        <span style={{ fontSize: '0.8rem', color: 'var(--ink-2)' }}>Same (_self)</span>
                      </td>
                      <td data-label="Status">
                        <span
                          className={`badge ${item.published ? 'badge--published' : 'badge--draft'}`}
                          onClick={() => hasEdit && togglePublish('menu_footer', 'id', item.id)}
                          style={{ cursor: hasEdit ? 'pointer' : 'default' }}
                          title={hasEdit ? "Click to toggle publish" : undefined}
                        >
                          <span className="badge--dot" />
                          {item.published ? 'PUBLISHED' : 'DRAFT'}
                        </span>
                      </td>
                      <td className="table-actions-cell" style={{ textAlign: 'right' }}>
                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                          {hasEdit ? (
                            <>
                              <button className="icon-btn" onClick={() => handleEdit(item)} title="Edit Menu Item">
                                ✏️
                              </button>
                              <button
                                className="icon-btn icon-btn--danger"
                                onClick={() => deleteItem('menu_footer', 'id', item.id)}
                                title="Delete Menu Item"
                              >
                                🗑️
                              </button>
                            </>
                          ) : (
                            <button className="icon-btn" onClick={() => handleEdit(item)} title="View Menu Item">
                              👁️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT / ADD MENU MODAL (EXACT PYTHON ADMIN REPLICA) */}
      {editingItem && (
        <Modal
          isOpen={isModalOpen}
          title={
            !hasEdit
              ? 'View Menu Link (Read Only)'
              : (activeSubtab === 'header'
                ? (isNewItem ? 'Add Header Navigation Link' : 'Edit Header Navigation Link')
                : (isNewItem ? 'Add Footer Directory Link' : 'Edit Footer Directory Link'))
          }
          onClose={() => setIsModalOpen(false)}
          onSave={hasEdit ? handleSave : undefined}
          maxWidth="640px"
        >
          <fieldset disabled={!hasEdit} style={{ border: 'none', margin: 0, padding: 0 }}>
            {activeSubtab === 'header' ? (
              <>
                <div className="form-group">
                  <label>
                    Link Label <span style={{ color: 'var(--danger)', fontWeight: 700 }}>*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.label ? 'is-invalid' : ''}`}
                    value={editingItem.label}
                    placeholder="e.g. Topics, Episodes, The Book"
                    onChange={(e) => {
                      setEditingItem({ ...editingItem, label: e.target.value });
                      if (formErrors.label) setFormErrors((prev) => ({ ...prev, label: '' }));
                    }}
                  />
                  {formErrors.label && (
                    <div className="field-error-msg">⚠️ {formErrors.label}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    Destination Route URL <span style={{ color: 'var(--danger)', fontWeight: 700 }}>*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.url ? 'is-invalid' : ''}`}
                    value={editingItem.url}
                    placeholder="e.g. /topics/ or /episodes/"
                    onChange={(e) => {
                      setEditingItem({ ...editingItem, url: e.target.value });
                      if (formErrors.url) setFormErrors((prev) => ({ ...prev, url: '' }));
                    }}
                  />
                  {formErrors.url && (
                    <div className="field-error-msg">⚠️ {formErrors.url}</div>
                  )}
                </div>

                <div className="form-row" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Mobile Drawer Badge (Optional)</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingItem.badge || ''}
                      placeholder="e.g. 13 hubs, 116+, Coming soon"
                      onChange={(e) => setEditingItem({ ...editingItem, badge: e.target.value })}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Target Window</label>
                    <select
                      className="form-control"
                      value={editingItem.target || '_self'}
                      onChange={(e) => setEditingItem({ ...editingItem, target: e.target.value })}
                    >
                      <option value="_self">Same Window (_self)</option>
                      <option value="_blank">New Tab (_blank)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Display Order Sequence</label>
                  <input
                    type="number"
                    className="form-control"
                    value={editingItem.order || 1}
                    min={1}
                    max={99}
                    onChange={(e) => setEditingItem({ ...editingItem, order: parseInt(e.target.value) || 1 })}
                  />
                </div>

                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      className="sr-checkbox"
                      checked={editingItem.published !== false}
                      onChange={(e) => setEditingItem({ ...editingItem, published: e.target.checked })}
                    />
                    <span className="toggle-switch"></span>
                    <span>Published &amp; Active in Header</span>
                  </label>
                </div>
              </>
            ) : (
              <>
                <div className="form-group">
                  <label>
                    Directory Column Group <span style={{ color: 'var(--danger)', fontWeight: 700 }}>*</span>
                  </label>
                  <select
                    className="form-control"
                    value={editingItem.col || 'Topics'}
                    onChange={(e) => setEditingItem({ ...editingItem, col: e.target.value })}
                  >
                    <option value="Topics">Topics (13 Clinical Topic Hubs)</option>
                    <option value="Library">Library (Episodes, Videos, FAQs)</option>
                    <option value="About & Standards">About &amp; Standards (Editorial, Medical Board, Contact)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>
                    Link Label <span style={{ color: 'var(--danger)', fontWeight: 700 }}>*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.label ? 'is-invalid' : ''}`}
                    value={editingItem.label}
                    placeholder="e.g. Gut Health, Episodes, About Us"
                    onChange={(e) => {
                      setEditingItem({ ...editingItem, label: e.target.value });
                      if (formErrors.label) setFormErrors((prev) => ({ ...prev, label: '' }));
                    }}
                  />
                  {formErrors.label && (
                    <div className="field-error-msg">⚠️ {formErrors.label}</div>
                  )}
                </div>

                <div className="form-group">
                  <label>
                    Destination Route URL <span style={{ color: 'var(--danger)', fontWeight: 700 }}>*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.url ? 'is-invalid' : ''}`}
                    value={editingItem.url}
                    placeholder="e.g. /topics/gut-health/ or /about/"
                    onChange={(e) => {
                      setEditingItem({ ...editingItem, url: e.target.value });
                      if (formErrors.url) setFormErrors((prev) => ({ ...prev, url: '' }));
                    }}
                  />
                  {formErrors.url && (
                    <div className="field-error-msg">⚠️ {formErrors.url}</div>
                  )}
                </div>

                <div className="form-row" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Display Order Sequence</label>
                    <input
                      type="number"
                      className="form-control"
                      value={editingItem.order || 1}
                      min={1}
                      max={99}
                      onChange={(e) => setEditingItem({ ...editingItem, order: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>Target Window</label>
                    <select
                      className="form-control"
                      value={editingItem.target || '_self'}
                      onChange={(e) => setEditingItem({ ...editingItem, target: e.target.value })}
                    >
                      <option value="_self">Same Window (_self)</option>
                      <option value="_blank">New Tab (_blank)</option>
                    </select>
                  </div>
                </div>

                <div className="form-group" style={{ marginTop: '0.75rem' }}>
                  <label className="toggle-label">
                    <input
                      type="checkbox"
                      className="sr-checkbox"
                      checked={editingItem.published !== false}
                      onChange={(e) => setEditingItem({ ...editingItem, published: e.target.checked })}
                    />
                    <span className="toggle-switch"></span>
                    <span>Published &amp; Visible in Footer</span>
                  </label>
                </div>
              </>
            )}
          </fieldset>
        </Modal>
      )}
    </div>
  );
};
