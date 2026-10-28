import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { Modal } from '../components/Modal';
import { RichTextEditor } from '../components/RichTextEditor';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { data, saveItem, showToast } = useAdmin();

  // Quick Action Modal states
  const [modalType, setModalType] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});

  const topicsCount = data.topics?.length || 0;
  const answersList = Array.isArray(data.answers)
    ? data.answers
    : Object.values(data.answers || {});
  const answersPublished = answersList.filter((a: any) => a.published).length;
  const answersDraft = answersList.length - answersPublished;
  const videosCount = Array.isArray(data.videos)
    ? data.videos.length
    : Object.keys(data.videos || {}).length;
  const pagesCount = data.pages?.length || 0;
  const subCount = data.ask_submissions?.length || 0;
  const redFlagCount = data.ask_submissions?.filter((s) => s.red_flag).length || 0;

  const handleOpenModal = (type: string) => {
    setModalType(type);
    if (type === 'page') {
      setFormData({
        id: 'pg-' + Date.now(),
        title: '',
        slug: '',
        template: 'Editorial & Standards',
        seo_title: '',
        meta_desc: '',
        published: true
      });
    } else if (type === 'answer') {
      setFormData({
        slug: 'ans-' + Date.now(),
        question: '',
        short_answer: '',
        topic: 'gut-health',
        ages: [0, 1, 2, 3, 4, 5, 6, 7],
        expert: 'dr-murray-clarke',
        reviewed_by: 'Dr. Murray Clarke',
        reviewed_at: new Date().toISOString().split('T')[0],
        published: true
      });
    } else if (type === 'video') {
      setFormData({
        id: 'vid-' + Date.now(),
        youtube_id: '',
        title: '',
        type: 'clip',
        duration: '02:30',
        topic: 'gut-health',
        expert: 'dr-murray-clarke',
        description: '',
        published: true
      });
    } else if (type === 'topic') {
      setFormData({
        slug: '',
        name: '',
        short: '',
        swatch: '#bfe4c6',
        intro: '',
        order: topicsCount + 1,
        published: true,
        ages: [0, 1, 2, 3, 4, 5, 6, 7]
      });
    } else if (type === 'faq') {
      setFormData({
        id: 'faq-' + Date.now(),
        question: '',
        answer: '',
        category: 'General',
        order: (data.faqs?.length || 0) + 1,
        published: true
      });
    }
  };

  const handleSaveModal = () => {
    if (!modalType) return;
    if (modalType === 'page') {
      if (!formData.title || !formData.slug) {
        showToast('Please provide a title and slug', 'error');
        return;
      }
      formData.url = `/${formData.slug}/`;
      saveItem('pages', formData, 'id');
    } else if (modalType === 'answer') {
      if (!formData.question) {
        showToast('Please provide a question', 'error');
        return;
      }
      saveItem('answers', formData, 'slug');
    } else if (modalType === 'video') {
      if (!formData.title || !formData.youtube_id) {
        showToast('Please provide a video title and YouTube ID', 'error');
        return;
      }
      saveItem('videos', formData, 'id');
    } else if (modalType === 'topic') {
      if (!formData.name || !formData.slug) {
        showToast('Please provide a topic name and slug', 'error');
        return;
      }
      saveItem('topics', formData, 'slug');
    } else if (modalType === 'faq') {
      if (!formData.question || !formData.answer) {
        showToast('Please provide a question and answer', 'error');
        return;
      }
      saveItem('faqs', formData, 'id');
    }
    setModalType(null);
  };

  return (
    <div className="content-area">
      <div className="page-header">
        <div>
          <h1 className="page-title">Platform Dashboard</h1>
        </div>
      </div>

      {/* Stat Grid */}
      <div className="stat-grid">
        <div className="stat-card" onClick={() => navigate('/topics')} style={{ cursor: 'pointer' }}>
          <div className="stat-card__head">
            <span>TOPIC MASTER</span>
            <div className="stat-card__icon">🏷️</div>
          </div>
          <div className="stat-card__value">{topicsCount}</div>
          <div className="stat-card__sub">{topicsCount} active topic hubs</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/answers')} style={{ cursor: 'pointer' }}>
          <div className="stat-card__head">
            <span>PARENT Q&amp;A</span>
            <div className="stat-card__icon">💬</div>
          </div>
          <div className="stat-card__value">
            {answersPublished}{' '}
            <small style={{ fontSize: '1rem', color: 'var(--ink-3)' }}>
              / {answersDraft} drafts
            </small>
          </div>
          <div className="stat-card__sub">✓ All clinically reviewed</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/videos')} style={{ cursor: 'pointer' }}>
          <div className="stat-card__head">
            <span>VIDEO LIBRARY</span>
            <div className="stat-card__icon">🎥</div>
          </div>
          <div className="stat-card__value">{videosCount}</div>
          <div className="stat-card__sub">Full episodes &amp; topic clips</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/pages')} style={{ cursor: 'pointer' }}>
          <div className="stat-card__head">
            <span>CONTENT PAGES</span>
            <div className="stat-card__icon">📄</div>
          </div>
          <div className="stat-card__value">{pagesCount}</div>
          <div className="stat-card__sub">About Us, Policies, Legal &amp; Custom</div>
        </div>

        <div className="stat-card" onClick={() => navigate('/submissions')} style={{ cursor: 'pointer' }}>
          <div className="stat-card__head">
            <span>INBOUND QUESTIONS</span>
            <div className="stat-card__icon">🩺</div>
          </div>
          <div className="stat-card__value">{subCount}</div>
          <div className="stat-card__sub">
            {redFlagCount > 0 ? (
              <span style={{ color: 'var(--danger)', fontWeight: 700 }}>
                🚨 {redFlagCount} red-flag alerts
              </span>
            ) : (
              'Zero urgent flags'
            )}
          </div>
        </div>
      </div>

      {/* Split Grid */}
      <div className="dashboard-split-grid">
        {/* Quick Content Actions */}
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">⚡ Quick Content Actions</h2>
          </div>
          <div className="quick-actions-grid">
            <button className="btn btn--outline" onClick={() => handleOpenModal('page')}>
              <span>📄</span> Create New Page
            </button>
            <button className="btn btn--outline" onClick={() => navigate('/pages')}>
              <span>📑</span> Page Management Directory
            </button>
            <button className="btn btn--outline" onClick={() => navigate('/answers/new')}>
              <span>💬</span> Add Question &amp; Answer
            </button>
            <button className="btn btn--outline" onClick={() => navigate('/videos/new')}>
              <span>🎥</span> Add Video Episode / Clip
            </button>
            <button className="btn btn--outline" onClick={() => navigate('/experts/new')}>
              <span>👨‍⚕️</span> Add Expert / Host
            </button>
            <button className="btn btn--outline" onClick={() => handleOpenModal('topic')}>
              <span>🏷️</span> Create New Topic Hub
            </button>
            <button className="btn btn--outline" onClick={() => handleOpenModal('faq')}>
              <span>❓</span> Add FAQ Entry
            </button>
          </div>
        </div>

        {/* Latest Ask the Doctor Inquiries */}
        <div className="card">
          <div className="card__header">
            <h2 className="card__title">🩺 Latest Ask the Doctor Inquiries</h2>
            <button className="btn btn--sm btn--outline" onClick={() => navigate('/submissions')}>
              View All
            </button>
          </div>
          <div style={{ padding: '1rem 1.25rem' }}>
            {(data.ask_submissions || []).slice(0, 3).map((sub) => (
              <div
                key={sub.id}
                style={{
                  padding: '0.75rem 0',
                  borderBottom: '1px solid var(--line-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '0.75rem'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--navy)', fontSize: '0.9rem' }}>
                    {sub.parent_name}{' '}
                    <small style={{ color: 'var(--ink-3)' }}>({sub.child_age})</small>
                  </div>
                  <div style={{ color: 'var(--ink-2)', fontSize: '0.82rem', marginTop: '0.2rem' }}>
                    {sub.question.slice(0, 80)}...
                  </div>
                </div>
                {sub.red_flag ? (
                  <span className="badge badge--redflag">RED FLAG</span>
                ) : (
                  <span className="badge badge--published">NEW</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Action Modal */}
      <Modal
        isOpen={modalType !== null}
        title={
          modalType === 'page'
            ? 'Create New Content Page'
            : modalType === 'answer'
            ? 'Add Parent Q&A'
            : modalType === 'video'
            ? 'Add Video Episode / Clip'
            : modalType === 'topic'
            ? 'Create Topic Hub'
            : 'Add FAQ Entry'
        }
        onClose={() => setModalType(null)}
        onSave={handleSaveModal}
        saveLabel="Create Item"
      >
        {modalType === 'page' && (
          <>
            <div className="form-group">
              <label>Page Title</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Editorial Standards"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>URL Slug</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. editorial-standards"
                value={formData.slug || ''}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Template</label>
              <select
                className="form-control"
                value={formData.template || 'Editorial & Standards'}
                onChange={(e) => setFormData({ ...formData, template: e.target.value })}
              >
                <option value="Editorial & Standards">Editorial &amp; Standards</option>
                <option value="Product / Book Showcase">Product / Book Showcase</option>
                <option value="Legal / Policy">Legal / Policy</option>
                <option value="Custom Content">Custom Content</option>
              </select>
            </div>
          </>
        )}

        {modalType === 'answer' && (
          <>
            <div className="form-group">
              <label>Question Asked by Parents</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Is my child's eczema a gut problem?"
                value={formData.question || ''}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Summary Answer</label>
              <RichTextEditor
                value={formData.short_answer || ''}
                onChange={(html) => setFormData({ ...formData, short_answer: html })}
                placeholder="Short answer for parents..."
                minHeight="140px"
              />
            </div>
            <div className="form-group">
              <label>Primary Topic</label>
              <select
                className="form-control"
                value={formData.topic || 'gut-health'}
                onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              >
                {data.topics?.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        {modalType === 'video' && (
          <>
            <div className="form-group">
              <label>Video Title</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Restoring the Gut After Antibiotics"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>YouTube Video ID or URL</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. wHrPcQPYiaE"
                value={formData.youtube_id || ''}
                onChange={(e) => setFormData({ ...formData, youtube_id: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select
                className="form-control"
                value={formData.type || 'clip'}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="episode">Full Episode</option>
                <option value="clip">Topic Clip</option>
                <option value="short">YouTube Short</option>
              </select>
            </div>
          </>
        )}

        {modalType === 'topic' && (
          <>
            <div className="form-group">
              <label>Topic Name</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. Baby Sleep & Wake Windows"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Slug</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. baby-sleep"
                value={formData.slug || ''}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Accent Swatch Color</label>
              <input
                type="color"
                value={formData.swatch || '#bfe4c6'}
                onChange={(e) => setFormData({ ...formData, swatch: e.target.value })}
                style={{ width: '60px', height: '36px', padding: 0 }}
              />
            </div>
          </>
        )}

        {modalType === 'faq' && (
          <>
            <div className="form-group">
              <label>FAQ Question</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. How are answers medically reviewed?"
                value={formData.question || ''}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Answer</label>
              <RichTextEditor
                value={formData.answer || ''}
                onChange={(html) => setFormData({ ...formData, answer: html })}
                placeholder="Medically reviewed answer..."
                minHeight="140px"
              />
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};
