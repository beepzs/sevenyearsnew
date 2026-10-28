import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { RichTextEditor } from '../components/RichTextEditor';
import { BannerItem, PromoBannerSettings, HeroBannerSettings, SearchChipItem } from '../types';

export const Settings: React.FC = () => {
  const { data, saveItem, togglePublish, deleteItem, rebuildSite, resetToDefaults, exportData, showToast } = useAdmin();

  const [activeSubtab, setActiveSubtab] = useState<'promo' | 'hero' | 'brand' | 'general' | 'security' | 'org'>('promo');
  const [selectedBannerId, setSelectedBannerId] = useState<string>('promo_strip');
  const [newPromptText, setNewPromptText] = useState('');
  const [newChipLabel, setNewChipLabel] = useState('');
  const [newChipUrl, setNewChipUrl] = useState('');

  const settings = data.settings || ({} as any);

  // Normalize banners from MySQL banners table
  const defaultPromoBanner: BannerItem = {
    id: 'promo_strip',
    type: 'promo',
    title: 'Education, not medical advice.',
    content: 'In an emergency, call 911.',
    badge: 'Notice',
    highlight: null,
    link_text: 'Learn more',
    link_url: '/medical-disclaimer/',
    bg_color: '#2B3C56',
    text_color: '#ffffff',
    image: null,
    secondary_text: null,
    data: { show_close: true },
    published: true,
    order: 1,
  };

  const defaultHeroBanner: BannerItem = {
    id: 'home_hero',
    type: 'hero',
    title: 'Every question about the first seven years, answered by people who know.',
    content: 'Short, reviewed answers from doctors and health experts — with the video behind every one.',
    badge: 'For parents of children 0–7',
    highlight: 'first seven years',
    link_text: 'Find answers',
    link_url: '/search/',
    bg_color: '#2B3C56',
    text_color: '#ffffff',
    image: '/assets/img/dr-murray-clarke-cutout.webp',
    secondary_text: 'With Dr. Murray Clarke, Dr. Bill Sears and Bryce Wylde',
    data: {
      search_prompts: [
        'Why won’t my toddler eat vegetables?',
        'Is my child’s eczema a gut problem?',
        'How do I help their gut after antibiotics?',
        'Are pets good for my baby’s immune system?',
        'Why are ADHD diagnoses rising?',
        'What’s the difference between probiotics and prebiotics?'
      ],
      chips: [
        { label: 'First foods', url: '/answers/what-should-my-babys-first-food-be/' },
        { label: 'Eczema & the gut', url: '/answers/is-my-childs-eczema-a-gut-problem/' },
        { label: 'After antibiotics', url: '/answers/restoring-the-gut-after-antibiotics/' },
        { label: 'Picky eating', url: '/topics/picky-eating/' }
      ],
      welcome_card: {
        enabled: true,
        title: 'Welcome to The First Seven Years',
        subtitle: 'Dr. Murray Clarke & Bryce Wylde on what this library is and how to use it',
        url: '/about/',
        image: '/assets/img/dr-murray-clarke-cutout.webp'
      }
    },
    published: true,
    order: 2,
  };

  const banners: BannerItem[] = Array.isArray(data.banners) && data.banners.length > 0
    ? data.banners
    : [defaultPromoBanner, defaultHeroBanner];

  const currentPromoRow: BannerItem = banners.find((b) => b.type === 'promo' || b.id === 'promo_strip') || defaultPromoBanner;
  const currentHeroRow: BannerItem = banners.find((b) => b.type === 'hero' || b.id === 'home_hero') || defaultHeroBanner;

  // Clean settings updater without recursive nesting
  const handleUpdate = (section: string, key: string, val: any) => {
    const current = settings as any;
    const cleanCurrent = { ...current };
    delete cleanCurrent['The First Seven Years'];
    if (cleanCurrent.site_title) delete cleanCurrent[cleanCurrent.site_title];

    const updated = {
      ...cleanCurrent,
      [section]: {
        ...(cleanCurrent[section] || {}),
        [key]: val
      }
    };
    saveItem('settings', updated, 'site_title');
    showToast('Settings saved', 'success');
  };

  const handleUpdateDirect = (key: string, val: any) => {
    const cleanCurrent: Record<string, any> = { ...settings };
    delete cleanCurrent['The First Seven Years'];
    if (cleanCurrent.site_title) delete cleanCurrent[cleanCurrent.site_title];

    const updated = {
      ...cleanCurrent,
      [key]: val
    };
    saveItem('settings', updated, 'site_title');
    showToast('Settings saved', 'success');
  };

  // Dedicated banner row save to MySQL table
  const handleSaveBannerItem = (banner: BannerItem, msg?: string) => {
    saveItem('banners', banner, 'id');
    showToast(msg || `Banner "${banner.id}" saved to database`, 'success');
  };

  const handleToggleBanner = (bannerId: string) => {
    togglePublish('banners', 'id', bannerId);
  };

  // Promo Banner helpers
  const handleUpdatePromoField = (field: keyof BannerItem, val: any) => {
    const updated: BannerItem = {
      ...currentPromoRow,
      [field]: val
    };
    handleSaveBannerItem(updated, 'Promo banner updated');
  };

  const handleUpdatePromoData = (key: string, val: any) => {
    const updated: BannerItem = {
      ...currentPromoRow,
      data: {
        ...(currentPromoRow.data || {}),
        [key]: val
      }
    };
    handleSaveBannerItem(updated, 'Promo banner updated');
  };

  // Hero Banner helpers
  const handleUpdateHeroField = (field: keyof BannerItem, val: any) => {
    const updated: BannerItem = {
      ...currentHeroRow,
      [field]: val
    };
    handleSaveBannerItem(updated, 'Hero banner updated');
  };

  const handleUpdateHeroData = (key: string, val: any) => {
    const updated: BannerItem = {
      ...currentHeroRow,
      data: {
        ...(currentHeroRow.data || {}),
        [key]: val
      }
    };
    handleSaveBannerItem(updated, 'Hero banner updated');
  };

  // Prompts helpers
  const currentPrompts: string[] = currentHeroRow.data?.search_prompts || defaultHeroBanner.data?.search_prompts || [];

  const addSearchPrompt = () => {
    if (!newPromptText.trim()) return;
    handleUpdateHeroData('search_prompts', [...currentPrompts, newPromptText.trim()]);
    setNewPromptText('');
  };

  const removeSearchPrompt = (idx: number) => {
    const updated = currentPrompts.filter((_, i) => i !== idx);
    handleUpdateHeroData('search_prompts', updated);
  };

  const updateSearchPrompt = (idx: number, text: string) => {
    const updated = [...currentPrompts];
    updated[idx] = text;
    handleUpdateHeroData('search_prompts', updated);
  };

  // Chips helpers
  const currentChips: SearchChipItem[] = currentHeroRow.data?.chips || defaultHeroBanner.data?.chips || [];

  const addSearchChip = () => {
    if (!newChipLabel.trim() || !newChipUrl.trim()) {
      showToast('Please provide both a label and a target URL', 'error');
      return;
    }
    handleUpdateHeroData('chips', [...currentChips, { label: newChipLabel.trim(), url: newChipUrl.trim() }]);
    setNewChipLabel('');
    setNewChipUrl('');
  };

  const removeSearchChip = (idx: number) => {
    const updated = currentChips.filter((_, i) => i !== idx);
    handleUpdateHeroData('chips', updated);
  };

  const updateSearchChip = (idx: number, field: 'label' | 'url', val: string) => {
    const updated = [...currentChips];
    updated[idx] = { ...updated[idx], [field]: val };
    handleUpdateHeroData('chips', updated);
  };

  // Welcome card helpers
  const welcomeCard = currentHeroRow.data?.welcome_card || defaultHeroBanner.data?.welcome_card || {};
  const handleUpdateWelcome = (key: string, val: any) => {
    handleUpdateHeroData('welcome_card', {
      ...welcomeCard,
      [key]: val
    });
  };

  return (
    <div className="content-area">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings &amp; Platform Configuration</h1>

        </div>

      </div>

      {/* Subtab Navigation Pills */}
      <div className="subtab-bar" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <button
          className={`subtab-btn btn ${activeSubtab === 'promo' ? 'btn--primary' : 'btn--outline'}`}
          onClick={() => setActiveSubtab('promo')}
        >
          📢 Promo Notice Strip
        </button>
        <button
          className={`subtab-btn btn ${activeSubtab === 'hero' ? 'btn--primary' : 'btn--outline'}`}
          onClick={() => setActiveSubtab('hero')}
        >
          🏠 Homepage Hero Banner
        </button>
        <button
          className={`subtab-btn btn ${activeSubtab === 'brand' ? 'btn--primary' : 'btn--outline'}`}
          onClick={() => setActiveSubtab('brand')}
        >
          🎨 Brand Colors
        </button>
        <button
          className={`subtab-btn btn ${activeSubtab === 'general' ? 'btn--primary' : 'btn--outline'}`}
          onClick={() => setActiveSubtab('general')}
        >
          🌐 Site Info &amp; Disclaimer
        </button>
        <button
          className={`subtab-btn btn ${activeSubtab === 'security' ? 'btn--primary' : 'btn--outline'}`}
          onClick={() => setActiveSubtab('security')}
        >
          🔑 Security &amp; Password
        </button>
      </div>

      {/* 1. PROMO NOTICE STRIP SUBTAB */}
      {activeSubtab === 'promo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Live Mockup */}
          <div className="card" style={{ border: '1px solid var(--line)', background: '#fff' }}>
            <div className="card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="card__title" style={{ fontSize: '1rem' }}>👁️ Top Promo Disclaimer Banner Live Preview</h2>
              <button
                type="button"
                className={`badge ${currentPromoRow.published !== false ? 'badge--success' : 'badge--secondary'}`}
                onClick={() => handleToggleBanner(currentPromoRow.id)}
                style={{ cursor: 'pointer', border: 'none' }}
              >
                {currentPromoRow.published !== false ? '● Live on Public Site' : '○ Banner Hidden'}
              </button>
            </div>
            <div style={{ padding: '1.25rem', background: 'var(--cream)', borderRadius: '0 0 var(--radius-md) var(--radius-md)' }}>
              {currentPromoRow.published !== false ? (
                <div
                  style={{
                    backgroundColor: currentPromoRow.bg_color || '#2B3C56',
                    color: currentPromoRow.text_color || '#ffffff',
                    padding: '0.65rem 1.25rem',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                    fontSize: '0.86rem',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.1rem' }}>🛡️</span>
                    <span>
                      {currentPromoRow.title && <strong>{currentPromoRow.title} </strong>}
                      {currentPromoRow.content}{' '}
                      {currentPromoRow.link_text && (
                        <span style={{ textDecoration: 'underline', fontWeight: 600, color: 'inherit', cursor: 'pointer' }}>
                          {currentPromoRow.link_text}
                        </span>
                      )}
                    </span>
                  </div>
                  {currentPromoRow.data?.show_close !== false && (
                    <button
                      type="button"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'inherit',
                        fontSize: '1.2rem',
                        cursor: 'pointer',
                        padding: '0 4px',
                        lineHeight: 1
                      }}
                      title="Dismiss notice"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ) : (
                <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--ink-3)', fontStyle: 'italic' }}>
                  The promo banner is currently hidden. Toggle status to "Live on Site" to display it on the public site.
                </div>
              )}
            </div>
          </div>

          {/* Form */}
          <div className="card">
            <div className="card__header">
              <h2 className="card__title">Banner Content &amp; Attributes</h2>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '750px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--cream)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <b style={{ color: 'var(--navy)', fontSize: '0.95rem' }}>Enable Top Announcement Banner</b>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-3)', marginTop: '0.2rem' }}>
                    Controls whether this banner appears at the very top of all public pages
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={currentPromoRow.published !== false}
                  onChange={(e) => handleUpdatePromoField('published', e.target.checked)}
                  style={{ width: '22px', height: '22px', cursor: 'pointer' }}
                />
              </div>

              <div className="form-group">
                <label>Bold Prefix Text (`title` column)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Education, not medical advice."
                  value={currentPromoRow.title || ''}
                  onChange={(e) => handleUpdatePromoField('title', e.target.value)}
                />
                <small style={{ color: 'var(--ink-3)', fontSize: '0.78rem' }}>Displayed in bold at the start of the message.</small>
              </div>

              <div className="form-group">
                <label>Notice / Message Text (`content` column)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. In an emergency, call 911."
                  value={currentPromoRow.content || ''}
                  onChange={(e) => handleUpdatePromoField('content', e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Action Link Label (`link_text`)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Learn more"
                    value={currentPromoRow.link_text || ''}
                    onChange={(e) => handleUpdatePromoField('link_text', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Action Link Target URL (`link_url`)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. /medical-disclaimer/"
                    value={currentPromoRow.link_url || ''}
                    onChange={(e) => handleUpdatePromoField('link_url', e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Banner Background Color (`bg_color`)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={currentPromoRow.bg_color || '#2B3C56'}
                      onChange={(e) => handleUpdatePromoField('bg_color', e.target.value)}
                      style={{ width: '40px', height: '36px', padding: 0, cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      value={currentPromoRow.bg_color || '#2B3C56'}
                      onChange={(e) => handleUpdatePromoField('bg_color', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Banner Text Color (`text_color`)</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="color"
                      value={currentPromoRow.text_color || '#ffffff'}
                      onChange={(e) => handleUpdatePromoField('text_color', e.target.value)}
                      style={{ width: '40px', height: '36px', padding: 0, cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      value={currentPromoRow.text_color || '#ffffff'}
                      onChange={(e) => handleUpdatePromoField('text_color', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <input
                  type="checkbox"
                  id="promo_close"
                  checked={currentPromoRow.data?.show_close !== false}
                  onChange={(e) => handleUpdatePromoData('show_close', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="promo_close" style={{ cursor: 'pointer', margin: 0 }}>
                  Show close button (allow visitors to dismiss the notice during their session)
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. HOMEPAGE HERO BANNER SUBTAB */}
      {activeSubtab === 'hero' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Live Mockup */}
          <div className="card" style={{ border: '1px solid var(--line)', background: '#fff' }}>
            <div className="card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 className="card__title" style={{ fontSize: '1rem' }}>👁️ Homepage Hero Banner Live Preview</h2>
              <button
                type="button"
                className={`badge ${currentHeroRow.published !== false ? 'badge--success' : 'badge--secondary'}`}
                onClick={() => handleToggleBanner(currentHeroRow.id)}
                style={{ cursor: 'pointer', border: 'none' }}
              >
                {currentHeroRow.published !== false ? '● Live on Public Site' : '○ Banner Hidden'}
              </button>
            </div>
            <div style={{ padding: '1.5rem', background: '#fdfbf7', borderRadius: '0 0 var(--radius-md) var(--radius-md)' }}>
              {currentHeroRow.published === false && (
                <div style={{ padding: '0.75rem 1rem', background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500 }}>
                  <span>⚠️</span>
                  <span>This Homepage Hero Banner is currently <strong>HIDDEN</strong> from the public site. Visitors will not see this banner. Toggle status above or check the box below to publish it.</span>
                </div>
              )}
              <div style={{ maxWidth: '850px', margin: '0 auto' }}>
                <div style={{ display: 'inline-block', background: '#e2f5e7', color: '#1d5a31', padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.85rem' }}>
                  {currentHeroRow.badge || 'For parents of children 0–7'}
                </div>
                <h1 style={{ fontSize: '1.85rem', color: '#162335', lineHeight: 1.25, margin: '0 0 0.75rem' }}>
                  {currentHeroRow.highlight && currentHeroRow.title?.includes(currentHeroRow.highlight) ? (
                    <>
                      {currentHeroRow.title.split(currentHeroRow.highlight)[0]}
                      <em style={{ fontStyle: 'italic', color: '#2a7c4e' }}>{currentHeroRow.highlight}</em>
                      {currentHeroRow.title.split(currentHeroRow.highlight).slice(1).join(currentHeroRow.highlight)}
                    </>
                  ) : (
                    currentHeroRow.title
                  )}
                </h1>
                <p style={{ color: '#4b5563', fontSize: '1rem', lineHeight: 1.5, margin: '0 0 1.25rem' }}>
                  {currentHeroRow.content}
                </p>

                {/* Simulated search bar */}
                <div style={{ background: '#fff', border: '1px solid #d1d5db', borderRadius: '999px', padding: '0.4rem 0.6rem 0.4rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '1rem' }}>
                  <span style={{ color: '#9ca3af', fontSize: '0.9rem' }}>
                    🔍 {currentPrompts[0] || 'Ask a question or search...'}
                  </span>
                  <button type="button" style={{ background: '#162335', color: '#fff', border: 'none', padding: '0.45rem 1rem', borderRadius: '999px', fontSize: '0.82rem', fontWeight: 600 }}>
                    Find answers →
                  </button>
                </div>

                {/* Search chips */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                  <small style={{ color: '#6b7280', fontSize: '0.78rem' }}>Popular:</small>
                  {currentChips.map((c, i) => (
                    <span key={i} style={{ background: '#f3f4f6', border: '1px solid #e5e7eb', padding: '0.2rem 0.65rem', borderRadius: '999px', fontSize: '0.78rem', color: '#374151' }}>
                      {c.label}
                    </span>
                  ))}
                </div>

                <div style={{ marginTop: '1rem', fontSize: '0.82rem', color: '#6b7280' }}>
                  👥 {currentHeroRow.secondary_text}
                </div>
              </div>
            </div>
          </div>

          {/* Copy Configuration Card */}
          <div className="card">
            <div className="card__header">
              <h2 className="card__title">1. Main Hero Headline &amp; Copy</h2>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '750px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--cream)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <b style={{ color: 'var(--navy)', fontSize: '0.95rem' }}>Enable Homepage Hero Banner</b>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-3)', marginTop: '0.2rem' }}>
                    Controls whether this hero banner section appears on the public homepage
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={currentHeroRow.published !== false}
                  onChange={(e) => handleUpdateHeroField('published', e.target.checked)}
                  style={{ width: '22px', height: '22px', cursor: 'pointer' }}
                />
              </div>

              <div className="form-group">
                <label>Top Pill Badge Text (`badge` column)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. For parents of children 0–7"
                  value={currentHeroRow.badge || ''}
                  onChange={(e) => handleUpdateHeroField('badge', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Hero Headline (`title` column)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Every question about the first seven years, answered by people who know."
                  value={currentHeroRow.title || ''}
                  onChange={(e) => handleUpdateHeroField('title', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Accent / Highlighted Phrase (`highlight` column)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. first seven years"
                  value={currentHeroRow.highlight || ''}
                  onChange={(e) => handleUpdateHeroField('highlight', e.target.value)}
                />
                <small style={{ color: 'var(--ink-3)', fontSize: '0.78rem' }}>
                  Matching words inside the title will be styled in the distinctive green cursive accent font.
                </small>
              </div>

              <div className="form-group">
                <label>Hero Subtitle / Lede Paragraph (`content` column)</label>
                <textarea
                  className="form-control"
                  rows={3}
                  placeholder="Short, reviewed answers from doctors and health experts..."
                  value={currentHeroRow.content || ''}
                  onChange={(e) => handleUpdateHeroField('content', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Trio Presenters Byline (`secondary_text` column)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="With Dr. Murray Clarke, Dr. Bill Sears and Bryce Wylde"
                  value={currentHeroRow.secondary_text || ''}
                  onChange={(e) => handleUpdateHeroField('secondary_text', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Rotating Search Prompts Card */}
          <div className="card">
            <div className="card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="card__title">2. Rotating Search Prompts</h2>
                <small style={{ color: 'var(--ink-3)' }}>
                  Questions that cycle smoothly in the search input every 3.2 seconds
                </small>
              </div>
              <span className="badge badge--primary">{currentPrompts.length} Prompts</span>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '750px' }}>
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Add a new rotating question prompt..."
                  value={newPromptText}
                  onChange={(e) => setNewPromptText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSearchPrompt();
                    }
                  }}
                />
                <button type="button" className="btn btn--primary" onClick={addSearchPrompt}>
                  + Add Prompt
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {currentPrompts.map((prompt, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      background: 'var(--cream)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--line)'
                    }}
                  >
                    <span style={{ color: 'var(--ink-3)', fontSize: '0.8rem', minWidth: '24px' }}>#{idx + 1}</span>
                    <input
                      type="text"
                      className="form-control"
                      value={prompt}
                      onChange={(e) => updateSearchPrompt(idx, e.target.value)}
                      style={{ fontSize: '0.88rem', padding: '0.35rem 0.6rem' }}
                    />
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      style={{ color: 'var(--danger)', padding: '0.35rem 0.6rem' }}
                      onClick={() => removeSearchPrompt(idx)}
                      title="Remove prompt"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Search Chips Card */}
          <div className="card">
            <div className="card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 className="card__title">3. Popular Search Quick Chips</h2>
                <small style={{ color: 'var(--ink-3)' }}>
                  Pill-shaped quick filter buttons displayed below the hero search bar
                </small>
              </div>
              <span className="badge badge--primary">{currentChips.length} Chips</span>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '750px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr auto', gap: '0.6rem' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Chip Label (e.g. First foods)"
                  value={newChipLabel}
                  onChange={(e) => setNewChipLabel(e.target.value)}
                />
                <input
                  type="text"
                  className="form-control"
                  placeholder="Target URL (e.g. /answers/what-should-my-babys-first-food-be/)"
                  value={newChipUrl}
                  onChange={(e) => setNewChipUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSearchChip();
                    }
                  }}
                />
                <button type="button" className="btn btn--primary" onClick={addSearchChip}>
                  + Add Chip
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
                {currentChips.map((chip, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1.5fr auto',
                      alignItems: 'center',
                      gap: '0.6rem',
                      background: 'var(--cream)',
                      padding: '0.5rem 0.75rem',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid var(--line)'
                    }}
                  >
                    <input
                      type="text"
                      className="form-control"
                      value={chip.label}
                      onChange={(e) => updateSearchChip(idx, 'label', e.target.value)}
                      placeholder="Label"
                      style={{ fontSize: '0.88rem', padding: '0.35rem 0.6rem' }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      value={chip.url}
                      onChange={(e) => updateSearchChip(idx, 'url', e.target.value)}
                      placeholder="Target URL"
                      style={{ fontSize: '0.88rem', padding: '0.35rem 0.6rem' }}
                    />
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      style={{ color: 'var(--danger)', padding: '0.35rem 0.6rem' }}
                      onClick={() => removeSearchChip(idx)}
                      title="Remove chip"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel Welcome Video Card */}
          <div className="card">
            <div className="card__header">
              <h2 className="card__title">4. Welcome Card &amp; Video Panel</h2>
            </div>
            <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '750px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--cream)', borderRadius: 'var(--radius-sm)' }}>
                <div>
                  <b style={{ color: 'var(--navy)', fontSize: '0.95rem' }}>Show Welcome Panel on Homepage</b>
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-3)', marginTop: '0.2rem' }}>
                    Displays the featured video card on the right side of the hero section
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={welcomeCard.enabled !== false}
                  onChange={(e) => handleUpdateWelcome('enabled', e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>

              <div className="form-group">
                <label>Welcome Card Title</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Welcome to The First Seven Years"
                  value={welcomeCard.title || ''}
                  onChange={(e) => handleUpdateWelcome('title', e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Welcome Card Subtitle / Speaker Info</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Dr. Murray Clarke & Bryce Wylde on what this library is and how to use it"
                  value={welcomeCard.subtitle || ''}
                  onChange={(e) => handleUpdateWelcome('subtitle', e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label>Card Action Link URL</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="/about/"
                    value={welcomeCard.url || ''}
                    onChange={(e) => handleUpdateWelcome('url', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Cutout / Image URL</label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="/assets/img/dr-murray-clarke-cutout.webp"
                      value={welcomeCard.image || ''}
                      onChange={(e) => handleUpdateWelcome('image', e.target.value)}
                    />
                    <label
                      className="btn btn--outline btn--sm"
                      style={{ cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', margin: 0 }}
                      title="Upload cutout photo"
                    >
                      📁 Upload
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            if (typeof evt.target?.result === 'string') {
                              handleUpdateWelcome('image', evt.target.result);
                              showToast('Cutout photo uploaded successfully!', 'success');
                            }
                          };
                          reader.readAsDataURL(file);
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. BRAND COLORS SUBTAB */}
      {activeSubtab === 'brand' && (
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Palette &amp; Visual Design System</h2>
          </div>
          <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {Object.entries(settings.brand_colors || {}).map(([key, hex]) => (
              <div
                key={key}
                style={{
                  padding: '1rem',
                  border: '1px solid var(--line)',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--cream)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <b style={{ textTransform: 'capitalize', color: 'var(--navy)', fontSize: '0.9rem' }}>
                    {key.replace('_', ' ')}
                  </b>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      background: hex as string,
                      border: '1px solid rgba(0,0,0,0.1)'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <input
                    type="color"
                    value={hex as string}
                    onChange={(e) => handleUpdate('brand_colors', key, e.target.value)}
                    style={{ width: '36px', height: '32px', padding: 0, cursor: 'pointer' }}
                  />
                  <input
                    type="text"
                    className="form-control"
                    value={hex as string}
                    onChange={(e) => handleUpdate('brand_colors', key, e.target.value)}
                    style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. GENERAL WEBSITE METADATA SUBTAB */}
      {activeSubtab === 'general' && (
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">General Website Metadata &amp; Medical Disclaimer</h2>
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: '650px' }}>
            <div className="form-group">
              <label>Website Title</label>
              <input
                type="text"
                className="form-control"
                value={settings.site_title || ''}
                onChange={(e) => handleUpdateDirect('site_title', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Tagline</label>
              <input
                type="text"
                className="form-control"
                value={settings.site_tagline || ''}
                onChange={(e) => handleUpdateDirect('site_tagline', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Canonical Domain URL</label>
              <input
                type="text"
                className="form-control"
                value={settings.canonical_domain || ''}
                onChange={(e) => handleUpdateDirect('canonical_domain', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>YouTube Channel URL</label>
              <input
                type="text"
                className="form-control"
                value={settings.youtube_channel || ''}
                onChange={(e) => handleUpdateDirect('youtube_channel', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Public Contact Email</label>
              <input
                type="email"
                className="form-control"
                value={settings.contact_email || ''}
                onChange={(e) => handleUpdateDirect('contact_email', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Global Educational &amp; Medical Disclaimer</label>
              <RichTextEditor
                value={settings.medical_disclaimer || ''}
                onChange={(html) => handleUpdateDirect('medical_disclaimer', html)}
                placeholder="Enter educational disclaimer applied across all content..."
                minHeight="140px"
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. SECURITY SUBTAB */}
      {activeSubtab === 'security' && (
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Security, 2FA &amp; Session Management</h2>
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: '600px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--cream)', borderRadius: 'var(--radius-sm)' }}>
              <div>
                <b style={{ color: 'var(--navy)' }}>Two-Factor Authentication (2FA)</b>
                <div style={{ fontSize: '0.8rem', color: 'var(--ink-3)' }}>
                  Require authenticator app code on login
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.security?.two_factor_enabled || false}
                onChange={(e) => handleUpdate('security', 'two_factor_enabled', e.target.checked)}
                style={{ width: '20px', height: '20px', cursor: 'pointer' }}
              />
            </div>

            <div className="form-group">
              <label>Session Inactivity Timeout</label>
              <select
                className="form-control"
                value={settings.security?.session_timeout || '30m'}
                onChange={(e) => handleUpdate('security', 'session_timeout', e.target.value)}
              >
                <option value="15m">15 Minutes</option>
                <option value="30m">30 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="4h">4 Hours</option>
              </select>
            </div>

            <div className="form-group">
              <label>Last Master Password Change</label>
              <input
                type="text"
                className="form-control"
                disabled
                value={settings.security?.last_password_change || '2026-10-09'}
              />
            </div>
          </div>
        </div>
      )}

      {/* 7. ORGANIZATION DETAILS SUBTAB */}
      {activeSubtab === 'org' && (
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">Organization &amp; Legal Details</h2>
          </div>
          <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem', maxWidth: '600px' }}>
            <div className="form-group">
              <label>Support Phone</label>
              <input
                type="text"
                className="form-control"
                value={settings.organization?.support_phone || ''}
                onChange={(e) => handleUpdate('organization', 'support_phone', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Office Location</label>
              <input
                type="text"
                className="form-control"
                value={settings.organization?.office_location || ''}
                onChange={(e) => handleUpdate('organization', 'office_location', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Copyright Notice</label>
              <input
                type="text"
                className="form-control"
                value={settings.organization?.copyright_notice || ''}
                onChange={(e) => handleUpdate('organization', 'copyright_notice', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
