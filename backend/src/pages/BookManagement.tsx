import React, { useState, useEffect } from 'react';
import { useAdmin } from '../context/AdminContext';
import { api } from '../api/client';
import { RichTextEditor } from '../components/RichTextEditor';

interface WaitlistSubscriber {
  id: string;
  email: string;
  date: string;
  name?: string;
  book_id?: string;
  book_title?: string;
}

export interface BookData {
  id?: string;
  slug?: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  author: string;
  author_role?: string;
  author_image?: string;
  approver1_name?: string;
  approver1_role?: string;
  approver1_image?: string;
  approver2_name?: string;
  approver2_role?: string;
  approver2_image?: string;
  approved_by: string;
  description: string;
  note: string;
  status: string;
  publisher: string;
  published: boolean;
  is_featured?: boolean;
  order?: number;
  cover_type: string;
  cover_image: string;
  preorder_url: string;
  topics?: string[];
  waitlist_subscribers?: WaitlistSubscriber[];
}

const EMPTY_BOOK: BookData = {
  title: '',
  subtitle: '',
  eyebrow: 'The book · publication details to come',
  author: 'Bryce Wylde',
  author_role: 'Co-host · Functional medicine',
  author_image: '',
  approver1_name: 'Dr. Bill Sears',
  approver1_role: 'Pediatrician · Author · Featured expert',
  approver1_image: '/assets/img/dr-bill-sears.jpg',
  approver2_name: 'Dr. Murray Clarke',
  approver2_role: 'Host · The First Seven Years',
  approver2_image: '/assets/img/dr-murray-clarke.jpg',
  approved_by: 'Dr. Bill Sears & Dr. Murray Clarke',
  description: '',
  note: 'Cover concept for the website only — final cover and title come from the publisher.',
  status: 'In Production',
  publisher: 'Details to be announced',
  published: true,
  is_featured: false,
  order: 0,
  cover_type: 'concept',
  cover_image: '',
  preorder_url: '',
  topics: [],
  waitlist_subscribers: [],
};

export const BookManagement: React.FC = () => {
  const { showToast, confirmAction, canEdit, data } = useAdmin();
  const hasEdit = canEdit('book');

  const [books, setBooks] = useState<BookData[]>([]);
  const [selectedBook, setSelectedBook] = useState<BookData>({
    id: 'book-the-first-seven-years',
    title: 'The First Seven Years',
    subtitle: 'The First Seven Years, in print.',
    eyebrow: 'The book · publication details to come',
    author: 'Bryce Wylde',
    author_role: 'Co-host · Functional medicine',
    author_image: '',
    approver1_name: 'Dr. Bill Sears',
    approver1_role: 'Pediatrician · Author · Featured expert',
    approver1_image: '/assets/img/dr-bill-sears.jpg',
    approver2_name: 'Dr. Murray Clarke',
    approver2_role: 'Host · The First Seven Years',
    approver2_image: '/assets/img/dr-murray-clarke.jpg',
    approved_by: 'Dr. Bill Sears & Dr. Murray Clarke',
    description:
      'Written by Bryce Wylde and approved by Dr. Bill Sears and Dr. Murray Clarke. This site will be its living companion — updated answers, expert videos and references for every topic the book covers.',
    note: 'Cover concept for the website only — final cover and title come from the publisher.',
    status: 'In Production',
    publisher: 'Details to be announced',
    published: true,
    is_featured: true,
    order: 1,
    cover_type: 'concept',
    cover_image: '',
    preorder_url: '',
    topics: [],
    waitlist_subscribers: [],
  });

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [subSearch, setSubSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [activeTab, setActiveTab] = useState<'editor' | 'waitlist'>('editor');
  const [coverPreviewMode, setCoverPreviewMode] = useState<'auto' | 'concept' | 'custom'>('auto');
  const [topicSearch, setTopicSearch] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Load books and waitlist from MySQL API
  const loadBooks = async () => {
    try {
      setLoading(true);
      const res = await api.get('/book');
      if (res.data?.success) {
        if (Array.isArray(res.data.books) && res.data.books.length > 0) {
          setBooks(res.data.books);
          const primary = res.data.books.find((b: BookData) => b.is_featured) || res.data.books[0];
          setSelectedBook(primary);
        } else if (res.data.book) {
          setBooks([res.data.book]);
          setSelectedBook(res.data.book);
        }
      }
    } catch (err: any) {
      console.error('Failed to load books from database:', err);
      showToast('Could not load books from database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBooks();
  }, []);

  // Update field on currently edited book
  const handleFieldChange = (field: keyof BookData, value: any) => {
    if (formErrors[field as string]) {
      setFormErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
    setSelectedBook((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Image Upload handler using FileReader for base64 data URLs
  const handleImageUpload = (
    field: 'cover_image' | 'author_image' | 'approver1_image' | 'approver2_image',
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setSelectedBook((prev) => ({
        ...prev,
        [field]: dataUrl,
      }));
      showToast('Image uploaded successfully!', 'success');
    };
    reader.readAsDataURL(file);
  };

  // Save changes to database (Update in MySQL)
  const handleSaveBook = async () => {
    const errs: Record<string, string> = {};
    if (!selectedBook.title || !selectedBook.title.trim()) {
      errs.title = 'Please provide a book title';
    }
    if (!selectedBook.author || !selectedBook.author.trim()) {
      errs.author = 'Please provide an author name';
    }

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    try {
      setIsSaving(true);
      const targetId = selectedBook.id;
      const res = await api.put(targetId ? `/book/${targetId}` : '/book', selectedBook);

      if (res.data?.success) {
        showToast('Book details updated successfully in database!', 'success');
        if (res.data.book) {
          setSelectedBook(res.data.book);
        }
        await loadBooks();
      } else {
        showToast(res.data?.message || 'Error saving book details', 'error');
      }
    } catch (err: any) {
      console.error('Error saving book details:', err);
      showToast(err.response?.data?.message || 'Failed to save book details to database', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Quick toggle publish state directly in database
  const handleTogglePublish = async (b: BookData) => {
    if (!hasEdit || !b.id) return;
    const willPublish = !b.published;
    confirmAction({
      title: willPublish ? 'Publish Book on Website?' : 'Change Book to Draft Status?',
      message: willPublish
        ? `Are you sure you want to publish "${b.title}"? It will become visible on the public website and catalog.`
        : `Are you sure you want to change "${b.title}" back to Draft? It will be hidden from the public website.`,
      confirmText: willPublish ? 'Publish Book' : 'Move to Draft',
      cancelText: 'Cancel',
      icon: willPublish ? '🌐' : '📝',
      isDanger: !willPublish,
      onConfirm: async () => {
        try {
          const updated = { ...b, published: !b.published };
          const res = await api.put(`/book/${b.id}`, { published: !b.published });
          if (res.data?.success) {
            showToast(`Book ${updated.published ? 'Published' : 'Unpublished'}`, 'info');
            setBooks((prev) => prev.map((item) => (item.id === b.id ? { ...item, published: !b.published } : item)));
            if (selectedBook.id === b.id) {
              setSelectedBook((prev) => ({ ...prev, published: !prev.published }));
            }
          }
        } catch (err: any) {
          showToast('Failed to update publish state in database', 'error');
        }
      }
    });
  };

  // Delete book from database
  const handleDeleteBook = (b: BookData) => {
    if (!b.id) return;
    confirmAction({
      title: 'Delete Book?',
      message: `Are you sure you want to permanently delete "${b.title}" from the database? All linked waitlist entries will also be removed.`,
      confirmText: 'Delete Book',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await api.delete(`/book/${b.id}`);
          if (res.data?.success) {
            showToast('Book deleted from database', 'info');
            await loadBooks();
            if (selectedBook.id === b.id) {
              const remaining = books.filter((x) => x.id !== b.id);
              if (remaining.length > 0) {
                setSelectedBook(remaining[0]);
              }
            }
          }
        } catch (err: any) {
          showToast(err.response?.data?.message || 'Failed to delete book from database', 'error');
        }
      },
    });
  };

  // Add subscriber to database
  const handleAddSubscriber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newEmail.includes('@')) {
      showToast('Please enter a valid email address', 'error');
      return;
    }

    try {
      const res = await api.post('/book/waitlist', {
        email: newEmail.trim(),
        book_id: selectedBook.id,
      });
      if (res.data?.success) {
        showToast(res.data.message || 'Subscriber added to database!', 'success');
        setNewEmail('');
        await loadBooks();
      } else {
        showToast(res.data?.message || 'Failed to add subscriber', 'error');
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Error adding subscriber to database', 'error');
    }
  };

  // Delete subscriber from database
  const handleDeleteSubscriber = (subId: string, email: string) => {
    confirmAction({
      title: 'Remove Waitlist Subscriber?',
      message: `Are you sure you want to remove ${email} from the book waitlist?`,
      confirmText: 'Remove Subscriber',
      isDanger: true,
      onConfirm: async () => {
        try {
          const res = await api.delete(`/book/waitlist/${subId}`);
          if (res.data?.success) {
            showToast('Subscriber removed from database waitlist', 'info');
            await loadBooks();
          }
        } catch (err: any) {
          showToast(err.response?.data?.message || 'Error removing subscriber from database', 'error');
        }
      },
    });
  };

  // Export waitlist to CSV
  const handleExportCSV = () => {
    const list = allSubscribers;
    if (list.length === 0) {
      showToast('No subscribers to export', 'info');

      return;
    }

    const headers = 'ID,Email,Book,Date Joined\n';
    const rows = list
      .map(
        (s) =>
          `"${s.id}","${s.email}","${s.book_title || selectedBook.title}","${new Date(s.date).toLocaleString()}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `book-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported subscribers CSV!', 'success');
  };

  const allSubscribers: WaitlistSubscriber[] = books.flatMap((b) =>
    (b.waitlist_subscribers || []).map((s) => ({
      ...s,
      book_title: b.title,
    }))
  );

  const filteredSubscribers = allSubscribers.filter((s) =>
    s.email.toLowerCase().includes(subSearch.toLowerCase())
  );

  const filteredBooks = books.filter((b) => {
    if (!bookSearch) return true;
    const q = bookSearch.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      (b.author && b.author.toLowerCase().includes(q)) ||
      (b.status && b.status.toLowerCase().includes(q))
    );
  });

  const shouldShowCustomCover =
    coverPreviewMode === 'custom' || (coverPreviewMode === 'auto' && Boolean(selectedBook.cover_image));

  const rawTopics = data?.topics || [];
  const availableTopics = [...rawTopics].sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

  const answersList: any[] = Array.isArray(data?.answers)
    ? data.answers
    : Object.values(data?.answers || {});
  const rawVideos = (data as any)?.episodes || data?.videos || [];
  const videosList: any[] = Array.isArray(rawVideos)
    ? rawVideos
    : Object.values(rawVideos || {});

  const handleToggleTopic = (topicSlug: string) => {
    setSelectedBook((prev) => {
      const current = Array.isArray(prev.topics) ? prev.topics : [];
      const next = current.includes(topicSlug)
        ? current.filter((s) => s !== topicSlug)
        : [...current, topicSlug];
      return { ...prev, topics: next };
    });
  };

  const handleSelectAllTopics = () => {
    setSelectedBook((prev) => ({
      ...prev,
      topics: availableTopics.map((t: any) => t.slug),
    }));
  };

  const handleDeselectAllTopics = () => {
    setSelectedBook((prev) => ({
      ...prev,
      topics: [],
    }));
  };

  const handleResetDefaultTopics = () => {
    setSelectedBook((prev) => ({
      ...prev,
      topics: ['gut-health', 'first-foods', 'picky-eating', 'skin-eczema', 'supplements', 'omega-3s'],
    }));
  };

  const filteredAvailableTopics = availableTopics.filter((t: any) => {
    if (!topicSearch) return true;
    const q = topicSearch.toLowerCase().trim();
    return (
      (t.name && t.name.toLowerCase().includes(q)) ||
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.slug && t.slug.toLowerCase().includes(q)) ||
      (t.short && t.short.toLowerCase().includes(q))
    );
  });

  return (
    <div className="content-area">
      {/* Page Header */}
      <div className="page-header" style={{ marginBottom: '1.25rem', alignItems: 'center' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', color: '#64748b', marginBottom: '0.35rem' }}>
            <span>Dashboard</span>
            <span>/</span>
            <span style={{ color: '#1e293b', fontWeight: 600 }}>The Book</span>
          </div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.65rem' }}>The Companion Book</h1>
          <p className="page-subtitle" style={{ color: '#64748b', marginTop: '0.25rem' }}>
            Manage book editorial details, author & medical reviewer credentials, companion topic hubs, and parent waitlist.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <a
            href="http://localhost:3000/book"
            target="_blank"
            rel="noreferrer"
            className="btn btn--outline"
            style={{
              padding: '0.65rem 1.15rem',
              fontSize: '0.9rem',
              fontWeight: 600,
              borderRadius: '8px',
              border: '1.5px solid #cbd5e1',
              background: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <span>↗</span> View Live Page
          </a>
          {hasEdit && (
            <button
              type="button"
              className="btn btn--primary"
              style={{
                padding: '0.65rem 1.4rem',
                fontSize: '0.92rem',
                fontWeight: 700,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(43, 60, 86, 0.18)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
              onClick={handleSaveBook}
              disabled={isSaving || loading}
            >
              {isSaving ? 'Saving...' : '💾 Save Changes'}
            </button>
          )}
        </div>
      </div>

      {/* Tabs navigation pill switcher */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #e2e8f0', paddingBottom: '0.75rem' }}>
        <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('editor')}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              background: activeTab === 'editor' ? '#ffffff' : 'transparent',
              color: activeTab === 'editor' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'editor' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>📖</span> Editorial & Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('waitlist')}
            style={{
              padding: '0.55rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              fontWeight: 600,
              fontSize: '0.88rem',
              cursor: 'pointer',
              background: activeTab === 'waitlist' ? '#ffffff' : 'transparent',
              color: activeTab === 'waitlist' ? '#0f172a' : '#64748b',
              boxShadow: activeTab === 'waitlist' ? '0 1px 4px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}
          >
            <span>👥</span> Waitlist Subscribers
            <span
              style={{
                background: activeTab === 'waitlist' ? '#2b3c56' : '#cbd5e1',
                color: activeTab === 'waitlist' ? '#ffffff' : '#334155',
                fontSize: '0.75rem',
                padding: '1px 7px',
                borderRadius: '10px',
                fontWeight: 700,
              }}
            >
              {allSubscribers.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: BOOK DETAILS & EDITOR */}
      {activeTab === 'editor' && (
        <div className="fluent-grid">
          {/* Main Book Editor Column */}
          <div className="fluent-main">
            {/* 1. Core Book Identity Card */}
            <div className="fluent-card">
              <div className="fluent-card__header">
                <div className="fluent-card__header-left">
                  <h2 className="fluent-card__title">
                    <span>📖</span> Book Identity & Headline
                  </h2>
                </div>
                <span
                  style={{
                    fontSize: '0.75rem',
                    color: '#64748b',
                    background: '#f8fafc',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    border: '1px solid #e2e8f0',
                    fontFamily: 'monospace',
                  }}
                >
                  ID: {selectedBook.id || 'N/A'}
                </span>
              </div>

              <div className="fluent-card__body">
                <div className="fluent-field">
                  <label className="fluent-label">
                    <span>
                      Book Title <span className="req-star">*</span>
                    </span>
                  </label>
                  <input
                    type="text"
                    className={`fluent-input fluent-input--lg ${formErrors.title ? 'is-invalid' : ''}`}
                    value={selectedBook.title}
                    onChange={(e) => handleFieldChange('title', e.target.value)}
                    placeholder="e.g. The First Seven Years"
                    required
                  />
                  {formErrors.title && <div className="field-error-msg">⚠️ {formErrors.title}</div>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="fluent-field">
                    <label className="fluent-label">
                      <span>Subtitle / Homepage Headline</span>
                    </label>
                    <input
                      type="text"
                      className="fluent-input"
                      value={selectedBook.subtitle}
                      onChange={(e) => handleFieldChange('subtitle', e.target.value)}
                      placeholder="e.g. The First Seven Years, in print."
                    />
                  </div>

                  <div className="fluent-field">
                    <label className="fluent-label">
                      <span>Eyebrow Tagline</span>
                    </label>
                    <input
                      type="text"
                      className="fluent-input"
                      value={selectedBook.eyebrow}
                      onChange={(e) => handleFieldChange('eyebrow', e.target.value)}
                      placeholder="e.g. The book · publication details to come"
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="fluent-field">
                    <label className="fluent-label">
                      <span>Publisher Information</span>
                    </label>
                    <input
                      type="text"
                      className="fluent-input"
                      value={selectedBook.publisher}
                      onChange={(e) => handleFieldChange('publisher', e.target.value)}
                      placeholder="e.g. Details to be announced"
                    />
                  </div>

                  <div className="fluent-field">
                    <label className="fluent-label">
                      <span>Pre-order or Purchase URL (optional)</span>
                    </label>
                    <input
                      type="url"
                      className="fluent-input"
                      value={selectedBook.preorder_url || ''}
                      onChange={(e) => handleFieldChange('preorder_url', e.target.value)}
                      placeholder="https://amazon.com/... or retailer link"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Editorial Lede & Description Card */}
            <div className="fluent-card">
              <div className="fluent-card__header">
                <div className="fluent-card__header-left">
                  <h2 className="fluent-card__title">
                    <span>✍️</span> Editorial Summary & Overview
                  </h2>
                </div>
              </div>

              <div className="fluent-card__body">
                <div className="fluent-field">
                  <label className="fluent-label">
                    <span>Book Description / Editorial Lede</span>
                  </label>
                  <RichTextEditor
                    value={selectedBook.description || ''}
                    minHeight={180}
                    placeholder="Enter the primary summary and editorial overview of the book..."
                    onChange={(val) => handleFieldChange('description', val)}
                  />
                </div>

                <div className="fluent-field">
                  <label className="fluent-label">
                    <span>Cover Disclaimer Note</span>
                  </label>
                  <input
                    type="text"
                    className="fluent-input"
                    value={selectedBook.note}
                    onChange={(e) => handleFieldChange('note', e.target.value)}
                    placeholder="Cover concept for the website only — final cover and title come from the publisher."
                  />
                </div>
              </div>
            </div>

            {/* 3. The People Behind the Book Card (Author & Approvers) */}
            <div className="fluent-card">
              <div className="fluent-card__header">
                <div className="fluent-card__header-left">
                  <h2 className="fluent-card__title">
                    <span>👥</span> The People Behind the Book
                  </h2>
                  <p className="fluent-card__subtitle">
                    Lead book author and medical specialists who approved the clinical recommendations.
                  </p>
                </div>
              </div>

              <div className="fluent-card__body">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    gap: '1.25rem',
                  }}
                >
                  {/* 1. Author: Bryce Wylde */}
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '1.25rem',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      {selectedBook.author_image ? (
                        <img
                          src={selectedBook.author_image}
                          alt="Author"
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                            border: '2px solid #ffffff',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '50%',
                            background: '#fbe7ac',
                            color: '#7a4b04',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            border: '2px solid #ffffff',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                          }}
                        >
                          BW
                        </div>
                      )}
                      <div>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            color: '#2b3c56',
                          }}
                        >
                          Lead Author
                        </div>
                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                          {selectedBook.author || 'Bryce Wylde'}
                        </strong>
                      </div>
                    </div>

                    <div className="fluent-field">
                      <label className="fluent-label" style={{ fontSize: '0.8rem' }}>
                        <span>
                          Author Name <span className="req-star">*</span>
                        </span>
                      </label>
                      <input
                        type="text"
                        className={`fluent-input ${formErrors.author ? 'is-invalid' : ''}`}
                        value={selectedBook.author}
                        onChange={(e) => handleFieldChange('author', e.target.value)}
                        placeholder="e.g. Bryce Wylde"
                        required
                      />
                      {formErrors.author && <div className="field-error-msg">⚠️ {formErrors.author}</div>}
                    </div>

                    <div className="fluent-field">
                      <label className="fluent-label" style={{ fontSize: '0.8rem' }}>
                        <span>Role / Tagline</span>
                      </label>
                      <input
                        type="text"
                        className="fluent-input"
                        value={selectedBook.author_role || 'Co-host · Functional medicine'}
                        onChange={(e) => handleFieldChange('author_role', e.target.value)}
                        placeholder="e.g. Co-host · Functional medicine"
                      />
                    </div>

                    <div>
                      <input
                        type="file"
                        id="author-photo-upload"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageUpload('author_image', e)}
                      />
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem' }}
                          onClick={() => document.getElementById('author-photo-upload')?.click()}
                        >
                          📷 {selectedBook.author_image ? 'Change Photo' : 'Upload Photo'}
                        </button>
                        {selectedBook.author_image && (
                          <button
                            type="button"
                            className="btn btn--outline btn--sm"
                            style={{ color: '#dc2626', borderColor: '#fca5a5', padding: '0.4rem 0.6rem' }}
                            onClick={() => handleFieldChange('author_image', '')}
                            title="Remove photo"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 2. Approver 1: Dr. Bill Sears */}
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '1.25rem',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <img
                        src={selectedBook.approver1_image || '/assets/img/dr-bill-sears.jpg'}
                        alt="Dr. Bill Sears"
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                          border: '2px solid #ffffff',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/img/dr-bill-sears.jpg';
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            color: '#15803d',
                          }}
                        >
                          Medical Approver #1
                        </div>
                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                          {selectedBook.approver1_name || 'Dr. Bill Sears'}
                        </strong>
                      </div>
                    </div>

                    <div className="fluent-field">
                      <label className="fluent-label" style={{ fontSize: '0.8rem' }}>
                        <span>Approver 1 Name</span>
                      </label>
                      <input
                        type="text"
                        className="fluent-input"
                        value={selectedBook.approver1_name || 'Dr. Bill Sears'}
                        onChange={(e) => handleFieldChange('approver1_name', e.target.value)}
                        placeholder="e.g. Dr. Bill Sears"
                      />
                    </div>

                    <div className="fluent-field">
                      <label className="fluent-label" style={{ fontSize: '0.8rem' }}>
                        <span>Role / Specialization</span>
                      </label>
                      <input
                        type="text"
                        className="fluent-input"
                        value={selectedBook.approver1_role || 'Pediatrician · Author · Featured expert'}
                        onChange={(e) => handleFieldChange('approver1_role', e.target.value)}
                        placeholder="e.g. Pediatrician · Author"
                      />
                    </div>

                    <div>
                      <input
                        type="file"
                        id="approver1-photo-upload"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageUpload('approver1_image', e)}
                      />
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem' }}
                          onClick={() => document.getElementById('approver1-photo-upload')?.click()}
                        >
                          📷 {selectedBook.approver1_image ? 'Change Photo' : 'Upload Photo'}
                        </button>
                        {selectedBook.approver1_image && (
                          <button
                            type="button"
                            className="btn btn--outline btn--sm"
                            style={{ color: '#dc2626', borderColor: '#fca5a5', padding: '0.4rem 0.6rem' }}
                            onClick={() => handleFieldChange('approver1_image', '')}
                            title="Remove photo"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 3. Approver 2: Dr. Murray Clarke */}
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '1.25rem',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <img
                        src={selectedBook.approver2_image || '/assets/img/dr-murray-clarke.jpg'}
                        alt="Dr. Murray Clarke"
                        style={{
                          width: '56px',
                          height: '56px',
                          borderRadius: '50%',
                          objectFit: 'cover',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                          border: '2px solid #ffffff',
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/img/dr-murray-clarke.jpg';
                        }}
                      />
                      <div>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            color: '#15803d',
                          }}
                        >
                          Medical Approver #2
                        </div>
                        <strong style={{ fontSize: '0.95rem', color: '#0f172a' }}>
                          {selectedBook.approver2_name || 'Dr. Murray Clarke'}
                        </strong>
                      </div>
                    </div>

                    <div className="fluent-field">
                      <label className="fluent-label" style={{ fontSize: '0.8rem' }}>
                        <span>Approver 2 Name</span>
                      </label>
                      <input
                        type="text"
                        className="fluent-input"
                        value={selectedBook.approver2_name || 'Dr. Murray Clarke'}
                        onChange={(e) => handleFieldChange('approver2_name', e.target.value)}
                        placeholder="e.g. Dr. Murray Clarke"
                      />
                    </div>

                    <div className="fluent-field">
                      <label className="fluent-label" style={{ fontSize: '0.8rem' }}>
                        <span>Role / Specialization</span>
                      </label>
                      <input
                        type="text"
                        className="fluent-input"
                        value={selectedBook.approver2_role || 'Host · The First Seven Years'}
                        onChange={(e) => handleFieldChange('approver2_role', e.target.value)}
                        placeholder="e.g. Host · The First Seven Years"
                      />
                    </div>

                    <div>
                      <input
                        type="file"
                        id="approver2-photo-upload"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageUpload('approver2_image', e)}
                      />
                      <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <button
                          type="button"
                          className="btn btn--outline btn--sm"
                          style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem' }}
                          onClick={() => document.getElementById('approver2-photo-upload')?.click()}
                        >
                          📷 {selectedBook.approver2_image ? 'Change Photo' : 'Upload Photo'}
                        </button>
                        {selectedBook.approver2_image && (
                          <button
                            type="button"
                            className="btn btn--outline btn--sm"
                            style={{ color: '#dc2626', borderColor: '#fca5a5', padding: '0.4rem 0.6rem' }}
                            onClick={() => handleFieldChange('approver2_image', '')}
                            title="Remove photo"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Combined Approval Byline Field */}
                <div className="fluent-field" style={{ marginTop: '0.5rem' }}>
                  <label className="fluent-label">
                    <span>Combined Approval Byline</span>
                  </label>
                  <input
                    type="text"
                    className="fluent-input"
                    value={selectedBook.approved_by || 'Dr. Bill Sears & Dr. Murray Clarke'}
                    onChange={(e) => handleFieldChange('approved_by', e.target.value)}
                    placeholder="e.g. Dr. Bill Sears & Dr. Murray Clarke"
                  />
                </div>
              </div>
            </div>

            {/* 4. Companion Topic Hubs Card */}
            <div className="fluent-card">
              <div className="fluent-card__header">
                <div className="fluent-card__header-left">
                  <h2 className="fluent-card__title">
                    <span>📚</span> Companion Topic Hubs
                    <span
                      style={{
                        background: '#2b3c56',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        marginLeft: '0.4rem',
                      }}
                    >
                      {(selectedBook.topics || []).length} of {availableTopics.length} Selected
                    </span>
                  </h2>
                  <p className="fluent-card__subtitle">
                    Select which topic cards appear under "Companion resources" on the public <code>/book</code> page.
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                    onClick={handleSelectAllTopics}
                  >
                    Select All
                  </button>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                    onClick={handleDeselectAllTopics}
                  >
                    Deselect All
                  </button>
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                    onClick={handleResetDefaultTopics}
                  >
                    Reset Defaults
                  </button>
                </div>
              </div>

              <div className="fluent-card__body">
                {/* Topic search / filter input */}
                <div>
                  <input
                    type="text"
                    className="fluent-input"
                    style={{ fontSize: '0.88rem' }}
                    placeholder="🔍 Filter topics by name or slug..."
                    value={topicSearch}
                    onChange={(e) => setTopicSearch(e.target.value)}
                  />
                </div>

                {/* Grid of selectable topic cards */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: '0.75rem',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    paddingRight: '4px',
                  }}
                >
                  {filteredAvailableTopics.map((t: any) => {
                    const isChecked = (selectedBook.topics || []).includes(t.slug);
                    const ansCount = answersList.filter(
                      (a: any) => a.topic === t.slug || a.topic === t.name
                    ).length;
                    const vidCount = videosList.filter(
                      (v: any) => v.topic === t.slug || v.topic === t.name
                    ).length;

                    return (
                      <div
                        key={t.slug}
                        onClick={() => handleToggleTopic(t.slug)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          borderRadius: '10px',
                          border: isChecked ? '2px solid #2b3c56' : '1px solid #e2e8f0',
                          background: isChecked ? 'rgba(43, 60, 86, 0.05)' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          userSelect: 'none',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          style={{
                            width: '18px',
                            height: '18px',
                            cursor: 'pointer',
                            accentColor: '#2b3c56',
                          }}
                        />

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span
                              style={{
                                width: '10px',
                                height: '10px',
                                borderRadius: '50%',
                                backgroundColor: t.color || t.swatch || '#bfe4c6',
                                display: 'inline-block',
                                flexShrink: 0,
                              }}
                            />
                            <strong
                              style={{
                                fontSize: '0.9rem',
                                color: '#0f172a',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {t.name || t.title}
                            </strong>
                          </div>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: '#64748b',
                              display: 'block',
                              marginTop: '2px',
                            }}
                          >
                            {ansCount > 0 ? `${ansCount} ${ansCount === 1 ? 'answer' : 'answers'}` : ''}
                            {ansCount > 0 && vidCount > 0 ? ' · ' : ''}
                            {vidCount > 0 ? `${vidCount} ${vidCount === 1 ? 'video' : 'videos'}` : (ansCount === 0 ? '0 resources' : '')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Sticky Sidebar Controls */}
          <div className="fluent-sidebar">
            {/* 1. Publication & Visibility Card */}
            <div className="fluent-card">
              <div className="fluent-card__header">
                <div className="fluent-card__header-left">
                  <h2 className="fluent-card__title">Publication Status</h2>
                </div>
              </div>

              <div className="fluent-card__body">
                {/* Live Website Publish Toggle */}
                <div className={`fluent-publish-box ${selectedBook.published ? 'is-published' : ''}`}>
                  <div className="fluent-publish-box__info">
                    <span className="fluent-publish-box__title">
                      {selectedBook.published ? 'Live on Website' : 'Draft Mode'}
                    </span>
                    <span className="fluent-publish-box__desc">
                      {selectedBook.published
                        ? 'Publicly accessible at /book & catalog'
                        : 'Hidden from public visitors'}
                    </span>
                  </div>
                  <label className="toggle-label" style={{ margin: 0, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedBook.published}
                      onChange={(e) => {
                        const targetVal = e.target.checked;
                        confirmAction({
                          title: targetVal ? 'Publish Book on Website?' : 'Move Book to Draft Status?',
                          message: targetVal
                            ? `Are you sure you want to publish "${selectedBook.title}"? It will become visible on the public website and catalog.`
                            : `Are you sure you want to set "${selectedBook.title}" to Draft? It will be hidden from public website visitors.`,
                          confirmText: targetVal ? 'Publish' : 'Move to Draft',
                          cancelText: 'Cancel',
                          icon: targetVal ? '🌐' : '📝',
                          isDanger: !targetVal,
                          onConfirm: () => handleFieldChange('published', targetVal),
                        });
                      }}
                      style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: '#16a34a' }}
                    />
                  </label>
                </div>

                {/* Primary Companion Book Toggle */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    background: selectedBook.is_featured ? '#f0fdf4' : '#f8fafc',
                    border: `1.5px solid ${selectedBook.is_featured ? '#bbf7d0' : '#e2e8f0'}`,
                    borderRadius: '10px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.88rem', color: selectedBook.is_featured ? '#15803d' : '#1e293b', display: 'block' }}>
                      Primary Companion Book
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                      Featured across the homepage and main navigation
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    id="book-featured"
                    checked={selectedBook.is_featured || false}
                    onChange={(e) => handleFieldChange('is_featured', e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#15803d' }}
                  />
                </div>

                {/* Publication Status Selector */}
                <div className="fluent-field">
                  <label className="fluent-label">
                    <span>Editorial Status Badge</span>
                  </label>
                  <select
                    className="fluent-select"
                    value={selectedBook.status}
                    onChange={(e) => handleFieldChange('status', e.target.value)}
                  >
                    <option value="In Production">In Production</option>
                    <option value="Coming Soon">Coming Soon</option>
                    <option value="Pre-order Open">Pre-order Open</option>
                    <option value="Published & Available">Published &amp; Available</option>
                  </select>
                </div>

                {/* Quick Snapshot Metrics */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.65rem',
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Waitlist Signups:</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                      {allSubscribers.length} parents
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Topic Hubs:</span>
                    <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>
                      {(selectedBook.topics || []).length} assigned
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Public Route:</span>
                    <span style={{ fontSize: '0.78rem', color: '#2563eb', fontFamily: 'monospace' }}>
                      /book
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Live Cover Preview & Artwork Card */}
            <div className="fluent-card">
              <div className="fluent-card__header">
                <div className="fluent-card__header-left">
                  <h2 className="fluent-card__title">
                    <span>🎨</span> Cover Artwork & Preview
                  </h2>
                </div>
                {selectedBook.cover_image && (
                  <div style={{ display: 'flex', gap: '0.25rem' }}>
                    <button
                      type="button"
                      className={`btn btn--sm ${shouldShowCustomCover ? 'btn--primary' : 'btn--outline'}`}
                      style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                      onClick={() => setCoverPreviewMode('custom')}
                    >
                      Uploaded
                    </button>
                    <button
                      type="button"
                      className={`btn btn--sm ${!shouldShowCustomCover ? 'btn--primary' : 'btn--outline'}`}
                      style={{ fontSize: '0.72rem', padding: '2px 8px' }}
                      onClick={() => setCoverPreviewMode('concept')}
                    >
                      Concept
                    </button>
                  </div>
                )}
              </div>

              <div className="fluent-card__body" style={{ alignItems: 'center' }}>
                {/* 3D Book Frame */}
                <div style={{ margin: '0.5rem 0' }}>
                  {shouldShowCustomCover ? (
                    <div
                      style={{
                        width: '220px',
                        minHeight: '310px',
                        borderRadius: '8px 14px 14px 8px',
                        overflow: 'hidden',
                        boxShadow: '0 18px 30px -8px rgba(16,28,45,0.4), 0 0 0 1px rgba(0,0,0,0.1)',
                        position: 'relative',
                        background: '#18283f',
                      }}
                    >
                      <img
                        src={selectedBook.cover_image}
                        alt="Uploaded cover"
                        style={{ width: '100%', height: '100%', minHeight: '310px', objectFit: 'cover' }}
                      />
                    </div>
                  ) : (
                    <div
                      style={{
                        width: '220px',
                        minHeight: '310px',
                        borderRadius: '8px 14px 14px 8px',
                        background: 'linear-gradient(135deg, #18283f 0%, #2b3c56 100%)',
                        color: '#fff',
                        padding: '1.5rem 1.25rem',
                        boxShadow: '0 18px 30px -8px rgba(16,28,45,0.4), 0 0 0 1px rgba(255,255,255,0.08) inset',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        fontFamily: 'serif',
                      }}
                    >
                      <div style={{ borderLeft: '3px solid rgba(255,255,255,0.2)', paddingLeft: '0.75rem' }}>
                        <div
                          style={{
                            fontSize: '0.8rem',
                            textTransform: 'uppercase',
                            letterSpacing: '2px',
                            opacity: 0.8,
                            color: '#fbe7ac',
                          }}
                        >
                          {selectedBook.title ? selectedBook.title.split(' ').slice(0, 2).join(' ') : 'The First'}
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700, lineHeight: 1.15, marginTop: '0.25rem' }}>
                          {selectedBook.title
                            ? selectedBook.title.split(' ').slice(2).join(' ') || selectedBook.title
                            : 'Seven Years'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '3px', margin: '1rem 0' }}>
                        {[...Array(7)].map((_, i) => (
                          <span
                            key={i}
                            style={{
                              flex: 1,
                              height: '3px',
                              background: '#7ad0a0',
                              borderRadius: '2px',
                              opacity: 0.85,
                            }}
                          />
                        ))}
                      </div>

                      <div
                        style={{
                          marginTop: 'auto',
                          borderTop: '1px solid rgba(255,255,255,0.15)',
                          paddingTop: '0.65rem',
                        }}
                      >
                        <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>
                          {selectedBook.author || 'Bryce Wylde'}
                        </div>
                        <div style={{ fontSize: '0.72rem', opacity: 0.75, marginTop: '2px', lineHeight: 1.2 }}>
                          Approved by {selectedBook.approved_by || 'Dr. Bill Sears & Dr. Murray Clarke'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <p
                  style={{
                    fontSize: '0.78rem',
                    color: '#64748b',
                    textAlign: 'center',
                    margin: '0.25rem 0 0.75rem',
                    maxWidth: '240px',
                    fontStyle: 'italic',
                  }}
                >
                  {selectedBook.cover_image
                    ? 'Displaying custom uploaded cover image'
                    : selectedBook.note || 'Cover concept for website display'}
                </p>

                {/* Upload / Replace Cover Actions */}
                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <input
                    type="file"
                    id="sidebar-cover-upload"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(e) => handleImageUpload('cover_image', e)}
                  />
                  <button
                    type="button"
                    className="btn btn--outline btn--sm"
                    style={{ width: '100%', fontSize: '0.85rem', padding: '0.55rem' }}
                    onClick={() => document.getElementById('sidebar-cover-upload')?.click()}
                  >
                    📁 {selectedBook.cover_image ? 'Change Cover Artwork' : 'Upload Cover Artwork'}
                  </button>
                  {selectedBook.cover_image && (
                    <button
                      type="button"
                      className="btn btn--outline btn--sm"
                      style={{ width: '100%', color: '#dc2626', borderColor: '#fca5a5', fontSize: '0.82rem' }}
                      onClick={() => handleFieldChange('cover_image', '')}
                    >
                      ✕ Remove Custom Artwork
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WAITLIST TAB */}
      {activeTab === 'waitlist' && (
        <div className="fluent-card">
          <div className="fluent-card__header">
            <div className="fluent-card__header-left">
              <h2 className="fluent-card__title">
                <span>👥</span> Waitlist Subscribers ({allSubscribers.length})
              </h2>
              <p className="fluent-card__subtitle">
                Parents who signed up to receive early access and notifications about the companion book release.
              </p>
            </div>
            <div>
              <button
                type="button"
                className="btn btn--outline btn--sm"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                onClick={handleExportCSV}
              >
                📥 Export CSV
              </button>
            </div>
          </div>

          <div className="fluent-card__body">
            {/* Quick Add Subscriber Form & Search Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <form
                onSubmit={handleAddSubscriber}
                style={{ display: 'flex', gap: '0.5rem', flex: 1, maxWidth: '500px' }}
              >
                <input
                  type="email"
                  className="fluent-input"
                  placeholder="parent@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="btn btn--primary"
                  style={{ whiteSpace: 'nowrap', padding: '0 1.25rem', fontSize: '0.88rem' }}
                >
                  + Add to Waitlist
                </button>
              </form>

              <div style={{ minWidth: '260px' }}>
                <input
                  type="text"
                  className="fluent-input"
                  placeholder="🔍 Search subscribers by email..."
                  value={subSearch}
                  onChange={(e) => setSubSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Subscribers Table */}
            <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
              <table className="data-table" style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0' }}>
                    <th style={{ padding: '0.85rem 1rem', width: '50px', fontSize: '0.8rem', color: '#64748b' }}>#</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#64748b' }}>Email Address</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#64748b' }}>Target Companion</th>
                    <th style={{ padding: '0.85rem 1rem', fontSize: '0.8rem', color: '#64748b' }}>Signed Up Date</th>
                    <th style={{ padding: '0.85rem 1rem', width: '100px', textAlign: 'right', fontSize: '0.8rem', color: '#64748b' }}>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribers.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b' }}>
                        No waitlist subscribers found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredSubscribers.map((sub, idx) => (
                      <tr key={sub.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.85rem' }}>{idx + 1}</td>
                        <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: '#0f172a' }}>{sub.email}</td>
                        <td style={{ padding: '0.85rem 1rem', fontSize: '0.85rem', color: '#64748b' }}>
                          <span
                            style={{
                              background: '#f1f5f9',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              fontSize: '0.8rem',
                            }}
                          >
                            {sub.book_title || 'The First Seven Years'}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', color: '#64748b', fontSize: '0.85rem' }}>
                          {new Date(sub.date).toLocaleDateString()}{' '}
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                            {new Date(sub.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn--outline btn--sm"
                            style={{
                              color: '#dc2626',
                              borderColor: '#fca5a5',
                              padding: '3px 8px',
                              fontSize: '0.78rem',
                            }}
                            onClick={() => handleDeleteSubscriber(sub.id, sub.email)}
                            title="Remove subscriber from database"
                          >
                            ✕ Remove
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
