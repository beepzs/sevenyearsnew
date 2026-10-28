import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdmin } from '../context/AdminContext';
import { TopicItem } from '../types';

export const Topics: React.FC = () => {
  const { data, searchQuery, togglePublish, deleteItem, saveItem, showToast, canEdit } = useAdmin();
  const hasEdit = canEdit('topics');

  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [draggedSlug, setDraggedSlug] = useState<string | null>(null);

  const topics = [...(data.topics || [])].sort((a, b) => (a.order || 0) - (b.order || 0));

  const filteredTopics = topics.filter((t) => {
    if (filter === 'published' && !t.published) return false;
    if (filter === 'draft' && t.published) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        t.name.toLowerCase().includes(q) ||
        t.short?.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q)
      );
    }
    return true;
  });

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

  const formatAgesRange = (ages: any): string => {
    const list = parseAges(ages);
    const sorted = Array.from(new Set(list)).sort((a, b) => a - b);
    if (sorted.length === 0 || sorted.length === 8) return '0–7';
    if (sorted.length === 1) return `${sorted[0]}`;

    const ranges: string[] = [];
    let start = sorted[0];
    let prev = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      const curr = sorted[i];
      if (curr === prev + 1) {
        prev = curr;
      } else {
        ranges.push(start === prev ? `${start}` : `${start}–${prev}`);
        start = curr;
        prev = curr;
      }
    }
    ranges.push(start === prev ? `${start}` : `${start}–${prev}`);
    return ranges.join(', ');
  };

  const moveTopic = (slug: string, direction: -1 | 1) => {
    const currentIdx = topics.findIndex((t) => t.slug === slug);
    const targetIdx = currentIdx + direction;
    if (currentIdx === -1 || targetIdx < 0 || targetIdx >= topics.length) return;

    const current = topics[currentIdx];
    const target = topics[targetIdx];
    const tempOrder = current.order;
    current.order = target.order;
    target.order = tempOrder;
    saveItem('topics', current, 'slug');
    saveItem('topics', target, 'slug');
    showToast(`Reordered ${current.name}`, 'info');
  };

  const handleDragStart = (slug: string) => {
    setDraggedSlug(slug);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetSlug: string) => {
    if (!draggedSlug || draggedSlug === targetSlug) return;
    const currentIdx = topics.findIndex((t) => t.slug === draggedSlug);
    const targetIdx = topics.findIndex((t) => t.slug === targetSlug);
    if (currentIdx === -1 || targetIdx === -1) return;

    const updated = [...topics];
    const [moved] = updated.splice(currentIdx, 1);
    updated.splice(targetIdx, 0, moved);

    updated.forEach((t, i) => {
      t.order = i + 1;
      saveItem('topics', t, 'slug');
    });

    setDraggedSlug(null);
    showToast('Topic order updated', 'success');
  };

  return (
    <div className="content-area">
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Topic Master</h1>
        </div>
        {hasEdit && (
          <Link to="/topics/new" className="btn btn--primary">
            + New Topic Hub
          </Link>
        )}
      </div>

      <div className="card">
        <div className="card__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 className="card__title" style={{ margin: 0 }}>All Topic Hubs</h2>
            <span className="badge" style={{ background: 'var(--cream-deep)', color: 'var(--ink-2)', fontWeight: 500, fontSize: '0.75rem' }}>
              ⠿ DRAG &amp; DROP TO REORDER
            </span>
          </div>
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
                <th style={{ width: '38px', textAlign: 'center' }} title="Drag to reorder">#</th>
                <th>TOPIC &amp; SLUG</th>
                <th>ASSIGNED EXPERTS</th>
                <th>MAIN VIDEO</th>
                <th>AGES</th>
                <th>ASSIGNED CONTENT</th>
                <th>STATUS</th>
                <th style={{ width: '85px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTopics.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--ink-3)' }}>
                    <div style={{ fontSize: '1.6rem', marginBottom: '0.4rem' }}>📁</div>
                    <strong style={{ color: 'var(--navy)', fontSize: '1rem' }}>No topics found</strong>
                    <p style={{ fontSize: '0.85rem', margin: '0.25rem 0 1rem' }}>No topic hubs match the current filter or search query.</p>
                    {hasEdit && (
                      <Link to="/topics/new" className="btn btn--sm btn--primary">
                        + Add New Topic Hub
                      </Link>
                    )}
                  </td>
                </tr>
              ) : (
                filteredTopics.map((topic, idx) => {
                  const ansCount = (topic.answers && topic.answers.length > 0)
                    ? topic.answers.length
                    : answersList.filter((a: any) => a.topic === topic.slug || a.topics?.includes(topic.slug) || a.also?.includes(topic.slug)).length;

                  const vidCount = (topic.episodes && topic.episodes.length > 0)
                    ? topic.episodes.length
                    : videosList.filter((v: any) => v.topic === topic.slug || v.tags?.includes(topic.slug)).length;

                  const exps = (topic.experts || []).map((expSlug) => getExpertName(expSlug));
                  const agesLabel = formatAgesRange(topic.ages);

                  const isFirst = idx === 0;
                  const isLast = idx === filteredTopics.length - 1;

                  return (
                    <tr
                      key={topic.slug}
                      draggable
                      onDragStart={() => handleDragStart(topic.slug)}
                      onDragOver={handleDragOver}
                      onDrop={() => handleDrop(topic.slug)}
                      className="draggable-row"
                    >
                      <td className="drag-handle-cell" title="Drag to reorder topic">
                        <span className="drag-handle">⠿</span>
                        <div className="topic-reorder-btns">
                          <button
                            type="button"
                            className="btn btn--sm btn--reorder"
                            title="Move Up"
                            disabled={isFirst}
                            onClick={() => moveTopic(topic.slug, -1)}
                          >
                            ▲
                          </button>
                          <button
                            type="button"
                            className="btn btn--sm btn--reorder"
                            title="Move Down"
                            disabled={isLast}
                            onClick={() => moveTopic(topic.slug, 1)}
                          >
                            ▼
                          </button>
                        </div>
                      </td>

                      <td className="table-cell-title">
                        <strong>{topic.name}</strong>
                        <br />
                        <small style={{ color: 'var(--ink-3)' }}>/{topic.slug}/</small>
                      </td>

                      <td data-label="Assigned Experts">
                        {exps.length > 0 ? (
                          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                            {exps.map((name, i) => (
                              <span
                                key={i}
                                className="badge"
                                style={{
                                  background: 'var(--cream-deep)',
                                  fontSize: '0.72rem',
                                  padding: '0.15rem 0.4rem',
                                  color: 'var(--navy)',
                                  fontWeight: 700,
                                  textTransform: 'uppercase'
                                }}
                              >
                                {name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--ink-3)', fontSize: '0.8rem' }}>None assigned</span>
                        )}
                      </td>

                      <td data-label="Main Video">
                        {topic.main_video ? (
                          <a
                            href={`https://youtu.be/${topic.main_video}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              textDecoration: 'none',
                              color: 'var(--navy)',
                              fontSize: '0.82rem',
                              fontWeight: 600
                            }}
                          >
                            <img
                              src={`https://i.ytimg.com/vi/${topic.main_video}/hqdefault.jpg`}
                              style={{ width: '36px', height: '22px', borderRadius: '3px', objectFit: 'cover' }}
                              alt=""
                            />
                            <span>{topic.main_video}</span>
                          </a>
                        ) : (
                          <span style={{ color: 'var(--ink-3)', fontSize: '0.8rem' }}>None</span>
                        )}
                      </td>

                      <td data-label="Target Ages">
                        <span className="badge" style={{ background: 'var(--cream-deep)', color: 'var(--navy)' }}>
                          {agesLabel}
                        </span>
                      </td>

                      <td data-label="Assigned Content">
                        <span style={{ fontSize: '0.85rem' }}>
                          <strong>{ansCount}</strong> Q&amp;As · <strong>{vidCount}</strong> Videos
                        </span>
                      </td>

                      <td data-label="Status">
                        <span
                          className={`badge ${topic.published ? 'badge--published' : 'badge--draft'}`}
                          onClick={() => hasEdit && togglePublish('topics', 'slug', topic.slug)}
                          title={hasEdit ? "Click to toggle status" : "View-only access"}
                          style={{ cursor: hasEdit ? 'pointer' : 'default' }}
                        >
                          <span className="badge--dot" />
                          {topic.published ? 'PUBLISHED' : 'DRAFT'}
                        </span>
                      </td>

                      <td className="table-actions-cell" style={{ textAlign: 'right' }}>
                        <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                          {hasEdit ? (
                            <>
                              <Link
                                to={`/topics/${topic.slug}/edit`}
                                className="icon-btn"
                                title="Edit Topic"
                              >
                                ✏️
                              </Link>
                              <button
                                className="icon-btn icon-btn--danger"
                                onClick={() => deleteItem('topics', 'slug', topic.slug)}
                                title="Delete Topic"
                              >
                                🗑️
                              </button>
                            </>
                          ) : (
                            <Link
                              to={`/topics/${topic.slug}/edit`}
                              className="icon-btn"
                              title="View Topic Details (Read-only)"
                            >
                              👁️
                            </Link>
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
    </div>
  );
};
