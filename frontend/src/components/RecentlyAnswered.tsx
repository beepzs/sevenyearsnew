"use client";

import React from "react";
import Link from "next/link";
import { useNavigation } from "../context/NavigationContext";

export function RecentlyAnswered() {
  const { answers, topics, experts } = useNavigation();

  const canonicalAnswers = [
    {
      slug: "is-my-childs-eczema-a-gut-problem",
      q: "Is my child’s eczema really a gut problem?",
      authorName: "Joy McCarthy",
      topicName: "Skin & eczema",
      color: "#ffb1c9",
    },
    {
      slug: "what-is-leaky-gut",
      q: "What is “leaky gut”, really?",
      authorName: "Dr. Elisa Song",
      topicName: "Gut health & microbiome",
      color: "#b2e6a8",
    },
    {
      slug: "prebiotics-vs-probiotics-vs-postbiotics",
      q: "Prebiotics, probiotics, postbiotics — what’s the difference?",
      authorName: "Dr. Elisa Song",
      topicName: "Gut health & microbiome",
      color: "#b2e6a8",
    },
    {
      slug: "restoring-the-gut-after-antibiotics",
      q: "How do I help my child’s gut recover after antibiotics?",
      authorName: "Dr. Elisa Song",
      topicName: "Gut health & microbiome",
      color: "#b2e6a8",
    },
    {
      slug: "are-pets-and-dirt-good-for-immunity",
      q: "Are pets and a bit of dirt actually good for my child?",
      authorName: "Dr. Elisa Song",
      topicName: "Immunity & everyday illness",
      color: "#a7d8ff",
    },
    {
      slug: "is-it-okay-to-kiss-my-baby",
      q: "Is it okay to kiss my baby on the face?",
      authorName: "Dr. Elisa Song",
      topicName: "Immunity & everyday illness",
      color: "#a7d8ff",
    },
  ];

  const getTopic = (topicSlug?: string | null) => {
    if (!topicSlug) return null;
    return topics.find((t) => t.slug === topicSlug) || null;
  };

  const getExpert = (expertSlug?: string | null) => {
    if (!expertSlug) return null;
    return experts.find((e) => e.slug === expertSlug) || null;
  };

  // Filter out any dummy test questions
  const validDynamicAnswers = (answers || [])
    .filter((a) => a.published !== false)
    .filter((a) => !a.q.toLowerCase().startsWith("test") && !a.q.toLowerCase().includes("test test"))
    .map((item) => {
      const top = getTopic(item.topic);
      const exp = getExpert(item.expert);
      return {
        slug: item.slug,
        q: item.q,
        authorName: exp?.name || "Dr. Murray Clarke",
        topicName: top?.name || "General",
        color: top?.color || "#b2e6a8",
      };
    });

  // Merge canonical answers with valid dynamic answers, avoiding duplicates
  const seenSlugs = new Set<string>();
  const combinedAnswers: Array<{ slug: string; q: string; authorName: string; topicName: string; color: string }> = [];

  // If there are valid dynamic answers, include them
  for (const a of validDynamicAnswers) {
    if (!seenSlugs.has(a.slug)) {
      seenSlugs.add(a.slug);
      combinedAnswers.push(a);
    }
  }

  // Fill in canonical answers from python site
  for (const c of canonicalAnswers) {
    if (!seenSlugs.has(c.slug)) {
      seenSlugs.add(c.slug);
      combinedAnswers.push(c);
    }
  }

  const displayList = combinedAnswers.slice(0, 6);

  return (
    <section className="section" aria-labelledby="recent-title">
      <div className="wrap">
        <div className="section-head reveal">
          <h2 id="recent-title">Recently answered</h2>
          <p className="lede">
            Short, practical answers — each one with the expert video it came from, and the date it was last reviewed.
          </p>
        </div>

        <ul className="answers reveal">
          {displayList.map((item) => {
            return (
              <li key={item.slug}>
                <Link
                  className="answer-card"
                  href={`/answers/${item.slug}/`}
                  style={{ "--sw": item.color } as React.CSSProperties}
                >
                  <span className="q">{item.q}</span>
                  <span className="who">
                    <i style={{ background: item.color }} />
                    {item.authorName} · {item.topicName}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
