import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { RichTextEditor } from '../components/RichTextEditor';
import { ExpertItem } from '../types';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}


export const ExpertEdit: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const isNew = !slug || slug === 'new';

  const { data, saveItem, showToast, canEdit } = useAdmin();
  const hasEdit = canEdit('experts');

  const rawExperts = data.experts || {};
  const expertsList: ExpertItem[] = Array.isArray(rawExperts)
    ? rawExperts
    : Object.entries(rawExperts).map(([s, val]: [string, any]) => ({
        slug: s,
        ...val
      }));

  const rawAnswers = data.answers || [];
  const answersList: any[] = Array.isArray(rawAnswers) ? rawAnswers : Object.values(rawAnswers);

  const rawVideos = data.videos || (data as any).episodes || [];
  const videosList: any[] = Array.isArray(rawVideos) ? rawVideos : Object.values(rawVideos);

  const [form, setForm] = useState<ExpertItem>({
    slug: '',
    name: '',
    role: '',
    img: '/assets/img/dr-murray-clarke.jpg',
    swatch: '#cce5ff',
    short: '',
    bio: '',
    creds: '',
    same: [],
    answers: [],
    episodes: [],
    published: true,
    seo_title: '',
    meta_desc: '',
    focus_keyword: '',
    keywords: '',
    canonical_url: '',
    robots_index: 'index'
  });

  const [isSlugManual, setIsSlugManual] = useState(false);
  const [newSameLink, setNewSameLink] = useState('');
  const [answerSearch, setAnswerSearch] = useState('');
  const [videoSearch, setVideoSearch] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    if (file.size > 8 * 1024 * 1024) {
      showToast('Image size exceeds 8MB. Please choose a smaller image.', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      setForm((prev) => ({ ...prev, img: dataUrl }));
      showToast('Profile photo attached!', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (!file.type.startsWith('image/')) {
        showToast('Please drop a valid image file (PNG, JPG, WebP).', 'error');
        return;
      }
      if (file.size > 8 * 1024 * 1024) {
        showToast('Image size exceeds 8MB. Please choose a smaller image.', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        setForm((prev) => ({ ...prev, img: dataUrl }));
        showToast('Profile photo attached!', 'success');
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!isNew && slug) {
      const existing = expertsList.find((e) => e.slug === slug);
      if (existing) {
        const assignedAnswers = Array.isArray(existing.answers)
          ? existing.answers
          : answersList.filter((a: any) => a.expert === existing.slug).map((a: any) => a.slug);

        const assignedVideos = Array.isArray(existing.episodes)
          ? existing.episodes
          : videosList
              .filter((v: any) => v.guest === existing.slug || v.expert === existing.slug)
              .map((v: any) => v.id || v.youtube_id);

        const bioStr = Array.isArray(existing.bio)
          ? existing.bio.join('\n\n')
          : (existing.bio || existing.short || '');

        const credsStr = Array.isArray(existing.creds)
          ? existing.creds.join(', ')
          : (existing.creds || '');

        setForm({
          ...existing,
          slug: existing.slug,
          name: existing.name || '',
          role: existing.role || '',
          img: existing.img || '/assets/img/dr-murray-clarke.jpg',
          swatch: existing.swatch || '#cce5ff',
          short: existing.short || '',
          bio: bioStr,
          creds: credsStr,
          same: Array.isArray(existing.same) ? existing.same : [],
          answers: assignedAnswers,
          episodes: assignedVideos,
          published: existing.published !== false,
          seo_title: existing.seo_title || '',
          meta_desc: existing.meta_desc || '',
          focus_keyword: existing.focus_keyword || '',
          keywords: existing.keywords || '',
          canonical_url: existing.canonical_url || '',
          robots_index: existing.robots_index || 'index'
        });
        setIsSlugManual(true);
      } else {
        showToast(`Expert "${slug}" not found`, 'error');
        navigate('/experts');
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

  const addSameLink = () => {
    if (!newSameLink.trim()) return;
    setForm((prev) => ({
      ...prev,
      same: [...(prev.same || []), newSameLink.trim()]
    }));
    setNewSameLink('');
  };

  const removeSameLink = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      same: (prev.same || []).filter((_, i) => i !== idx)
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

  const toggleLinkedVideo = (vidId: string) => {
    setForm((prev) => {
      const current = prev.episodes || [];
      const next = current.includes(vidId)
        ? current.filter((s) => s !== vidId)
        : [...current, vidId];
      return { ...prev, episodes: next };
    });
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!hasEdit) {
      showToast('You have read-only permissions.', 'error');
      return;
    }
    const errs: Record<string, string> = {};
    if (!form.name.trim()) {
      errs.name = 'Please provide an expert name';
    }
    const finalSlug = form.slug.trim() || slugify(form.name);
    if (!finalSlug) {
      errs.slug = 'Please provide a valid URL slug';
    }
    if (!form.role?.trim()) {
      errs.role = 'Please provide a professional role / position';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    const credsArray = typeof form.creds === 'string'
      ? form.creds.split(',').map((c) => c.trim()).filter(Boolean)
      : form.creds;

    const toSave: ExpertItem = {
      ...form,
      slug: finalSlug,
      name: form.name.trim(),
      role: form.role?.trim() || '',
      short: form.short?.trim() || '',
      creds: credsArray,
      canonical_url: form.canonical_url || `https://thefirstsevenyears.com/experts/${finalSlug}/`
    };

    saveItem('experts', toSave, 'slug');
    showToast(`Expert "${form.name}" profile saved successfully!`, 'success');
    navigate('/experts');
  };

  // Filtered lists for linking
  const filteredAnswers = answersList.filter((a: any) => {
    if (!answerSearch) return true;
    const q = answerSearch.toLowerCase();
    return (
      (a.question || a.q || '').toLowerCase().includes(q) ||
      (a.slug || '').toLowerCase().includes(q)
    );
  });

  const filteredVideos = videosList.filter((v: any) => {
    if (!videoSearch) return true;
    const q = videoSearch.toLowerCase();
    return (
      v.title.toLowerCase().includes(q) ||
      (v.id || '').toLowerCase().includes(q) ||
      (v.youtube_id || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="content-area">
      {/* Page Header */}
      <div className="page-header" style={{ alignItems: 'center', marginBottom: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link
            to="/experts"
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
            {isNew ? 'New Expert Profile' : 'Edit Expert Profile'}
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
              Save Expert Profile
            </button>
          )}
        </div>
      </div>

      {/* 3. Main Form Grid */}
      <div className="fluent-grid">
        {/* Main Column */}
        <div className="fluent-main">
          {/* Identity & Role Card */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Professional Identity &amp; Title</h2>
                <p className="fluent-card__subtitle">
                  Medical credentials, official title, and intro pitch
                </p>
              </div>
            </div>

            <div className="fluent-card__body">
              <div className="form-row">
                <div className="fluent-field">
                  <label className="fluent-label">
                    <span>
                      Full Name <span className="req-star">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    className={`fluent-input fluent-input--lg ${formErrors.name ? 'is-invalid' : ''}`}
                    placeholder="e.g. Dr. Murray Clarke"
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
                    <span className="fluent-slug-group__prefix">/experts/</span>
                    <input
                      type="text"
                      className="fluent-slug-group__input"
                      placeholder="dr-murray-clarke"
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
                          setForm({ ...form, slug: slugify(form.name) });
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
              </div>

              <div className="form-row">
                <div className="fluent-field">
                  <label className="fluent-label">
                    <span>
                      Professional Role / Position <span className="req-star">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    className={`fluent-input ${formErrors.role ? 'is-invalid' : ''}`}
                    placeholder="e.g. Pediatric Naturopathic Doctor & Founder"
                    value={form.role}
                    onChange={(e) => {
                      if (formErrors.role) setFormErrors((prev) => ({ ...prev, role: '' }));
                      setForm({ ...form, role: e.target.value });
                    }}
                    required
                  />
                  {formErrors.role && (
                    <div className="field-error-msg">⚠️ {formErrors.role}</div>
                  )}
                </div>

                <div className="fluent-field">
                  <label className="fluent-label">
                    <span>Medical Designations &amp; Credentials</span>
                  </label>
                  <input
                    type="text"
                    className="fluent-input"
                    placeholder="e.g. ND, DHANP, CCH, Homeopath"
                    value={
                      Array.isArray(form.creds)
                        ? form.creds.join(', ')
                        : (form.creds || '')
                    }
                    onChange={(e) => setForm({ ...form, creds: e.target.value })}
                  />
                </div>
              </div>

              <div className="fluent-field">
                <label className="fluent-label">
                  <span>Introductory Pitch / One-Line Summary</span>
                </label>
                <textarea
                  className="fluent-textarea"
                  style={{ minHeight: '80px' }}
                  placeholder="Short introductory summary displayed on expert cards and search snippets..."
                  value={form.short || ''}
                  onChange={(e) => setForm({ ...form, short: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Full Biography Card */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Complete Medical Biography</h2>
                <p className="fluent-card__subtitle">
                  Education, clinical practice, pediatric philosophy, and contributions
                </p>
              </div>
            </div>

            <div className="fluent-card__body">
              <div className="fluent-field">
                <RichTextEditor
                  value={typeof form.bio === 'string' ? form.bio : (form.bio || []).join('\n\n')}
                  onChange={(val) => setForm({ ...form, bio: val })}
                  placeholder="Detail the expert's clinical history, pediatric focus, and contributions..."
                  minHeight="300px"
                />
              </div>
            </div>
          </div>

          {/* Authority Profiles Card (sameAs) */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Authority Profiles &amp; Web Links (sameAs)</h2>
                <p className="fluent-card__subtitle">
                  Establishes Google E-E-A-T and medical entity validation
                </p>
              </div>
            </div>

            <div className="fluent-card__body">
              <div className="fluent-field">
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <input
                    type="url"
                    className="fluent-input"
                    placeholder="https://en.wikipedia.org/wiki/... or LinkedIn profile URL"
                    value={newSameLink}
                    onChange={(e) => setNewSameLink(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSameLink();
                      }
                    }}
                  />
                  <button type="button" className="btn btn--secondary" onClick={addSameLink}>
                    + Add Link
                  </button>
                </div>
              </div>

              {(form.same || []).length > 0 && (
                <div className="link-chips-container" style={{ marginTop: '0.5rem' }}>
                  {(form.same || []).map((link, idx) => (
                    <div key={idx} className="link-chip">
                      <span className="link-chip__url">{link}</span>
                      <button
                        type="button"
                        className="link-chip__remove"
                        onClick={() => removeSameLink(idx)}
                        title="Remove link"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Assigned Parent Q&As Card */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Reviewed / Answered Parent Questions</h2>
                <p className="fluent-card__subtitle">
                  {(form.answers || []).length} questions assigned to this expert
                </p>
              </div>
            </div>

            <div className="fluent-card__body">
              <div className="fluent-field">
                <input
                  type="text"
                  className="fluent-input"
                  placeholder="🔍 Search questions to assign..."
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

          {/* Featured Video Episodes Card */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Featured Video Episodes &amp; Interviews</h2>
                <p className="fluent-card__subtitle">
                  {(form.episodes || []).length} video episodes linked to this expert
                </p>
              </div>
            </div>

            <div className="fluent-card__body">
              <div className="fluent-field">
                <input
                  type="text"
                  className="fluent-input"
                  placeholder="🔍 Search video episodes..."
                  value={videoSearch}
                  onChange={(e) => setVideoSearch(e.target.value)}
                />
              </div>

              <div className="linked-items-scroll-box">
                {filteredVideos.length === 0 ? (
                  <p className="text-muted" style={{ padding: '1.25rem', textAlign: 'center' }}>
                    No matching video episodes found.
                  </p>
                ) : (
                  filteredVideos.map((v: any) => {
                    const vId = v.id || v.youtube_id;
                    const isLinked = (form.episodes || []).includes(vId);
                    return (
                      <label
                        key={vId}
                        className={`linked-item-row ${isLinked ? 'is-linked' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={isLinked}
                          onChange={() => toggleLinkedVideo(vId)}
                        />
                        <div className="linked-item-row__content">
                          <span className="linked-item-row__title">{v.title}</span>
                          <span className="linked-item-row__meta">
                            <code>{vId}</code> · {v.type} ({v.duration || 'N/A'})
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
          {/* Status & Profile Photo Card */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Status &amp; Avatar</h2>
              </div>
            </div>

            <div className="fluent-card__body">
              {/* Publication Switch Box */}
              <div className={`fluent-publish-box ${form.published ? 'is-published' : ''}`}>
                <div className="fluent-publish-box__info">
                  <span className="fluent-publish-box__title">
                    {form.published ? 'Active Host Profile' : 'Hidden / Inactive'}
                  </span>
                  <span className="fluent-publish-box__desc">
                    {form.published ? 'Visible across expert directory and answers' : 'Hidden from site navigation'}
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

              {/* Avatar Preview & Upload Box */}
              <div className="fluent-field">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
                  <label className="fluent-label" style={{ margin: 0 }}>
                    <span>Profile Photo</span>
                  </label>
                  {form.img && (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        letterSpacing: '0.4px',
                        color: form.img.startsWith('data:') ? '#166534' : '#2b3c56',
                        background: form.img.startsWith('data:') ? '#dcfce7' : '#e2e8f0',
                        padding: '0.15rem 0.5rem',
                        borderRadius: '999px',
                      }}
                    >
                      {form.img.startsWith('data:') ? 'Custom Upload' : 'Asset URL'}
                    </span>
                  )}
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />

                {/* Upload Card / Dropzone */}
                <div
                  className={`fluent-avatar-upload ${isDragOver ? 'is-dragover' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    padding: '1rem',
                    background: isDragOver ? '#f0fdf4' : '#f8fafc',
                    border: isDragOver ? '2px dashed #16a34a' : '1px solid #e2e8f0',
                    borderRadius: '12px',
                    transition: 'all 0.2s ease',
                  }}
                >
                  {/* Avatar Headshot with Camera Badge */}
                  <div
                    style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
                    onClick={() => fileInputRef.current?.click()}
                    title="Click to upload headshot"
                  >
                    <img
                      src={form.img || '/assets/img/dr-murray-clarke.jpg'}
                      alt={form.name || 'Expert preview'}
                      className="fluent-avatar-img"
                      onError={(e: any) => {
                        e.target.src = '/assets/img/logo.jpg';
                      }}
                      style={{
                        width: '76px',
                        height: '76px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid #ffffff',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
                        display: 'block'
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        background: '#2B3C56',
                        color: '#ffffff',
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                        border: '2px solid #ffffff'
                      }}
                    >
                      📷
                    </div>
                  </div>

                  {/* Actions & Instructions */}
                  <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                    {form.img && (
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn--sm btn--outline"
                          onClick={() => setForm((prev) => ({ ...prev, img: '' }))}
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.82rem', color: '#dc2626', borderColor: '#fca5a5' }}
                        >
                          ✕ Remove Photo
                        </button>
                      </div>
                    )}
                    <div style={{ fontSize: '0.74rem', color: '#64748b', lineHeight: 1.35 }}>
                      Click photo avatar or drag &amp; drop PNG, JPG, or WebP to upload (max 8MB).
                    </div>
                  </div>
                </div>

                {/* Direct URL / Asset path edit input */}
                <div style={{ marginTop: '0.65rem' }}>
                  <label style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600, display: 'block', marginBottom: '0.3rem' }}>
                    Or image URL / Asset path:
                  </label>
                  <input
                    type="text"
                    className="fluent-input"
                    placeholder="/assets/img/dr-murray-clarke.jpg or https://..."
                    value={form.img?.startsWith('data:') ? 'Custom uploaded headshot (Base64)' : (form.img || '')}
                    disabled={form.img?.startsWith('data:')}
                    onChange={(e) => setForm({ ...form, img: e.target.value })}
                    style={{ fontSize: '0.85rem' }}
                  />
                  {form.img?.startsWith('data:') && (
                    <small style={{ display: 'block', marginTop: '0.25rem', color: '#16a34a', fontSize: '0.75rem', fontWeight: 600 }}>
                      ✓ Custom headshot file attached. Click the avatar or "Remove Photo" to change.
                    </small>
                  )}
                </div>

              </div>

              {/* Brand Swatch */}
              <div className="fluent-field">
                <label className="fluent-label">
                  <span>Profile Brand Accent Swatch</span>
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="color"
                    value={form.swatch || '#cce5ff'}
                    onChange={(e) => setForm({ ...form, swatch: e.target.value })}
                    style={{ width: '44px', height: '40px', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer', padding: '2px' }}
                  />
                  <input
                    type="text"
                    className="fluent-input"
                    value={form.swatch || '#cce5ff'}
                    onChange={(e) => setForm({ ...form, swatch: e.target.value })}
                    style={{ width: '130px' }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SEO & Search Engine Optimization Card */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">SEO &amp; Author Knowledge Graph</h2>
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
                  placeholder="e.g. Dr Murray Clarke pediatrician"
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
                  placeholder={form.name ? `${form.name} — Expert Profile` : 'Expert Profile'}
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
                  style={{ minHeight: '80px' }}
                  placeholder="Official author credentials, bio, and reviews for search engines..."
                  value={form.meta_desc || ''}
                  onChange={(e) => setForm({ ...form, meta_desc: e.target.value })}
                />
              </div>

              {/* SERP Card */}
              <div className="fluent-serp" style={{ marginTop: '0.5rem' }}>
                <div className="fluent-serp__header">
                  <span>🩺 Google Author Profile Preview</span>
                </div>
                <div className="fluent-serp__url">
                  https://thefirstsevenyears.com › experts › {form.slug || 'slug'}
                </div>
                <div className="fluent-serp__title">
                  {form.seo_title || form.name || 'Expert Profile — The First Seven Years'}
                </div>
                <div className="fluent-serp__desc">
                  {form.meta_desc ||
                    form.short ||
                    `Learn more about ${form.name || 'this clinical expert'} and their reviewed pediatric answers...`}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ExpertEdit;
