"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageShell } from "../../components/PageShell";

interface BookData {
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
  cover_type?: string;
  cover_image?: string;
  preorder_url?: string;
  topics?: string[];
}

export default function BookPage() {
  const [book, setBook] = useState<BookData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [topics, setTopics] = useState<any[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState(
    "You’re on the list — we’ll email you when publication details are announced."
  );

  useEffect(() => {
    Promise.allSettled([
      fetch("/api/book").then((res) => res.json()),
      fetch("/api/topics").then((res) => res.json()),
      fetch("/api/answers").then((res) => res.json()),
      fetch("/api/videos").then((res) => res.json()),
    ])
      .then(([bookRes, topicsRes, answersRes, videosRes]) => {
        if (bookRes.status === "fulfilled" && bookRes.value?.success && bookRes.value?.book) {
          setBook(bookRes.value.book);
        }
        if (topicsRes.status === "fulfilled" && topicsRes.value?.success && Array.isArray(topicsRes.value?.topics)) {
          setTopics(topicsRes.value.topics);
        }
        if (answersRes.status === "fulfilled" && answersRes.value?.success && Array.isArray(answersRes.value?.answers)) {
          setAnswers(answersRes.value.answers);
        }
        if (videosRes.status === "fulfilled" && videosRes.value?.success && Array.isArray(videosRes.value?.videos)) {
          setVideos(videosRes.value.videos);
        }
      })
      .catch((err) => {
        console.warn("Could not load dynamic data on /book:", err);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/book/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setSubmittedMessage(
          data.message ||
            "You’re on the list — we’ll email you when publication details are announced."
        );
        setSubmitted(true);
      } else {
        setSubmittedMessage(
          data.message || "Could not submit to waitlist. Please try again."
        );
        setSubmitted(true);
      }
    } catch {
      setSubmittedMessage(
        "You’re on the list — we’ll email you when publication details are announced."
      );
      setSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PageShell>
        <main id="main" style={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
          <div style={{ color: "var(--ink-light, #666)", fontSize: "1rem" }}>Loading book...</div>
        </main>
      </PageShell>
    );
  }

  if (!book || book.published === false) {
    return (
      <PageShell>
        <main id="main" style={{ minHeight: "50vh", display: "grid", placeItems: "center" }}>
          <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
            <h1 className="display" style={{ fontSize: "1.8rem" }}>Book Not Available</h1>
            <p className="lede" style={{ marginTop: "0.5rem" }}>No published book information was found.</p>
            <Link href="/" className="btn btn--sm btn--primary" style={{ marginTop: "1.5rem" }}>
              Return Home
            </Link>
          </div>
        </main>
      </PageShell>
    );
  }

  const selectedTopicSlugs = Array.isArray(book.topics) ? book.topics : [];
  const companionTopics = topics
    .filter((t: any) => selectedTopicSlugs.includes(t.slug))
    .sort((a: any, b: any) => {
      const idxA = selectedTopicSlugs.indexOf(a.slug);
      const idxB = selectedTopicSlugs.indexOf(b.slug);
      return (idxA !== -1 ? idxA : 999) - (idxB !== -1 ? idxB : 999);
    });

  return (
    <PageShell>
      <main id="main">
        {/* Breadcrumb */}
        <div className="page-head" style={{ paddingBottom: 0 }}>
          <div className="wrap">
            <nav aria-label="Breadcrumb">
              <ol className="crumbs">
                <li>
                  <Link href="/">Home</Link>
                </li>
                <li aria-current="page">The book</li>
              </ol>
            </nav>
          </div>
        </div>

        {/* Book Hero Section */}
        <section className="section--tight" style={{ paddingTop: 0 }}>
          <div className="wrap book">
            <div className="book__cover-wrap">
              {book.cover_image ? (
                <div
                  className="book__cover"
                  style={{
                    padding: 0,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#18283f',
                    boxShadow: '0 20px 35px -10px rgba(16,28,45,0.4)',
                  }}
                  role="img"
                  aria-label={`Cover for ${book.title} book by ${book.author}`}
                >
                  <img
                    src={book.cover_image}
                    alt={`Cover of ${book.title}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              ) : (
                <div
                  className="book__cover"
                  role="img"
                  aria-label={`Cover concept for ${book.title} book by ${book.author}`}
                >
                  <span className="t1">The First</span>
                  <span className="t2">
                    Seven
                    <br />
                    Years
                  </span>
                  <span className="sq">
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                    <i />
                  </span>
                  <span className="by">{book.author}</span>
                  <span className="sub">
                    {book.approved_by
                      ? book.approved_by.startsWith("Approved")
                        ? book.approved_by
                        : `Approved by ${book.approved_by}`
                      : ""}
                  </span>
                </div>
              )}
              <p className="muted book__note">
                {book.note ||
                  "Cover concept for the website only — final cover and title come from the publisher."}
              </p>
            </div>

            <div>
              <span className="eyebrow">
                {book.eyebrow || "The book · publication details to come"}
              </span>
              <h1 className="display" style={{ marginTop: ".6rem" }}>
                {book.title}
              </h1>
              <p className="lede" style={{ marginTop: "1rem" }}>
                {book.description}
              </p>
              <p style={{ marginTop: "1rem", color: "var(--ink-2)" }}>
                When it arrives, this site becomes its living companion: up-to-date answers,
                expert videos and references for the topics the book covers — so the conversation
                keeps going after the last page.
              </p>

              {book.preorder_url && (
                <div style={{ marginTop: "1.25rem", marginBottom: "1.25rem" }}>
                  <a
                    className="btn btn--mint"
                    href={book.preorder_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Pre-order {book.title} ↗
                  </a>
                </div>
              )}

              {!submitted ? (
                <form className="inline-form" onSubmit={handleSubmit} style={{ marginTop: "1.5rem" }}>
                  <label className="sr-only" htmlFor="bk-email">
                    Email address
                  </label>
                  <input
                    id="bk-email"
                    type="email"
                    required
                    placeholder="you@example.com"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                  <button className="btn" type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Submitting..." : "Tell me when it’s out"}
                  </button>
                </form>
              ) : (
                <p
                  className="form-msg is-success"
                  role="status"
                  style={{
                    display: "block",
                    color: "var(--navy)",
                    fontWeight: 500,
                    marginTop: "1.25rem",
                  }}
                >
                  {submittedMessage}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* The people behind the book */}
        <section className="section--tight">
          <div className="wrap">
            <div className="section-head">
              <h2>The people behind the book</h2>
              <p className="lede">
                One author, two doctors who approved it, and the show that keeps the conversation going.
              </p>
            </div>
            <ul className="experts stg-in">
              <li>
                <Link className="expert-card" href="/experts/bryce-wylde/">
                  <span className="expert-card__img" style={{ "--c": "#fbe7ac" } as React.CSSProperties}>
                    {book.author_image ? (
                      <img
                        src={book.author_image}
                        alt={book.author || "Bryce Wylde"}
                        loading="lazy"
                        width={800}
                        height={875}
                        style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 1, display: "block" }}
                      />
                    ) : (
                      <span className="ini">BW</span>
                    )}
                  </span>
                  <span>
                    <b>{book.author || "Bryce Wylde"}</b>
                    <span>{book.author_role || "Co-host · Functional medicine"}</span>
                  </span>
                </Link>
                <p className="book-role">Author</p>
              </li>
              <li>
                <Link className="expert-card" href="/experts/dr-bill-sears/">
                  <span className="expert-card__img" style={{ "--c": "#bfe4c6" } as React.CSSProperties}>
                    <img
                      src={book.approver1_image || "/assets/img/dr-bill-sears.jpg"}
                      alt={book.approver1_name || "Dr. Bill Sears"}
                      loading="lazy"
                      width={800}
                      height={875}
                      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 1, display: "block" }}
                    />
                  </span>
                  <span>
                    <b>{book.approver1_name || "Dr. Bill Sears"}</b>
                    <span>{book.approver1_role || "Pediatrician · Author · Featured expert"}</span>
                  </span>
                </Link>
                <p className="book-role">Approved the book</p>
              </li>
              <li>
                <Link className="expert-card" href="/experts/dr-murray-clarke/">
                  <span className="expert-card__img" style={{ "--c": "#a6d6b0" } as React.CSSProperties}>
                    <img
                      src={book.approver2_image || "/assets/img/dr-murray-clarke.jpg"}
                      alt={book.approver2_name || "Dr. Murray Clarke"}
                      loading="lazy"
                      width={800}
                      height={875}
                      style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 1, display: "block" }}
                    />
                  </span>
                  <span>
                    <b>{book.approver2_name || "Dr. Murray Clarke"}</b>
                    <span>{book.approver2_role || "Host · The First Seven Years"}</span>
                  </span>
                </Link>
                <p className="book-role">Approved the book</p>
              </li>
            </ul>
          </div>
        </section>

        {/* Companion resources */}
        {companionTopics.length > 0 && (
          <section className="section--tight">
            <div className="wrap">
              <div className="section-head">
                <h2>Companion resources</h2>
                <p className="lede">
                  Start with the topics parents ask about most. Each hub collects reviewed answers and videos from the show.
                </p>
              </div>
              <ul className="answers">
                {companionTopics.map((topic: any) => {
                  const topicAnswers = answers.filter(
                    (a: any) =>
                      (a.topic === topic.slug ||
                        a.topic === topic.name ||
                        (typeof a.topic === "string" &&
                          a.topic.toLowerCase().trim() === (topic.name || "").toLowerCase().trim())) &&
                      a.published !== false
                  );
                  const topicVideos = videos.filter(
                    (v: any) =>
                      (v.topic === topic.slug ||
                        v.topic === topic.name ||
                        (typeof v.topic === "string" &&
                          v.topic.toLowerCase().trim() === (topic.name || "").toLowerCase().trim())) &&
                      v.published !== false
                  );

                  const ansCount = topicAnswers.length;
                  const vidCount = topicVideos.length;

                  let statsLabel = "";
                  if (ansCount > 0 && vidCount > 0) {
                    statsLabel = `${ansCount} ${ansCount === 1 ? "answer" : "answers"} · ${vidCount} ${vidCount === 1 ? "video" : "videos"}`;
                  } else if (ansCount > 0) {
                    statsLabel = `${ansCount} ${ansCount === 1 ? "answer" : "answers"}`;
                  } else if (vidCount > 0) {
                    statsLabel = `${vidCount} ${vidCount === 1 ? "video" : "videos"}`;
                  } else {
                    statsLabel = "Explore topic";
                  }

                  return (
                    <li key={topic.slug}>
                      <Link className="answer-card" href={`/topics/${topic.slug}/`}>
                        <span className="q">{topic.name || topic.title}</span>
                        <span className="who">
                          <i style={{ background: topic.color || topic.swatch || "#bfe4c6" }} />
                          {statsLabel}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
              <p className="muted" style={{ marginTop: "1.5rem", fontSize: ".9rem" }}>
                Companion pages add to the book; they never reproduce it. Book content appears on this site only within the publishing rights agreed.
              </p>
            </div>
          </section>
        )}
      </main>
    </PageShell>
  );
}
