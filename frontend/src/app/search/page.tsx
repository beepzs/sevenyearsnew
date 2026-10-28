"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { PageShell } from "../../components/PageShell";
import { SearchIcon, ArrowIcon } from "../../components/Icons";
import { useNavigation } from "../../context/NavigationContext";
import { buildSearchIndex, searchIndex, KIND_LABELS, SearchItem } from "../../utils/search";

const POPULAR_CHIPS = [
  { label: "Gut health & microbiome", url: "/topics/gut-health/" },
  { label: "Nutrition & first foods", url: "/topics/first-foods/" },
  { label: "Picky eating", url: "/topics/picky-eating/" },
  { label: "Skin & eczema", url: "/topics/skin-eczema/" },
  { label: "Allergies", url: "/topics/allergies/" },
  { label: "Immunity & everyday illness", url: "/topics/immunity/" },
  { label: "Brain, focus & ADHD", url: "/topics/brain-focus/" },
  { label: "Autism & development", url: "/topics/autism-development/" }
];

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { answers, topics, videos, experts } = useNavigation();

  // Keep internal state synced if URL parameter changes
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null && q !== query) {
      setQuery(q);
    }
  }, [searchParams]);

  // Build combined search index
  const fullSearchIndex = useMemo(() => {
    return buildSearchIndex(answers, topics, videos, experts);
  }, [answers, topics, videos, experts]);

  // Results for current query
  const allResults = useMemo(() => {
    if (!query.trim()) return [];
    return searchIndex(query, fullSearchIndex, 50);
  }, [query, fullSearchIndex]);

  // Filtered by selected category tab
  const displayResults = useMemo(() => {
    if (activeCategory === "all") return allResults;
    return allResults.filter((r) => r.k === activeCategory);
  }, [allResults, activeCategory]);

  const counts = useMemo(() => {
    const c = { all: allResults.length, answer: 0, episode: 0, topic: 0, expert: 0 };
    for (const r of allResults) {
      if (c[r.k] !== undefined) {
        c[r.k]++;
      }
    }
    return c;
  }, [allResults]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <main id="main">
      <div className="page-head page-head--tint" style={{ minHeight: "60vh", paddingBottom: "4rem" }}>
        <div className="wrap">
          <nav aria-label="Breadcrumb">
            <ol className="crumbs">
              <li>
                <Link href="/">Home</Link>
              </li>
              <li aria-current="page">Search</li>
            </ol>
          </nav>

          <h1>What would you like to know?</h1>
          <p className="lede">
            Ask in your own words — we’ll find the answers, episodes and experts that match.
          </p>

          <div style={{ marginTop: "2rem" }}>
            <div className="qsearch">
              <form role="search" onSubmit={handleSearchSubmit}>
                <div className="qsearch__field">
                  <SearchIcon />
                  <label className="sr-only" htmlFor="search-page-q">
                    Ask a question or search
                  </label>
                  <input
                    id="search-page-q"
                    name="q"
                    type="search"
                    autoComplete="off"
                    placeholder="Why won’t my toddler eat vegetables?"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button className="btn" type="submit">
                    <ArrowIcon />
                    <span>Find answers</span>
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="qsearch__chips" style={{ justifyContent: "flex-start", marginTop: "1rem" }}>
            {(topics && topics.length > 0
              ? topics.slice(0, 8).map((t) => ({ label: t.name, url: `/topics/${t.slug}/` }))
              : POPULAR_CHIPS
            ).map((chip, idx) => (
              <Link key={idx} className="chip" href={chip.url}>
                {chip.label}
              </Link>
            ))}
          </div>

          {/* Results section */}
          {query.trim().length > 0 && (
            <div style={{ marginTop: "3rem" }}>
              {allResults.length > 0 ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "1rem",
                      marginBottom: "1.5rem",
                      borderBottom: "1px solid var(--line, #e2e8f0)",
                      paddingBottom: "1rem"
                    }}
                  >
                    <p style={{ margin: 0, fontWeight: 600, color: "var(--ink)" }}>
                      Found {allResults.length} {allResults.length === 1 ? "result" : "results"} for “{query.trim()}”
                    </p>

                    <div style={{ display: "flex", gap: ".5rem", flexWrap: "wrap" }}>
                      <button
                        type="button"
                        className={`chip ${activeCategory === "all" ? "is-active" : ""}`}
                        style={{
                          background: activeCategory === "all" ? "var(--ink, #1f2d3d)" : undefined,
                          color: activeCategory === "all" ? "#fff" : undefined
                        }}
                        onClick={() => setActiveCategory("all")}
                      >
                        All ({counts.all})
                      </button>
                      {counts.answer > 0 && (
                        <button
                          type="button"
                          className={`chip ${activeCategory === "answer" ? "is-active" : ""}`}
                          style={{
                            background: activeCategory === "answer" ? "var(--ink, #1f2d3d)" : undefined,
                            color: activeCategory === "answer" ? "#fff" : undefined
                          }}
                          onClick={() => setActiveCategory("answer")}
                        >
                          Answers ({counts.answer})
                        </button>
                      )}
                      {counts.episode > 0 && (
                        <button
                          type="button"
                          className={`chip ${activeCategory === "episode" ? "is-active" : ""}`}
                          style={{
                            background: activeCategory === "episode" ? "var(--ink, #1f2d3d)" : undefined,
                            color: activeCategory === "episode" ? "#fff" : undefined
                          }}
                          onClick={() => setActiveCategory("episode")}
                        >
                          Videos ({counts.episode})
                        </button>
                      )}
                      {counts.topic > 0 && (
                        <button
                          type="button"
                          className={`chip ${activeCategory === "topic" ? "is-active" : ""}`}
                          style={{
                            background: activeCategory === "topic" ? "var(--ink, #1f2d3d)" : undefined,
                            color: activeCategory === "topic" ? "#fff" : undefined
                          }}
                          onClick={() => setActiveCategory("topic")}
                        >
                          Topics ({counts.topic})
                        </button>
                      )}
                      {counts.expert > 0 && (
                        <button
                          type="button"
                          className={`chip ${activeCategory === "expert" ? "is-active" : ""}`}
                          style={{
                            background: activeCategory === "expert" ? "var(--ink, #1f2d3d)" : undefined,
                            color: activeCategory === "expert" ? "#fff" : undefined
                          }}
                          onClick={() => setActiveCategory("expert")}
                        >
                          Experts ({counts.expert})
                        </button>
                      )}
                    </div>
                  </div>

                  <ul
                    className="qsearch__results"
                    style={{
                      position: "static",
                      maxHeight: "none",
                      boxShadow: "none",
                      border: "none",
                      padding: 0,
                      background: "transparent"
                    }}
                  >
                    {displayResults.map((item, idx) => (
                      <li
                        key={idx}
                        style={{
                          marginBottom: ".75rem",
                          background: "#fff",
                          borderRadius: "14px",
                          border: "1px solid var(--line, #e6ecf2)",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
                        }}
                      >
                        <Link
                          href={item.u}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "auto 1fr",
                            gap: ".2rem 1rem",
                            padding: "1rem 1.25rem",
                            borderRadius: "14px",
                            textDecoration: "none"
                          }}
                        >
                          <span className={`kind kind--${item.k}`}>
                            {KIND_LABELS[item.k] || item.k}
                          </span>
                          <span className="t" style={{ fontSize: "1.05rem" }}>
                            {item.t}
                          </span>
                          {item.s && <span className="s">{item.s}</span>}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              ) : (
                <div
                  style={{
                    background: "#fff",
                    borderRadius: "1rem",
                    border: "1px solid var(--line, #e2e8f0)",
                    padding: "2.5rem 1.5rem",
                    textAlign: "center"
                  }}
                >
                  <p style={{ fontSize: "1.1rem", color: "var(--ink)", fontWeight: 600, margin: 0 }}>
                    No answer yet for “{query.trim()}”.
                  </p>
                  <p style={{ color: "var(--ink-soft)", marginTop: ".5rem" }}>
                    We answer the questions parents ask most. Send your question to Dr. Murray and we’ll let you know when it’s live.
                  </p>
                  <Link
                    className="btn btn--mint"
                    style={{ marginTop: "1rem", display: "inline-flex" }}
                    href={`/ask-the-doctor/?q=${encodeURIComponent(query.trim())}`}
                  >
                    Ask Dr. Murray instead
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <PageShell>
      <Suspense fallback={<div style={{ minHeight: "50vh" }} />}>
        <SearchContent />
      </Suspense>
    </PageShell>
  );
}
