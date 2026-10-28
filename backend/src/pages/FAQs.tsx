import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Modal } from '../components/Modal';
import { RichTextEditor } from '../components/RichTextEditor';
import { FaqItem } from '../types';

export const FAQs: React.FC = () => {
  const { data, searchQuery, togglePublish, deleteItem, saveItem, showToast, canEdit } = useAdmin();
  const hasEdit = canEdit('faqs');

  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNewFaq, setIsNewFaq] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const faqs = [...(data.faqs || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  const filteredFaqs = faqs.filter((faq) => {
    if (filter === 'published' && !faq.published) return false;
    if (filter === 'draft' && faq.published) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        faq.question.toLowerCase().includes(q) ||
        faq.answer.toLowerCase().includes(q) ||
        faq.category?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenAdd = () => {
    if (!hasEdit) return;
    setIsNewFaq(true);
    setFormErrors({});
    setEditingFaq({
      id: 'faq-' + Date.now(),
      question: '',
      answer: '',
      category: 'General',
      order: faqs.length + 1,
      published: true
    });
    setIsModalOpen(true);
  };

  const handleEdit = (faq: FaqItem) => {
    setIsNewFaq(false);
    setFormErrors({});
    setEditingFaq({ ...faq });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!hasEdit || !editingFaq) return;
    const errs: Record<string, string> = {};
    if (!editingFaq.question?.trim()) {
      errs.question = 'Please provide a FAQ question';
    }
    const cleanAnswer = (editingFaq.answer || '').replace(/<[^>]*>/g, '').trim();
    if (!cleanAnswer && !editingFaq.answer?.trim()) {
      errs.answer = 'Please provide an answer for this FAQ';
    }
    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }
    setFormErrors({});
    saveItem('faqs', { ...editingFaq, question: editingFaq.question.trim() }, 'id');
    setIsModalOpen(false);
    showToast('FAQ saved successfully!', 'success');
  };

  return (
    <div className="content-area">
      {/* 4. FAQ TAB HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">FAQ Management</h1>
        </div>
        {hasEdit && (
          <button className="btn btn--primary" onClick={handleOpenAdd}>
            + Add FAQ
          </button>
        )}
      </div>

      <div className="card">
        <div className="card__header">
          <h2 className="card__title" style={{ margin: 0 }}>General &amp; Clinical FAQs</h2>
          <div className="card__toolbar">
            <div className="filter-pills">
              <button
                className={`filter-pill ${filter === 'all' ? 'is-active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-pill ${filter === 'published' ? 'is-active' : ''}`}
                onClick={() => setFilter('published')}
              >
                Published
              </button>
              <button
                className={`filter-pill ${filter === 'draft' ? 'is-active' : ''}`}
                onClick={() => setFilter('draft')}
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
                <th style={{ width: '130px' }}>CATEGORY</th>
                <th>QUESTION &amp; ANSWER</th>
                <th style={{ width: '80px' }}>ORDER</th>
                <th>STATUS</th>
                <th style={{ width: '90px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaqs.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ink-3)' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>❓</div>
                    <strong style={{ color: 'var(--navy)', fontSize: '1rem' }}>No FAQs found</strong>
                    <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 1rem' }}>No FAQs match the current filter or search query.</p>
                    <button className="btn btn--sm btn--primary" onClick={handleOpenAdd}>+ Add FAQ</button>
                  </td>
                </tr>
              ) : (
                filteredFaqs.map((faq) => (
                  <tr key={faq.id}>
                    <td data-label="Category">
                      <strong>{faq.category}</strong>
                    </td>
                    <td className="table-cell-title">
                      <strong>{faq.question}</strong>
                      <br />
                      <small style={{ color: 'var(--ink-2)' }}>{faq.answer.slice(0, 100)}...</small>
                    </td>
                    <td data-label="Order">
                      <span className="badge" style={{ background: 'var(--cream-deep)', color: 'var(--navy)' }}>
                        #{faq.order || 1}
                      </span>
                    </td>
                    <td data-label="Status">
                      <span
                        className={`badge ${faq.published ? 'badge--published' : 'badge--draft'}`}
                        onClick={() => hasEdit && togglePublish('faqs', 'id', faq.id)}
                        style={{ cursor: hasEdit ? 'pointer' : 'default' }}
                        title={hasEdit ? "Click to toggle publish status" : "View-only access"}
                      >
                        <span className="badge--dot" />
                        {faq.published ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </td>
                    <td className="table-actions-cell" style={{ textAlign: 'right' }}>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        {hasEdit ? (
                          <>
                            <button className="icon-btn" onClick={() => handleEdit(faq)} title="Edit FAQ">
                              ✏️
                            </button>
                            <button
                              className="icon-btn icon-btn--danger"
                              onClick={() => deleteItem('faqs', 'id', faq.id)}
                              title="Delete FAQ"
                            >
                              🗑️
                            </button>
                          </>
                        ) : (
                          <button
                            className="icon-btn"
                            onClick={() => handleEdit(faq)}
                            title="View FAQ Details (Read-only)"
                          >
                            👁️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT / ADD FAQ MODAL */}
      {editingFaq && (
        <Modal
          isOpen={isModalOpen}
          title={isNewFaq ? 'Add FAQ Entry' : (hasEdit ? 'Edit FAQ' : 'View FAQ Entry (Read Only)')}
          subtitle="Configure frequently asked question details, rich answer text, and visibility"
          onClose={() => setIsModalOpen(false)}
          onSave={hasEdit ? handleSave : undefined}
          maxWidth="680px"
        >
          <fieldset disabled={!hasEdit} style={{ border: 'none', padding: 0, margin: 0 }}>
            <div className="form-group">
              <label>Category</label>
              <input
                type="text"
                className="form-control"
                value={editingFaq.category || 'General Questions'}
                placeholder="e.g. Clinical &amp; Medical"
                onChange={(e) => setEditingFaq({ ...editingFaq, category: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>
                Question <span className="req-star">*</span>
              </label>
              <input
                type="text"
                className={`form-control ${formErrors.question ? 'is-invalid' : ''}`}
                value={editingFaq.question}
                placeholder="e.g. What is The First Seven Years?"
                onChange={(e) => {
                  setEditingFaq({ ...editingFaq, question: e.target.value });
                  if (formErrors.question) setFormErrors((prev) => ({ ...prev, question: '' }));
                }}
              />
              {formErrors.question && (
                <div className="field-error-msg">⚠️ {formErrors.question}</div>
              )}
            </div>

            <div className="form-group">
              <label>
                Answer (Rich Formatted) <span className="req-star">*</span>
              </label>
              <div className={formErrors.answer ? 'is-invalid' : ''} style={{ borderRadius: '8px' }}>
                <RichTextEditor
                  value={editingFaq.answer}
                  minHeight={150}
                  placeholder="Enter comprehensive answer, bullet points, recommendations..."
                  onChange={(val) => {
                    setEditingFaq({ ...editingFaq, answer: val });
                    if (formErrors.answer) setFormErrors((prev) => ({ ...prev, answer: '' }));
                  }}
                />
              </div>
              {formErrors.answer && (
                <div className="field-error-msg">⚠️ {formErrors.answer}</div>
              )}
            </div>

            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', alignItems: 'end' }}>
              <div className="form-group">
                <label>Display Order</label>
                <input
                  type="number"
                  className="form-control"
                  value={editingFaq.order || 1}
                  onChange={(e) => setEditingFaq({ ...editingFaq, order: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="form-group" style={{ paddingBottom: '0.45rem' }}>
                <label className="toggle-label" style={{ margin: 0 }}>
                  <input
                    type="checkbox"
                    className="sr-checkbox"
                    checked={editingFaq.published !== false}
                    onChange={(e) => setEditingFaq({ ...editingFaq, published: e.target.checked })}
                  />
                  <span className="toggle-switch"></span>
                  <span>Published on Website</span>
                </label>
              </div>
            </div>
          </fieldset>
        </Modal>
      )}
    </div>
  );
};
