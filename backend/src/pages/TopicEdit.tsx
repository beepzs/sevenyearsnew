import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { RichTextEditor } from '../components/RichTextEditor';
import { TopicItem } from '../types';

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

const PRESET_SWATCHES = [
  { label: 'Mint', color: '#bfe4c6' },
  { label: 'Soft Sage', color: '#d0ebd8' },
  { label: 'Warm Cream', color: '#f8f5ec' },
  { label: 'Sky Blue', color: '#d6e8fa' },
  { label: 'Lavender', color: '#e0dbfc' },
  { label: 'Peach', color: '#fcdcd1' },
  { label: 'Pale Gold', color: '#fbf0cd' }
];

export const TopicEdit: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const isNew = !slug || slug === 'new';

  const { data, saveItem, showToast, canEdit } = useAdmin();
  const hasEdit = canEdit('topics');

  const topicsList = data.topics || [];
  const rawAnswers = data.answers || [];
  const answersList: any[] = Array.isArray(rawAnswers) ? rawAnswers : Object.values(rawAnswers);

  const rawVideos = (data as any).episodes || data.videos || [];
  const videosList: any[] = Array.isArray(rawVideos) ? rawVideos : Object.values(rawVideos);

  // Normalize experts from database
  const expertsList: { slug: string; name: string }[] = data.experts
    ? (Array.isArray(data.experts)
      ? data.experts.map((e: any) => ({ slug: e.slug, name: e.name || e.slug }))
      : Object.entries(data.experts).map(([s, x]: [string, any]) => ({ slug: s, name: x.name || s })))
    : [];

  const getExpertName = (expSlug: string): string => {
    const found = expertsList.find((e) => e.slug === expSlug);
    return found?.name || expSlug;
  };

  const parseAges = (ages: any): number[] => {
    if (Array.isArray(ages)) {
      return ages.map(Number).filter((n) => !Number.isNaN(n) && Number.isInteger(n) && n >= 0 && n <= 7);
    }
    if (typeof ages === 'string') {
      try {
        const parsed = JSON.parse(ages);
        if (Array.isArray(parsed)) {
          return parsed.map(Number).filter((n) => !Number.isNaN(n) && Number.isInteger(n) && n >= 0 && n <= 7);
        }
      } catch {
        return ages.split(',').map((s) => Number(s.trim())).filter((n) => !Number.isNaN(n) && Number.isInteger(n) && n >= 0 && n <= 7);
      }
    }
    return [0, 1, 2, 3, 4, 5, 6, 7];
  };

  const [form, setForm] = useState<TopicItem>({
    slug: '',
    name: '',
    short: '',
    swatch: '#bfe4c6',
    intro: '',
    order: (topicsList.length || 0) + 1,
    published: true,
    answers: [],
    episodes: [],
    experts: [],
    main_video: '',
    main_video_url: '',
    ages: [0, 1, 2, 3, 4, 5, 6, 7],
    seo_title: '',
    meta_desc: '',
    focus_keyword: '',
    canonical_url: '',
    robots_index: 'noindex'
  });

  const [isSlugManual, setIsSlugManual] = useState(false);
  const [questionSearch, setQuestionSearch] = useState('');
  const [videoSearch, setVideoSearch] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isNew && slug) {
      const existing = topicsList.find((t) => t.slug === slug);
      if (existing) {
        const assignedAnswers = existing.answers && existing.answers.length > 0
          ? existing.answers
          : answersList
            .filter((a: any) => a.topic === existing.slug || (a.also || []).includes(existing.slug))
            .map((a: any) => a.slug);

        const assignedVideos = existing.episodes && existing.episodes.length > 0
          ? existing.episodes
          : videosList
            .filter((v: any) => (v.tags || []).includes(existing.slug))
            .map((v: any) => v.id);

        const currentVid = existing.main_video || '';
        const currentVidUrl = existing.main_video_url || (currentVid ? (currentVid.startsWith('http') ? currentVid : `https://www.youtube.com/watch?v=${currentVid}`) : '');

        setForm({
          ...existing,
          experts: existing.experts && existing.experts.length > 0 ? existing.experts : ['dr-murray-clarke'],
          ages: existing.ages !== undefined && existing.ages !== null ? parseAges(existing.ages) : [0, 1, 2, 3, 4, 5, 6, 7],
          answers: assignedAnswers,
          episodes: assignedVideos,
          main_video: currentVid,
          main_video_url: currentVidUrl,
          seo_title: existing.seo_title || '',
          meta_desc: existing.meta_desc || '',
          focus_keyword: existing.focus_keyword || '',
          canonical_url: existing.canonical_url || '',
          robots_index: existing.robots_index || 'noindex',
          swatch: existing.swatch || '#bfe4c6'
        });
        setIsSlugManual(true);
      }
    }
  }, [slug, isNew]);

  const handleNameChange = (newName: string) => {
    if (formErrors.name || formErrors.slug) {
      setFormErrors((prev) => ({ ...prev, name: '', slug: '' }));
    }
    setForm((prev) => {
      const updated = { ...prev, name: newName };
      if (!isSlugManual && isNew) {
        updated.slug = slugify(newName);
      }
      return updated;
    });
  };

  const toggleExpert = (expSlug: string) => {
    setForm((prev) => {
      const current = prev.experts || [];
      const next = current.includes(expSlug)
        ? current.filter((s) => s !== expSlug)
        : [...current, expSlug];
      return { ...prev, experts: next };
    });
  };

  const toggleAge = (age: number) => {
    setForm((prev) => {
      const current = prev.ages || [];
      const next = current.includes(age)
        ? current.filter((a) => a !== age).sort((a, b) => a - b)
        : [...current, age].sort((a, b) => a - b);
      return { ...prev, ages: next };
    });
  };

  const setAllAges = (select: boolean) => {
    setForm((prev) => ({
      ...prev,
      ages: select ? [0, 1, 2, 3, 4, 5, 6, 7] : []
    }));
  };

  const toggleAnswer = (aSlug: string) => {
    setForm((prev) => {
      const current = prev.answers || [];
      const next = current.includes(aSlug)
        ? current.filter((s) => s !== aSlug)
        : [...current, aSlug];
      return { ...prev, answers: next };
    });
  };

  const toggleEpisode = (vId: string) => {
    setForm((prev) => {
      const current = prev.episodes || [];
      const next = current.includes(vId)
        ? current.filter((id) => id !== vId)
        : [...current, vId];
      return { ...prev, episodes: next };
    });
  };

  const handleCustomVideoUrlChange = (url: string) => {
    const extractedId = extractYouTubeId(url);
    setForm((prev) => ({
      ...prev,
      main_video_url: url,
      main_video: extractedId || (url.trim().length === 11 ? url.trim() : prev.main_video)
    }));
  };

  const handleMainVideoSelectChange = (videoId: string) => {
    setForm((prev) => ({
      ...prev,
      main_video: videoId,
      main_video_url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : ''
    }));
  };

  const handleSave = () => {
    const errs: Record<string, string> = {};
    if (!form.name.trim()) {
      errs.name = 'Please provide a topic name';
    }
    const finalSlug = form.slug?.trim() || slugify(form.name);
    if (!finalSlug) {
      errs.slug = 'Please provide a valid URL slug';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    const rawUrl = form.main_video_url?.trim() || '';
    const extractedId = extractYouTubeId(rawUrl);
    const finalMainVideo = extractedId || form.main_video || '';
    const finalMainVideoUrl = rawUrl.startsWith('http')
      ? rawUrl
      : (finalMainVideo ? `https://www.youtube.com/watch?v=${finalMainVideo}` : '');

    const payload: TopicItem = {
      ...form,
      name: form.name.trim(),
      slug: finalSlug,
      main_video: finalMainVideo,
      main_video_url: finalMainVideoUrl,
      canonical_url: form.canonical_url || `https://thefirstsevenyears.com/topics/${finalSlug}/`
    };

    saveItem('topics', payload, 'slug');
    showToast(`Topic "${payload.name}" saved successfully!`, 'success');
    navigate('/topics');
  };

  const currentVidId = extractYouTubeId(form.main_video_url) || form.main_video || '';

  // SEO lengths
  const seoTitleLen = (form.seo_title || '').length;
  const titleCountColor =
    seoTitleLen >= 45 && seoTitleLen <= 60
      ? '#15803d'
      : seoTitleLen > 60
        ? '#dc2626'
        : '#64748b';

  const seoDescLen = (form.meta_desc || '').length;
  const descCountColor =
    seoDescLen >= 130 && seoDescLen <= 160
      ? '#15803d'
      : seoDescLen > 160
        ? '#dc2626'
        : '#64748b';

  // Filtered Questions
  const filteredAnswers = answersList.filter((a: any) => {
    if (!questionSearch) return true;
    const q = (a.q || a.question || '').toLowerCase();
    const exp = getExpertName(a.expert || '').toLowerCase();
    const term = questionSearch.toLowerCase();
    return q.includes(term) || exp.includes(term);
  });

  // Filtered Videos
  const filteredVideos = videosList.filter((v: any) => {
    if (!videoSearch) return true;
    const title = (v.title || '').toLowerCase();
    const id = (v.id || v.youtube_id || '').toLowerCase();
    const term = videoSearch.toLowerCase();
    return title.includes(term) || id.includes(term);
  });

  return (
    <div className="content-area">
      {/* Page Header */}
      <div className="page-header" style={{ alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link
            to="/topics"
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
            {isNew ? 'New Topic Hub' : 'Edit Topic Hub'}
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
              Save Topic Hub
            </button>
          )}
        </div>
      </div>

      {/* Main Form Grid (2 Columns) */}
      <div className="fluent-grid">
        {/* Main Column */}
        <div className="fluent-main">
          {/* Card 1: Core Topic Info */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Topic Formulation &amp; Identity</h2>
                <p className="fluent-card__subtitle">
                  Define the primary topic title, clean permalink slug, navigation summary, and accent swatch
                </p>
              </div>
            </div>

            <div className="fluent-card__body">
              <div className="fluent-field">
                <label className="fluent-label">
                  <span>
                    Topic Name <span className="req-star">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  className={`fluent-input fluent-input--lg ${formErrors.name ? 'is-invalid' : ''}`}
                  placeholder="e.g. Gut Health &amp; Microbiome"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                />
                {formErrors.name && (
                  <div className="field-error-msg">⚠️ {formErrors.name}</div>
                )}
              </div>

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>
                    URL Slug <span className="req-star">*</span>
                  </span>
                </label>
                <div className={`fluent-slug-group ${formErrors.slug ? 'is-invalid' : ''}`}>
                  <span className="fluent-slug-group__prefix">/topics/</span>
                  <input
                    type="text"
                    className="fluent-slug-group__input"
                    placeholder="gut-health"
                    value={form.slug}
                    onChange={(e) => {
                      if (formErrors.slug) setFormErrors((prev) => ({ ...prev, slug: '' }));
                      setIsSlugManual(true);
                      setForm({ ...form, slug: slugify(e.target.value) });
                    }}
                  />
                  {!isSlugManual ? (
                    <button
                      type="button"
                      className="fluent-slug-group__action"
                      onClick={() => setIsSlugManual(true)}
                    >
                      Customize
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="fluent-slug-group__action"
                      onClick={() => {
                        if (formErrors.slug) setFormErrors((prev) => ({ ...prev, slug: '' }));
                        setIsSlugManual(false);
                        setForm((prev) => ({ ...prev, slug: slugify(prev.name) }));
                      }}
                    >
                      Auto-generate
                    </button>
                  )}
                </div>
                {formErrors.slug && (
                  <div className="field-error-msg">⚠️ {formErrors.slug}</div>
                )}
              </div>

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>Short Description (Navigation &amp; Card subhead)</span>
                  <span className="fluent-badge-opt">Optional</span>
                </label>
                <input
                  type="text"
                  className="fluent-input"
                  placeholder="e.g. Tummies, probiotics and the gut–brain link"
                  value={form.short || ''}
                  onChange={(e) => setForm({ ...form, short: e.target.value })}
                />
                <p className="fluent-hint">
                  Displayed on category chips, topic cards, and header navigation dropdowns.
                </p>
              </div>

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>Accent Swatch Color</span>
                  <span className="fluent-badge-opt">Color Theme</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {PRESET_SWATCHES.map((swatch) => {
                      const isSelected = (form.swatch || '').toLowerCase() === swatch.color.toLowerCase();
                      return (
                        <button
                          key={swatch.color}
                          type="button"
                          onClick={() => setForm({ ...form, swatch: swatch.color })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            border: isSelected ? '2px solid var(--navy, #2b3c56)' : '1.5px solid #e2e8f0',
                            background: isSelected ? '#f8fafc' : '#ffffff',
                            boxShadow: isSelected ? '0 2px 6px rgba(43, 60, 86, 0.12)' : 'none',
                            cursor: 'pointer',
                            fontSize: '0.86rem',
                            fontWeight: isSelected ? 700 : 500,
                            color: '#1e293b',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-block',
                              width: '16px',
                              height: '16px',
                              borderRadius: '50%',
                              background: swatch.color,
                              border: '1.5px solid rgba(0,0,0,0.15)',
                              boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                            }}
                          />
                          <span>{swatch.label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.35rem 0.65rem',
                      borderRadius: '8px',
                      border: '1.5px solid #e2e8f0',
                      background: '#ffffff'
                    }}
                  >
                    <input
                      type="color"
                      value={form.swatch || '#bfe4c6'}
                      onChange={(e) => setForm({ ...form, swatch: e.target.value })}
                      style={{
                        width: '28px',
                        height: '28px',
                        border: 'none',
                        borderRadius: '4px',
                        background: 'transparent',
                        cursor: 'pointer'
                      }}
                      title="Custom Color"
                    />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155', fontFamily: 'monospace' }}>
                      {form.swatch || '#bfe4c6'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>Hub Intro Paragraph (Rich Formatted)</span>
                  <span className="fluent-badge-opt">Full Clinical Overview</span>
                </label>
                <RichTextEditor
                  value={form.intro || ''}
                  minHeight={200}
                  placeholder="Introduce this clinical topic hub, why it matters for children aged 0-7, and what parents will discover..."
                  onChange={(val) => setForm({ ...form, intro: val })}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Target Ages */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Target Age Range (0–7 Years)</h2>
                <p className="fluent-card__subtitle">Highlight applicable developmental years for this topic hub</p>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button type="button" className="btn-link" onClick={() => setAllAges(true)}>
                  All Ages (0–7)
                </button>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <button type="button" className="btn-link" onClick={() => setAllAges(false)}>
                  Clear
                </button>
              </div>
            </div>

            <div className="fluent-card__body">
              <div className="age-grid-selector">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((age) => {
                  const isChecked = (form.ages || []).includes(age);
                  return (
                    <button
                      key={age}
                      type="button"
                      className={`age-selector-btn ${isChecked ? 'is-selected' : ''}`}
                      onClick={() => toggleAge(age)}
                    >
                      <span className="age-selector-btn__num">{age}</span>
                      <span className="age-selector-btn__label">
                        {age === 0 ? '0–12 mo' : `${age} yr`}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 3: Featured Main Video */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Featured Main Video ("Start Here" Clip)</h2>
                <p className="fluent-card__subtitle">
                  Select a flagship clip from your library or link any YouTube episode
                </p>
              </div>
            </div>

            <div className="fluent-card__body">
              <div className="form-row">
                <div className="fluent-field">
                  <label className="fluent-label">
                    <span>From Video Library</span>
                    <span className="fluent-badge-opt">Select</span>
                  </label>
                  <select
                    className="fluent-select"
                    value={currentVidId || ''}
                    onChange={(e) => handleMainVideoSelectChange(e.target.value)}
                  >
                    <option value="">-- None / Select from library --</option>
                    {videosList.map((e: any) => {
                      const id = e.id || e.youtube_id;
                      const label = `${e.kind === 'ep' ? 'EP ' + (e.ep || '') : 'Clip'}: ${e.title} (${id})`;
                      return (
                        <option key={id} value={id}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="fluent-field">
                  <label className="fluent-label">
                    <span>Or Direct YouTube URL</span>
                    <span className="fluent-badge-opt">Link</span>
                  </label>
                  <input
                    type="url"
                    className="fluent-input"
                    placeholder="https://www.youtube.com/watch?v=... or ID"
                    value={form.main_video_url || ''}
                    onChange={(e) => handleCustomVideoUrlChange(e.target.value)}
                  />
                </div>
              </div>

              {currentVidId ? (
                <div className="video-preview-box" style={{ marginTop: '0.25rem' }}>
                  <div className="video-preview-box__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge badge--success">✓ Connected Video: {currentVidId}</span>
                    <a
                      href={`https://youtu.be/${currentVidId}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: 'var(--navy)', fontSize: '0.82rem', textDecoration: 'none', fontWeight: 600 }}
                    >
                      ▶️ Open on YouTube
                    </a>
                  </div>
                  <div className="video-embed-responsive">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${currentVidId}`}
                      title="YouTube video player"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              ) : (
                <div className="notice-box notice-box--info" style={{ margin: 0 }}>
                  ℹ️ Connecting a featured video displays a prominent "Start Here" video player at the top of this topic's public hub.
                </div>
              )}
            </div>
          </div>

          {/* Card 4: Assign Clinical Experts */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Clinical Experts &amp; Hosts</h2>
                <p className="fluent-card__subtitle">
                  Select pediatricians and clinical hosts associated with this topic ({(form.experts || []).length} selected)
                </p>
              </div>
            </div>

            <div className="fluent-card__body">
              <div className="fluent-pills-wrap">
                {expertsList.map((x) => {
                  const isSelected = (form.experts || []).includes(x.slug);
                  return (
                    <label
                      key={x.slug}
                      className={`fluent-pill-checkbox ${isSelected ? 'is-checked' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleExpert(x.slug)}
                      />
                      <span>{x.name}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Card 5: Content Associations (Q&As & Videos) */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Content Associations</h2>
                <p className="fluent-card__subtitle">
                  Assign questions and video library episodes to appear on this topic hub
                </p>
              </div>
            </div>

            <div className="fluent-card__body">
              {/* Questions Association */}
              <div className="fluent-field">
                <label className="fluent-label">
                  <span>Assign Parent Q&amp;As ({(form.answers || []).length} selected)</span>
                </label>
                <input
                  type="text"
                  className="fluent-input"
                  placeholder="🔍 Search questions by keyword or doctor..."
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                />

                <div className="linked-items-scroll-box" style={{ maxHeight: '250px', marginTop: '0.5rem' }}>
                  {filteredAnswers.length === 0 ? (
                    <p className="text-muted" style={{ padding: '1.25rem', textAlign: 'center', margin: 0 }}>
                      No matching questions found in library.
                    </p>
                  ) : (
                    filteredAnswers.map((a: any) => {
                      const isChecked = (form.answers || []).includes(a.slug);
                      const expName = getExpertName(a.expert);
                      return (
                        <label
                          key={a.slug}
                          className={`linked-item-row ${isChecked ? 'is-linked' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleAnswer(a.slug)}
                          />
                          <div className="linked-item-row__content">
                            <span className="linked-item-row__title">{a.q || a.question}</span>
                            <span className="linked-item-row__meta">
                              <code>{a.slug}</code> · {expName}
                            </span>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Videos Association */}
              <div className="fluent-field" style={{ marginTop: '0.75rem' }}>
                <label className="fluent-label">
                  <span>Assign Videos ({(form.episodes || []).length} selected)</span>
                </label>
                <input
                  type="text"
                  className="fluent-input"
                  placeholder="🔍 Search video titles or IDs..."
                  value={videoSearch}
                  onChange={(e) => setVideoSearch(e.target.value)}
                />

                <div className="linked-items-scroll-box" style={{ maxHeight: '250px', marginTop: '0.5rem' }}>
                  {filteredVideos.length === 0 ? (
                    <p className="text-muted" style={{ padding: '1.25rem', textAlign: 'center', margin: 0 }}>
                      No matching videos found in library.
                    </p>
                  ) : (
                    filteredVideos.map((e: any) => {
                      const id = e.id || e.youtube_id;
                      const isChecked = (form.episodes || []).includes(id);
                      const expName = getExpertName(e.guest || e.expert);
                      return (
                        <label
                          key={id}
                          className={`linked-item-row ${isChecked ? 'is-linked' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleEpisode(id)}
                          />
                          <img
                            src={`https://i.ytimg.com/vi/${id}/hqdefault.jpg`}
                            alt=""
                            loading="lazy"
                            style={{
                              width: '52px',
                              height: '32px',
                              borderRadius: '4px',
                              objectFit: 'cover',
                              flexShrink: 0
                            }}
                            onError={(ev) => {
                              (ev.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                          <div className="linked-item-row__content">
                            <span className="linked-item-row__title">{e.title}</span>
                            <span className="linked-item-row__meta">
                              {e.kind === 'ep' ? 'EP ' + (e.ep || '') : 'Clip'} · {expName} · <code>{id}</code>
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

          {/* Card 6: SEO & Meta */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Search Engine Optimization (SEO)</h2>
                <p className="fluent-card__subtitle">
                  Configure search engine titles, snippets, and indexing directives
                </p>
              </div>
            </div>

            <div className="fluent-card__body">
              <div className="fluent-field">
                <label className="fluent-label">
                  <span>Primary Focus Keyword</span>
                  <span className="fluent-badge-opt">Search Intent</span>
                </label>
                <input
                  type="text"
                  className="fluent-input"
                  placeholder="e.g. gut health, microbiome"
                  value={form.focus_keyword || ''}
                  onChange={(e) => setForm({ ...form, focus_keyword: e.target.value })}
                />
              </div>

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>SEO Meta Title</span>
                  <span style={{ fontSize: '0.75rem', color: titleCountColor, fontWeight: 700 }}>
                    {seoTitleLen}/60 chars
                  </span>
                </label>
                <input
                  type="text"
                  className="fluent-input"
                  placeholder="Custom title tag (defaults to Topic Name if blank)"
                  value={form.seo_title || ''}
                  onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                />
              </div>

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>SEO Meta Description</span>
                  <span style={{ fontSize: '0.75rem', color: descCountColor, fontWeight: 700 }}>
                    {seoDescLen}/160 chars
                  </span>
                </label>
                <textarea
                  className="fluent-textarea"
                  style={{ minHeight: '85px' }}
                  placeholder="Snippet description displayed in Google results..."
                  value={form.meta_desc || ''}
                  onChange={(e) => setForm({ ...form, meta_desc: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="fluent-field">
                  <label className="fluent-label">
                    <span>Robots Indexing</span>
                  </label>
                  <select
                    className="fluent-select"
                    value={form.robots_index || 'noindex'}
                    onChange={(e) => setForm({ ...form, robots_index: e.target.value })}
                  >
                    <option value="noindex">noindex, follow (Hide from Google)</option>
                    <option value="index">index, follow (Search visible)</option>
                  </select>
                </div>

                <div className="fluent-field">
                  <label className="fluent-label">
                    <span>Canonical URL Override</span>
                    <span className="fluent-badge-opt">Optional</span>
                  </label>
                  <input
                    type="text"
                    className="fluent-input"
                    placeholder={`https://thefirstsevenyears.com/topics/${form.slug || ''}/`}
                    value={form.canonical_url || ''}
                    onChange={(e) => setForm({ ...form, canonical_url: e.target.value })}
                  />
                </div>
              </div>

              {/* Google SERP Snippet Preview */}
              <div className="fluent-serp" style={{ marginTop: '0.5rem' }}>
                <div className="fluent-serp__header">
                  <span>🔍 Google Search Preview</span>
                </div>
                <div className="fluent-serp__url">
                  https://thefirstsevenyears.com › topics › {form.slug || 'topic'}
                </div>
                <div className="fluent-serp__title">
                  {(form.seo_title || form.name || 'Topic') + ' — The First Seven Years'}
                </div>
                <div className="fluent-serp__desc">
                  {form.meta_desc ||
                    (typeof form.intro === 'string' ? form.intro.replace(/<[^>]*>/g, '') : '') ||
                    form.short ||
                    'Expert pediatric answers and clinical topic guidance for parents of children aged 0 to 7.'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="fluent-sidebar">
          {/* Card: Publishing & Display Priority */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Publishing &amp; Priority</h2>
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
                    {form.published
                      ? 'Accessible to parents in navigation and search'
                      : 'Saved internally only (not publicly visible)'}
                  </span>
                </div>
                <label className="toggle-label" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    className="sr-checkbox"
                    checked={form.published !== false}
                    onChange={(e) => setForm({ ...form, published: e.target.checked })}
                  />
                  <div className="toggle-switch"></div>
                </label>
              </div>

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>Display Order / Priority</span>
                </label>
                <input
                  type="number"
                  className="fluent-input"
                  min={1}
                  value={form.order || 1}
                  onChange={(e) => setForm({ ...form, order: Number(e.target.value) || 1 })}
                />
                <p className="fluent-hint">
                  Lower numbers display first in parent navigation and dropdowns.
                </p>
              </div>

              {form.slug && (
                <div className="fluent-field" style={{ marginBottom: 0 }}>
                  <label className="fluent-label">
                    <span>Live Public Hub</span>
                  </label>
                  <a
                    href={`https://thefirstsevenyears.com/topics/${form.slug}/`}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.6rem 0.85rem',
                      background: '#f8fafc',
                      border: '1.5px solid #e2e8f0',
                      borderRadius: '8px',
                      color: 'var(--navy, #2b3c56)',
                      fontSize: '0.86rem',
                      fontWeight: 600,
                      textDecoration: 'none',
                      wordBreak: 'break-all'
                    }}
                  >
                    <span>🔗</span> /topics/{form.slug}/
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Card: Summary Metrics */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Topic Summary</h2>
              </div>
            </div>

            <div className="fluent-card__body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.65rem', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Assigned Questions</span>
                  <strong style={{ color: 'var(--navy)', fontWeight: 700, fontSize: '0.95rem' }}>
                    {(form.answers || []).length}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.65rem', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Assigned Videos</span>
                  <strong style={{ color: 'var(--navy)', fontWeight: 700, fontSize: '0.95rem' }}>
                    {(form.episodes || []).length}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.65rem', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Assigned Experts</span>
                  <strong style={{ color: 'var(--navy)', fontWeight: 700, fontSize: '0.95rem' }}>
                    {(form.experts || []).length}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.65rem', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Ages Covered</span>
                  <strong style={{ color: 'var(--navy)', fontWeight: 700, fontSize: '0.92rem' }}>
                    {(form.ages || []).length === 8 ? '0–7 (All)' : (form.ages || []).join(', ') || 'None'}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.88rem', color: '#64748b' }}>Accent Swatch</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        background: form.swatch || '#bfe4c6',
                        border: '1px solid rgba(0,0,0,0.15)'
                      }}
                    />
                    <strong style={{ color: 'var(--navy)', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                      {form.swatch || '#bfe4c6'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
