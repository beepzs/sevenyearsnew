import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { Modal } from '../components/Modal';
import { RichTextEditor } from '../components/RichTextEditor';
import { ExpertItem } from '../types';

export const Experts: React.FC = () => {
  const navigate = useNavigate();
  const { data, searchQuery, togglePublish, deleteItem, saveItem, showToast, canEdit } = useAdmin();
  const hasEdit = canEdit('experts');

  const [editingExpert, setEditingExpert] = useState<ExpertItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewExpert, setIsNewExpert] = useState(false);
  const [showManualUrl, setShowManualUrl] = useState(false);

  const [answerFilter, setAnswerFilter] = useState('');
  const [videoFilter, setVideoFilter] = useState('');

  // Normalize experts
  const rawExperts = data.experts || {};
  const expertsList: ExpertItem[] = Array.isArray(rawExperts)
    ? rawExperts
    : Object.entries(rawExperts).map(([slug, val]: [string, any]) => ({
        slug,
        ...val
      }));

  const rawAnswers = data.answers || [];
  const answersList: any[] = Array.isArray(rawAnswers) ? rawAnswers : Object.values(rawAnswers);

  const rawVideos = data.videos || (data as any).episodes || [];
  const videosList: any[] = Array.isArray(rawVideos) ? rawVideos : Object.values(rawVideos);

  const filteredExperts = expertsList.filter((e) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const bioStr = Array.isArray(e.bio) ? e.bio.join(' ') : (e.bio || '');
      return (
        e.name.toLowerCase().includes(q) ||
        e.role?.toLowerCase().includes(q) ||
        e.slug.toLowerCase().includes(q) ||
        bioStr.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    navigate('/experts/new');
  };

  const handleEdit = (expert: ExpertItem) => {
    navigate(`/experts/${encodeURIComponent(expert.slug)}/edit`);
  };

  const handleSave = () => {
    if (!editingExpert?.name || !editingExpert?.slug) {
      showToast('Please provide an expert name and slug', 'error');
      return;
    }

    const cleanSlug = editingExpert.slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/(^-+|-+$)/g, '');

    const credsArray = typeof editingExpert.creds === 'string'
      ? editingExpert.creds.split(',').map((s) => s.trim()).filter(Boolean)
      : (editingExpert.creds || []);

    const bioArray = typeof editingExpert.bio === 'string'
      ? editingExpert.bio.split('\n\n').map((s) => s.trim()).filter(Boolean)
      : (editingExpert.bio || []);

    const toSave: ExpertItem = {
      ...editingExpert,
      slug: cleanSlug,
      name: editingExpert.name.trim(),
      role: editingExpert.role ? editingExpert.role.trim() : '',
      short: bioArray.length > 0 ? bioArray[0] : (editingExpert.short || ''),
      swatch: editingExpert.swatch || '#cce5ff',
      creds: credsArray,
      bio: bioArray,
      answers: editingExpert.answers || [],
      episodes: editingExpert.episodes || [],
      seo_title: editingExpert.seo_title || '',
      meta_desc: editingExpert.meta_desc || '',
      focus_keyword: editingExpert.focus_keyword || '',
      keywords: editingExpert.keywords || '',
      canonical_url: editingExpert.canonical_url || '',
      robots_index: editingExpert.robots_index || 'noindex'
    };

    saveItem('experts', toSave, 'slug');
    setIsModalOpen(false);
    showToast(`Expert "${editingExpert.name}" saved!`, 'success');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !editingExpert) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      setEditingExpert({ ...editingExpert, img: dataUrl });
      showToast('Headshot attached!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const toggleAnswer = (slug: string) => {
    if (!editingExpert) return;
    const current = editingExpert.answers || [];
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    setEditingExpert({ ...editingExpert, answers: next });
  };

  const toggleEpisode = (id: string, yId?: string) => {
    if (!editingExpert) return;
    const current = editingExpert.episodes || [];
    const isPresent = current.includes(id) || (yId && current.includes(yId));
    let next: string[];
    if (isPresent) {
      next = current.filter((i) => i !== id && i !== yId);
    } else {
      next = [...current, id];
      if (yId && yId !== id && !next.includes(yId)) {
        next.push(yId);
      }
    }
    setEditingExpert({ ...editingExpert, episodes: next });
  };

  // SEO counters
  const seoTitleLen = (editingExpert?.seo_title || '').length;
  const titleCountColor = seoTitleLen >= 45 && seoTitleLen <= 60
    ? 'var(--mint)'
    : (seoTitleLen > 60 ? 'var(--danger)' : 'var(--ink-3)');

  const seoDescLen = (editingExpert?.meta_desc || '').length;
  const descCountColor = seoDescLen >= 130 && seoDescLen <= 160
    ? 'var(--mint)'
    : (seoDescLen > 160 ? 'var(--danger)' : 'var(--ink-3)');

  const modalFilteredAnswers = answersList.filter((a: any) => {
    if (!answerFilter) return true;
    const q = (a.q || a.question || '').toLowerCase();
    const term = answerFilter.toLowerCase();
    return q.includes(term);
  });

  const modalFilteredVideos = videosList.filter((v: any) => {
    if (!videoFilter) return true;
    const title = (v.title || '').toLowerCase();
    const id = (v.id || v.youtube_id || '').toLowerCase();
    const term = videoFilter.toLowerCase();
    return title.includes(term) || id.includes(term);
  });

  return (
    <div className="content-area">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Expert Directory &amp; Hosts</h1>
        </div>
        {hasEdit && (
          <button className="btn btn--primary" onClick={handleOpenAdd}>
            + Add Expert / Host
          </button>
        )}
      </div>

      <div className="card">
        <div className="card__header">
          <h2 className="card__title">All Registered Experts</h2>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>PHOTO</th>
                <th>EXPERT &amp; SLUG</th>
                <th>ROLE &amp; BIO</th>
                <th>ASSIGNED Q&amp;AS</th>
                <th>VIDEO LIBRARY</th>
                <th>STATUS</th>
                <th style={{ width: '85px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredExperts.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ink-3)' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>👥</div>
                    <strong style={{ color: 'var(--navy)', fontSize: '1rem' }}>No experts found</strong>
                    <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 1rem' }}>No specialists match your search criteria.</p>
                    <button className="btn btn--sm btn--primary" onClick={handleOpenAdd}>+ Add Expert / Host</button>
                  </td>
                </tr>
              ) : (
                filteredExperts.map((exp) => {
                  const expAnswers = Array.isArray(exp.answers) ? exp.answers : null;
                  const linkedAns = expAnswers
                    ? answersList.filter((a: any) => expAnswers.includes(a.slug))
                    : answersList.filter((a: any) => a.expert === exp.slug);

                  const expEpisodes = Array.isArray(exp.episodes) ? exp.episodes : null;
                  const linkedVids = expEpisodes
                    ? videosList.filter((v: any) =>
                        expEpisodes.includes(v.id) ||
                        (v.youtube_id && expEpisodes.includes(v.youtube_id)) ||
                        (v.slug && expEpisodes.includes(v.slug))
                      )
                    : videosList.filter((v: any) => v.guest === exp.slug || v.expert === exp.slug);

                  const bioSnippet = Array.isArray(exp.bio) ? exp.bio[0] : (exp.bio || exp.short || '');

                  return (
                    <tr key={exp.slug}>
                      <td>
                        {exp.img ? (
                          <img
                            src={exp.img}
                            alt={exp.name}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1px solid var(--line)'
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.onerror = null;
                              target.src = '/assets/img/dr-murray-clarke.jpg';
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '50%',
                              background: 'var(--mint)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              color: 'var(--navy)'
                            }}
                          >
                            {(exp.name || exp.slug)[0]}
                          </div>
                        )}
                      </td>
                      <td className="table-cell-title">
                        <strong>{exp.name}</strong>
                        <br />
                        <small style={{ color: 'var(--ink-3)' }}>/experts/{exp.slug}/</small>
                      </td>
                      <td data-label="Role &amp; Bio">
                        <div style={{ maxWidth: '280px' }}>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--navy)' }}>{exp.role || 'Specialist'}</strong>
                          {bioSnippet && (
                            <p style={{ fontSize: '0.8rem', color: 'var(--ink-2)', margin: '0.2rem 0 0', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {bioSnippet}
                            </p>
                          )}
                          {exp.creds && (
                            <small style={{ color: 'var(--ink-3)', display: 'block', marginTop: '0.2rem' }}>
                              {Array.isArray(exp.creds) ? exp.creds.join(' · ') : exp.creds}
                            </small>
                          )}
                        </div>
                      </td>
                      <td data-label="Assigned Q&amp;As">
                        {linkedAns.length > 0 ? (
                          <span className="badge" style={{ background: 'var(--cream-deep)', color: 'var(--navy)', fontWeight: 600 }}>
                            💬 {linkedAns.length} Q&amp;A{linkedAns.length > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--ink-3)', fontSize: '0.8rem' }}>None</span>
                        )}
                      </td>
                      <td data-label="Video Library">
                        {linkedVids.length > 0 ? (
                          <span className="badge" style={{ background: 'var(--cream-deep)', color: 'var(--navy)', fontWeight: 600 }}>
                            🎬 {linkedVids.length} Video{linkedVids.length > 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--ink-3)', fontSize: '0.8rem' }}>None</span>
                        )}
                      </td>
                      <td data-label="Status">
                        <span
                          className={`badge ${exp.published !== false ? 'badge--published' : 'badge--draft'}`}
                          onClick={() => hasEdit && togglePublish('experts', 'slug', exp.slug)}
                          style={{ cursor: hasEdit ? 'pointer' : 'default' }}
                          title={hasEdit ? "Click to toggle publish status" : "View-only access"}
                        >
                          <span className="badge--dot" />
                          {exp.published !== false ? 'PUBLISHED' : 'DRAFT'}
                        </span>
                      </td>
                      <td className="table-actions-cell" style={{ textAlign: 'right' }}>
                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                          {hasEdit ? (
                            <>
                              <button className="icon-btn" onClick={() => handleEdit(exp)} title="Edit Expert">
                                ✏️
                              </button>
                              <button
                                className="icon-btn icon-btn--danger"
                                onClick={() => deleteItem('experts', 'slug', exp.slug)}
                                title="Delete Expert"
                              >
                                🗑️
                              </button>
                            </>
                          ) : (
                            <button
                              className="icon-btn"
                              onClick={() => handleEdit(exp)}
                              title="View Expert Details (Read-only)"
                            >
                              👁️
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

      {/* EDIT / ADD EXPERT MODAL */}
      {editingExpert && (
        <Modal
          isOpen={isModalOpen}
          title={isNewExpert ? 'Add Expert / Host' : (hasEdit ? 'Edit Expert' : 'View Expert Details (Read Only)')}
          onClose={() => setIsModalOpen(false)}
          onSave={hasEdit ? handleSave : undefined}
          maxWidth="780px"
        >
          <fieldset disabled={!hasEdit} style={{ border: 'none', padding: 0, margin: 0 }}>
          {/* 1. NAME & SLUG */}
          <div className="form-row" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 200px' }}>
              <label>Expert / Host Name *</label>
              <input
                type="text"
                className="form-control"
                value={editingExpert.name}
                placeholder="e.g. Dr. Murray Clarke"
                onChange={(e) => {
                  const val = e.target.value;
                  if (isNewExpert) {
                    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setEditingExpert({ ...editingExpert, name: val, slug: autoSlug });
                  } else {
                    setEditingExpert({ ...editingExpert, name: val });
                  }
                }}
                required
              />
            </div>
            <div className="form-group" style={{ flex: '1 1 200px' }}>
              <label>Slug (URL identifier) *</label>
              <input
                type="text"
                className="form-control"
                value={editingExpert.slug}
                placeholder="e.g. dr-murray-clarke"
                readOnly={!isNewExpert}
                style={!isNewExpert ? { background: 'var(--cream)' } : {}}
                onChange={(e) => setEditingExpert({ ...editingExpert, slug: e.target.value })}
                required
              />
            </div>
          </div>

          {/* 2. ROLE & CREDENTIALS */}
          <div className="form-row" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 200px' }}>
              <label>Role / Title</label>
              <input
                type="text"
                className="form-control"
                value={editingExpert.role || ''}
                placeholder="e.g. Host · The First Seven Years"
                onChange={(e) => setEditingExpert({ ...editingExpert, role: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ flex: '1 1 200px' }}>
              <label>Credentials / Specialization</label>
              <input
                type="text"
                className="form-control"
                value={typeof editingExpert.creds === 'string' ? editingExpert.creds : (editingExpert.creds || []).join(', ')}
                placeholder="e.g. ND, DHom, LAc (comma separated)"
                onChange={(e) => setEditingExpert({ ...editingExpert, creds: e.target.value })}
              />
            </div>
          </div>

          {/* 3. DESCRIPTION & BIO */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label>Description &amp; Bio</label>
              <small style={{ color: 'var(--ink-3)' }}>Multi-paragraph bio &amp; clinical overview</small>
            </div>
            <RichTextEditor
              value={typeof editingExpert.bio === 'string' ? editingExpert.bio : (editingExpert.bio || []).join('\n\n')}
              minHeight={200}
              placeholder="Enter expert biography, background, clinical focus..."
              onChange={(val) => setEditingExpert({ ...editingExpert, bio: val })}
            />
          </div>

          {/* 4. HEADSHOT PHOTO & PUBLISH TOGGLE */}
          <div className="form-row" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 280px' }}>
              <label>Headshot Photo (Upload Image)</label>
              <div className="image-upload-wrap">
                <input
                  type="file"
                  id="f-exp-file-input"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />

                {editingExpert.img ? (
                  <div className="image-upload-card" style={{ display: 'flex' }}>
                    <img
                      src={editingExpert.img}
                      alt="Headshot"
                      className="image-upload-thumb"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/assets/img/dr-murray-clarke.jpg';
                      }}
                    />
                    <div className="image-upload-info">
                      <span className="image-upload-title">
                        {editingExpert.img.startsWith('data:') ? 'Uploaded Image' : editingExpert.img.split('/').pop()}
                      </span>
                      <div className="image-upload-actions">
                        <button
                          type="button"
                          className="btn btn--sm btn--outline"
                          onClick={() => document.getElementById('f-exp-file-input')?.click()}
                        >
                          Change Photo
                        </button>
                        <button
                          type="button"
                          className="btn btn--sm btn--danger-outline"
                          onClick={() => setEditingExpert({ ...editingExpert, img: null })}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    className="image-dropzone"
                    style={{ display: 'flex' }}
                    onClick={() => document.getElementById('f-exp-file-input')?.click()}
                  >
                    <div className="image-dropzone__icon">📸</div>
                    <div className="image-dropzone__text">
                      <strong>Click to upload</strong> or drag &amp; drop
                    </div>
                    <div className="image-dropzone__hint">JPG, PNG, WebP or SVG headshot (square recommended)</div>
                    <button
                      type="button"
                      className="btn btn--sm btn--outline"
                      style={{ marginTop: '0.5rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById('f-exp-file-input')?.click();
                      }}
                    >
                      Choose Image File
                    </button>
                  </div>
                )}

                {/* URL fallback */}
                <div style={{ marginTop: '0.45rem' }}>
                  <a
                    href="#toggle"
                    onClick={(e) => {
                      e.preventDefault();
                      setShowManualUrl(!showManualUrl);
                    }}
                    style={{ fontSize: '0.75rem', color: 'var(--ink-3)', textDecoration: 'none' }}
                  >
                    🔗 Or specify image URL manually
                  </a>
                  {showManualUrl && (
                    <div style={{ marginTop: '0.35rem' }}>
                      <input
                        type="text"
                        className="form-control"
                        value={editingExpert.img || ''}
                        placeholder="/assets/img/dr-murray-clarke.jpg"
                        style={{ fontSize: '0.8rem' }}
                        onChange={(e) => setEditingExpert({ ...editingExpert, img: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="form-group" style={{ flex: '1 1 180px', display: 'flex', justifyContent: 'center' }}>
              <label className="toggle-label" style={{ marginTop: '1.5rem' }}>
                <input
                  type="checkbox"
                  className="sr-checkbox"
                  checked={editingExpert.published !== false}
                  onChange={(e) => setEditingExpert({ ...editingExpert, published: e.target.checked })}
                />
                <span className="toggle-switch"></span>
                <span>Published on live site</span>
              </label>
            </div>
          </div>

          {/* 5. ASSIGN PARENT QUESTIONS & ANSWERS */}
          <div className="form-group">
            <label>Assign Parent Question &amp; Answers (Select Multiple)</label>
            <div className="selection-box">
              <input
                type="text"
                className="selection-box__filter"
                placeholder="Filter questions..."
                value={answerFilter}
                onChange={(e) => setAnswerFilter(e.target.value)}
              />
              <div className="selection-box__list">
                {modalFilteredAnswers.length === 0 ? (
                  <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--ink-3)' }}>
                    No matching questions found
                  </div>
                ) : (
                  modalFilteredAnswers.map((a: any) => {
                    const isChecked = (editingExpert.answers || []).includes(a.slug);
                    return (
                      <label
                        key={a.slug}
                        className="selection-item"
                        onClick={(e) => {
                          e.preventDefault();
                          toggleAnswer(a.slug);
                        }}
                      >
                        <input type="checkbox" checked={isChecked} readOnly />
                        <span className="selection-item__title">{a.q || a.question}</span>
                        <span className="selection-item__meta">{a.topic}</span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
            <small style={{ color: 'var(--ink-3)', display: 'block', marginTop: '0.25rem' }}>
              Checked Q&amp;As will be assigned to this expert as their answering specialist.
            </small>
          </div>

          {/* 6. ASSIGN VIDEOS FROM VIDEO LIBRARY */}
          <div className="form-group">
            <label>Assign Videos from Video Library (Select Multiple Episodes &amp; Clips)</label>
            <div className="selection-box">
              <input
                type="text"
                className="selection-box__filter"
                placeholder="Filter video episodes &amp; clips..."
                value={videoFilter}
                onChange={(e) => setVideoFilter(e.target.value)}
              />
              <div className="selection-box__list">
                {modalFilteredVideos.length === 0 ? (
                  <div style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--ink-3)' }}>
                    No matching videos found
                  </div>
                ) : (
                  modalFilteredVideos.map((e: any) => {
                    const id = e.id || e.youtube_id;
                    const yId = e.youtube_id || e.id;
                    const thumbId = e.youtube_id || e.id;
                    const isChecked = (editingExpert.episodes || []).includes(id) || (yId && (editingExpert.episodes || []).includes(yId));
                    return (
                      <label
                        key={id}
                        className="selection-item"
                        onClick={(ev) => {
                          ev.preventDefault();
                          toggleEpisode(id, yId);
                        }}
                      >
                        <input type="checkbox" checked={isChecked} readOnly />
                        <img
                          className="selection-item__thumb"
                          src={`https://i.ytimg.com/vi/${thumbId}/hqdefault.jpg`}
                          alt=""
                          loading="lazy"
                        />
                        <span className="selection-item__title">{e.title}</span>
                        <span className="selection-item__meta">
                          {e.type || e.kind || 'Clip'} · {thumbId}
                        </span>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
            <small style={{ color: 'var(--ink-3)', display: 'block', marginTop: '0.25rem' }}>
              Checked videos will link this expert as host or featured guest.
            </small>
          </div>

          {/* 7. EXPERT SEO FIELDS SECTION */}
          <div
            style={{
              marginTop: '1.25rem',
              padding: '1rem',
              background: 'var(--cream)',
              borderRadius: '8px',
              border: '1px solid var(--line)'
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '1.15rem' }}>🔍</span>
                <strong style={{ fontSize: '0.95rem', color: 'var(--navy)' }}>
                  Expert &amp; Host SEO, Google SERP &amp; Social Sharing
                </strong>
              </div>
              <span
                className="badge"
                style={{
                  background: 'var(--navy)',
                  color: '#fff',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  textTransform: 'uppercase'
                }}
              >
                ALL SEO FIELDS
              </span>
            </div>

            {/* LIVE GOOGLE SERP PREVIEW */}
            <div
              style={{
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '0.75rem 1rem',
                marginBottom: '1rem',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}
            >
              <div
                style={{
                  fontSize: '0.75rem',
                  color: '#202124',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  marginBottom: '0.25rem'
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: '16px',
                    height: '16px',
                    background: 'var(--navy)',
                    borderRadius: '50%',
                    color: '#fff',
                    fontSize: '10px',
                    textAlign: 'center',
                    lineHeight: '16px',
                    fontWeight: 700
                  }}
                >
                  7
                </span>
                <span>thefirstsevenyears.com</span>
                <span style={{ color: '#5f6368' }}>
                  › experts › <span>{editingExpert.slug || 'expert'}</span>
                </span>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '1rem',
                      color: '#1a0dab',
                      fontWeight: 500,
                      lineHeight: 1.3,
                      marginBottom: '0.25rem',
                      cursor: 'pointer'
                    }}
                  >
                    {editingExpert.seo_title ||
                      (editingExpert.name
                        ? `${editingExpert.name} — ${editingExpert.role ? editingExpert.role.split('·')[0].trim() : 'Expert'} | The First Seven Years`
                        : 'Expert Profile — The First Seven Years')}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#4d5156', lineHeight: 1.4 }}>
                    {editingExpert.meta_desc ||
                      (typeof editingExpert.bio === 'string' ? editingExpert.bio.slice(0, 160) : '') ||
                      editingExpert.short ||
                      'Meet our pediatric specialist, clinical background, podcast episodes and verified parent answers.'}
                  </div>
                </div>
                {editingExpert.img && (
                  <img
                    src={editingExpert.img}
                    alt=""
                    style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '6px',
                      objectFit: 'cover',
                      border: '1px solid var(--line)',
                      flexShrink: 0
                    }}
                  />
                )}
              </div>
            </div>

            {/* SEO META TITLE */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>SEO Meta Title (Title Tag)</label>
                <small style={{ color: titleCountColor }}>
                  <span>{seoTitleLen}</span> / 60 chars (Recommended 50–60)
                </small>
              </div>
              <input
                type="text"
                className="form-control"
                value={editingExpert.seo_title || ''}
                placeholder="Custom title tag (defaults to Expert Name — Role if empty)"
                onChange={(e) => setEditingExpert({ ...editingExpert, seo_title: e.target.value })}
              />
            </div>

            {/* SEO META DESCRIPTION */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>SEO Meta Description</label>
                <small style={{ color: descCountColor }}>
                  <span>{seoDescLen}</span> / 160 chars (Recommended 150–160)
                </small>
              </div>
              <textarea
                className="form-control"
                rows={2}
                value={editingExpert.meta_desc || ''}
                placeholder="Brief search snippet highlighting qualifications &amp; pediatric focus (150-160 characters)..."
                onChange={(e) => setEditingExpert({ ...editingExpert, meta_desc: e.target.value })}
              />
            </div>

            {/* FOCUS KEYWORD & SECONDARY KEYWORDS */}
            <div className="form-row" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: '1 1 200px' }}>
                <label>Primary Focus Keyword</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingExpert.focus_keyword || ''}
                  placeholder="e.g. Dr Murray Clarke pediatrician"
                  onChange={(e) => setEditingExpert({ ...editingExpert, focus_keyword: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ flex: '1 1 200px' }}>
                <label>Secondary Keywords / Meta Keywords</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingExpert.keywords || ''}
                  placeholder="e.g. pediatric nutrition, child microbiome, gut health"
                  onChange={(e) => setEditingExpert({ ...editingExpert, keywords: e.target.value })}
                />
              </div>
            </div>

            {/* CANONICAL & ROBOTS */}
            <div className="form-row" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: '1 1 200px' }}>
                <label>Canonical URL Override</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingExpert.canonical_url || ''}
                  placeholder={`https://thefirstsevenyears.com/experts/${editingExpert.slug || ''}/`}
                  onChange={(e) => setEditingExpert({ ...editingExpert, canonical_url: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ flex: '1 1 200px' }}>
                <label>Robots Indexing</label>
                <select
                  className="form-control"
                  value={editingExpert.robots_index || 'noindex'}
                  onChange={(e) => setEditingExpert({ ...editingExpert, robots_index: e.target.value })}
                >
                  <option value="noindex">Noindex (Hide from search engines)</option>
                  <option value="index">Index (Allow in search engines)</option>
                </select>
              </div>
            </div>
          </div>
          </fieldset>
        </Modal>
      )}
    </div>
  );
};
