import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { RichTextEditor } from '../components/RichTextEditor';
import { VideoItem } from '../types';

function extractYouTubeId(url?: string): string {
  if (!url) return '';
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  if (m) return m[1];
  if (/^[\w-]{11}$/.test(url.trim())) return url.trim();
  return '';
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const DEFAULT_DISCLAIMER =
  'The First Seven Years is for educational and informational purposes only and does not constitute medical advice. Always seek the advice of your pediatrician or qualified healthcare provider.';

export const VideoEdit: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isNew = !id || id === 'new';

  const { data, saveItem, showToast, canEdit } = useAdmin();
  const hasEdit = canEdit('videos');

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

  const [form, setForm] = useState<VideoItem>({
    id: '',
    title: '',
    type: 'clip',
    kind: 'clip',
    ep: '',
    duration: '',
    youtube_id: '',
    youtube_full_url: '',
    youtube_short_url: '',
    caption: '',
    description: '',
    topic: data.topics?.[0]?.slug || '',
    guest: '',
    expert: '',
    published: true,
    answers: [],
    transcript: '',
    youtube_disclaimer: (data as any)?.settings?.youtube_disclaimer || DEFAULT_DISCLAIMER,
    seo_title: '',
    meta_desc: '',
    focus_keyword: '',
    canonical_url: '',
    robots_index: 'index'
  });

  const [answerSearch, setAnswerSearch] = useState('');
  const [isIdManual, setIsIdManual] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isNew && id) {
      const decodedId = decodeURIComponent(id);
      const existing = videosList.find(
        (v) => v.id === decodedId || v.youtube_id === decodedId || v.slug === decodedId
      );

      if (existing) {
        const rawType = (existing.type || existing.kind || (existing as any).category || '').toLowerCase();
        const videoFormat = rawType.includes('episode') || rawType === 'full'
          ? 'episode'
          : (rawType.includes('short') || rawType === 'reel' ? 'short' : 'clip');

        const ytId = existing.youtube_id || extractYouTubeId(existing.youtube_full_url || existing.youtube_short_url) || '';

        setForm({
          ...existing,
          id: existing.id || ytId,
          title: existing.title || '',
          type: videoFormat,
          kind: videoFormat,
          ep: existing.ep || '',
          duration: existing.duration || '',
          youtube_id: ytId,
          youtube_full_url: existing.youtube_full_url || (ytId ? `https://www.youtube.com/watch?v=${ytId}` : ''),
          youtube_short_url: existing.youtube_short_url || '',
          caption: existing.caption || existing.description || '',
          description: existing.description || existing.caption || '',
          topic: existing.topic || data.topics?.[0]?.slug || 'gut-health',
          guest: existing.guest || existing.expert || 'dr-murray-clarke',
          expert: existing.expert || existing.guest || 'dr-murray-clarke',
          published: existing.published !== false,
          answers: Array.isArray(existing.answers) ? existing.answers : [],
          transcript: existing.transcript || '',
          youtube_disclaimer: existing.youtube_disclaimer || (data as any)?.settings?.youtube_disclaimer || DEFAULT_DISCLAIMER,
          seo_title: existing.seo_title || '',
          meta_desc: existing.meta_desc || '',
          focus_keyword: existing.focus_keyword || '',
          canonical_url: existing.canonical_url || '',
          robots_index: existing.robots_index || 'index'
        });
        setIsIdManual(true);
      } else {
        showToast(`Video "${id}" not found`, 'error');
        navigate('/videos');
      }
    }
  }, [id, isNew]);

  const handleTitleChange = (newTitle: string) => {
    setForm((prev) => {
      const updated = { ...prev, title: newTitle };
      if (!isIdManual && isNew) {
        updated.id = slugify(newTitle);
      }
      return updated;
    });
  };

  const handleUrlChange = (url: string) => {
    const extracted = extractYouTubeId(url);
    setForm((prev) => ({
      ...prev,
      youtube_full_url: url,
      youtube_id: extracted || prev.youtube_id
    }));
  };

  const toggleLinkedAnswer = (ansSlug: string) => {
    setForm((prev) => {
      const current = prev.answers || [];
      const next = current.includes(ansSlug)
        ? current.filter((s) => s !== ansSlug)
        : [...current, ansSlug];
      return { ...prev, answers: next };
    });
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!hasEdit) {
      showToast('You have read-only permissions.', 'error');
      return;
    }
    const errs: Record<string, string> = {};
    if (!form.title?.trim()) {
      errs.title = 'Please provide a video title';
    }

    const finalYtId = (form.youtube_id || extractYouTubeId(form.youtube_full_url) || extractYouTubeId(form.youtube_short_url) || '').trim();
    if (!finalYtId) {
      errs.youtube = 'Please provide a valid YouTube 11-Character ID or Watch URL';
    }

    const finalId = form.id?.trim() || finalYtId || slugify(form.title);
    if (!finalId) {
      errs.id = 'Please provide a Video ID or Slug';
    }

    if (!form.topic || !form.topic.trim()) {
      errs.topic = 'Please select a primary topic hub for this video';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setFormErrors({});

    const toSave: VideoItem = {
      ...form,
      id: finalId,
      slug: finalId,
      youtube_id: finalYtId,
      youtube_full_url: form.youtube_full_url || (finalYtId ? `https://www.youtube.com/watch?v=${finalYtId}` : ''),
      title: form.title.trim(),
      caption: form.caption || form.description || '',
      description: form.description || form.caption || '',
      expert: form.expert || form.guest,
      guest: form.guest || form.expert,
      canonical_url: form.canonical_url || `https://thefirstsevenyears.com/videos/${finalId}/`
    };

    saveItem('videos', toSave, 'id');
    showToast(`Video "${form.title.slice(0, 32)}..." saved successfully!`, 'success');
    navigate('/videos');
  };

  const currentEmbedId = form.youtube_id || extractYouTubeId(form.youtube_full_url) || extractYouTubeId(form.youtube_short_url);
  const currentTopic = data.topics?.find((t) => t.slug === form.topic);

  // Filtered answers for linking
  const filteredAnswers = answersList.filter((a: any) => {
    if (!answerSearch) return true;
    const q = answerSearch.toLowerCase();
    const qText = (a.question || a.q || '').toLowerCase();
    const slugText = (a.slug || '').toLowerCase();
    return qText.includes(q) || slugText.includes(q);
  });

  return (
    <div className="content-area">
      {/* Page Header */}
      <div className="page-header" style={{ alignItems: 'center', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Link
            to="/videos"
            className="btn btn--outline"
            style={{
              padding: '0.6rem 1.15rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '0.92rem',
              fontWeight: 600,
              color: 'var(--navy)',
              borderRadius: '8px',
              border: '1.5px solid var(--line-bold, #cbd5e1)',
              background: '#ffffff'
            }}
          >
            <span style={{ fontSize: '1.15rem', lineHeight: 1 }}>←</span> Back
          </Link>
          <h1
            className="page-title"
            style={{
              margin: 0,
              fontSize: '2.5rem',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              color: 'var(--navy)',
              lineHeight: 1.15
            }}
          >
            {isNew ? 'New Video' : 'Edit Video'}
          </h1>
        </div>

        <div>
          {hasEdit && (
            <button
              type="button"
              className="btn btn--primary"
              style={{
                padding: '0.7rem 1.6rem',
                fontSize: '0.96rem',
                fontWeight: 700,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(43, 60, 86, 0.18)'
              }}
              onClick={() => handleSave()}
            >
              Save Video
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Form Grid */}
      <div className="fluent-grid">
        {/* Main Column */}
        <div className="fluent-main">
          {/* Video Title & YouTube Source Card */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Video Details &amp; YouTube Player</h2>
                <p className="fluent-card__subtitle">
                  Configure title, system ID, and embed source
                </p>
              </div>
            </div>

            <div className="fluent-card__body">
              <div className="fluent-field">
                <label className="fluent-label">
                  <span>
                    Video Title <span className="req-star">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  className={`fluent-input fluent-input--lg ${formErrors.title ? 'is-invalid' : ''}`}
                  placeholder="e.g. How to Heal Infant Eczema from the Inside Out"
                  value={form.title}
                  onChange={(e) => {
                    handleTitleChange(e.target.value);
                    if (formErrors.title) setFormErrors((prev) => ({ ...prev, title: '' }));
                  }}
                />
                {formErrors.title && (
                  <div className="field-error-msg">⚠️ {formErrors.title}</div>
                )}
              </div>

              <div className="form-row">
                <div className="fluent-field">
                  <label className="fluent-label">
                    <span>System Identifier / Slug</span>
                  </label>
                  <div className="fluent-slug-group">
                    <input
                      type="text"
                      className="fluent-slug-group__input"
                      placeholder="how-to-heal-infant-eczema"
                      value={form.id}
                      onChange={(e) => {
                        setIsIdManual(true);
                        setForm({ ...form, id: slugify(e.target.value) });
                      }}
                    />
                    {!isIdManual ? (
                      <button
                        type="button"
                        className="fluent-slug-group__action"
                        onClick={() => setIsIdManual(true)}
                      >
                        Customize
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="fluent-slug-group__action"
                        onClick={() => {
                          setIsIdManual(false);
                          setForm({ ...form, id: slugify(form.title) });
                        }}
                      >
                        Auto-generate
                      </button>
                    )}
                  </div>
                </div>

                <div className="fluent-field">
                  <label className="fluent-label">
                    <span>YouTube 11-Character ID</span>
                  </label>
                  <input
                    type="text"
                    className={`fluent-input ${formErrors.youtube ? 'is-invalid' : ''}`}
                    placeholder="e.g. dQw4w9WgXcQ"
                    value={form.youtube_id || ''}
                    onChange={(e) => {
                      setForm({ ...form, youtube_id: extractYouTubeId(e.target.value) || e.target.value });
                      if (formErrors.youtube) setFormErrors((prev) => ({ ...prev, youtube: '' }));
                    }}
                  />
                </div>
              </div>

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>
                    Full YouTube Watch URL <span className="req-star">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  className={`fluent-input ${formErrors.youtube ? 'is-invalid' : ''}`}
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={form.youtube_full_url || ''}
                  onChange={(e) => {
                    handleUrlChange(e.target.value);
                    if (formErrors.youtube) setFormErrors((prev) => ({ ...prev, youtube: '' }));
                  }}
                />
                {formErrors.youtube && (
                  <div className="field-error-msg">⚠️ {formErrors.youtube}</div>
                )}
                <p className="fluent-hint">
                  Pasting a YouTube link automatically detects and connects the 11-character video ID.
                </p>
              </div>

              {/* Responsive Live Player */}
              {currentEmbedId ? (
                <div className="video-preview-box" style={{ marginTop: '0.5rem' }}>
                  <div className="video-preview-box__header">
                    <span className="badge badge--success">✓ Video Player Connected ({currentEmbedId})</span>
                  </div>
                  <div className="video-embed-responsive">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${currentEmbedId}`}
                      title={form.title || 'YouTube preview'}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <div className="notice-box notice-box--info">
                  ℹ️ Provide a YouTube link or 11-character ID above to preview the embedded video player here.
                </div>
              )}
            </div>
          </div>

          {/* Description & Caption Card */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Video Highlights &amp; Detailed Notes</h2>
                <p className="fluent-card__subtitle">
                  Accompanying guidance, timestamps, and pediatric advice
                </p>
              </div>
            </div>

            <div className="fluent-card__body">
              <div className="fluent-field">
                <label className="fluent-label">
                  <span>Short Caption / Teaser</span>
                  <span className="fluent-badge-opt">Thumbnail Text</span>
                </label>
                <textarea
                  className="fluent-textarea"
                  style={{ minHeight: '80px' }}
                  placeholder="Concise overview displayed under video player and episode cards..."
                  value={form.caption || ''}
                  onChange={(e) => setForm({ ...form, caption: e.target.value })}
                />
              </div>

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>Full Video Description &amp; Timestamps</span>
                </label>
                <RichTextEditor
                  value={form.description || ''}
                  onChange={(val) => setForm({ ...form, description: val })}
                  placeholder="Detailed breakdown of what parents will learn, timestamps, and clinical references..."
                  minHeight="220px"
                />
              </div>
            </div>
          </div>

          {/* Full Conversation Transcript Card */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Complete Video Transcript</h2>
                <p className="fluent-card__subtitle">
                  Critical for accessibility, full-text parent search, and Google video indexing
                </p>
              </div>
            </div>

            <div className="fluent-card__body">
              <div className="fluent-field">
                <textarea
                  className="fluent-textarea"
                  style={{ minHeight: '260px', fontFamily: 'monospace', fontSize: '0.88rem' }}
                  placeholder="Paste verbatim spoken transcript here (e.g. Dr. Murray Clarke: Welcome to The First Seven Years...)"
                  value={form.transcript || ''}
                  onChange={(e) => setForm({ ...form, transcript: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Associated Parent Q&As Card */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Linked Parent Questions (Q&amp;A)</h2>
                <p className="fluent-card__subtitle">
                  {(form.answers || []).length} questions associated with this video
                </p>
              </div>
            </div>

            <div className="fluent-card__body">
              <div className="fluent-field">
                <input
                  type="text"
                  className="fluent-input"
                  placeholder="🔍 Search questions by title or slug..."
                  value={answerSearch}
                  onChange={(e) => setAnswerSearch(e.target.value)}
                />
              </div>

              <div className="linked-items-scroll-box">
                {filteredAnswers.length === 0 ? (
                  <p className="text-muted" style={{ padding: '1.25rem', textAlign: 'center' }}>
                    No matching questions found in library.
                  </p>
                ) : (
                  filteredAnswers.map((a: any) => {
                    const isLinked = (form.answers || []).includes(a.slug);
                    return (
                      <label
                        key={a.slug}
                        className={`linked-item-row ${isLinked ? 'is-linked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isLinked}
                          onChange={() => toggleLinkedAnswer(a.slug)}
                        />
                        <div className="linked-item-row__content">
                          <span className="linked-item-row__title">
                            {a.question || a.q || a.slug}
                          </span>
                          <span className="linked-item-row__meta">
                            <code>{a.slug}</code> · {a.topic}
                          </span>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="fluent-sidebar">
          {/* Format & Publishing Card */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Format &amp; Publishing</h2>
              </div>
            </div>

            <div className="fluent-card__body">
              {/* Publication Switch Box */}
              <div className={`fluent-publish-box ${form.published ? 'is-published' : ''}`}>
                <div className="fluent-publish-box__info">
                  <span className="fluent-publish-box__title">
                    {form.published ? 'Live on Website' : 'Draft / Unpublished'}
                  </span>
                  <span className="fluent-publish-box__desc">
                    {form.published ? 'Visible in video library and hubs' : 'Hidden from public index'}
                  </span>
                </div>
                <label className="toggle-label" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    className="sr-checkbox"
                    checked={form.published}
                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  />
                  <div className="toggle-switch"></div>
                </label>
              </div>

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>Video Format / Type</span>
                </label>
                <select
                  className="fluent-select"
                  value={form.type || 'clip'}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value as any,
                      kind: e.target.value
                    })
                  }
                >
                  <option value="clip">Topic Clip (Short clip)</option>
                  <option value="episode">Full Episode</option>
                  <option value="short">Social Short / Reel</option>
                </select>
              </div>

              {form.type === 'episode' && (
                <div className="fluent-field">
                  <label className="fluent-label">
                    <span>Episode Number</span>
                  </label>
                  <input
                    type="text"
                    className="fluent-input"
                    placeholder="e.g. 1"
                    value={form.ep || ''}
                    onChange={(e) => setForm({ ...form, ep: e.target.value })}
                  />
                </div>
              )}

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>Duration</span>
                </label>
                <input
                  type="text"
                  className="fluent-input"
                  placeholder="e.g. 12:45 or 03:20"
                  value={form.duration || ''}
                  onChange={(e) => setForm({ ...form, duration: e.target.value })}
                />
              </div>

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>
                    Primary Topic Hub <span className="req-star">*</span>
                  </span>
                </label>
                <select
                  className={`fluent-select ${formErrors.topic ? 'is-invalid' : ''}`}
                  value={form.topic}
                  onChange={(e) => {
                    setForm({ ...form, topic: e.target.value });
                    if (formErrors.topic) setFormErrors((prev) => ({ ...prev, topic: '' }));
                  }}
                >
                  {data.topics?.map((t) => (
                    <option key={t.slug} value={t.slug}>
                      {t.name}
                    </option>
                  ))}
                </select>
                {formErrors.topic && (
                  <div className="field-error-msg">⚠️ {formErrors.topic}</div>
                )}
              </div>

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>Featured Host / Expert</span>
                </label>
                <select
                  className="fluent-select"
                  value={form.guest || form.expert || 'dr-murray-clarke'}
                  onChange={(e) =>
                    setForm({ ...form, guest: e.target.value, expert: e.target.value })
                  }
                >
                  {expertsList.map((exp) => (
                    <option key={exp.slug} value={exp.slug}>
                      {exp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Medical Disclaimer Card */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Medical Disclaimer</h2>
              </div>
            </div>

            <div className="fluent-card__body">
              <div className="fluent-field">
                <textarea
                  className="fluent-textarea"
                  style={{ minHeight: '85px', fontSize: '0.84rem' }}
                  value={form.youtube_disclaimer || ''}
                  onChange={(e) => setForm({ ...form, youtube_disclaimer: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* SEO & Search Engine Optimization Card */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">SEO &amp; Video Search Snippet</h2>
              </div>
            </div>

            <div className="fluent-card__body">
              <div className="fluent-field">
                <label className="fluent-label">
                  <span>Focus Keyword</span>
                </label>
                <input
                  type="text"
                  className="fluent-input"
                  placeholder="e.g. healing infant eczema"
                  value={form.focus_keyword || ''}
                  onChange={(e) => setForm({ ...form, focus_keyword: e.target.value })}
                />
              </div>

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>SEO Meta Title</span>
                </label>
                <input
                  type="text"
                  className="fluent-input"
                  placeholder={form.title || 'Video Title — The First Seven Years'}
                  value={form.seo_title || ''}
                  onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                />
              </div>

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>Meta Description</span>
                </label>
                <textarea
                  className="fluent-textarea"
                  style={{ minHeight: '75px' }}
                  placeholder="Summary for Google search &amp; video schema..."
                  value={form.meta_desc || ''}
                  onChange={(e) => setForm({ ...form, meta_desc: e.target.value })}
                />
              </div>

              {/* Live SERP Card */}
              <div className="fluent-serp" style={{ marginTop: '0.5rem' }}>
                <div className="fluent-serp__header">
                  <span>🎥 Google Video Search Preview</span>
                </div>
                <div className="fluent-serp__url">
                  https://thefirstsevenyears.com › videos › {form.id || 'video-id'}
                </div>
                <div className="fluent-serp__title">
                  {form.seo_title || form.title || 'Video Episode — The First Seven Years'}
                </div>
                <div className="fluent-serp__desc">
                  {form.meta_desc || form.caption || 'Watch pediatric expert discussion on child wellness...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default VideoEdit;
