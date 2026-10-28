import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { Modal } from '../components/Modal';
import { RichTextEditor } from '../components/RichTextEditor';
import { VideoItem } from '../types';

function extractYouTubeId(url?: string): string {
  if (!url) return '';
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (m) return m[1];
  if (/^[\w-]{11}$/.test(url.trim())) return url.trim();
  return '';
}

const DEFAULT_YT_DISCLAIMER =
  'The First Seven Years is for educational and informational purposes only and does not constitute medical advice. Always seek the advice of your pediatrician or qualified healthcare provider.';

export type VideoCategory = 'episode' | 'clip' | 'short';

export function getVideoFormat(v?: VideoItem): VideoCategory {
  if (!v) return 'clip';
  const raw = (v.type || v.kind || (v as any).category || '').toLowerCase();
  if (raw.includes('episode') || raw === 'full') return 'episode';
  if (raw.includes('short') || raw.includes('social') || raw === 'reel') return 'short';
  return 'clip'; // Default is clip / short video
}

export const Videos: React.FC = () => {
  const navigate = useNavigate();
  const { data, searchQuery, togglePublish, deleteItem, saveItem, showToast, canEdit } = useAdmin();
  const hasEdit = canEdit('videos');

  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [formatFilter, setFormatFilter] = useState<'all' | 'episode' | 'clip' | 'short'>('all');
  const [editingVideo, setEditingVideo] = useState<VideoItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewVideo, setIsNewVideo] = useState(false);
  const [isDisclaimerOpen, setIsDisclaimerOpen] = useState(false);
  const [answerFilter, setAnswerFilter] = useState('');

  const globalDisclaimer = (data as any)?.settings?.youtube_disclaimer || DEFAULT_YT_DISCLAIMER;
  const [globalDisclaimerInput, setGlobalDisclaimerInput] = useState(globalDisclaimer);

  // Convert dictionary or array to array
  const rawVideos = data.videos || (data as any).episodes || [];
  const videosList: VideoItem[] = Array.isArray(rawVideos)
    ? rawVideos
    : Object.values(rawVideos);

  const rawAnswers = data.answers || [];
  const answersList: any[] = Array.isArray(rawAnswers) ? rawAnswers : Object.values(rawAnswers);

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

  const episodeCount = videosList.filter((v) => getVideoFormat(v) === 'episode').length;
  const clipCount = videosList.filter((v) => getVideoFormat(v) === 'clip').length;
  const shortCount = videosList.filter((v) => getVideoFormat(v) === 'short').length;

  const filteredVideos = videosList.filter((v) => {
    if (filter === 'published' && !v.published) return false;
    if (filter === 'draft' && v.published) return false;
    if (formatFilter !== 'all' && getVideoFormat(v) !== formatFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        v.title.toLowerCase().includes(q) ||
        (v.youtube_id && v.youtube_id.toLowerCase().includes(q)) ||
        (v.id && v.id.toLowerCase().includes(q)) ||
        (v.caption && v.caption.toLowerCase().includes(q)) ||
        (v.duration && v.duration.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    navigate('/videos/new');
  };

  const handleEdit = (v: VideoItem) => {
    navigate(`/videos/${encodeURIComponent(v.id || v.youtube_id || '')}/edit`);
  };

  const handleSave = () => {
    if (!editingVideo) return;
    if (!editingVideo.title.trim()) {
      showToast('Please provide a video title', 'error');
      return;
    }

    const detectedId =
      extractYouTubeId(editingVideo.youtube_full_url) ||
      extractYouTubeId(editingVideo.youtube_short_url) ||
      editingVideo.youtube_id ||
      extractYouTubeId(editingVideo.id) ||
      '';

    if (!detectedId && !editingVideo.id) {
      showToast('Please provide a valid YouTube URL or Video ID', 'error');
      return;
    }

    const fmt = editingVideo.type || 'clip';

    // Preserve existing database primary key id when editing to update in MySQL without duplicating rows!
    const targetId = isNewVideo
      ? (detectedId || `vid-${Date.now()}`)
      : (editingVideo.id || detectedId || `vid-${Date.now()}`);

    const finalYoutubeId = detectedId || editingVideo.youtube_id || (extractYouTubeId(targetId) ? targetId : '');

    const toSave: VideoItem = {
      ...editingVideo,
      id: targetId,
      youtube_id: finalYoutubeId,
      type: fmt,
      kind: fmt,
      duration: editingVideo.duration || '',
      guest: editingVideo.guest || editingVideo.expert || 'dr-murray-clarke',
      expert: editingVideo.guest || editingVideo.expert || 'dr-murray-clarke',
      caption: editingVideo.caption || editingVideo.description || '',
      description: editingVideo.caption || editingVideo.description || ''
    };

    saveItem('videos', toSave, 'id');
    setIsModalOpen(false);
    showToast(`Video "${editingVideo.title}" saved!`, 'success');
  };

  const toggleAnswer = (slug: string) => {
    if (!editingVideo) return;
    const current = editingVideo.answers || [];
    const next = current.includes(slug)
      ? current.filter((s) => s !== slug)
      : [...current, slug];
    setEditingVideo({ ...editingVideo, answers: next });
  };

  const detectedVidId = editingVideo
    ? extractYouTubeId(editingVideo.youtube_full_url) ||
    extractYouTubeId(editingVideo.youtube_short_url) ||
    editingVideo.id ||
    ''
    : '';

  // SEO counters
  const seoTitleLen = (editingVideo?.seo_title || '').length;
  const titleCountColor = seoTitleLen >= 45 && seoTitleLen <= 60
    ? 'var(--mint)'
    : (seoTitleLen > 60 ? 'var(--danger)' : 'var(--ink-3)');

  const seoDescLen = (editingVideo?.meta_desc || '').length;
  const descCountColor = seoDescLen >= 130 && seoDescLen <= 160
    ? 'var(--mint)'
    : (seoDescLen > 160 ? 'var(--danger)' : 'var(--ink-3)');

  const modalFilteredAnswers = answersList.filter((a: any) => {
    if (!answerFilter) return true;
    const q = (a.q || a.question || '').toLowerCase();
    const exp = getExpertName(a.expert).toLowerCase();
    const term = answerFilter.toLowerCase();
    return q.includes(term) || exp.includes(term);
  });

  return (
    <div className="content-area">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Video Library &amp; Clip Management</h1>
        </div>
        {hasEdit && (
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              className="btn btn--outline"
              onClick={() => {
                setGlobalDisclaimerInput(globalDisclaimer);
                setIsDisclaimerOpen(true);
              }}
            >
              ⚖️ Edit Common Disclaimer
            </button>
            <button className="btn btn--primary" onClick={handleOpenAdd}>
              + Add Video
            </button>
          </div>
        )}
      </div>

      {/* 3 FORMAT OVERVIEW CARDS (DIFFERENTIATED CATEGORIES) */}
      <div className="video-formats-grid">
        {/* 1. Full Episodes */}
        <div
          className={`video-format-card ${formatFilter === 'episode' ? 'is-active' : ''}`}
          onClick={() => setFormatFilter(formatFilter === 'episode' ? 'all' : 'episode')}
        >
          <div className="video-format-card__badge-row">
            <span className="fmt-badge fmt-badge--episode">
              <span className="fmt-badge--dot" /> FULL EPISODE
            </span>
            <span className="badge" style={{ background: 'var(--cream-deep)', color: 'var(--navy)', fontWeight: 700 }}>
              {episodeCount}
            </span>
          </div>
          <div className="video-format-card__title">Full episodes</div>
          <div className="video-format-card__link">
            {formatFilter === 'episode' ? '✓ Showing all full episodes' : `All full episodes (${episodeCount}) →`}
          </div>
        </div>

        {/* 2. Short Videos */}
        <div
          className={`video-format-card ${formatFilter === 'clip' ? 'is-active' : ''}`}
          onClick={() => setFormatFilter(formatFilter === 'clip' ? 'all' : 'clip')}
        >
          <div className="video-format-card__badge-row">
            <span className="fmt-badge fmt-badge--clip">
              <span className="fmt-badge--dot" /> SHORT VIDEO
            </span>
            <span className="badge" style={{ background: 'var(--mint-soft)', color: 'var(--mint-dark)', fontWeight: 700 }}>
              {clipCount}
            </span>
          </div>
          <div className="video-format-card__title">Short videos</div>
          <div className="video-format-card__link">
            {formatFilter === 'clip' ? '✓ Showing all short videos' : `All short videos (${clipCount}) →`}
          </div>
        </div>

        {/* 3. Social Clips */}
        <div
          className={`video-format-card ${formatFilter === 'short' ? 'is-active' : ''}`}
          onClick={() => setFormatFilter(formatFilter === 'short' ? 'all' : 'short')}
        >
          <div className="video-format-card__badge-row">
            <span className="fmt-badge fmt-badge--short">
              <span className="fmt-badge--dot" /> SOCIAL CLIP
            </span>
            <span className="badge" style={{ background: 'var(--peach-soft)', color: '#c2410c', fontWeight: 700 }}>
              {shortCount}
            </span>
          </div>
          <div className="video-format-card__title">Social clips</div>
          <div className="video-format-card__link">
            {formatFilter === 'short' ? '✓ Showing all social clips' : `All social clips (${shortCount}) →`}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <h2 className="card__title">All Published &amp; Draft Videos</h2>
          <div className="card__toolbar" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <div className="filter-pills">
              <button
                className={`filter-pill ${formatFilter === 'all' ? 'is-active' : ''}`}
                onClick={() => setFormatFilter('all')}
              >
                All Formats ({videosList.length})
              </button>
            </div>


          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '120px' }}>PREVIEW</th>
                <th>TITLE &amp; GUEST</th>
                <th style={{ width: '160px' }}>FORMAT / CATEGORY</th>
                <th>LINKED QUESTIONS</th>
                <th>DISCLAIMER OVERRIDE</th>
                <th>STATUS</th>
                <th style={{ width: '85px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredVideos.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ink-3)' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>🎬</div>
                    <strong style={{ color: 'var(--navy)', fontSize: '1rem' }}>No videos found</strong>
                    <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 1rem' }}>No video episodes match your filter or search criteria.</p>
                    <button className="btn btn--sm btn--primary" onClick={handleOpenAdd}>+ Add Video Episode</button>
                  </td>
                </tr>
              ) : (
                filteredVideos.map((video) => {
                  const vidId = video.id || video.youtube_id;
                  const guestSlug = video.guest || video.expert;
                  const guestName = getExpertName(guestSlug);
                  const fmt = getVideoFormat(video);
                  const linkedAnsCount = answersList.filter(
                    (a: any) => a.video === vidId || (video.answers || []).includes(a.slug)
                  ).length;
                  const hasCustomDisclaimer = !!video.youtube_disclaimer;

                  return (
                    <tr key={vidId}>
                      <td>
                        <a
                          href={`https://youtu.be/${vidId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ position: 'relative', display: 'block', width: '100px', height: '56px', borderRadius: '4px', overflow: 'hidden' }}
                        >
                          <img
                            src={`https://i.ytimg.com/vi/${vidId}/hqdefault.jpg`}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            alt=""
                          />
                          <span
                            style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(0,0,0,0.3)',
                              color: '#fff',
                              fontSize: '1rem'
                            }}
                          >
                            ▶
                          </span>
                        </a>
                      </td>
                      <td className="table-cell-title">
                        <strong style={{ fontSize: '0.92rem', color: 'var(--navy)' }}>{video.title}</strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                          <span style={{ fontSize: '0.78rem', color: 'var(--ink-2)', fontWeight: 600 }}>
                            🎙️ {guestName}
                          </span>
                          <span style={{ color: 'var(--ink-3)', fontSize: '0.75rem' }}>·</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--ink-3)' }}>ID: {vidId}</span>
                        </div>
                      </td>
                      <td data-label="Format">
                        {fmt === 'episode' && (
                          <span className="fmt-badge fmt-badge--episode">
                            <span className="fmt-badge--dot" /> FULL EPISODE
                          </span>
                        )}
                        {fmt === 'clip' && (
                          <span className="fmt-badge fmt-badge--clip">
                            <span className="fmt-badge--dot" /> SHORT VIDEO
                          </span>
                        )}
                        {fmt === 'short' && (
                          <span className="fmt-badge fmt-badge--short">
                            <span className="fmt-badge--dot" /> SOCIAL CLIP
                          </span>
                        )}
                        {video.duration && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--ink-2)', marginTop: '4px', fontWeight: 600 }}>
                            ⏱️ {video.duration}
                          </div>
                        )}
                      </td>
                      <td data-label="Linked Q&As">
                        <span className="badge" style={{ background: 'var(--cream-deep)', color: 'var(--navy)' }}>
                          {linkedAnsCount} linked Q&amp;As
                        </span>
                      </td>
                      <td data-label="Disclaimer">
                        {hasCustomDisclaimer ? (
                          <span className="badge badge--published">Custom Override</span>
                        ) : (
                          <span className="badge" style={{ background: 'var(--cream)', color: 'var(--ink-2)' }}>
                            Using Global Default
                          </span>
                        )}
                      </td>
                      <td data-label="Status">
                        <span
                          className={`badge ${video.published ? 'badge--published' : 'badge--draft'}`}
                          onClick={() => hasEdit && togglePublish('videos', 'id', vidId)}
                          style={{ cursor: hasEdit ? 'pointer' : 'default' }}
                          title={hasEdit ? "Click to toggle status" : "View-only access"}
                        >
                          <span className="badge--dot" />
                          {video.published ? 'PUBLISHED' : 'DRAFT'}
                        </span>
                      </td>
                      <td className="table-actions-cell" style={{ textAlign: 'right' }}>
                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                          {hasEdit ? (
                            <>
                              <button className="icon-btn" onClick={() => handleEdit(video)} title="Edit Video">
                                ✏️
                              </button>
                              <button
                                className="icon-btn icon-btn--danger"
                                onClick={() => deleteItem('videos', 'id', vidId)}
                                title="Delete Video"
                              >
                                🗑️
                              </button>
                            </>
                          ) : (
                            <button className="icon-btn" onClick={() => handleEdit(video)} title="View Video Details (Read-only)">
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

      {/* EDIT / ADD VIDEO MODAL */}
      {editingVideo && (
        <Modal
          isOpen={isModalOpen}
          title={isNewVideo ? 'Add Video Episode / Clip' : (hasEdit ? 'Edit Video' : 'View Video Details (Read Only)')}
          onClose={() => setIsModalOpen(false)}
          onSave={hasEdit ? handleSave : undefined}
          maxWidth="780px"
        >
          <fieldset disabled={!hasEdit} style={{ border: 'none', padding: 0, margin: 0, minWidth: 0, width: '100%' }}>
            {/* 1. VIDEO TITLE */}
            <div className="form-group">
              <label>Video Title</label>
              <input
                type="text"
                className="form-control"
                value={editingVideo.title}
                placeholder="e.g. 7 Things One Doctor Does to Manage His Own ADHD"
                onChange={(e) => {
                  const titleVal = e.target.value;
                  if (isNewVideo) {
                    const autoSlug = titleVal.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    setEditingVideo({ ...editingVideo, title: titleVal, slug: autoSlug });
                  } else {
                    setEditingVideo({ ...editingVideo, title: titleVal });
                  }
                }}
                required
              />
            </div>

            {/* 2. VIDEO FORMAT & CATEGORY (3 DISTINCT CARDS) */}
            <div className="form-group">
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--navy)', marginBottom: '0.4rem', display: 'block' }}>
                Video Format / Category *
              </label>
              <div className="video-modal-formats">
                {/* Option 1: Full Episode */}
                <div
                  className={`video-modal-format-card ${getVideoFormat(editingVideo) === 'episode' ? 'is-selected is-episode' : ''}`}
                  onClick={() => setEditingVideo({ ...editingVideo, type: 'episode', kind: 'episode' })}
                >
                  <div className="video-modal-format-header">
                    <span className="fmt-badge fmt-badge--episode">
                      <span className="fmt-badge--dot" /> FULL EPISODE
                    </span>
                    <span className="format-check-circle">
                      {getVideoFormat(editingVideo) === 'episode' ? '✓' : ''}
                    </span>
                  </div>
                  <div className="video-modal-format-label">Full episodes</div>
                  <div className="video-modal-format-sub">Long-form podcast (45m–1.5h)</div>
                </div>

                {/* Option 2: Short Video */}
                <div
                  className={`video-modal-format-card ${getVideoFormat(editingVideo) === 'clip' ? 'is-selected is-clip' : ''}`}
                  onClick={() => setEditingVideo({ ...editingVideo, type: 'clip', kind: 'clip' })}
                >
                  <div className="video-modal-format-header">
                    <span className="fmt-badge fmt-badge--clip">
                      <span className="fmt-badge--dot" /> SHORT VIDEO
                    </span>
                    <span className="format-check-circle">
                      {getVideoFormat(editingVideo) === 'clip' ? '✓' : ''}
                    </span>
                  </div>
                  <div className="video-modal-format-label">Short videos</div>
                  <div className="video-modal-format-sub">Single Q&amp;A topic (7–12 min)</div>
                </div>

                {/* Option 3: Social Clip */}
                <div
                  className={`video-modal-format-card ${getVideoFormat(editingVideo) === 'short' ? 'is-selected is-short' : ''}`}
                  onClick={() => setEditingVideo({ ...editingVideo, type: 'short', kind: 'short' })}
                >
                  <div className="video-modal-format-header">
                    <span className="fmt-badge fmt-badge--short">
                      <span className="fmt-badge--dot" /> SOCIAL CLIP
                    </span>
                    <span className="format-check-circle">
                      {getVideoFormat(editingVideo) === 'short' ? '✓' : ''}
                    </span>
                  </div>
                  <div className="video-modal-format-label">Social clips</div>
                  <div className="video-modal-format-sub">Vertical clip (Shorts 1–2m)</div>
                </div>
              </div>
            </div>

            {/* 2. YOUTUBE FULL EPISODE URL */}
            <div className="form-group">
              <label>YouTube Full Episode URL</label>
              <input
                type="url"
                className="form-control"
                value={editingVideo.youtube_full_url || ''}
                placeholder="https://www.youtube.com/watch?v=sJsNza0_zRQ"
                onChange={(e) => setEditingVideo({ ...editingVideo, youtube_full_url: e.target.value })}
              />
              <small style={{ color: 'var(--ink-3)', display: 'block', marginTop: '0.25rem' }}>
                Paste YouTube full episode watch URL or youtu.be link
              </small>
            </div>

            {/* 3. YOUTUBE SHORT URL & THUMBNAIL PREVIEW */}
            <div className="form-group">
              <label>YouTube Short URL</label>
              <input
                type="url"
                className="form-control"
                value={editingVideo.youtube_short_url || ''}
                placeholder="https://youtube.com/shorts/sJsNza0_zRQ"
                onChange={(e) => setEditingVideo({ ...editingVideo, youtube_short_url: e.target.value })}
              />
              <small style={{ color: 'var(--ink-3)', display: 'block', marginTop: '0.25rem' }}>
                Paste YouTube Shorts or clip URL
              </small>

              {detectedVidId && (
                <div style={{ marginTop: '0.5rem' }}>
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
                      src={`https://i.ytimg.com/vi/${detectedVidId}/hqdefault.jpg`}
                      style={{ height: '44px', borderRadius: '4px' }}
                      alt="Preview"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div style={{ fontSize: '0.8rem' }}>
                      <span style={{ fontWeight: 600, color: 'var(--navy)' }}>
                        Detected Video ID: <code>{detectedVidId}</code>
                      </span>
                      <div>
                        <a
                          href={`https://youtu.be/${detectedVidId}`}
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

            {/* 4. VIDEO CAPTION */}
            <div className="form-group">
              <label>Video Caption</label>
              <RichTextEditor
                value={editingVideo.caption || ''}
                minHeight={110}
                placeholder="Brief descriptive caption for this video..."
                onChange={(val) => setEditingVideo({ ...editingVideo, caption: val })}
              />
            </div>

            {/* 5. HOST / GUEST & DURATION IN 2-COLUMN ROW */}
            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', alignItems: 'flex-start' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label>Host / Guest Expert</label>
                <select
                  className="form-control"
                  value={editingVideo.guest || editingVideo.expert || 'dr-murray-clarke'}
                  onChange={(e) =>
                    setEditingVideo({ ...editingVideo, guest: e.target.value, expert: e.target.value })
                  }
                >
                  {expertsList.map((x) => (
                    <option key={x.slug} value={x.slug}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label>Approx. Run Time / Duration</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingVideo.duration || ''}
                  placeholder="e.g. 76 min, 09:53, 01:23"
                  onChange={(e) => setEditingVideo({ ...editingVideo, duration: e.target.value })}
                />
              </div>
            </div>

            {/* 6. PUBLISH TOGGLE */}
            <div className="form-group" style={{ marginTop: '0.25rem' }}>
              <label className="toggle-label">
                <input
                  type="checkbox"
                  className="sr-checkbox"
                  checked={editingVideo.published !== false}
                  onChange={(e) => setEditingVideo({ ...editingVideo, published: e.target.checked })}
                />
                <span className="toggle-switch"></span>
                <span>Published on live site</span>
              </label>
            </div>

            {/* 6. ASSIGN QUESTION & ANSWERS (SELECTION BOX) */}
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
                      const isChecked = (editingVideo.answers || []).includes(a.slug);
                      const expName = getExpertName(a.expert);
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
                          <span className="selection-item__meta">{expName} · {a.topic}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
              <small style={{ color: 'var(--ink-3)', display: 'block', marginTop: '0.25rem' }}>
                Checked Q&amp;As will be linked to this video and display it as their source video.
              </small>
            </div>

            {/* 7. FULL VIDEO TRANSCRIPT */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Full Video Transcript</label>
                <small style={{ color: 'var(--ink-3)' }}>Supports dialogue, speakers &amp; timestamps</small>
              </div>
              <RichTextEditor
                value={editingVideo.transcript || ''}
                minHeight={220}
                placeholder="Paste full episode dialogue, timestamps (e.g. 02:15 - Topic introduction), or clinical notes here..."
                onChange={(val) => setEditingVideo({ ...editingVideo, transcript: val })}
              />
            </div>

            {/* 8. YOUTUBE DISCLAIMER */}
            <div className="form-group">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.35rem'
                }}
              >
                <label style={{ margin: 0 }}>⚖️ YouTube Medical &amp; Educational Disclaimer</label>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  <button
                    type="button"
                    className="btn btn--xs btn--outline"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => setEditingVideo({ ...editingVideo, youtube_disclaimer: globalDisclaimer })}
                  >
                    Insert Global Default
                  </button>
                  <button
                    type="button"
                    className="btn btn--xs btn--outline"
                    style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                    onClick={() => setEditingVideo({ ...editingVideo, youtube_disclaimer: '' })}
                  >
                    Clear (Use Global Default)
                  </button>
                </div>
              </div>
              <RichTextEditor
                value={editingVideo.youtube_disclaimer || ''}
                minHeight={130}
                placeholder="Leave blank to automatically use the global YouTube disclaimer, or enter custom disclaimer for this specific video..."
                onChange={(val) => setEditingVideo({ ...editingVideo, youtube_disclaimer: val })}
              />
              <small style={{ display: 'block', marginTop: '0.35rem', color: 'var(--ink-3)', lineHeight: 1.4 }}>
                <strong>Current Global Default:</strong> <span style={{ fontStyle: 'italic' }}>{globalDisclaimer}</span>
              </small>
            </div>

            {/* 9. VIDEO EPISODE SEO FIELDS SECTION */}
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
                    Video Episode SEO &amp; Rich Snippets
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
                    › episodes › <span>{editingVideo.slug || detectedVidId || 'video-episode'}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', marginTop: '0.35rem' }}>
                  <div
                    style={{
                      flexShrink: 0,
                      width: '96px',
                      height: '54px',
                      background: '#1e293b',
                      borderRadius: '4px',
                      overflow: 'hidden',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    {detectedVidId && (
                      <img
                        src={`https://i.ytimg.com/vi/${detectedVidId}/hqdefault.jpg`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        alt=""
                      />
                    )}
                    <span
                      style={{
                        position: 'absolute',
                        fontSize: '14px',
                        color: '#fff',
                        textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                        pointerEvents: 'none'
                      }}
                    >
                      ▶
                    </span>
                  </div>
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
                      {(editingVideo.seo_title || editingVideo.title || 'Video Title') +
                        ' — The First Seven Years'}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#4d5156', lineHeight: 1.4 }}>
                      {editingVideo.meta_desc ||
                        editingVideo.caption ||
                        'Watch pediatric insights and expert advice from The First Seven Years series.'}
                    </div>
                  </div>
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
                  value={editingVideo.seo_title || ''}
                  placeholder="Custom title tag (defaults to Video Title if empty)"
                  onChange={(e) => setEditingVideo({ ...editingVideo, seo_title: e.target.value })}
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
                  value={editingVideo.meta_desc || ''}
                  placeholder="Search snippet description (defaults to Video Caption)..."
                  onChange={(e) => setEditingVideo({ ...editingVideo, meta_desc: e.target.value })}
                />
              </div>

              {/* FOCUS KEYWORD & CANONICAL & ROBOTS */}
              <div className="form-row" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div className="form-group" style={{ flex: '1 1 200px' }}>
                  <label>Primary Focus Keyword</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingVideo.focus_keyword || ''}
                    placeholder="e.g. adhd parenting pediatric"
                    onChange={(e) => setEditingVideo({ ...editingVideo, focus_keyword: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: '1 1 200px' }}>
                  <label>Canonical URL Override</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingVideo.canonical_url || ''}
                    placeholder={`https://thefirstsevenyears.com/episodes/${editingVideo.slug || detectedVidId || ''}/`}
                    onChange={(e) => setEditingVideo({ ...editingVideo, canonical_url: e.target.value })}
                  />
                </div>
                <div className="form-group" style={{ flex: '1 1 200px' }}>
                  <label>Robots Indexing</label>
                  <select
                    className="form-control"
                    value={editingVideo.robots_index || 'noindex'}
                    onChange={(e) => setEditingVideo({ ...editingVideo, robots_index: e.target.value })}
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

      {/* GLOBAL DISCLAIMER MODAL (EXACT PYTHON ADMIN REPLICA) */}
      {isDisclaimerOpen && (
        <Modal
          isOpen={isDisclaimerOpen}
          title="⚖️ Common YouTube Disclaimer (Global)"
          onClose={() => setIsDisclaimerOpen(false)}
          onSave={() => {
            const updated = JSON.parse(JSON.stringify(data));
            if (!updated.settings) updated.settings = {};
            updated.settings.youtube_disclaimer = globalDisclaimerInput;
            saveItem('settings', updated.settings, 'youtube_disclaimer');
            showToast('Global YouTube disclaimer updated', 'success');
            setIsDisclaimerOpen(false);
          }}
          maxWidth="680px"
        >
          <div
            style={{
              background: 'var(--cream)',
              border: '1px solid var(--line)',
              borderRadius: '8px',
              padding: '0.75rem 1rem',
              marginBottom: '1rem'
            }}
          >
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--navy)', lineHeight: 1.4 }}>
              <strong>Common Video Library Disclaimer:</strong> This medical &amp; educational notice is displayed across the Video Library (<a href="/episodes/" target="_blank">/episodes/</a>) and on every video episode page by default. Any individual video can optionally override this disclaimer in its individual video settings.
            </p>
          </div>
          <div className="form-group">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.35rem'
              }}
            >
              <label style={{ margin: 0 }}>YouTube Medical &amp; Educational Notice</label>
              <button
                type="button"
                className="btn btn--xs btn--outline"
                style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                onClick={() => setGlobalDisclaimerInput(DEFAULT_YT_DISCLAIMER)}
              >
                Reset to Default
              </button>
            </div>
            <RichTextEditor
              value={globalDisclaimerInput}
              onChange={(html) => setGlobalDisclaimerInput(html)}
              placeholder="YouTube Medical & Educational Notice..."
              minHeight="140px"
            />
            <small style={{ display: 'block', marginTop: '0.35rem', color: 'var(--ink-3)' }}>
              Saving here updates the common default disclaimer applied across all video episodes that don't have an individual override.
            </small>
          </div>
        </Modal>
      )}
    </div>
  );
};
