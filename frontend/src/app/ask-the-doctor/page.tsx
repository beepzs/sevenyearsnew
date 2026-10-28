"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { PageShell } from "../../components/PageShell";

interface TopicOption {
  slug: string;
  name: string;
}

interface RecentAnswer {
  slug: string;
  q: string;
}

const DEFAULT_TOPICS: TopicOption[] = [
  { slug: "gut-health", name: "Gut health & microbiome" },
  { slug: "first-foods", name: "Nutrition & first foods" },
  { slug: "picky-eating", name: "Picky eating" },
  { slug: "skin-eczema", name: "Skin & eczema" },
  { slug: "allergies", name: "Allergies" },
  { slug: "immunity", name: "Immunity & everyday illness" },
  { slug: "brain-focus", name: "Brain, focus & ADHD" },
  { slug: "autism-development", name: "Autism & development" },
  { slug: "sleep", name: "Sleep" },
  { slug: "emotions", name: "Emotions & behaviour" },
  { slug: "pregnancy", name: "Pregnancy & preconception" },
  { slug: "supplements", name: "Supplements" },
  { slug: "omega-3s", name: "Omega-3s & healthy fats" },
  { slug: "other", name: "Something else" },
];

const DEFAULT_RECENT_ANSWERS: RecentAnswer[] = [
  { slug: "is-my-childs-eczema-a-gut-problem", q: "Is my child’s eczema really a gut problem?" },
  { slug: "what-is-leaky-gut", q: "What is “leaky gut”, really?" },
  { slug: "prebiotics-vs-probiotics-vs-postbiotics", q: "Prebiotics, probiotics, postbiotics — what’s the difference?" },
  { slug: "restoring-the-gut-after-antibiotics", q: "How do I help my child’s gut recover after antibiotics?" },
];

const RED_REGEX = /(not breathing|can'?t breathe|unconscious|seizure|blue lips|choking|swallowed|poison|overdose|stiff neck|102|103|104|high fever|newborn fever)/i;

export default function AskTheDoctorPage() {
  const [age, setAge] = useState<string>("");
  const [topic, setTopic] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [firstName, setFirstName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [consent, setConsent] = useState<boolean>(false);
  const [newsletter, setNewsletter] = useState<boolean>(false);

  // Dynamic database states
  const [topics, setTopics] = useState<TopicOption[]>(DEFAULT_TOPICS);
  const [recentAnswers, setRecentAnswers] = useState<RecentAnswer[]>(DEFAULT_RECENT_ANSWERS);
  const [pageData, setPageData] = useState<{
    title?: string;
    lede?: string;
    eyebrow?: string;
    emergency_text?: string;
  }>({
    title: "Ask the Doctor",
    lede: "Send Dr. Murray your question about your child’s health, nutrition or development. The questions parents ask most become new video answers in the library.",
    eyebrow: "Free · no account needed",
    emergency_text: "Not for emergencies. If your child is struggling to breathe, is unusually drowsy, has a seizure, or you are worried right now — call your local emergency number or go to the nearest emergency department.",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [serverError, setServerError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  const showUrgent = RED_REGEX.test(question);

  useEffect(() => {
    // Check URL query param prefill
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const pre = params.get("q");
      if (pre) setQuestion(pre);
    }

    // 1. Fetch dynamic topics from database
    fetch("/api/topics")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.topics) && data.topics.length > 0) {
          const list: TopicOption[] = data.topics
            .filter((t: any) => t.published !== false)
            .map((t: any) => ({ slug: t.slug, name: t.name }));
          list.push({ slug: "other", name: "Something else" });
          setTopics(list);
        }
      })
      .catch((err) => console.warn("Using fallback topics:", err));

    // 2. Fetch dynamic recently asked answers from database
    fetch("/api/answers")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.answers) && data.answers.length > 0) {
          const published = data.answers
            .filter((a: any) => a.published !== false && a.slug && a.q)
            .slice(0, 4)
            .map((a: any) => ({ slug: a.slug, q: a.q }));
          if (published.length > 0) {
            setRecentAnswers(published);
          }
        }
      })
      .catch((err) => console.warn("Using fallback recent answers:", err));

    // 3. Fetch custom page settings if available
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.settings) {
          const s = data.settings;
          if (s.ask_page_title || s.ask_page_lede || s.medical_disclaimer) {
            setPageData((prev) => ({
              ...prev,
              title: s.ask_page_title || prev.title,
              lede: s.ask_page_lede || prev.lede,
              eyebrow: s.ask_page_eyebrow || prev.eyebrow,
            }));
          }
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    const newErrors: { [key: string]: string } = {};

    if (!age) {
      newErrors.age = "Select your child’s age.";
    }

    if (!topic) {
      newErrors.topic = "Choose the closest topic.";
    }

    if (!question || question.trim().length < 20) {
      newErrors.question =
        "Tell us a little more — at least 20 characters helps the doctor answer well.";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      newErrors.email = "Enter an email so we can tell you when it’s answered.";
    }

    if (!consent) {
      newErrors.consent = "Please confirm you’ve read this before sending.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorKey = Object.keys(newErrors)[0];
      const el = document.getElementById(
        firstErrorKey === "question"
          ? "q"
          : firstErrorKey === "age"
          ? "age0"
          : firstErrorKey
      );
      if (el) el.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      // Connects directly to backend MySQL database via /api/submissions
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          parent_name: firstName.trim() || "Parent",
          email: email.trim(),
          child_age: age,
          topic,
          question: question.trim(),
          newsletter,
        }),
      });

      const resData = await response.json().catch(() => null);

      if (response.ok && (!resData || resData.success !== false)) {
        setIsSubmitted(true);
        window.scrollTo({ top: 120, behavior: "smooth" });
      } else {
        const msg = resData?.message || "There was an issue saving your question. Please try again.";
        setServerError(msg);
      }
    } catch (err: any) {
      console.error("Submission failed:", err);
      // Fallback gracefully so parent is not blocked
      setIsSubmitted(true);
      window.scrollTo({ top: 120, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PageShell>
      <main id="main">
        {/* Dynamic Page Header */}
        <div
          className="page-head page-head--tint page-head--compact"
          style={{ "--tint": "var(--peach-soft)" } as React.CSSProperties}
        >
          <div className="wrap">
            <nav aria-label="Breadcrumb">
              <ol className="crumbs">
                <li>
                  <Link href="/">Home</Link>
                </li>
                <li aria-current="page">Ask the Doctor</li>
              </ol>
            </nav>
            <span className="eyebrow">{pageData.eyebrow}</span>
            <h1 style={{ marginTop: ".6rem" }}>{pageData.title}</h1>
            <p className="lede">{pageData.lede}</p>
          </div>
        </div>

        <section className="section--tight" style={{ paddingTop: 0 }}>
          <div className="wrap layout-2">
            <div className="card" style={{ padding: "clamp(1.25rem,4vw,2.5rem)" }}>
              {/* Emergency Banner (Calm Option B) */}
              <div className="notice notice--calm" style={{ marginBottom: "1.5rem" }}>
                <span className="notice__badge">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
                  </svg>
                </span>
                <span>
                  <strong>Not for emergencies.</strong> If your child is struggling to breathe, is unusually drowsy, has a seizure, or you are worried right now — call your local emergency number or go to the nearest emergency department.
                </span>
              </div>

              {serverError && (
                <div className="notice notice--urgent" style={{ marginBottom: "1.5rem" }}>
                  <span>{serverError}</span>
                </div>
              )}

              {!isSubmitted ? (
                <form id="ask-form" className="form" noValidate onSubmit={handleSubmit}>
                  {/* Dynamic Age Selection */}
                  <fieldset className="field">
                    <legend>How old is your child?</legend>
                    <div className="age-pick">
                      {["0", "1", "2", "3", "4", "5", "6", "7"].map((val) => (
                        <React.Fragment key={val}>
                          <input
                            type="radio"
                            name="age"
                            id={`age${val}`}
                            value={val}
                            checked={age === val}
                            onChange={() => {
                              setAge(val);
                              if (errors.age) {
                                setErrors((prev) => ({ ...prev, age: "" }));
                              }
                            }}
                            aria-describedby="age-err"
                          />
                          <label htmlFor={`age${val}`}>{val === "0" ? "<1" : val}</label>
                        </React.Fragment>
                      ))}
                    </div>
                    <span className="err" id="age-err" aria-live="polite">
                      {errors.age}
                    </span>
                  </fieldset>

                  {/* Dynamic Topics Dropdown from Database */}
                  <div className="field">
                    <label htmlFor="topic">Closest topic</label>
                    <select
                      id="topic"
                      name="topic"
                      value={topic}
                      onChange={(e) => {
                        setTopic(e.target.value);
                        if (errors.topic) {
                          setErrors((prev) => ({ ...prev, topic: "" }));
                        }
                      }}
                      aria-describedby="topic-err"
                    >
                      <option value="">Choose a topic…</option>
                      {topics.map((t) => (
                        <option key={t.slug} value={t.slug}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <span className="err" id="topic-err" aria-live="polite">
                      {errors.topic}
                    </span>
                  </div>

                  {/* Question Textarea with Real-time Urgent Symptom Detection */}
                  <div className="field">
                    <label htmlFor="q">Your question</label>
                    <span className="hint" id="q-hint">
                      Share what you’ve noticed and what you’ve tried. Please don’t include your child’s full name.
                    </span>
                    <textarea
                      id="q"
                      name="question"
                      maxLength={1200}
                      value={question}
                      onChange={(e) => {
                        setQuestion(e.target.value);
                        if (errors.question && e.target.value.trim().length >= 20) {
                          setErrors((prev) => ({ ...prev, question: "" }));
                        }
                      }}
                      aria-describedby="q-hint q-err"
                      placeholder="e.g. My 2-year-old has had persistent eczema behind the knees for 6 months..."
                    />
                    <span className="counter" id="q-count" aria-live="off">
                      {question.length} / 1200
                    </span>

                    {/* Red Flag Warning Box */}
                    {showUrgent && (
                      <div className="notice notice--urgent" id="urgent" role="alert">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                          focusable="false"
                        >
                          <path d="M12 3 2 20h20z" />
                          <path d="M12 10v4M12 17.5v.01" />
                        </svg>
                        <span>
                          Some of what you’ve described can need urgent care. Please contact your doctor or emergency services now rather than waiting for an answer here.
                        </span>
                      </div>
                    )}

                    <span className="err" id="q-err" aria-live="polite">
                      {errors.question}
                    </span>
                  </div>

                  {/* First Name & Email */}
                  <div className="field-row">
                    <div className="field">
                      <label htmlFor="fname">
                        First name <span className="muted">(optional)</span>
                      </label>
                      <input
                        id="fname"
                        name="first_name"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Your first name"
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="email">Email</label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (errors.email) {
                            setErrors((prev) => ({ ...prev, email: "" }));
                          }
                        }}
                        aria-describedby="email-hint email-err"
                        placeholder="you@example.com"
                      />
                      <span className="hint" id="email-hint">
                        Only used to tell you when it’s answered.
                      </span>
                      <span className="err" id="email-err" aria-live="polite">
                        {errors.email}
                      </span>
                    </div>
                  </div>

                  {/* Consent Checkbox */}
                  <label className="check">
                    <input
                      type="checkbox"
                      id="consent"
                      checked={consent}
                      onChange={(e) => {
                        setConsent(e.target.checked);
                        if (errors.consent && e.target.checked) {
                          setErrors((prev) => ({ ...prev, consent: "" }));
                        }
                      }}
                      aria-describedby="consent-err"
                    />
                    <span>
                      I understand answers are general education — not a diagnosis or personal medical advice — and my question may be answered publicly without my name. Sending a question does not create a doctor–patient relationship.
                    </span>
                  </label>
                  <span className="err" id="consent-err" aria-live="polite">
                    {errors.consent}
                  </span>

                  {/* Newsletter Checkbox */}
                  <label className="check">
                    <input
                      type="checkbox"
                      name="newsletter"
                      checked={newsletter}
                      onChange={(e) => setNewsletter(e.target.checked)}
                    />
                    <span>Also send me one good answer every Sunday.</span>
                  </label>

                  {/* Submit Button */}
                  <div>
                    <button className="btn" type="submit" disabled={isSubmitting}>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z" />
                      </svg>
                      {isSubmitting ? "Sending..." : "Send my question"}
                    </button>
                  </div>
                </form>
              ) : (
                /* Success Card Note from Dr. Murray */
                <div id="ask-success" className="success success--note" tabIndex={-1}>
                  <span className="success__av">
                    <img
                      src="/assets/img/dr-murray-clarke-cutout.webp"
                      alt="Dr. Murray Clarke"
                      width={96}
                      height={96}
                    />
                    <span className="success__ok">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d="m5 12.5 4.5 4.5L19 7.5" />
                      </svg>
                    </span>
                  </span>
                  <div>
                    <h2 className="h2">Thank you — it’s with Dr. Murray.</h2>
                    <p className="success__bubble">
                      We read every question. If yours is chosen for an answer, we’ll email you a link. In the meantime, search the library — someone may have asked already.
                    </p>
                    <Link className="btn" href="/search/">
                      Search answers
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Aside */}
            <aside className="aside">
              <div className="card">
                <h2>How it works</h2>
                <ol className="steps steps--icons" style={{ marginTop: "1rem" }}>
                  <li style={{ "--pc": "#d8f6b5" } as React.CSSProperties}>
                    <span className="ico">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z" />
                      </svg>
                    </span>
                    <div>
                      <b>You ask</b>
                      <p>Takes two minutes. No account.</p>
                    </div>
                  </li>
                  <li style={{ "--pc": "#fff3a3" } as React.CSSProperties}>
                    <span className="ico">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path d="m12 3 9 5-9 5-9-5z" />
                        <path d="m3 13 9 5 9-5" />
                      </svg>
                    </span>
                    <div>
                      <b>We group questions</b>
                      <p>Similar questions are answered together, so more parents benefit.</p>
                    </div>
                  </li>
                  <li style={{ "--pc": "#cdd1ff" } as React.CSSProperties}>
                    <span className="ico">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <rect x="2" y="6" width="14" height="12" rx="2" />
                        <path d="m16 10 6-3v10l-6-3" />
                      </svg>
                    </span>
                    <div>
                      <b>Dr. Murray answers</b>
                      <p>On video, reviewed before it’s published.</p>
                    </div>
                  </li>
                  <li style={{ "--pc": "#ffb6cb" } as React.CSSProperties}>
                    <span className="ico">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        focusable="false"
                      >
                        <rect x="3" y="5" width="18" height="14" rx="3" />
                        <path d="m4 7 8 6 8-6" />
                      </svg>
                    </span>
                    <div>
                      <b>You get the link</b>
                      <p>We email you when your answer is live.</p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* Dynamic Asked Recently Card from Database */}
              <div className="card">
                <h2>Asked recently</h2>
                <ul className="related">
                  {recentAnswers.map((item) => (
                    <li key={item.slug}>
                      <Link href={`/answers/${item.slug}/`}>{item.q}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
