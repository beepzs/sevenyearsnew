import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';

interface PageItem {
  id: string;
  slug: string;
  title: string;
  url?: string;
  template: string;
  excerpt?: string;
  body?: string;
  published: boolean;
  updated?: string;
  seo_title?: string;
  meta_desc?: string;
  focus_keyword?: string;
  keywords?: string;
  canonical_url?: string;
  robots_index?: string;
  robots_follow?: string;
  og_title?: string;
  og_type?: string;
  og_desc?: string;
  og_image?: string;
  schema_type?: string;
  twitter_card?: string;
}

export const PagesManagement: React.FC = () => {
  const { data, searchQuery, togglePublish, deleteItem, canEdit } = useAdmin();
  const hasEdit = canEdit('pages');

  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [templateFilter, setTemplateFilter] = useState('all');

  // Normalize pages from database
  const rawPages = Array.isArray((data as any)?.pages) ? (data as any).pages : [];
  const pagesList: PageItem[] = Array.isArray(rawPages) ? rawPages : Object.values(rawPages);

  const filteredPages = pagesList.filter((p) => {
    if (filter === 'published' && !p.published) return false;
    if (filter === 'draft' && p.published) return false;
    if (templateFilter !== 'all' && p.template !== templateFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        p.title.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q) ||
        p.seo_title?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="content-area">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Static Pages &amp; SEO Metadata</h1>
        </div>
        {hasEdit && (
          <Link to="/pages/new" className="btn btn--primary">
            + Create New Page
          </Link>
        )}
      </div>

      <div className="card">
        <div className="card__header">
          <h2 className="card__title" style={{ margin: 0 }}>All Static Pages</h2>
          <div className="card__toolbar">
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={templateFilter}
              onChange={(e) => setTemplateFilter(e.target.value)}
            >
              <option value="all">All Templates</option>
              <option value="Editorial & Standards">Editorial &amp; Standards</option>
              <option value="Product / Book Showcase">Product / Book Showcase</option>
              <option value="Legal & Privacy Policy">Legal &amp; Privacy Policy</option>
            </select>

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
                <th>PAGE TITLE &amp; ROUTE</th>
                <th>TEMPLATE</th>
                <th>SEARCH ENGINE PREVIEW</th>
                <th>LAST MODIFIED</th>
                <th>STATUS</th>
                <th style={{ width: '85px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ink-3)' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>📄</div>
                    <strong style={{ color: 'var(--navy)', fontSize: '1rem' }}>No pages found</strong>
                    <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 1rem' }}>No static pages match your filters.</p>
                    {hasEdit && (
                      <Link to="/pages/new" className="btn btn--sm btn--primary">
                        + Create New Page
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                filteredPages.map((page) => (
                  <tr key={page.id}>
                    <td className="table-cell-title">
                      <strong>{page.title}</strong>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem' }}>
                        <code style={{ fontSize: '0.75rem', background: 'var(--cream-deep)', padding: '2px 5px', borderRadius: '3px' }}>
                          {page.url || `/${page.slug}/`}
                        </code>
                        <a
                          href={`http://localhost:3000${page.url || '/' + page.slug + '/'}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.75rem', color: 'var(--mint-dark, #15803d)', fontWeight: 600, textDecoration: 'underline' }}
                        >
                          view ↗
                        </a>
                      </div>
                    </td>
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: 'var(--cream-deep)',
                          color: 'var(--navy)',
                          fontWeight: 600,
                          border: '1px solid var(--line)'
                        }}
                      >
                        {page.template || 'Standard'}
                      </span>
                    </td>
                    <td style={{ maxWidth: '320px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem', flexWrap: 'wrap' }}>
                        <span
                          className="badge"
                          style={{
                            background: page.seo_title || page.meta_desc ? 'var(--cream-deep)' : '#f1f3f5',
                            color: 'var(--navy)',
                            fontSize: '0.7rem',
                            padding: '0.1rem 0.4rem',
                            fontWeight: 600
                          }}
                        >
                          🔍 {page.seo_title ? 'SEO Configured' : 'Default SEO'}
                        </span>
                        {page.focus_keyword && (
                          <span
                            className="badge badge--topic"
                            style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}
                          >
                            🎯 {page.focus_keyword}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--ink)', fontWeight: 500 }}>
                        {page.excerpt || page.meta_desc || '—'}
                      </div>
                      {page.seo_title && (
                        <small style={{ color: 'var(--ink-3)', display: 'block', marginTop: '2px', fontSize: '0.75rem' }}>
                          Title Tag: {page.seo_title}
                        </small>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--ink-2)' }}>
                        {page.updated || '2026-10-12'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${page.published ? 'badge--published' : 'badge--draft'}`}
                        onClick={() => hasEdit && togglePublish('pages', 'id', page.id)}
                        style={{ cursor: hasEdit ? 'pointer' : 'default' }}
                        title={hasEdit ? "Click to toggle publish status" : undefined}
                      >
                        <span className="badge--dot" />
                        {page.published ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </td>
                    <td className="table-actions-cell" style={{ textAlign: 'right' }}>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        {hasEdit ? (
                          <>
                            <Link
                              to={`/pages/${page.slug || page.id}/edit`}
                              className="icon-btn"
                              title="Edit Page"
                            >
                              ✏️
                            </Link>
                            <button
                              className="icon-btn icon-btn--danger"
                              onClick={() => deleteItem('pages', 'id', page.id)}
                              title="Delete Page"
                            >
                              🗑️
                            </button>
                          </>
                        ) : (
                          <Link
                            to={`/pages/${page.slug || page.id}/edit`}
                            className="icon-btn"
                            title="View Page Details"
                          >
                            👁️
                          </Link>
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
    </div>
  );
};
