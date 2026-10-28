import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { RichTextEditor } from '../components/RichTextEditor';
import { PageItem } from '../types';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

export const PageEdit: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const isNew = !slug || slug === 'new';

  const { data, saveItem, deleteItem, showToast, canEdit } = useAdmin();
  const hasEdit = canEdit('pages');

  const rawPages = Array.isArray((data as any)?.pages) ? (data as any).pages : [];
  const pagesList: PageItem[] = Array.isArray(rawPages) ? rawPages : Object.values(rawPages);

  const [form, setForm] = useState<PageItem>({
    id: 'page-' + Date.now(),
    slug: '',
    title: '',
    url: '/',
    template: 'Editorial & Standards',
    excerpt: '',
    body: '',
    published: true,
    updated: new Date().toISOString().split('T')[0],
    seo_title: '',
    meta_desc: '',
    focus_keyword: '',
    keywords: '',
    canonical_url: '',
    robots_index: 'index',
    robots_follow: 'follow',
    og_title: '',
    og_type: 'website',
    og_desc: '',
    og_image: '',
    schema_type: 'WebPage',
    twitter_card: 'summary_large_image'
  });

  const [isSlugManual, setIsSlugManual] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load existing page if editing
  useEffect(() => {
    if (!isNew && slug) {
      const existing = pagesList.find((p) => p.slug === slug || p.id === slug);
      if (existing) {
        setForm({
          ...existing,
          url: existing.url || `/${existing.slug}/`,
          seo_title: existing.seo_title || '',
          meta_desc: existing.meta_desc || '',
          focus_keyword: existing.focus_keyword || '',
          keywords: existing.keywords || '',
          canonical_url: existing.canonical_url || '',
          robots_index: existing.robots_index || 'index',
          robots_follow: existing.robots_follow || 'follow',
          og_title: existing.og_title || '',
          og_type: existing.og_type || 'website',
          og_desc: existing.og_desc || '',
          og_image: existing.og_image || '',
          schema_type: existing.schema_type || 'WebPage',
          twitter_card: existing.twitter_card || 'summary_large_image'
        });
        setIsSlugManual(true);
      } else {
        showToast(`Page "${slug}" not found`, 'error');
        navigate('/pages');
      }
    }
  }, [slug, isNew]);

  const handleTitleChange = (val: string) => {
    if (formErrors.title) setFormErrors((prev) => ({ ...prev, title: '' }));
    setForm((prev) => {
      const next = { ...prev, title: val };
      if (isNew && !isSlugManual) {
        const autoSlug = slugify(val);
        next.slug = autoSlug;
        next.url = autoSlug ? `/${autoSlug}/` : '/';
      }
      return next;
    });
  };

  const handleSlugChange = (rawSlug: string) => {
    setIsSlugManual(true);
    if (formErrors.slug) setFormErrors((prev) => ({ ...prev, slug: '' }));
    const cleaned = rawSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setForm((prev) => ({
      ...prev,
      slug: cleaned,
      url: cleaned ? `/${cleaned}/` : '/'
    }));
  };

  const handleSave = () => {
    if (!hasEdit) return;

    const errs: Record<string, string> = {};
    if (!form.title?.trim()) {
      errs.title = 'Please provide a page title';
    }
    if (!form.slug?.trim()) {
      errs.slug = 'Please provide a URL slug';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setFormErrors({});

    const toSave: PageItem = {
      ...form,
      title: form.title.trim(),
      slug: form.slug.trim(),
      url: form.url?.trim() || `/${form.slug.trim()}/`,
      updated: new Date().toISOString().split('T')[0]
    };

    saveItem('pages', toSave, 'id');
    showToast(`Page "${toSave.title}" successfully saved!`, 'success');
    navigate('/pages');
  };

  const handleDelete = () => {
    if (!hasEdit || isNew) return;
    deleteItem('pages', 'id', form.id);
    navigate('/pages');
  };

  // SEO length indicators
  const seoTitleLen = (form.seo_title || '').length;
  const titleCountColor =
    seoTitleLen >= 45 && seoTitleLen <= 60
      ? 'var(--mint-dark, #15803d)'
      : seoTitleLen > 60
      ? 'var(--danger, #dc2626)'
      : 'var(--ink-3, #64748b)';

  const seoDescLen = (form.meta_desc || '').length;
  const descCountColor =
    seoDescLen >= 130 && seoDescLen <= 160
      ? 'var(--mint-dark, #15803d)'
      : seoDescLen > 160
      ? 'var(--danger, #dc2626)'
      : 'var(--ink-3, #64748b)';

  return (
    <div className="content-area">
      {/* Page Header */}
      <div className="page-header" style={{ alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link
            to="/pages"
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
            {isNew ? 'New Static Page' : (form.title ? `Edit: ${form.title}` : 'Edit Static Page')}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Link
            to="/pages"
            className="btn btn--outline"
            style={{
              padding: '0.7rem 1.3rem',
              fontSize: '0.96rem',
              fontWeight: 600,
              borderRadius: '8px',
              border: '1.5px solid var(--line-bold, #cbd5e1)',
              background: '#ffffff'
            }}
          >
            Cancel
          </Link>
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
              onClick={handleSave}
            >
              Save Page
            </button>
          )}
        </div>
      </div>

      {/* Main Form Grid (2 Columns) */}
      <div className="fluent-grid">
        {/* LEFT COLUMN: Main Editor Area */}
        <div className="fluent-main">
          {/* Core Page Identity Card */}
              <div className="fluent-card">
                <div className="fluent-card__header">
                  <div className="fluent-card__header-left">
                    <h2 className="fluent-card__title">Page Identity &amp; Routing</h2>
                    <p className="fluent-card__subtitle">
                      Set the page title, clean permalink segment, and canonical web route
                    </p>
                  </div>
                </div>

                <div className="fluent-card__body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div className="fluent-field">
                    <label className="fluent-label">
                      <span>
                        Page Title <span className="req-star">*</span>
                      </span>
                    </label>
                    <input
                      type="text"
                      className={`fluent-input fluent-input--lg ${formErrors.title ? 'is-invalid' : ''}`}
                      placeholder="e.g. Privacy Policy & Parent Rights"
                      value={form.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                    />
                    {formErrors.title && (
                      <div className="field-error-msg">⚠️ {formErrors.title}</div>
                    )}
                    <p className="fluent-hint">
                      Primary H1 heading displayed on the page and used in document navigation.
                    </p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                    <div className="fluent-field">
                      <label className="fluent-label">
                        <span>
                          URL Slug <span className="req-star">*</span>
                        </span>
                      </label>
                      <div className={`fluent-slug-group ${formErrors.slug ? 'is-invalid' : ''}`}>
                        <span className="fluent-slug-group__prefix">/</span>
                        <input
                          type="text"
                          className="fluent-slug-group__input"
                          placeholder="privacy"
                          value={form.slug}
                          onChange={(e) => handleSlugChange(e.target.value)}
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
                              const autoSlug = slugify(form.title);
                              setForm((prev) => ({
                                ...prev,
                                slug: autoSlug,
                                url: autoSlug ? `/${autoSlug}/` : '/'
                              }));
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
                        <span>Target URL Route</span>
                      </label>
                      <input
                        type="text"
                        className="fluent-input"
                        placeholder="e.g. /privacy/ or /book/"
                        value={form.url || `/${form.slug}/`}
                        onChange={(e) => setForm({ ...form, url: e.target.value })}
                        required
                      />
                      <p className="fluent-hint">Exact routing path served by the frontend router.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Excerpt Summary Card */}
              <div className="fluent-card">
                <div className="fluent-card__header">
                  <div className="fluent-card__header-left">
                    <h2 className="fluent-card__title">Page Excerpt &amp; Lead Summary</h2>
                    <p className="fluent-card__subtitle">
                      Short summary used in site search, navigation cards, and directory listings
                    </p>
                  </div>
                </div>

                <div className="fluent-card__body" style={{ padding: '1.5rem' }}>
                  <RichTextEditor
                    value={form.excerpt || ''}
                    minHeight={120}
                    placeholder="Write a concise lead-in summary or introductory hook..."
                    onChange={(val) => setForm({ ...form, excerpt: val })}
                  />
                </div>
              </div>

              {/* Comprehensive Rich Text Body Content Card */}
              <div className="fluent-card">
                <div className="fluent-card__header">
                  <div className="fluent-card__header-left">
                    <h2 className="fluent-card__title">Main Page Content (Rich Text &amp; HTML)</h2>
                    <p className="fluent-card__subtitle">
                      Full editorial layout including headings, paragraphs, formatted lists, links, and media
                    </p>
                  </div>
                </div>

                <div className="fluent-card__body" style={{ padding: '1.5rem' }}>
                  <RichTextEditor
                    value={form.body || ''}
                    minHeight={360}
                    placeholder="Enter comprehensive page content, headings, clinical notes, or legal policy text..."
                    onChange={(val) => setForm({ ...form, body: val })}
                  />
                </div>
              </div>

          {/* Search Engine Optimization & Indexing Card */}
          <div className="fluent-card">
              <div className="fluent-card__header">
                <div className="fluent-card__header-left">
                  <h2 className="fluent-card__title">Search Engine Optimization &amp; Indexing</h2>
                  <p className="fluent-card__subtitle">
                    Preview your SERP snippet and optimize meta title, description, and robot directives
                  </p>
                </div>
              </div>

              <div className="fluent-card__body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                {/* LIVE GOOGLE SERP PREVIEW BOX */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '1.25rem 1.5rem',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--navy)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.75rem' }}>
                    Google Search Result Live Preview
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#202124', display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.3rem' }}>
                    <span
                      style={{
                        display: 'inline-block',
                        width: '18px',
                        height: '18px',
                        background: 'var(--navy)',
                        borderRadius: '50%',
                        color: '#fff',
                        fontSize: '11px',
                        textAlign: 'center',
                        lineHeight: '18px',
                        fontWeight: 700
                      }}
                    >
                      7
                    </span>
                    <span style={{ fontWeight: 500 }}>thefirstsevenyears.com</span>
                    <span style={{ color: '#5f6368' }}>› {form.slug || 'page'}</span>
                  </div>
                  <div
                    style={{
                      fontSize: '1.15rem',
                      color: '#1a0dab',
                      fontWeight: 500,
                      lineHeight: 1.35,
                      marginBottom: '0.35rem',
                      cursor: 'pointer'
                    }}
                  >
                    {(form.seo_title || form.title || 'Page Title') + ' — The First Seven Years'}
                  </div>
                  <div style={{ fontSize: '0.86rem', color: '#4d5156', lineHeight: 1.45 }}>
                    {form.meta_desc ||
                      form.excerpt ||
                      'Expert pediatric answers and developmental guidance for parents of children aged 0 to 7.'}
                  </div>
                </div>

                {/* SEO Title Input */}
                <div className="fluent-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="fluent-label" style={{ margin: 0 }}>
                      <span>SEO Meta Title (Title Tag)</span>
                    </label>
                    <small style={{ color: titleCountColor, fontWeight: 600 }}>
                      {seoTitleLen} / 60 characters (Recommended 50–60)
                    </small>
                  </div>
                  <input
                    type="text"
                    className="fluent-input"
                    value={form.seo_title || ''}
                    placeholder="Custom search engine title (defaults to Page Title if left empty)"
                    onChange={(e) => setForm({ ...form, seo_title: e.target.value })}
                  />
                </div>

                {/* SEO Description Input */}
                <div className="fluent-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                    <label className="fluent-label" style={{ margin: 0 }}>
                      <span>SEO Meta Description</span>
                    </label>
                    <small style={{ color: descCountColor, fontWeight: 600 }}>
                      {seoDescLen} / 160 characters (Recommended 150–160)
                    </small>
                  </div>
                  <textarea
                    className="fluent-input"
                    rows={3}
                    style={{ resize: 'vertical' }}
                    value={form.meta_desc || ''}
                    placeholder="Concise overview snippet to maximize click-through rate from search engines..."
                    onChange={(e) => setForm({ ...form, meta_desc: e.target.value })}
                  />
                </div>

                {/* Keywords */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="fluent-field">
                    <label className="fluent-label">Primary Focus Keyword</label>
                    <input
                      type="text"
                      className="fluent-input"
                      value={form.focus_keyword || ''}
                      placeholder="e.g. pediatric gut health"
                      onChange={(e) => setForm({ ...form, focus_keyword: e.target.value })}
                    />
                  </div>
                  <div className="fluent-field">
                    <label className="fluent-label">Secondary Keywords / Tags</label>
                    <input
                      type="text"
                      className="fluent-input"
                      value={form.keywords || ''}
                      placeholder="comma-separated tags e.g. toddler gut, eczema"
                      onChange={(e) => setForm({ ...form, keywords: e.target.value })}
                    />
                  </div>
                </div>

                {/* Canonical & Robots Directives */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '1.25rem' }}>
                  <div className="fluent-field">
                    <label className="fluent-label">Canonical URL Override</label>
                    <input
                      type="text"
                      className="fluent-input"
                      value={form.canonical_url || ''}
                      placeholder={`https://thefirstsevenyears.com${form.url || '/'}`}
                      onChange={(e) => setForm({ ...form, canonical_url: e.target.value })}
                    />
                  </div>
                  <div className="fluent-field">
                    <label className="fluent-label">Robots Indexing</label>
                    <select
                      className="fluent-select"
                      value={form.robots_index || 'index'}
                      onChange={(e) => setForm({ ...form, robots_index: e.target.value })}
                    >
                      <option value="index">Index (Allow in search)</option>
                      <option value="noindex">Noindex (Hide from search)</option>
                    </select>
                  </div>
                  <div className="fluent-field">
                    <label className="fluent-label">Robots Following</label>
                    <select
                      className="fluent-select"
                      value={form.robots_follow || 'follow'}
                      onChange={(e) => setForm({ ...form, robots_follow: e.target.value })}
                    >
                      <option value="follow">Follow (Crawl page links)</option>
                      <option value="nofollow">Nofollow (Do not crawl)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

          {/* Social Share & OpenGraph Metadata Card */}
          <div className="fluent-card">
              <div className="fluent-card__header">
                <div className="fluent-card__header-left">
                  <h2 className="fluent-card__title">Social Share &amp; OpenGraph Metadata</h2>
                  <p className="fluent-card__subtitle">
                    Configure rich preview cards for Facebook, X / Twitter, LinkedIn, and Schema.org
                  </p>
                </div>
              </div>

              <div className="fluent-card__body" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.35rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem' }}>
                  <div className="fluent-field">
                    <label className="fluent-label">Social Share Title (OG Title)</label>
                    <input
                      type="text"
                      className="fluent-input"
                      value={form.og_title || ''}
                      placeholder="Defaults to SEO Title if blank"
                      onChange={(e) => setForm({ ...form, og_title: e.target.value })}
                    />
                  </div>
                  <div className="fluent-field">
                    <label className="fluent-label">Open Graph Type</label>
                    <select
                      className="fluent-select"
                      value={form.og_type || 'website'}
                      onChange={(e) => setForm({ ...form, og_type: e.target.value })}
                    >
                      <option value="website">website</option>
                      <option value="article">article</option>
                      <option value="profile">profile</option>
                    </select>
                  </div>
                </div>

                <div className="fluent-field">
                  <label className="fluent-label">Social Share Description</label>
                  <textarea
                    className="fluent-input"
                    rows={2}
                    value={form.og_desc || ''}
                    placeholder="Defaults to meta description if blank"
                    onChange={(e) => setForm({ ...form, og_desc: e.target.value })}
                  />
                </div>

                <div className="fluent-field">
                  <label className="fluent-label">Social Share Image URL (OG Image 1200×630)</label>
                  <input
                    type="text"
                    className="fluent-input"
                    value={form.og_image || ''}
                    placeholder="https://thefirstsevenyears.com/assets/img/og-share.jpg"
                    onChange={(e) => setForm({ ...form, og_image: e.target.value })}
                  />
                  <p className="fluent-hint">Recommended dimension: 1200 x 630 pixels (JPEG/PNG/WebP).</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="fluent-field">
                    <label className="fluent-label">Schema.org Structured Data Type</label>
                    <select
                      className="fluent-select"
                      value={form.schema_type || 'WebPage'}
                      onChange={(e) => setForm({ ...form, schema_type: e.target.value })}
                    >
                      <option value="WebPage">WebPage (Standard Page)</option>
                      <option value="Article">Article (Educational Editorial)</option>
                      <option value="MedicalWebPage">MedicalWebPage (Clinical Guidance)</option>
                      <option value="AboutPage">AboutPage (Credentials &amp; Organization)</option>
                      <option value="FAQPage">FAQPage (Questions &amp; Answers)</option>
                      <option value="ContactPage">ContactPage (Ask the Doctor)</option>
                      <option value="ItemPage">ItemPage (Book Showcase)</option>
                    </select>
                  </div>
                  <div className="fluent-field">
                    <label className="fluent-label">Twitter / X Card Format</label>
                    <select
                      className="fluent-select"
                      value={form.twitter_card || 'summary_large_image'}
                      onChange={(e) => setForm({ ...form, twitter_card: e.target.value })}
                    >
                      <option value="summary_large_image">summary_large_image (Large Photo Card)</option>
                      <option value="summary">summary (Compact Card)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
        </div>

        {/* RIGHT COLUMN: Sidebar Publication & Settings */}
        <div className="fluent-sidebar">
          {/* Publication Card */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Publication Status</h2>
              </div>
            </div>

            <div className="fluent-card__body" style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div className={`fluent-publish-box ${form.published ? 'is-published' : ''}`}>
                <div className="fluent-publish-box__info">
                  <span className="fluent-publish-box__title">
                    {form.published ? 'Live on Website' : 'Draft Mode'}
                  </span>
                  <span className="fluent-publish-box__desc">
                    {form.published ? 'Publicly accessible at target URL route' : 'Hidden from site visitors and navigation'}
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
                  <span>Page Layout Template</span>
                  <span className="fluent-badge-opt">Template</span>
                </label>
                <select
                  className="fluent-select"
                  value={form.template}
                  onChange={(e) => setForm({ ...form, template: e.target.value })}
                >
                  <option value="Editorial & Standards">Editorial &amp; Standards (About Us, Mission)</option>
                  <option value="Clinical Review Board">Clinical Review Board (Verification)</option>
                  <option value="Product / Book Showcase">Product / Book Showcase (The Book)</option>
                  <option value="Legal & Privacy Policy">Legal &amp; Privacy Policy (Terms, COPPA)</option>
                  <option value="Contact & Intake">Contact &amp; Intake (Ask the Doctor Form)</option>
                  <option value="Custom Standard Layout">Custom Standard Layout</option>
                </select>
              </div>

              <div className="fluent-field">
                <label className="fluent-label">Last Modified Date</label>
                <input
                  type="date"
                  className="fluent-input"
                  value={form.updated || ''}
                  onChange={(e) => setForm({ ...form, updated: e.target.value })}
                />
              </div>

              {form.slug && (
                <div className="fluent-field" style={{ marginBottom: 0 }}>
                  <label className="fluent-label">Live Public Route</label>
                  <a
                    href={`http://localhost:3000${form.url || '/' + form.slug + '/'}`}
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
                    <span>🔗</span> {form.url || `/${form.slug}/`} <span style={{ opacity: 0.7 }}>↗</span>
                  </a>
                </div>
              )}

              {hasEdit && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="btn btn--primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.75rem', fontWeight: 700 }}
                    onClick={handleSave}
                  >
                    Save Page Changes
                  </button>
                  <Link
                    to="/pages"
                    className="btn btn--outline"
                    style={{ width: '100%', justifyContent: 'center', padding: '0.65rem' }}
                  >
                    Discard Changes
                  </Link>
                  {!isNew && (
                    <button
                      type="button"
                      className="btn btn--danger"
                      style={{ width: '100%', justifyContent: 'center', padding: '0.65rem', marginTop: '0.5rem' }}
                      onClick={handleDelete}
                    >
                      🗑️ Delete Page
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Route Card */}
          <div className="fluent-card">
            <div className="fluent-card__header">
              <div className="fluent-card__header-left">
                <h2 className="fluent-card__title">Live Web Route</h2>
              </div>
            </div>
            <div className="fluent-card__body" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ background: '#f1f5f9', padding: '0.65rem 0.85rem', borderRadius: '8px', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--navy)' }}>
                {form.url || `/${form.slug}/`}
              </div>
              <a
                href={`https://thefirstsevenyears.com${form.url || `/${form.slug}/`}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn--outline"
                style={{ fontSize: '0.82rem', justifyContent: 'center', padding: '0.5rem' }}
              >
                🔗 Open Public Page ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
