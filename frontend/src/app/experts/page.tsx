import React from "react";
import Link from "next/link";
import { PageShell } from "../../components/PageShell";
import { DynamicExpert } from "../../context/NavigationContext";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Experts — The First Seven Years",
  description: "Meet Dr. Murray Clarke, co-host Bryce Wylde and the pediatricians and practitioners who join The First Seven Years."
};


const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function getExperts(): Promise<DynamicExpert[]> {
  try {
    const res = await fetch(`${API_BASE}/experts`, {
      cache: "no-store"
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.experts)) {
        return data.experts.filter((e: DynamicExpert) => e.published !== false);
      }
    }
  } catch (err) {
    console.error("Failed to fetch dynamic experts:", err);
  }
  return [];
}

export default async function ExpertsPage() {
  const experts = await getExperts();

  return (
    <PageShell>
      <main id="main">
        <div className="page-head page-head--tint" style={{ "--tint": "var(--peach-soft)" } as React.CSSProperties}>
          <div className="wrap">
            <nav aria-label="Breadcrumb">
              <ol className="crumbs">
                <li>
                  <Link href="/">Home</Link>
                </li>
                <li aria-current="page">Experts</li>
              </ol>
            </nav>
            <h1>The experts</h1>
            <p className="lede">
              You always know who is speaking. Our hosts, and the pediatricians, researchers and practitioners who join them.
            </p>
          </div>
        </div>

        <section className="section--tight">
          <div className="wrap">
            {experts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "4rem 0", color: "var(--ink-muted, #667)" }}>
                <p style={{ fontSize: "1.1rem" }}>No experts are currently published in the library.</p>
              </div>
            ) : (
              <ul className="experts">
                {experts.map((e) => {
                  const initials = e.name
                    .split(" ")
                    .filter(Boolean)
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join("");
                  const swatchColor = e.swatch || e.color || "#bfe4c6";

                  return (
                    <li key={e.slug}>
                      <Link className="expert-card" href={`/experts/${e.slug}/`}>
                        <span className="expert-card__img" style={{ "--c": swatchColor } as React.CSSProperties}>
                          {e.img ? (
                            <img
                              src={e.img}
                              alt={e.name}
                              loading="lazy"
                              width={800}
                              height={875}
                            />
                          ) : (
                            <span className="ini">{initials}</span>
                          )}
                        </span>
                        <span>
                          <b>{e.name}</b>
                          <span>{e.role}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="section--tight" id="review-team">
          <div className="wrap">
            <div className="section-head">
              <h2>Who checks the answers</h2>
              <p className="lede">
                Every answer is reviewed before it is published. These are the roles behind that review.
              </p>
            </div>
            <ul className="principles">
              <li>
                <h3>Clinical lead</h3>
                <p>
                  <b>Dr. Murray Clarke</b> — final clinical sign-off on flagged content.
                </p>
              </li>
              <li>
                <h3>Scientific reviewer</h3>
                <p>
                  <b>To be announced</b> — checks the evidence, sources and accuracy of every health answer.
                </p>
              </li>
              <li>
                <h3>Legal &amp; regulatory review</h3>
                <p>
                  <b>To be announced</b> — checks disclosures and wording near nutrition and supplements.
                </p>
              </li>
              <li>
                <h3>Editorial</h3>
                <p>
                  Turns reviewed language into clear, plain-English pages and keeps tone and attribution consistent.
                </p>
              </li>
            </ul>
            <p className="muted" style={{ marginTop: "1.25rem" }}>
              How we verify experts: credentials are supplied by each expert and checked before their profile is published. Guests share their own views.{" "}
              <Link href="/about/#standards">Editorial standards</Link>
            </p>
          </div>
        </section>
      </main>
    </PageShell>
  );
}
