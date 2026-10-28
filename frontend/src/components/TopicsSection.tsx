"use client";

import React from "react";
import Link from "next/link";
import { useNavigation } from "../context/NavigationContext";
import { ArrowIcon } from "./Icons";

export function TopicsSection() {
  const { topics } = useNavigation();

  if (!topics || topics.length === 0) {
    return null;
  }

  return (
    <section className="section" aria-labelledby="topics-title">
      <div className="wrap">
        <div className="section-head reveal">
          <h2 id="topics-title">
            {topics.length === 13 ? "Thirteen" : topics.length} topics.{" "}
            <em className="accent">Zero</em> judgement.
          </h2>
          <p className="lede">
            Each topic brings together short answers, videos and the experts behind them — so you can go as deep as you have time for tonight.
          </p>
        </div>

        <ul className="topic-index reveal">
          {topics.map((topic, idx) => {
            const num = (idx + 1).toString().padStart(2, "0");
            return (
              <li key={topic.slug}>
                <Link
                  className="topic-row"
                  href={`/topics/${topic.slug}/`}
                  style={{ "--sw": topic.color } as React.CSSProperties}
                >
                  <span className="n">{num}</span>
                  <span className="name">{topic.name}</span>
                  <span className="desc">{topic.desc}</span>
                  <span className="count">{topic.count}</span>
                  <span className="go">
                    <ArrowIcon />
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
