"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SearchIcon, ArrowIcon, PlayIcon } from "./Icons";
import { useNavigation } from "../context/NavigationContext";
import { buildSearchIndex, searchIndex, KIND_LABELS } from "../utils/search";

interface HeroBannerProps {
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
}

export function HeroBanner({ searchInputRef }: HeroBannerProps) {
  const router = useRouter();
  const { answers, topics, experts, videos, banners, settings } = useNavigation();
  const publishedAnswers = (answers || []).filter((a) => a.published !== false);

  const heroRow = (banners || []).find((b) => b.type === "hero" || b.id === "home_hero");
  const heroSettings = settings?.hero_banner;

  const pillText = heroRow?.badge || heroSettings?.pill_text || "For parents of children 0–7";
  const rawTitle = heroRow?.title || heroSettings?.title || "Every question about the first seven years, answered by people who know.";
  const titleText = rawTitle.replace(/\.h$/, ".").replace(/h$/, "");
  const highlightText =
    heroRow?.highlight !== undefined && heroRow?.highlight !== null
      ? heroRow.highlight
      : heroSettings?.highlight_text !== undefined
      ? heroSettings.highlight_text
      : "first seven years";
  const subtitleText = heroRow?.content || heroSettings?.subtitle || "Short, reviewed answers from doctors and health experts — with the video behind every one.";

  // Dynamic rotating search prompts directly from database configuration or live answers
  const prompts = useMemo(() => {
    const dbPrompts = heroRow?.data?.search_prompts;
    if (Array.isArray(dbPrompts) && dbPrompts.length > 0) {
      const validPrompts = dbPrompts.filter((p: any) => typeof p === "string" && p.trim().length > 0);
      if (validPrompts.length > 0) {
        return validPrompts;
      }
    }
    if (publishedAnswers.length > 0) {
      return publishedAnswers.map((a) => a.q);
    }
    return ["Ask a question or search..."];
  }, [heroRow?.data?.search_prompts, publishedAnswers]);

  // Resolve search chips dynamically from database banners table (falling back to topics/answers)
  const parsedChips = useMemo(() => {
    const dbChips = heroRow?.data?.chips;
    if (Array.isArray(dbChips) && dbChips.length > 0) {
      const validChips = dbChips.filter((c: any) => c && typeof c.label === "string" && c.label.trim().length > 0);
      if (validChips.length > 0) {
        return validChips.map((c: any) => ({
          label: c.label.trim(),
          url: c.url ? (c.url.startsWith("/") ? c.url : `/${c.url}`) : "/search/"
        }));
      }
    }

    const publishedTopics = (topics || []).filter((t: any) => t.published !== false);
    const candidateTopics = publishedTopics.length > 0 ? publishedTopics : (topics || []);
    if (candidateTopics.length > 0) {
      return candidateTopics.slice(0, 4).map((t) => ({
        label: t.name,
        url: `/topics/${t.slug}/`
      }));
    }

    if (publishedAnswers.length > 0) {
      return publishedAnswers.slice(0, 4).map((a) => ({
        label: a.q.length > 25 ? `${a.q.slice(0, 24)}…` : a.q,
        url: `/answers/${a.slug}/`
      }));
    }

    return [];
  }, [heroRow?.data?.chips, topics, publishedAnswers]);

  // Resolve trio experts dynamically from live database experts
  const trioExperts = useMemo(() => {
    const publishedExperts = (experts || []).filter((e) => e.published !== false);
    if (!publishedExperts.length) return [];

    const preferredOrder = ["dr-murray-clarke", "dr-bill-sears", "bryce-wylde"];
    const resolved: typeof publishedExperts = [];

    for (const slug of preferredOrder) {
      const match = publishedExperts.find((e) => e.slug === slug);
      if (match && !resolved.some((r) => r.slug === match.slug)) {
        resolved.push(match);
      }
    }

    for (const exp of publishedExperts) {
      if (resolved.length >= 3) break;
      if (!resolved.some((r) => r.slug === exp.slug)) {
        resolved.push(exp);
      }
    }

    return resolved;
  }, [experts]);

  const trioText = heroRow?.secondary_text || heroSettings?.trio_text || "With Dr. Murray Clarke, Dr. Bill Sears and Bryce Wylde";
  const welcomeCard = heroRow?.data?.welcome_card || heroSettings?.welcome_card;

  const [promptIndex, setPromptIndex] = useState(0);
  const [isSwapping, setIsSwapping] = useState(false);
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const localInputRef = useRef<HTMLInputElement>(null);
  const inputRef = searchInputRef || localInputRef;

  // Rotating placeholder
  useEffect(() => {
    if (prompts.length === 0) return;
    const timer = setInterval(() => {
      if (document.activeElement === inputRef.current || query) return;
      setIsSwapping(true);
      setTimeout(() => {
        setPromptIndex((prev) => (prev + 1) % prompts.length);
        setIsSwapping(false);
      }, 240);
    }, 3200);

    return () => clearInterval(timer);
  }, [query, inputRef, prompts.length]);

  // Build combined search index from default + live content
  const fullSearchIndex = useMemo(() => {
    return buildSearchIndex(answers, topics, videos, experts);
  }, [answers, topics, videos, experts]);

  // Search results
  const filteredResults = useMemo(() => {
    if (!query.trim()) return [];
    return searchIndex(query, fullSearchIndex, 8);
  }, [query, fullSearchIndex]);

  // Reset active index when query changes
  useEffect(() => {
    setActiveIndex(-1);
  }, [query]);

  // Helper to render headline with accent highlighted phrase
  const renderTitle = () => {
    if (!highlightText || !titleText.includes(highlightText)) {
      return titleText;
    }
    const parts = titleText.split(highlightText);
    return (
      <>
        {parts[0]}
        <em className="accent">{highlightText}</em>
        {parts.slice(1).join(highlightText)}
      </>
    );
  };

  const activePrompt = prompts[promptIndex % prompts.length] || "Ask a question or search...";

  // Dynamic "Parents are asking" questions from database
  const askingItems = publishedAnswers.length > 0
    ? publishedAnswers.slice(0, 4).map((ans) => {
        const exp = (experts || []).find((e) => e.slug === ans.expert);
        const expName = exp?.name || "Dr. Murray Clarke";
        const expImg = exp?.img || "/assets/img/dr-murray-clarke-cutout.webp";
        const expBg = exp?.swatch || exp?.color || "#d8f6b5";
        const vid = (videos || []).find((v) => v.id === ans.video || (v as any).slug === ans.video);
        const sub = vid?.duration
          ? `${expName} · ${vid.type || "Short video"} · ${vid.duration}`
          : `${expName} · Expert answer`;

        return {
          slug: ans.slug,
          q: ans.q,
          sub,
          img: expImg,
          bg: expBg,
        };
      })
    : [];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (filteredResults.length > 0) {
        setActiveIndex((prev) => (prev + 1) % filteredResults.length);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (filteredResults.length > 0) {
        setActiveIndex((prev) => (prev - 1 + filteredResults.length) % filteredResults.length);
      }
    } else if (e.key === "Enter") {
      if (activeIndex >= 0 && filteredResults[activeIndex]) {
        e.preventDefault();
        router.push(filteredResults[activeIndex].u);
        setIsFocused(false);
      } else if (filteredResults.length > 0) {
        e.preventDefault();
        router.push(filteredResults[0].u);
        setIsFocused(false);
      } else if (query.trim()) {
        e.preventDefault();
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        setIsFocused(false);
      }
    } else if (e.key === "Escape") {
      setIsFocused(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && filteredResults[activeIndex]) {
      router.push(filteredResults[activeIndex].u);
      setIsFocused(false);
    } else if (filteredResults.length > 0) {
      router.push(filteredResults[0].u);
      setIsFocused(false);
    } else if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsFocused(false);
    } else {
      inputRef.current?.focus();
    }
  };

  // If the hero banner is unpublished or hidden in database, do not render
  if (heroRow && heroRow.published === false) {
    return null;
  }
  if (heroSettings && heroSettings.enabled === false) {
    return null;
  }

  return (
    <section className="hero-banner" aria-labelledby="hero-title">
      <div className="wrap hero-banner__in">
        <div className="hero-banner__copy">
          <span className="pill pill--mint">{pillText}</span>
          <h1 id="hero-title">{renderTitle()}</h1>
          <p className="lede">{subtitleText}</p>

          <div className="qsearch" data-prompts={prompts.join("|")}>
            <form role="search" onSubmit={handleSubmit}>
              <div className="qsearch__field">
                <SearchIcon />
                <label className="sr-only" htmlFor="hero-q">
                  Ask a question or search
                </label>
                <input
                  ref={inputRef as React.RefObject<HTMLInputElement>}
                  id="hero-q"
                  name="q"
                  type="search"
                  autoComplete="off"
                  placeholder={activePrompt}
                  className={isSwapping ? "is-swapping" : ""}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setTimeout(() => setIsFocused(false), 250)}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={isFocused && query.trim().length > 0}
                  aria-controls="hero-q-list"
                  aria-activedescendant={
                    activeIndex >= 0 ? `hero-q-o${activeIndex}` : undefined
                  }
                />
                <button className="btn" type="submit">
                  <ArrowIcon />
                  <span>Find answers</span>
                </button>
              </div>
            </form>

            {isFocused && query.trim().length > 0 && (
              <ul className="qsearch__results" id="hero-q-list" role="listbox" aria-label="Suggestions">
                {filteredResults.length > 0 ? (
                  filteredResults.map((item, idx) => (
                    <li key={idx} role="presentation">
                      <Link
                        role="option"
                        id={`hero-q-o${idx}`}
                        aria-selected={activeIndex === idx}
                        href={item.u}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          router.push(item.u);
                          setIsFocused(false);
                        }}
                      >
                        <span className={`kind kind--${item.k}`}>
                          {KIND_LABELS[item.k] || item.k}
                        </span>
                        <span className="t">{item.t}</span>
                        {item.s && <span className="s">{item.s}</span>}
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="qsearch__empty">
                    No answer yet for “{query.trim()}”.{" "}
                    <Link
                      className="link-arrow"
                      href={`/ask-the-doctor/?q=${encodeURIComponent(query.trim())}`}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        router.push(`/ask-the-doctor/?q=${encodeURIComponent(query.trim())}`);
                        setIsFocused(false);
                      }}
                    >
                      Ask Dr. Murray instead
                    </Link>
                  </li>
                )}
              </ul>
            )}
          </div>

          <div className="qsearch__chips" aria-label="Popular questions">
            {parsedChips.map((chip, idx) => (
              <Link key={idx} className="chip" href={chip.url || "#"}>
                {chip.label}
              </Link>
            ))}
          </div>

          <div className="trio">
            <span className="trio__faces">
              {trioExperts.length > 0 ? (
                trioExperts.map((exp) => (
                  <Link key={exp.slug} href={`/experts/${exp.slug}/`} title={exp.name}>
                    <img
                      className="avatar avatar--cut"
                      src={exp.img || "/assets/img/dr-murray-clarke-cutout.webp"}
                      alt={exp.name}
                      width={44}
                      height={44}
                      style={{
                        "--s": "44px",
                        background: exp.swatch || exp.color || "#c4ec9f"
                      } as React.CSSProperties}
                      loading="lazy"
                    />
                  </Link>
                ))
              ) : (
                <>
                  <img
                    className="avatar avatar--cut"
                    src="/assets/img/dr-murray-clarke-cutout.webp"
                    alt="Dr. Murray Clarke"
                    width={44}
                    height={44}
                    style={{ "--s": "44px", background: "#c4ec9f" } as React.CSSProperties}
                    loading="lazy"
                  />
                  <img
                    className="avatar avatar--cut"
                    src="/assets/img/experts/dr-bill-sears.webp"
                    alt="Dr. Bill Sears"
                    width={44}
                    height={44}
                    style={{ "--s": "44px", background: "#ffdab5" } as React.CSSProperties}
                    loading="lazy"
                  />
                  <img
                    className="avatar avatar--cut"
                    src="/assets/img/experts/bryce-wylde.webp"
                    alt="Bryce Wylde"
                    width={44}
                    height={44}
                    style={{ "--s": "44px", background: "#fff3a3" } as React.CSSProperties}
                    loading="lazy"
                  />
                </>
              )}
            </span>
            <p>
              {trioExperts.length > 0 ? (
                <>
                  With{" "}
                  {trioExperts.map((exp, idx) => (
                    <React.Fragment key={exp.slug}>
                      <Link href={`/experts/${exp.slug}/`}>{exp.name}</Link>
                      {idx < trioExperts.length - 2
                        ? ", "
                        : idx === trioExperts.length - 2
                        ? " and "
                        : ""}
                    </React.Fragment>
                  ))}
                </>
              ) : (
                trioText
              )}
            </p>
          </div>
        </div>

        <div className="hero-panel">
          {welcomeCard?.enabled !== false && (
            <Link
              className="welcome welcome--soon"
              href={
                welcomeCard?.url
                  ? welcomeCard.url.startsWith("/")
                    ? welcomeCard.url
                    : `/${welcomeCard.url}`
                  : "/about/"
              }
            >
              <img
                src={welcomeCard?.image || "/assets/img/dr-murray-clarke-cutout.webp"}
                alt={welcomeCard?.title || "Welcome to The First Seven Years"}
                width={800}
                height={875}
              />
              <span className="welcome__play">
                <PlayIcon />
              </span>
              <span className="welcome__txt">
                <b>
                  {welcomeCard?.title ? (
                    welcomeCard.title.includes("\n") ? (
                      welcomeCard.title.split("\n").map((line: string, i: number) => (
                        <React.Fragment key={i}>
                          {line}
                          {i < welcomeCard.title.split("\n").length - 1 && <br />}
                        </React.Fragment>
                      ))
                    ) : welcomeCard.title.toLowerCase().startsWith("welcome to ") ? (
                      <>
                        Welcome to
                        <br />
                        {welcomeCard.title.slice(11)}
                      </>
                    ) : (
                      welcomeCard.title
                    )
                  ) : (
                    <>
                      Welcome to
                      <br />
                      The First Seven Years
                    </>
                  )}
                </b>
                <small>
                  {welcomeCard?.subtitle || "Dr. Murray Clarke & Bryce Wylde on what this library is and how to use it"}
                </small>
              </span>
            </Link>
          )}

          <div className="asking">
            <p className="asking__h">
              <span>Parents are asking</span>
              <Link href="/search/">See all</Link>
            </p>
            <ul>
              {askingItems.map((ans) => (
                <li key={ans.slug}>
                  <Link href={`/answers/${ans.slug}/`}>
                    <img
                      className="avatar avatar--cut"
                      src={ans.img}
                      alt=""
                      width={40}
                      height={40}
                      style={{ "--s": "40px", background: ans.bg } as React.CSSProperties}
                      loading="lazy"
                    />
                    <span>
                      <b>{ans.q}</b>
                      <small>{ans.sub}</small>
                    </span>
                    <ArrowIcon />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
