import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { RichTextEditor } from '../components/RichTextEditor';
import { AnswerItem } from '../types';

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

export const AnswerEdit: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const isNew = !slug || slug === 'new';

  const { data, saveItem, showToast, canEdit } = useAdmin();
  const hasEdit = canEdit('answers');

  const rawAnswers = data.answers || [];
  const answersList: AnswerItem[] = Array.isArray(rawAnswers)
    ? rawAnswers
    : Object.values(rawAnswers);

  // Normalize experts from database
  const expertsList: { slug: string; name: string }[] = data.experts
    ? (Array.isArray(data.experts)
        ? data.experts.map((e: any) => ({ slug: e.slug, name: e.name || e.slug }))
        : Object.entries(data.experts).map(([s, x]: [string, any]) => ({ slug: s, name: x.name || s })))
    : [];

  const rawVideos = (data as any).episodes || data.videos || [];
  const videosList: any[] = Array.isArray(rawVideos) ? rawVideos : Object.values(rawVideos);

  const [form, setForm] = useState<AnswerItem>({
    slug: '',
    q: '',
    question: '',
    quick: '',
    short_answer: '',
    body: '',
    topic: data.topics?.[0]?.slug || '',
    topics: data.topics?.[0]?.slug ? [data.topics[0].slug] : [],
    also: [],
    video: '',
    ages: [0, 1, 2, 3, 4, 5, 6, 7],
    expert: '',
    reviewed_by: '',
    reviewed_at: new Date().toISOString().split('T')[0],
    clinical_status: 'Reviewed',
    published: true,
    seo_title: '',
    meta_desc: '',
    focus_keyword: '',
    schema_type: 'MedicalWebPage',
    canonical_url: '',
    robots_index: 'index'
  });

  const [isSlugManual, setIsSlugManual] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isNew && slug) {
      const existing = answersList.find((a) => a.slug === slug);
      if (existing) {
        const qText = existing.q || existing.question || '';
        const quickText = existing.quick || existing.short_answer || '';
        const bodyText = Array.isArray(existing.body)
          ? existing.body.join('\n\n')
          : (existing.body || '');

        setForm({
          ...existing,
          slug: existing.slug,
          q: qText,
          question: qText,
          quick: quickText,
          short_answer: quickText,
          body: bodyText,
          also: existing.also || [],
          video: existing.video || '',
          ages: existing.ages || [0, 1, 2, 3, 4, 5, 6, 7],
          expert: existing.expert || 'dr-murray-clarke',
          reviewed_by: existing.reviewed_by || 'Dr. Murray Clarke',
          reviewed_at: existing.reviewed_at || existing.reviewed || new Date().toISOString().split('T')[0],
          clinical_status: existing.clinical_status || 'Reviewed',
          published: existing.published !== false,
          seo_title: existing.seo_title || '',
          meta_desc: existing.meta_desc || '',
          focus_keyword: existing.focus_keyword || '',
          schema_type: existing.schema_type || 'MedicalWebPage',
          canonical_url: existing.canonical_url || '',
          robots_index: existing.robots_index || 'index'
        });
        setIsSlugManual(true);
      } else {
        showToast(`Question with slug "${slug}" not found`, 'error');
        navigate('/answers');
      }
    }
  }, [slug, isNew]);

  const handleQuestionChange = (newQ: string) => {
    setForm((prev) => {
      const updated = { ...prev, q: newQ, question: newQ };
      if (!isSlugManual && isNew) {
        updated.slug = slugify(newQ);
      }
      return updated;
    });
  };

  const toggleSecondaryTopic = (tSlug: string) => {
    setForm((prev) => {
      const current = prev.also || [];
      const next = current.includes(tSlug)
        ? current.filter((s) => s !== tSlug)
        : [...current, tSlug];
      return { ...prev, also: next };
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

  const selectAllAges = () => {
    setForm((prev) => ({ ...prev, ages: [0, 1, 2, 3, 4, 5, 6, 7] }));
  };

  const clearAges = () => {
    setForm((prev) => ({ ...prev, ages: [] }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!hasEdit) {
      showToast('You have read-only permissions.', 'error');
      return;
    }
    const errs: Record<string, string> = {};
    const qText = (form.question || form.q || '').trim();
    if (!qText) {
      errs.question = 'Please provide a parent question heading';
    }
    if (!form.slug?.trim()) {
      errs.slug = 'Please provide a URL slug';
    }
    const quickText = (form.short_answer || form.quick || '').trim();
    if (!quickText) {
      errs.quick = 'Please provide a quick answer summary';
    }
    if (!form.topic || !form.topic.trim()) {
      errs.topic = 'Please select a primary topic hub';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setFormErrors({});
    const videoId = extractYouTubeId(form.video) || form.video || '';

    const toSave: AnswerItem = {
      ...form,
      q: qText.trim(),
      question: qText.trim(),
      quick: (form.short_answer || form.quick || '').trim(),
      short_answer: (form.short_answer || form.quick || '').trim(),
      video: videoId,
      canonical_url: form.canonical_url || `https://thefirstsevenyears.com/parent-answers/${form.slug}/`
    };

    saveItem('answers', toSave, 'slug');
    showToast(`Question "${qText.slice(0, 32)}..." saved successfully!`, 'success');
    navigate('/answers');
  };

  const currentVidId = extractYouTubeId(form.video) || form.video || '';
  const currentTopic = data.topics?.find((t) => t.slug === form.topic);

  // SEO counters
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

  return (
    <div className="content-area">
      {/* Page Header */}
      <div className="page-header" style={{ alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link
            to="/answers"
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
            {isNew ? 'New Question & Answer' : 'Edit Question & Answer'}
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
              Save Question &amp; Answer
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Form Grid (2 Columns) */}
      <div className="fluent-grid">
        {/* Main Column */}
        <div className="fluent-main">
          {/* Question Details Card */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Question Formulation &amp; Summary</h2>
                <p className="fluent-card__subtitle">
                  Define the core parent inquiry and provide a direct executive summary
                </p>
              </div>
            </div>

            <div className="fluent-card__body">
              <div className="fluent-field">
                <label className="fluent-label">
                  <span>
                    Parent Question <span className="req-star">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  className={`fluent-input fluent-input--lg ${formErrors.question ? 'is-invalid' : ''}`}
                  placeholder="e.g. When should I introduce solids to my baby's diet?"
                  value={form.question || form.q || ''}
                  onChange={(e) => {
                    handleQuestionChange(e.target.value);
                    if (formErrors.question) setFormErrors((prev) => ({ ...prev, question: '' }));
                  }}
                />
                {formErrors.question && (
                  <div className="field-error-msg">⚠️ {formErrors.question}</div>
                )}
                <p className="fluent-hint">
                  Write how parents actually ask doctors (natural, conversational, and direct).
                </p>
              </div>

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>
                    URL Slug <span className="req-star">*</span>
                  </span>
                </label>
                <div className={`fluent-slug-group ${formErrors.slug ? 'is-invalid' : ''}`}>
                  <span className="fluent-slug-group__prefix">/parent-answers/</span>
                  <input
                    type="text"
                    className="fluent-slug-group__input"
                    placeholder="when-to-introduce-solids-baby"
                    value={form.slug}
                    onChange={(e) => {
                      setIsSlugManual(true);
                      setForm({ ...form, slug: slugify(e.target.value) });
                      if (formErrors.slug) setFormErrors((prev) => ({ ...prev, slug: '' }));
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
                        setIsSlugManual(false);
                        setForm({ ...form, slug: slugify(form.question || form.q || '') });
                        if (formErrors.slug) setFormErrors((prev) => ({ ...prev, slug: '' }));
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
                  <span>
                    Quick Answer / At-a-Glance Summary <span className="req-star">*</span>
                  </span>
                </label>
                <textarea
                  className={`fluent-textarea ${formErrors.quick ? 'is-invalid' : ''}`}
                  style={{ minHeight: '90px' }}
                  placeholder="2–3 concise sentences delivering the direct clinical conclusion before the deep dive..."
                  value={form.short_answer || form.quick || ''}
                  onChange={(e) => {
                    setForm({ ...form, quick: e.target.value, short_answer: e.target.value });
                    if (formErrors.quick) setFormErrors((prev) => ({ ...prev, quick: '' }));
                  }}
                />
                {formErrors.quick && (
                  <div className="field-error-msg">⚠️ {formErrors.quick}</div>
                )}
                <p className="fluent-hint">
                  Displayed prominently in search chips, parent previews, and featured answers.
                </p>
              </div>
            </div>
          </div>

          {/* Detailed Explanation Card */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Comprehensive Clinical Answer</h2>
                <p className="fluent-card__subtitle">
                  Full pediatric rationale, clinical signs, developmental steps, and parent action tips
                </p>
              </div>
            </div>

            <div className="fluent-card__body">
              <div className="fluent-field">
                <RichTextEditor
                  value={typeof form.body === 'string' ? form.body : (form.body || []).join('\n\n')}
                  onChange={(val) => setForm({ ...form, body: val })}
                  placeholder="Provide detailed clinical guidance, step-by-step advice, and when to consult a physician..."
                  minHeight="340px"
                />
              </div>
            </div>
          </div>

          {/* Video Attachment Card */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Video Attachment &amp; Player Preview</h2>
                <p className="fluent-card__subtitle">
                  Connect a topic clip or full podcast episode to this question
                </p>
              </div>
            </div>

            <div className="fluent-card__body">
              <div className="form-row">
                <div className="fluent-field">
                  <label className="fluent-label">
                    <span>YouTube Link or Video ID</span>
                    <span className="fluent-badge-opt">Optional</span>
                  </label>
                  <input
                    type="text"
                    className="fluent-input"
                    placeholder="https://www.youtube.com/watch?v=... or ID"
                    value={form.video || ''}
                    onChange={(e) => setForm({ ...form, video: e.target.value })}
                  />
                </div>

                <div className="fluent-field">
                  <label className="fluent-label">
                    <span>Or Pick from Existing Video Library</span>
                    <span className="fluent-badge-opt">Select</span>
                  </label>
                  <select
                    className="fluent-select"
                    value={currentVidId}
                    onChange={(e) => setForm({ ...form, video: e.target.value })}
                  >
                    <option value="">-- No video linked --</option>
                    {videosList.map((v: any) => {
                      const vId = v.id || v.youtube_id || '';
                      return (
                        <option key={vId} value={vId}>
                          {v.title} ({vId})
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {currentVidId ? (
                <div className="video-preview-box" style={{ marginTop: '0.5rem' }}>
                  <div className="video-preview-box__header">
                    <span className="badge badge--success">✓ Connected Video: {currentVidId}</span>
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
                <div className="notice-box notice-box--info">
                  ℹ️ Linking a video allows parents to watch the expert explanation directly beside this written answer.
                </div>
              )}
            </div>
          </div>

          {/* Secondary Topics Card */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Secondary Categories &amp; Cross-References</h2>
                <p className="fluent-card__subtitle">
                  Tag additional topic hubs where parents should discover this answer
                </p>
              </div>
            </div>

            <div className="fluent-card__body">
              <div className="fluent-pills-wrap">
                {data.topics
                  ?.filter((t) => t.slug !== form.topic)
                  .map((t) => {
                    const isChecked = (form.also || []).includes(t.slug);
                    return (
                      <label
                        key={t.slug}
                        className={`fluent-pill-checkbox ${isChecked ? 'is-checked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSecondaryTopic(t.slug)}
                        />
                        <span>{t.name}</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="fluent-sidebar">
          {/* Status & Review Card */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Publishing &amp; Review</h2>
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
                    {form.published ? 'Accessible to parents in search & navigation' : 'Hidden from public index'}
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
                  <span>Clinical Review Status</span>
                </label>
                <select
                  className="fluent-select"
                  value={form.clinical_status || 'Reviewed'}
                  onChange={(e) => setForm({ ...form, clinical_status: e.target.value })}
                >
                  <option value="Reviewed">Clinically Reviewed</option>
                  <option value="Pending Review">Pending Review</option>
                  <option value="Update Needed">Needs Clinical Update</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>Reviewing Expert</span>
                </label>
                <select
                  className="fluent-select"
                  value={form.expert || 'dr-murray-clarke'}
                  onChange={(e) => {
                    const found = expertsList.find((x) => x.slug === e.target.value);
                    setForm({
                      ...form,
                      expert: e.target.value,
                      reviewed_by: found?.name || e.target.value
                    });
                  }}
                >
                  {expertsList.map((exp) => (
                    <option key={exp.slug} value={exp.slug}>
                      {exp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>Clinical Review Date</span>
                </label>
                <input
                  type="date"
                  className="fluent-input"
                  value={form.reviewed_at || form.reviewed || ''}
                  onChange={(e) =>
                    setForm({ ...form, reviewed_at: e.target.value, reviewed: e.target.value })
                  }
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
            </div>
          </div>

          {/* Child Age Range Selector */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Target Child Age (0–7)</h2>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button type="button" className="btn-link" onClick={selectAllAges}>
                  All Ages
                </button>
                <span style={{ color: '#cbd5e1' }}>|</span>
                <button type="button" className="btn-link" onClick={clearAges}>
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

          {/* Search & Social (SEO) */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Search &amp; Social (SEO)</h2>
              </div>
            </div>

            <div className="fluent-card__body">
              <div className="fluent-field">
                <label className="fluent-label">
                  <span>Focus Keyword</span>
                  <span className="fluent-badge-opt">Search Intent</span>
                </label>
                <input
                  type="text"
                  className="fluent-input"
                  placeholder="e.g. baby starting solids"
                  value={form.focus_keyword || ''}
                  onChange={(e) => setForm({ ...form, focus_keyword: e.target.value })}
                />
              </div>

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>SEO Meta Title</span>
                  <span style={{ fontSize: '0.75rem', color: titleCountColor, fontWeight: 700 }}>
                    {seoTitleLen}/60
                  </span>
                </label>
                <input
                  type="text"
                  className="fluent-input"
                  placeholder={form.question || 'Page title for search engines'}
                  value={form.seo_title || ''}
                  onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                />
              </div>

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>Meta Description</span>
                  <span style={{ fontSize: '0.75rem', color: descCountColor, fontWeight: 700 }}>
                    {seoDescLen}/160
                  </span>
                </label>
                <textarea
                  className="fluent-textarea"
                  style={{ minHeight: '80px' }}
                  placeholder="Summary for Google search snippets (130-160 characters ideal)"
                  value={form.meta_desc || ''}
                  onChange={(e) => setForm({ ...form, meta_desc: e.target.value })}
                />
              </div>

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>Robots Indexing</span>
                </label>
                <select
                  className="fluent-select"
                  value={form.robots_index || 'index'}
                  onChange={(e) => setForm({ ...form, robots_index: e.target.value })}
                >
                  <option value="index">index, follow (Search visible)</option>
                  <option value="noindex">noindex, follow (Hide from Google)</option>
                </select>
              </div>

              {/* Google SERP Snippet Preview */}
              <div className="fluent-serp" style={{ marginTop: '0.5rem' }}>
                <div className="fluent-serp__header">
                  <span>🔍 Google Search Preview</span>
                </div>
                <div className="fluent-serp__url">
                  https://thefirstsevenyears.com › parent-answers › {form.slug || 'slug'}
                </div>
                <div className="fluent-serp__title">
                  {form.seo_title || form.question || 'The First Seven Years — Pediatric Q&A'}
                </div>
                <div className="fluent-serp__desc">
                  {form.meta_desc ||
                    form.short_answer ||
                    form.quick ||
                    'Reviewed pediatric guidance for parents of kids 0–7...'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default AnswerEdit;
