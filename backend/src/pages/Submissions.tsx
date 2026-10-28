import React, { useState } from 'react';
import { useAdmin } from '../context/AdminContext';
import { Modal } from '../components/Modal';
import { RichTextEditor } from '../components/RichTextEditor';
import { SubmissionItem } from '../types';

export const Submissions: React.FC = () => {
  const { data, searchQuery, deleteItem, saveItem, convertSubmissionToAnswer, showToast, canEdit, confirmAction } = useAdmin();
  const hasEdit = canEdit('submissions');

  const [filter, setFilter] = useState<'all' | 'red_flag' | 'new' | 'answered'>('all');
  const [selectedSub, setSelectedSub] = useState<SubmissionItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [newSub, setNewSub] = useState<Partial<SubmissionItem>>({
    parent_name: '',
    email: '',
    child_age: '2 years',
    topic: 'gut-health',
    question: '',
    red_flag: false,
    status: 'New',
    date: new Date().toISOString()
  });

  const submissions = data.ask_submissions || [];

  const filteredSubs = submissions.filter((s) => {
    if (filter === 'red_flag' && !s.red_flag) return false;
    if (filter === 'new' && s.status !== 'New') return false;
    if (filter === 'answered' && s.status !== 'Answered') return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        s.parent_name.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.question.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleOpenDetail = (sub: SubmissionItem) => {
    setSelectedSub({ ...sub });
    setIsDetailOpen(true);
  };

  const handleUpdateStatus = (newStatus: 'New' | 'In Review' | 'Answered' | 'Red Flag Triaged') => {
    if (!selectedSub) return;
    const statusTitles: Record<string, string> = {
      'New': 'Mark Inquiry as New?',
      'In Review': 'Mark Inquiry as In Review?',
      'Answered': 'Mark Inquiry as Answered?',
      'Red Flag Triaged': 'Mark as Red Flag Triaged?'
    };
    const statusIcons: Record<string, string> = {
      'New': '🔄',
      'In Review': '🔍',
      'Answered': '✅',
      'Red Flag Triaged': '🚩'
    };

    confirmAction({
      title: statusTitles[newStatus] || `Update Status to ${newStatus}?`,
      message: `Are you sure you want to change the triage status of this inquiry from "${selectedSub.parent_name}" to "${newStatus}"?`,
      confirmText: `Mark ${newStatus}`,
      cancelText: 'Cancel',
      icon: statusIcons[newStatus] || '📋',
      isDanger: false,
      onConfirm: () => {
        const updated = { ...selectedSub, status: newStatus };
        saveItem('ask_submissions', updated, 'id');
        setSelectedSub(updated);
        showToast(`Updated submission status to "${newStatus}"`, 'success');
      }
    });
  };

  const handleConvertToAnswer = (subId: string) => {
    const parentName = selectedSub?.parent_name || 'this parent';
    confirmAction({
      title: 'Convert to Q&A Answer?',
      message: `Are you sure you want to convert the question from "${parentName}" into a new Q&A Answer entry?`,
      confirmText: 'Convert to Q&A',
      cancelText: 'Cancel',
      icon: '✨',
      isDanger: false,
      onConfirm: () => {
        convertSubmissionToAnswer(subId);
        setIsDetailOpen(false);
      }
    });
  };

  const handleSaveNewSub = () => {
    const errs: Record<string, string> = {};
    if (!newSub.parent_name?.trim()) {
      errs.parent_name = 'Please provide a parent name';
    }
    const cleanQ = (newSub.question || '').replace(/<[^>]*>/g, '').trim();
    if (!cleanQ && !newSub.question?.trim()) {
      errs.question = 'Please provide the parent inquiry question';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    setFormErrors({});
    const itemToSave: SubmissionItem = {
      id: 'sub-' + Date.now(),
      parent_name: newSub.parent_name!.trim(),
      email: (newSub.email || '').trim(),
      child_age: newSub.child_age || '2 years',
      topic: newSub.topic || 'gut-health',
      topics: [newSub.topic || 'gut-health'],
      question: newSub.question || '',
      status: (newSub.status as any) || 'New',
      red_flag: !!newSub.red_flag,
      notes: newSub.notes || '',
      date: newSub.date || new Date().toISOString()
    };
    saveItem('ask_submissions', itemToSave, 'id');
    setIsAddOpen(false);
    showToast('Inbound question added', 'success');
  };

  return (
    <div className="content-area">
      {/* 6. ASK THE DOCTOR INBOX TAB HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Ask the Doctor Submissions</h1>
        </div>
        {hasEdit && (
          <button className="btn btn--primary" onClick={() => setIsAddOpen(true)}>
            + Add Inbound Question
          </button>
        )}
      </div>

      <div className="card">
        <div className="card__header">
          <h2 className="card__title" style={{ margin: 0 }}>Inbound Questions</h2>
          <div className="card__toolbar">
            <div className="filter-pills">
              {(['all', 'red_flag', 'new', 'answered'] as const).map((f) => (
                <button
                  key={f}
                  className={`filter-pill ${filter === f ? 'is-active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all'
                    ? `All (${submissions.length})`
                    : f === 'red_flag'
                    ? '🚨 Red Flags'
                    : f === 'new'
                    ? 'New'
                    : 'Answered'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>PARENT / EMAIL</th>
                <th>CHILD AGE</th>
                <th>TOPIC(S)</th>
                <th>QUESTION</th>
                <th>TRIAGE STATUS</th>
                <th style={{ width: '150px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ink-3)' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>📥</div>
                    <strong style={{ color: 'var(--navy)', fontSize: '1rem' }}>No submissions found</strong>
                    <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 1rem' }}>No parent inquiries match the current filter or search query.</p>
                  </td>
                </tr>
              ) : (
                filteredSubs.map((sub) => {
                  const topicList = Array.isArray(sub.topics) && sub.topics.length > 0
                    ? sub.topics
                    : (sub.topic ? [sub.topic] : []);

                  return (
                    <tr key={sub.id} style={{ background: sub.red_flag ? 'var(--danger-soft)' : undefined }}>
                      <td className="table-cell-title">
                        <strong>{sub.parent_name}</strong>
                        <br />
                        <small style={{ color: 'var(--ink-3)' }}>{sub.email}</small>
                      </td>
                      <td data-label="Child Age">
                        <span className="badge" style={{ background: 'var(--cream-deep)', color: 'var(--navy)' }}>
                          {sub.child_age}
                        </span>
                      </td>
                      <td data-label="Topic(s)">
                        <div style={{ display: 'flex', gap: '0.3rem', flexWrap: 'wrap', maxWidth: '220px' }}>
                          {topicList.length > 0 ? (
                            topicList.map((tSlug) => {
                              const topicObj = (data.topics || []).find((t) => t.slug === tSlug);
                              return (
                                <span key={tSlug} className="badge badge--topic-chip" style={{ marginBottom: '2px' }}>
                                  {topicObj ? topicObj.name : tSlug}
                                </span>
                              );
                            })
                          ) : (
                            <span style={{ color: 'var(--ink-3)', fontSize: '0.8rem' }}>None</span>
                          )}
                        </div>
                      </td>
                      <td data-label="Question">
                        <div style={{ maxWidth: '350px' }}>
                          <p style={{ fontSize: '0.85rem', margin: 0 }}>{sub.question}</p>
                          {sub.notes && <small style={{ color: 'var(--danger)', display: 'block', marginTop: '2px' }}>⚠️ {sub.notes}</small>}
                        </div>
                      </td>
                      <td data-label="Triage Status">
                        {sub.red_flag ? (
                          <span className="badge badge--redflag">Red Flag Alert</span>
                        ) : (
                          <span className="badge badge--published">{sub.status || 'New'}</span>
                        )}
                      </td>
                      <td className="table-actions-cell" style={{ textAlign: 'right' }}>
                        <div className="table-actions" style={{ display: 'flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                          {hasEdit ? (
                            <>
                              <button
                                className="icon-btn"
                                onClick={() => handleOpenDetail(sub)}
                                title="Edit Topics & Details"
                              >
                                ✏️
                              </button>
                              <button
                                className="icon-btn icon-btn--danger"
                                onClick={() => deleteItem('ask_submissions', 'id', sub.id)}
                                title="Delete Submission"
                              >
                                🗑️
                              </button>
                            </>
                          ) : (
                            <button
                              className="icon-btn"
                              onClick={() => handleOpenDetail(sub)}
                              title="View Submission Details"
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

      {/* Detail / Review Modal */}
      {selectedSub && (
        <Modal
          isOpen={isDetailOpen}
          title={!hasEdit ? `Inbound Inquiry: ${selectedSub.parent_name} (Read Only)` : `Inbound Inquiry: ${selectedSub.parent_name}`}
          onClose={() => setIsDetailOpen(false)}
          onSave={hasEdit ? () => {
            saveItem('ask_submissions', selectedSub, 'id');
            setIsDetailOpen(false);
          } : undefined}
        >
          <fieldset disabled={!hasEdit} style={{ border: 'none', margin: 0, padding: 0 }}>
            <div style={{ padding: '0.75rem', background: selectedSub.red_flag ? 'var(--danger-soft)' : 'var(--cream)', borderRadius: 'var(--radius-sm)', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong>{selectedSub.parent_name}</strong> &bull; {selectedSub.email}
                  <div style={{ fontSize: '0.8rem', color: 'var(--ink-3)' }}>
                    Child Age: {selectedSub.child_age} &bull; Received: {new Date(selectedSub.date).toLocaleDateString()}
                  </div>
                </div>
                {selectedSub.red_flag && <span className="badge badge--redflag">🚨 Urgent Red Flag</span>}
              </div>
            </div>

            <div className="form-group">
              <label>Question Content</label>
              <RichTextEditor
                value={selectedSub.question}
                minHeight={140}
                placeholder="Parent question content..."
                onChange={(val) => setSelectedSub({ ...selectedSub, question: val })}
              />
            </div>

            <div className="form-group">
              <label>Internal Triage Notes</label>
              <RichTextEditor
                value={selectedSub.notes || ''}
                minHeight={110}
                placeholder="Add pediatric review or triage observations..."
                onChange={(val) => setSelectedSub({ ...selectedSub, notes: val })}
              />
            </div>

            {hasEdit && (
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn--sm btn--outline"
                  onClick={() => handleUpdateStatus('New')}
                >
                  Mark New
                </button>
                <button
                  type="button"
                  className="btn btn--sm btn--outline"
                  onClick={() => handleUpdateStatus('In Review')}
                >
                  Mark In Review
                </button>
                <button
                  type="button"
                  className="btn btn--sm btn--primary"
                  onClick={() => handleUpdateStatus('Answered')}
                >
                  Mark Answered
                </button>
                <button
                  type="button"
                  className="btn btn--sm btn--mint"
                  onClick={() => handleConvertToAnswer(selectedSub.id)}
                >
                  ✨ Convert to Q&amp;A
                </button>
              </div>
            )}
          </fieldset>
        </Modal>
      )}

      {/* Add Inbound Modal */}
      {isAddOpen && (
        <Modal
          isOpen={isAddOpen}
          title="Add Inbound Parent Question"
          onClose={() => setIsAddOpen(false)}
          onSave={handleSaveNewSub}
        >
          <div className="form-group">
            <label>
              Parent Name <span style={{ color: 'var(--danger)', fontWeight: 700 }}>*</span>
            </label>
            <input
              type="text"
              className={`form-control ${formErrors.parent_name ? 'is-invalid' : ''}`}
              value={newSub.parent_name}
              onChange={(e) => {
                setNewSub({ ...newSub, parent_name: e.target.value });
                if (formErrors.parent_name) setFormErrors((prev) => ({ ...prev, parent_name: '' }));
              }}
              placeholder="e.g. Jessica M."
            />
            {formErrors.parent_name && (
              <div className="field-error-msg">⚠️ {formErrors.parent_name}</div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                className="form-control"
                value={newSub.email}
                onChange={(e) => setNewSub({ ...newSub, email: e.target.value })}
                placeholder="parent@example.com"
              />
            </div>

            <div className="form-group">
              <label>Child Age</label>
              <input
                type="text"
                className="form-control"
                value={newSub.child_age}
                onChange={(e) => setNewSub({ ...newSub, child_age: e.target.value })}
                placeholder="e.g. 18 months"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Topic</label>
            <select
              className="form-control"
              value={newSub.topic}
              onChange={(e) => setNewSub({ ...newSub, topic: e.target.value })}
            >
              {data.topics?.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>
              Question Inquiry <span style={{ color: 'var(--danger)', fontWeight: 700 }}>*</span>
            </label>
            <div className={formErrors.question ? 'is-invalid' : ''} style={{ borderRadius: '8px' }}>
              <RichTextEditor
                value={newSub.question || ''}
                minHeight={130}
                placeholder="Enter parent inquiry..."
                onChange={(val) => {
                  setNewSub({ ...newSub, question: val });
                  if (formErrors.question) setFormErrors((prev) => ({ ...prev, question: '' }));
                }}
              />
            </div>
            {formErrors.question && (
              <div className="field-error-msg">⚠️ {formErrors.question}</div>
            )}
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="sub-redflag"
              checked={newSub.red_flag}
              onChange={(e) => setNewSub({ ...newSub, red_flag: e.target.checked })}
            />
            <label htmlFor="sub-redflag" style={{ margin: 0, cursor: 'pointer', color: 'var(--danger)', fontWeight: 600 }}>
              🚨 Flag as urgent clinical red flag
            </label>
          </div>
        </Modal>
      )}
    </div>
  );
};
