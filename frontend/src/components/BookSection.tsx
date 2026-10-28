"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowIcon } from "./Icons";

interface BookData {
  title: string;
  subtitle: string;
  eyebrow: string;
  author: string;
  approved_by: string;
  description: string;
  note: string;
  status: string;
  publisher: string;
  published: boolean;
  cover_image?: string;
  preorder_url?: string;
}

const defaultBook: BookData = {
  title: "The First Seven Years, in print.",
  subtitle: "The First Seven Years",
  eyebrow: "The book · publication details to come",
  author: "Bryce Wylde",
  approved_by: "Dr. Bill Sears & Dr. Murray Clarke",
  description:
    "Written by Bryce Wylde and approved by Dr. Bill Sears and Dr. Murray Clarke. This site will be its living companion — updated answers, expert videos and references for every topic the book covers.",
  note: "",
  status: "coming_soon",
  publisher: "First Seven Years Press",
  published: true,
};

export function BookSection() {
  const [book, setBook] = useState<BookData>(defaultBook);
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedMessage, setSubmittedMessage] = useState(
    "You’re on the list — we’ll email you when publication details are announced."
  );

  useEffect(() => {
    fetch("/api/book")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.book) {
          setBook(data.book);
        }
      })
      .catch((err) => {
        console.warn("Could not load dynamic book data:", err);
      });
  }, []);

  if (!book || book.published === false) {
    return null;
  }

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

  return (
    <section className="section--tight" aria-labelledby="book-title">
      <div className="wrap book">
        <div className="book__cover-wrap reveal">
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

        <div className="reveal" style={{ "--d": "120ms" } as React.CSSProperties}>
          <span className="eyebrow">
            {book.eyebrow || "The book · publication details to come"}
          </span>
          <h2 id="book-title" className="h1" style={{ marginTop: ".8rem" }}>
            {book.subtitle || `${book.title}, in print.`}
          </h2>
          <p className="lede" style={{ marginTop: "1rem" }}>
            {book.description}
          </p>

          {!submitted ? (
            <form className="inline-form" onSubmit={handleSubmit}>
              <label className="sr-only" htmlFor="book-email">
                Email address
              </label>
              <input
                id="book-email"
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
                marginTop: "1rem",
              }}
            >
              {submittedMessage}
            </p>
          )}

          <div style={{ display: "flex", gap: "1.25rem", alignItems: "center", marginTop: "1.25rem", flexWrap: "wrap" }}>
            <Link className="link-arrow" href="/book/">
              About the book <ArrowIcon />
            </Link>
            {book.preorder_url && (
              <a
                className="btn btn--mint"
                href={book.preorder_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ padding: "0.5rem 1rem", fontSize: "0.9rem" }}
              >
                Pre-order Now ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
