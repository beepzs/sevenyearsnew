import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { Modal } from '../components/Modal';
import { RichTextEditor } from '../components/RichTextEditor';
import { AnswerItem } from '../types';

function extractYouTubeId(url?: string): string {
  if (!url) return '';
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (m) return m[1];
  if (/^[\w-]{11}$/.test(url.trim())) return url.trim();
  return '';
}

export const Answers: React.FC = () => {
  const navigate = useNavigate();
  const { data, searchQuery, togglePublish, deleteItem, saveItem, approveClinical, showToast, canEdit } = useAdmin();
  const hasEdit = canEdit('answers');

  const [topicFilter, setTopicFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [editingAnswer, setEditingAnswer] = useState<AnswerItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewAnswer, setIsNewAnswer] = useState(false);

  // Convert answers dictionary or array to array
  const rawAnswers = data.answers || [];
  const answersList: AnswerItem[] = Array.isArray(rawAnswers)
    ? rawAnswers
    : Object.values(rawAnswers);

  const getQuestion = (ans: AnswerItem) => ans.q || ans.question || '';
  const getShortAnswer = (ans: AnswerItem) => ans.quick || ans.short_answer || '';

  // Normalize experts from database
  const expertsList: { slug: string; name: string }[] = data.experts
    ? (Array.isArray(data.experts)
        ? data.experts.map((e: any) => ({ slug: e.slug, name: e.name || e.slug }))
        : Object.entries(data.experts).map(([s, x]: [string, any]) => ({ slug: s, name: x.name || s })))
    : [];

  const getExpertName = (expSlug?: string) => {
    if (!expSlug) return 'None assigned';
    const found = expertsList.find((e) => e.slug === expSlug);
    return found?.name || expSlug;
  };

  const rawEpisodes = (data as any).episodes || data.videos || [];
  const episodesList: any[] = Array.isArray(rawEpisodes) ? rawEpisodes : Object.values(rawEpisodes);

  const filteredAnswers = answersList.filter((ans) => {
    if (topicFilter !== 'all' && ans.topic !== topicFilter) return false;
    if (statusFilter === 'published' && !ans.published) return false;
    if (statusFilter === 'draft' && ans.published) return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const questionText = getQuestion(ans).toLowerCase();
      const summaryText = getShortAnswer(ans).toLowerCase();
      const slugText = (ans.slug || '').toLowerCase();
      return questionText.includes(q) || summaryText.includes(q) || slugText.includes(q);
    }
    return true;
  });

  const handleOpenAdd = () => {
    navigate('/answers/new');
  };

  const handleEdit = (ans: AnswerItem) => {
    navigate(`/answers/${encodeURIComponent(ans.slug)}/edit`);
  };


  const handleSave = () => {
    if (!editingAnswer) return;
    const qText = editingAnswer.question || editingAnswer.q || '';
    if (!qText.trim() || !editingAnswer.slug.trim()) {
      showToast('Please provide a question and slug', 'error');
      return;
    }

    const videoId = extractYouTubeId(editingAnswer.video) || editingAnswer.video || '';

    const toSave: AnswerItem = {
      ...editingAnswer,
      q: qText,
      question: qText,
      quick: editingAnswer.short_answer || editingAnswer.quick || '',
      short_answer: editingAnswer.short_answer || editingAnswer.quick || '',
      video: videoId
    };

    saveItem('answers', toSave, 'slug');
    setIsModalOpen(false);
    showToast(`Question "${qText.slice(0, 30)}..." saved!`, 'success');
  };

  const toggleSecondaryTopic = (slug: string) => {
    if (!editingAnswer) return;
    const current = editingAnswer.also || [];
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    setEditingAnswer({ ...editingAnswer, also: next });
  };

  const toggleAge = (age: number) => {
    if (!editingAnswer) return;
    const current = editingAnswer.ages || [];
    const next = current.includes(age)
      ? current.filter((a) => a !== age).sort((a, b) => a - b)
      : [...current, age].sort((a, b) => a - b);
    setEditingAnswer({ ...editingAnswer, ages: next });
  };

  const currentVidId = editingAnswer ? (extractYouTubeId(editingAnswer.video) || editingAnswer.video || '') : '';

  // SEO counters
  const seoTitleLen = (editingAnswer?.seo_title || '').length;
  const titleCountColor = seoTitleLen >= 45 && seoTitleLen <= 60
    ? 'var(--mint)'
    : (seoTitleLen > 60 ? 'var(--danger)' : 'var(--ink-3)');

  const seoDescLen = (editingAnswer?.meta_desc || '').length;
  const descCountColor = seoDescLen >= 130 && seoDescLen <= 160
    ? 'var(--mint)'
    : (seoDescLen > 160 ? 'var(--danger)' : 'var(--ink-3)');

  return (
    <div className="content-area">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Question &amp; Answer (Parent Answers)</h1>
        </div>
        {hasEdit && (
          <button className="btn btn--primary" onClick={handleOpenAdd}>
            + Add Question &amp; Answer
          </button>
        )}
      </div>

      <div className="card">
        <div className="card__header">
          <h2 className="card__title">All Q&amp;A Library</h2>
          <div className="card__toolbar">
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
            >
              <option value="all">All Topics</option>
              {data.topics?.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>

            <div className="filter-pills">
              <button
                className={`filter-pill ${statusFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-pill ${statusFilter === 'published' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('published')}
              >
                Published
              </button>
              <button
                className={`filter-pill ${statusFilter === 'draft' ? 'is-active' : ''}`}
                onClick={() => setStatusFilter('draft')}
              >
                Drafts
              </button>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>QUESTION &amp; EXPERT</th>
                <th>TOPIC</th>
                <th>SOURCE VIDEO</th>
                <th>CLINICAL STATUS</th>
                <th>PUBLISH STATUS</th>
                <th style={{ width: '85px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredAnswers.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ink-3)' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>💬</div>
                    <strong style={{ color: 'var(--navy)', fontSize: '1rem' }}>No questions found</strong>
                    <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 1rem' }}>No Q&amp;As match your current filter or search criteria.</p>
                    <button className="btn btn--sm btn--primary" onClick={handleOpenAdd}>+ Add First Question</button>
                  </td>
                </tr>
              ) : (
                filteredAnswers.map((ans) => {
                  const topicObj = data.topics?.find((t) => t.slug === ans.topic);
                  const isReviewed = ans.clinical_status === 'Reviewed';
                  const vidId = ans.video ? (extractYouTubeId(ans.video) || ans.video) : null;
                  const vidObj = vidId ? episodesList.find((v: any) => v.id === vidId || v.youtube_id === vidId) : null;
                  const vidTitle = vidObj?.title || (vidId ? `YouTube (${vidId})` : '');

                  return (
                    <tr key={ans.slug}>
                      <td className="table-cell-title">
                        <strong style={{ fontSize: '0.92rem', color: 'var(--navy)' }}>{getQuestion(ans)}</strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.2rem' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--ink-2)', fontWeight: 600 }}>
                            👤 {getExpertName(ans.expert)}
                          </span>
                          <span style={{ color: 'var(--ink-3)', fontSize: '0.75rem' }}>·</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--ink-3)' }}>/{ans.slug}/</span>
                        </div>
                      </td>
                      <td data-label="Topic">
                        <span className="badge badge--topic-chip">
                          {topicObj?.name || ans.topic}
                        </span>
                      </td>
                      <td data-label="Source Video">
                        {vidId ? (
                          <a
                            href={`https://youtu.be/${vidId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              textDecoration: 'none',
                              color: 'var(--navy)',
                              fontSize: '0.82rem',
                              fontWeight: 600
                            }}
                            title={vidTitle}
                          >
                            <img
                              src={`https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`}
                              style={{ width: '36px', height: '22px', borderRadius: '3px', objectFit: 'cover' }}
                              alt=""
                            />
                            <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {vidTitle}
                            </span>
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ink-3)', fontSize: '0.8rem' }}>None</span>
                        )}
                      </td>
                      <td data-label="Clinical Status">
                        <span
                          className={`badge ${isReviewed ? 'badge--published' : 'badge--draft'}`}
                          onClick={() => approveClinical(ans.slug)}
                          style={{ cursor: 'pointer' }}
                          title="Click to toggle clinical status"
                        >
                          {isReviewed ? '✓ Reviewed' : '⚠️ Pending'}
                        </span>
                        <small style={{ color: 'var(--ink-3)', display: 'block', marginTop: '2px' }}>
                          {ans.reviewed || ans.reviewed_at || 'N/A'}
                        </small>
                      </td>
                      <td data-label="Publish Status">
                        <span
                          className={`badge ${ans.published ? 'badge--published' : 'badge--draft'}`}
                          onClick={() => hasEdit && togglePublish('answers', 'slug', ans.slug)}
                          style={{ cursor: hasEdit ? 'pointer' : 'default' }}
                          title={hasEdit ? "Click to toggle publish status" : "View-only access"}
                        >
                          <span className="badge--dot" />
                          {ans.published ? 'PUBLISHED' : 'DRAFT'}
                        </span>
                      </td>
                      <td className="table-actions-cell" style={{ textAlign: 'right' }}>
                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                          {hasEdit ? (
                            <>
                              <button className="icon-btn" onClick={() => handleEdit(ans)} title="Edit Answer">
                                ✏️
                              </button>
                              <button
                                className="icon-btn icon-btn--danger"
                                onClick={() => deleteItem('answers', 'slug', ans.slug)}
                                title="Delete Answer"
                              >
                                🗑️
                              </button>
                            </>
                          ) : (
                            <button
                              className="icon-btn"
                              onClick={() => handleEdit(ans)}
                              title="View Answer Details (Read-only)"
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

      {/* EDIT / ADD QUESTION & ANSWER MODAL */}
      {editingAnswer && (
        <Modal
          isOpen={isModalOpen}
          title={isNewAnswer ? 'Add New Question & Answer' : (hasEdit ? 'Edit Question & Answer' : 'View Question & Answer (Read Only)')}
          onClose={() => setIsModalOpen(false)}
          onSave={hasEdit ? handleSave : undefined}
          maxWidth="780px"
        >
          <fieldset disabled={!hasEdit} style={{ border: 'none', padding: 0, margin: 0 }}>
          {/* 1. QUESTION TITLE */}
          <div className="form-group">
            <label>Question Title</label>
            <input
              type="text"
              className="form-control"
              value={editingAnswer.question || editingAnswer.q || ''}
              placeholder="e.g. Is my child’s eczema really a gut problem?"
              onChange={(e) => {
                const val = e.target.value;
                if (isNewAnswer) {
                  const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                  setEditingAnswer({ ...editingAnswer, question: val, q: val, slug: autoSlug });
                } else {
                  setEditingAnswer({ ...editingAnswer, question: val, q: val });
                }
              }}
              required
            />
          </div>

          {/* 2. SLUG & ASSIGNED EXPERT */}
          <div className="form-row" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: '1 1 200px' }}>
              <label>Slug</label>
              <input
                type="text"
                className="form-control"
                value={editingAnswer.slug}
                placeholder="is-my-childs-eczema-a-gut-problem"
                readOnly={!isNewAnswer}
                style={!isNewAnswer ? { background: 'var(--cream)' } : {}}
                onChange={(e) => setEditingAnswer({ ...editingAnswer, slug: e.target.value })}
              />
            </div>
            <div className="form-group" style={{ flex: '1 1 200px' }}>
              <label>Assigned Expert</label>
              <select
                className="form-control"
                value={editingAnswer.expert || 'dr-murray-clarke'}
                onChange={(e) => setEditingAnswer({ ...editingAnswer, expert: e.target.value })}
              >
                {expertsList.map((x) => (
                  <option key={x.slug} value={x.slug}>
                    {x.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 3. PRIMARY TOPIC */}
          <div className="form-group">
            <label>Primary Topic</label>
            <select
              className="form-control"
              value={editingAnswer.topic}
              onChange={(e) => setEditingAnswer({ ...editingAnswer, topic: e.target.value })}
            >
              {data.topics?.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* 4. SECONDARY TOPICS */}
          <div className="form-group">
            <label>Secondary Topics (Optional — appears in additional topic hubs)</label>
            <div className="checkbox-pills">
              {(data.topics || [])
                .filter((t) => t.slug !== editingAnswer.topic)
                .map((t) => {
                  const isChecked = (editingAnswer.also || []).includes(t.slug);
                  return (
                    <label
                      key={t.slug}
                      className={`checkbox-pill-label ${isChecked ? 'is-active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        toggleSecondaryTopic(t.slug);
                      }}
                    >
                      <input type="checkbox" checked={isChecked} readOnly />
                      <span>{t.name}</span>
                    </label>
                  );
                })}
            </div>
          </div>

          {/* 5. SOURCE VIDEO CLIP */}
          <div className="form-group">
            <label>Source Video Clip (Optional — Select from Video Library or enter ID)</label>
            <div className="form-row" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <select
                className="form-control"
                style={{ flex: 1.4 }}
                value={currentVidId || ''}
                onChange={(e) => setEditingAnswer({ ...editingAnswer, video: e.target.value })}
              >
                <option value="">-- Select from video library --</option>
                {episodesList.map((e: any) => {
                  const id = e.id || e.youtube_id;
                  const typeTag = e.kind === 'ep' ? `EP ${e.ep || ''}` : 'Clip';
                  return (
                    <option key={id} value={id}>
                      {e.title} ({typeTag} · {id})
                    </option>
                  );
                })}
              </select>
              <input
                type="text"
                className="form-control"
                style={{ flex: 1 }}
                placeholder="Or enter YouTube ID..."
                value={editingAnswer.video || ''}
                onChange={(e) => setEditingAnswer({ ...editingAnswer, video: e.target.value })}
              />
            </div>
            {currentVidId && (
              <div style={{ marginTop: '0.4rem' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    background: 'var(--cream)',
                    padding: '0.4rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid var(--line)'
                  }}
                >
                  <img
                    src={`https://i.ytimg.com/vi/${currentVidId}/hqdefault.jpg`}
                    style={{ height: '44px', borderRadius: '4px' }}
                    alt="Preview"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = 'none';
                    }}
                  />
                  <div style={{ fontSize: '0.8rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--navy)' }}>
                      Detected Video ID: <code>{currentVidId}</code>
                    </span>
                    <div>
                      <a
                        href={`https://youtu.be/${currentVidId}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: 'var(--navy)', fontSize: '0.75rem', textDecoration: 'none' }}
                      >
                        ▶️ Open video in new tab
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 6. CHILD AGE SUITABILITY */}
          <div className="form-group">
            <label>Child Age Suitability</label>
            <div className="checkbox-pills">
              {[0, 1, 2, 3, 4, 5, 6, 7].map((age) => {
                const isChecked = (editingAnswer.ages || []).includes(age);
                return (
                  <label
                    key={age}
                    className={`checkbox-pill-label ${isChecked ? 'is-active' : ''}`}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleAge(age);
                    }}
                  >
                    <input type="checkbox" checked={isChecked} readOnly />
                    <span>Age {age}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 7. SHORT ANSWER SUMMARY */}
          <div className="form-group">
            <label>Short Answer Summary (TL;DR block at top)</label>
            <RichTextEditor
              value={editingAnswer.short_answer || editingAnswer.quick || ''}
              minHeight={120}
              placeholder="Enter quick clinical summary or TL;DR..."
              onChange={(val) =>
                setEditingAnswer({ ...editingAnswer, short_answer: val, quick: val })
              }
            />
          </div>

          {/* 8. FULL CLINICAL BODY */}
          <div className="form-group">
            <label>Full Clinical Body (Rich Formatted)</label>
            <RichTextEditor
              value={Array.isArray(editingAnswer.body) ? editingAnswer.body.join('\n\n') : (editingAnswer.body || '')}
              minHeight={220}
              placeholder="Enter comprehensive pediatric advice, symptoms, evidence..."
              onChange={(val) => setEditingAnswer({ ...editingAnswer, body: val })}
            />
          </div>

          {/* 9. ANSWER SEO FIELDS SECTION */}
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
                  Answer Page SEO &amp; Rich Snippets
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
                  › answers › <span>{editingAnswer.slug || 'question'}</span>
                </span>
              </div>
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
                {(editingAnswer.seo_title || editingAnswer.q || editingAnswer.question || 'Question') +
                  ' — The First Seven Years'}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#4d5156', lineHeight: 1.4 }}>
                {editingAnswer.meta_desc ||
                  editingAnswer.quick ||
                  editingAnswer.short_answer ||
                  'Expert pediatric answer by leading integrative doctors and specialists.'}
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
                value={editingAnswer.seo_title || ''}
                placeholder="Custom search title (defaults to Question Title if empty)"
                onChange={(e) => setEditingAnswer({ ...editingAnswer, seo_title: e.target.value })}
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
                value={editingAnswer.meta_desc || ''}
                placeholder="Search snippet description (defaults to Short Answer Summary)..."
                onChange={(e) => setEditingAnswer({ ...editingAnswer, meta_desc: e.target.value })}
              />
            </div>

            {/* FOCUS KEYWORD & SCHEMA.ORG */}
            <div className="form-row" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: '1 1 200px' }}>
                <label>Primary Focus Keyword</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingAnswer.focus_keyword || ''}
                  placeholder="e.g. eczema gut connection"
                  onChange={(e) => setEditingAnswer({ ...editingAnswer, focus_keyword: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ flex: '1 1 200px' }}>
                <label>Schema.org Structured Data</label>
                <select
                  className="form-control"
                  value={editingAnswer.schema_type || 'MedicalWebPage'}
                  onChange={(e) => setEditingAnswer({ ...editingAnswer, schema_type: e.target.value })}
                >
                  <option value="MedicalWebPage">MedicalWebPage (Clinical Guidance)</option>
                  <option value="FAQPage">FAQPage (Question &amp; Answer)</option>
                  <option value="Article">Article (General Medical Article)</option>
                </select>
              </div>
            </div>

            {/* CANONICAL & ROBOTS */}
            <div className="form-row" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div className="form-group" style={{ flex: '1 1 200px' }}>
                <label>Canonical URL Override</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingAnswer.canonical_url || ''}
                  placeholder={`https://thefirstsevenyears.com/answers/${editingAnswer.slug || ''}/`}
                  onChange={(e) => setEditingAnswer({ ...editingAnswer, canonical_url: e.target.value })}
                />
              </div>
              <div className="form-group" style={{ flex: '1 1 200px' }}>
                <label>Robots Indexing</label>
                <select
                  className="form-control"
                  value={editingAnswer.robots_index || 'noindex'}
                  onChange={(e) => setEditingAnswer({ ...editingAnswer, robots_index: e.target.value })}
                >
                  <option value="noindex">Noindex (Hide from search engines)</option>
                  <option value="index">Index (Allow in search engines)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 10. CLINICAL STATUS & PUBLISH TOGGLE */}
          <div className="form-row" style={{ marginTop: '0.75rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Clinical Review Status</label>
              <select
                className="form-control"
                value={editingAnswer.clinical_status || 'Reviewed'}
                onChange={(e) => setEditingAnswer({ ...editingAnswer, clinical_status: e.target.value })}
              >
                <option value="Reviewed">Reviewed &amp; Approved</option>
                <option value="Pending">Pending Clinical Review</option>
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
              <label className="toggle-label" style={{ marginTop: '1.2rem' }}>
                <input
                  type="checkbox"
                  className="sr-checkbox"
                  checked={editingAnswer.published !== false}
                  onChange={(e) => setEditingAnswer({ ...editingAnswer, published: e.target.checked })}
                />
                <span className="toggle-switch"></span>
                <span>Published on live site</span>
              </label>
            </div>
          </div>
          </fieldset>
        </Modal>
      )}
    </div>
  );
};
