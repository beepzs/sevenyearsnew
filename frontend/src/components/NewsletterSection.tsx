"use client";

import React, { useState } from "react";

export function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
    }
  };

  return (
    <section className="section--tight" id="newsletter" aria-labelledby="nl-title">
      <div className="wrap">
        <div className="newsletter reveal">
          <div>
            <h2 id="nl-title">One good answer, every Sunday.</h2>
            <p style={{ marginTop: ".8rem" }}>
              A single question, answered well — plus the week’s new videos. Unsubscribe any time.
            </p>
          </div>
          <div>
            {!subscribed ? (
              <form className="inline-form" onSubmit={handleSubmit}>
                <label className="sr-only" htmlFor="nl-email">
                  Email address
                </label>
                <input
                  id="nl-email"
                  type="email"
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button className="btn" type="submit">
                  Subscribe
                </button>
              </form>
            ) : (
              <p className="form-msg is-success" role="status" style={{ display: "block", color: "var(--navy)", fontWeight: 500 }}>
                Welcome — your first Sunday answer is on its way.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
