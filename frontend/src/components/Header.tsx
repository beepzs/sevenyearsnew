"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useNavigation } from "../context/NavigationContext";
import { SearchIcon, ChatIcon, MenuIcon, ChevronDownIcon, ArrowIcon } from "./Icons";
import { getVideoFormat, getVideoUrl, getVideoThumbnail, getExpertDisplayName } from "../utils/videos";

interface HeaderProps {
  onOpenDrawer: () => void;
  onFocusSearch?: () => void;
}

export function Header({ onOpenDrawer, onFocusSearch }: HeaderProps) {
  const { headerItems, topics, experts, answers, videos } = useNavigation();
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveMenu(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleMouseEnter = (menuName: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(menuName);
    }, 120);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setActiveMenu(null);
    }, 180);
  };

  const toggleMenu = (menuName: string) => {
    setActiveMenu((prev) => (prev === menuName ? null : menuName));
  };

  // Helper to determine mega menu type based on label or url
  const getMenuType = (label: string, url: string): "topics" | "answers" | "videos" | "experts" | "about" | "link" => {
    const l = label.toLowerCase();
    const u = url.toLowerCase();
    if (l.includes("topic") || u.includes("/topics")) return "topics";
    if (l.includes("answer") || u.includes("/answers")) return "answers";
    if (l.includes("watch") || l.includes("video") || u.includes("/videos")) return "videos";
    if (l.includes("expert") || u.includes("/experts")) return "experts";
    if (l.includes("about") || u.includes("/about")) return "about";
    return "link";
  };

  // Divide topics into 3 columns for mega grid
  const topicCol1 = topics.slice(0, 5);
  const topicCol2 = topics.slice(5, 10);
  const topicCol3 = topics.slice(10);

  return (
    <header ref={headerRef} className={`bar is-ready ${isScrolled ? "is-scrolled" : ""}`}>
      <div className="wrap bar__in">
        <Link className="bar__brand" href="/" aria-label="The First Seven Years — home">
          <Image
            className="logo-img"
            src="/assets/img/logo.jpg"
            alt="The First Seven Years"
            width={76}
            height={76}
            priority
          />
        </Link>

        <nav className="mega" aria-label="Main">
          <ul className="mega__menu">
            {headerItems.map((item) => {
              const menuType = getMenuType(item.label, item.url);

              // 1. TOPICS MEGA MENU
              if (menuType === "topics") {
                return (
                  <li
                    key={item.id}
                    className="mega__item"
                    onMouseEnter={() => handleMouseEnter("topics")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      className="mega__trigger"
                      type="button"
                      aria-expanded={activeMenu === "topics"}
                      onClick={() => toggleMenu("topics")}
                    >
                      {item.label}
                      <ChevronDownIcon />
                    </button>
                    <div className="mega__panel" hidden={activeMenu !== "topics"}>
                      <div className="wrap">
                        <div className="mega__grid mega__grid--topics">
                          <div>
                            <p className="mega__kicker">
                              {topics.length > 0 ? `${topics.length} topics for ages 0–7` : "No topics published"}
                            </p>
                            {topics.length > 0 ? (
                              <div className="mega__cols">
                                <ul>
                                  {topicCol1.map((t) => (
                                    <li key={t.slug}>
                                      <Link href={`/topics/${t.slug}/`}>
                                        <i style={{ background: t.color }} />
                                        <span>
                                          {t.name}
                                          <small>{t.desc}</small>
                                        </span>
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                                <ul>
                                  {topicCol2.map((t) => (
                                    <li key={t.slug}>
                                      <Link href={`/topics/${t.slug}/`}>
                                        <i style={{ background: t.color }} />
                                        <span>
                                          {t.name}
                                          <small>{t.desc}</small>
                                        </span>
                                      </Link>
                                    </li>
                                  ))}
                                </ul>
                                {topicCol3.length > 0 && (
                                  <ul>
                                    {topicCol3.map((t) => (
                                      <li key={t.slug}>
                                        <Link href={`/topics/${t.slug}/`}>
                                          <i style={{ background: t.color }} />
                                          <span>
                                            {t.name}
                                            <small>{t.desc}</small>
                                          </span>
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ) : (
                              <p style={{ padding: "1.5rem 0", color: "var(--ink-muted, #667)" }}>
                                No topics are currently published in the CMS.
                              </p>
                            )}
                          </div>
                          <div className="mega__aside">
                            <p className="mega__kicker">Start here</p>
                            <Link className="mega__cta" href="/topics/">
                              Browse all topics <ArrowIcon />
                            </Link>
                            <Link className="mega__cta" href="/search/">
                              Search by question <SearchIcon />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              }

              // 2. PARENT ANSWERS MEGA MENU
              if (menuType === "answers") {
                const publishedAnswers = (answers || []).filter((a) => a.published !== false);
                return (
                  <li
                    key={item.id}
                    className="mega__item"
                    onMouseEnter={() => handleMouseEnter("answers")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      className="mega__trigger"
                      type="button"
                      aria-expanded={activeMenu === "answers"}
                      onClick={() => toggleMenu("answers")}
                    >
                      {item.label}
                      <ChevronDownIcon />
                    </button>
                    <div className="mega__panel" hidden={activeMenu !== "answers"}>
                      <div className="wrap">
                        <div className="mega__grid">
                          <div>
                            <p className="mega__kicker">Questions parents ask most</p>
                            {publishedAnswers.length > 0 ? (
                              <ul className="mega__list">
                                {publishedAnswers.slice(0, 6).map((ans) => (
                                  <li key={ans.slug}>
                                    <Link href={`/answers/${ans.slug}/`}>
                                      {ans.q}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p style={{ padding: "1.5rem 0", color: "var(--ink-muted, #667)" }}>
                                No answers are currently published in the CMS.
                              </p>
                            )}
                            <Link className="mega__more" href="/search/">
                              Search every answer <ArrowIcon />
                            </Link>
                          </div>
                          <div className="mega__aside mega__aside--peach">
                            <p className="mega__kicker">Can’t find it?</p>
                            <p>Send Dr. Murray your question. The most-asked become new answers.</p>
                            <Link className="btn btn--sm" href="/ask-the-doctor/">
                              Ask the Doctor
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              }

              // 3. WATCH & LISTEN MEGA MENU
              if (menuType === "videos") {
                const publishedVideos = (videos || []).filter((v) => v.published !== false);

                const episodeCount = publishedVideos.filter((v) => getVideoFormat(v) === "episode").length;
                const clipCount = publishedVideos.filter((v) => getVideoFormat(v) === "clip").length;
                const shortCount = publishedVideos.filter((v) => getVideoFormat(v) === "short").length;

                // Pick the latest episode or latest video as the featured card
                const latestEpisode =
                  publishedVideos.find((v) => getVideoFormat(v) === "episode") || publishedVideos[0] || null;

                const featTarget = latestEpisode ? getVideoUrl(latestEpisode) : null;
                const featThumb = latestEpisode ? getVideoThumbnail(latestEpisode, false) : "";
                const featTitle = latestEpisode ? latestEpisode.title : "";
                const featDur = latestEpisode?.duration ? `Latest episode · ${latestEpisode.duration}` : "Latest episode";
                const featExpert = latestEpisode ? `with ${getExpertDisplayName(latestEpisode.expert || latestEpisode.guest, experts)}` : "";

                return (
                  <li
                    key={item.id}
                    className="mega__item"
                    onMouseEnter={() => handleMouseEnter("videos")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      className="mega__trigger"
                      type="button"
                      aria-expanded={activeMenu === "videos"}
                      onClick={() => toggleMenu("videos")}
                    >
                      {item.label}
                      <ChevronDownIcon />
                    </button>
                    <div className="mega__panel" hidden={activeMenu !== "videos"}>
                      <div className="wrap">
                        <div className="mega__grid">
                          <div>
                            <p className="mega__kicker">Pick a format</p>
                            <ul className="mega__fmts">
                              <li>
                                <Link className="mega__fmt" href="/videos/full-episodes/">
                                  <span className="fmt-badge fmt-badge--episode">Full episode</span>
                                  <b>Full episodes <small>{episodeCount}</small></b>
                                  <span>The long-form podcast conversations — 45 minutes to 1.5 hours with a guest expert.</span>
                                </Link>
                              </li>
                              <li>
                                <Link className="mega__fmt" href="/videos/short-videos/">
                                  <span className="fmt-badge fmt-badge--video">Short video</span>
                                  <b>Short videos <small>{clipCount}</small></b>
                                  <span>7–12 minutes on a single question — one expert, one idea, straight to the point.</span>
                                </Link>
                              </li>
                              <li>
                                <Link className="mega__fmt" href="/videos/social-clips/">
                                  <span className="fmt-badge fmt-badge--social">Social clip</span>
                                  <b>Social clips <small>{shortCount}</small></b>
                                  <span>A minute or two, made for your phone. Vertical clips from YouTube Shorts and social.</span>
                                </Link>
                              </li>
                            </ul>
                          </div>
                          <div>
                            {latestEpisode && featTarget ? (
                              featTarget.isExternal ? (
                                <a className="mega__feature" href={featTarget.url} target="_blank" rel="noopener noreferrer">
                                  <img
                                    src={featThumb}
                                    alt={featTitle}
                                    width={480}
                                    height={270}
                                    loading="lazy"
                                  />
                                  <span className="fmt-badge fmt-badge--episode">{featDur}</span>
                                  <b>{featTitle}</b>
                                  <small>{featExpert}</small>
                                </a>
                              ) : (
                                <Link className="mega__feature" href={featTarget.url}>
                                  <img
                                    src={featThumb}
                                    alt={featTitle}
                                    width={480}
                                    height={270}
                                    loading="lazy"
                                  />
                                  <span className="fmt-badge fmt-badge--episode">{featDur}</span>
                                  <b>{featTitle}</b>
                                  <small>{featExpert}</small>
                                </Link>
                              )
                            ) : (
                              <div
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  textAlign: "center",
                                  padding: "2.5rem 1.5rem",
                                  background: "var(--cream-soft, #f7f5f0)",
                                  borderRadius: "1rem",
                                  minHeight: "220px",
                                  color: "var(--ink-muted, #667)"
                                }}
                              >
                                <span className="fmt-badge fmt-badge--episode" style={{ marginBottom: ".75rem" }}>
                                  Watch &amp; listen
                                </span>
                                <b style={{ color: "var(--ink, #1f2d3d)", fontSize: "1.05rem" }}>
                                  New episodes coming soon
                                </b>
                                <small style={{ marginTop: ".35rem" }}>
                                  Published videos and podcast episodes will appear here.
                                </small>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              }

              // 4. EXPERTS MEGA MENU
              if (menuType === "experts") {
                const activeExperts = (experts || []).filter((e) => e.published !== false);
                return (
                  <li
                    key={item.id}
                    className="mega__item"
                    onMouseEnter={() => handleMouseEnter("experts")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      className="mega__trigger"
                      type="button"
                      aria-expanded={activeMenu === "experts"}
                      onClick={() => toggleMenu("experts")}
                    >
                      {item.label}
                      <ChevronDownIcon />
                    </button>
                    <div className="mega__panel" hidden={activeMenu !== "experts"}>
                      <div className="wrap">
                        <div className="mega__grid">
                          <div>
                            <p className="mega__kicker">Who answers here</p>
                            {activeExperts.length === 0 ? (
                              <p style={{ padding: "1rem 0", color: "var(--ink-muted, #778)", fontSize: ".95rem" }}>
                                No experts currently published.
                              </p>
                            ) : (
                              <ul className="mega__people">
                                {activeExperts.map((exp) => {
                                  const initials = exp.name
                                    .split(" ")
                                    .filter(Boolean)
                                    .map((n) => n[0])
                                    .slice(0, 2)
                                    .join("");
                                  return (
                                    <li key={exp.slug}>
                                      <Link className="mega__person" href={`/experts/${exp.slug}/`}>
                                        {exp.img ? (
                                          <img
                                            className="avatar"
                                            src={exp.img}
                                            alt={exp.name}
                                            width={48}
                                            height={48}
                                            style={{ "--s": "48px" } as React.CSSProperties}
                                            loading="lazy"
                                          />
                                        ) : (
                                          <span
                                            className="avatar avatar--ini"
                                            style={
                                              {
                                                "--s": "48px",
                                                background: exp.swatch || exp.color || "#bfe4c6"
                                              } as React.CSSProperties
                                            }
                                            aria-hidden="true"
                                          >
                                            {initials}
                                          </span>
                                        )}
                                        <span>
                                          <b>{exp.name}</b>
                                          <small>{exp.role}</small>
                                        </span>
                                      </Link>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                            <Link className="mega__more" href="/experts/">
                              All experts <ArrowIcon />
                            </Link>
                          </div>
                          <div className="mega__aside">
                            <p className="mega__kicker">How we check</p>
                            <p>Every expert is named, with credentials on their profile. Answers are reviewed before they are published.</p>
                            <Link className="mega__more" href="/about/#standards">
                              Editorial standards <ArrowIcon />
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              }

              // 5. ABOUT MEGA MENU
              if (menuType === "about") {
                return (
                  <li
                    key={item.id}
                    className="mega__item"
                    onMouseEnter={() => handleMouseEnter("about")}
                    onMouseLeave={handleMouseLeave}
                  >
                    <button
                      className="mega__trigger"
                      type="button"
                      aria-expanded={activeMenu === "about"}
                      onClick={() => toggleMenu("about")}
                    >
                      {item.label}
                      <ChevronDownIcon />
                    </button>
                    <div className="mega__panel" hidden={activeMenu !== "about"}>
                      <div className="wrap">
                        <div className="mega__grid mega__grid--simple">
                          <ul className="mega__list mega__list--plain">
                            <li>
                              <Link href="/about/">About The First Seven Years</Link>
                            </li>
                            <li>
                              <Link href="/about/#standards">Editorial standards &amp; review</Link>
                            </li>
                            <li>
                              <Link href="/about/#disclosure">Sponsors &amp; relationships</Link>
                            </li>
                            <li>
                              <Link href="/medical-disclaimer/">Medical disclaimer</Link>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              }

              // 6. DIRECT LINK (e.g. "The book", "FAQ", or custom link added from Admin)
              return (
                <li key={item.id} className="mega__item">
                  <Link
                    className="mega__link"
                    href={item.url}
                    target={item.target || "_self"}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="bar__tools">
          <Link
            className="bar__search"
            href="/search/"
            aria-label="Search questions"
          >
            <SearchIcon />
          </Link>
          <Link className="btn btn--mint bar__cta" href="/ask-the-doctor/">
            <ChatIcon />
            Ask the Doctor
          </Link>
          <button
            className="menu-btn"
            type="button"
            onClick={onOpenDrawer}
            aria-controls="drawer"
            aria-expanded="false"
            aria-label="Open menu"
          >
            <MenuIcon />
          </button>
        </div>
      </div>
    </header>
  );
}
