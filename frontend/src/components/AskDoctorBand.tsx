import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ChatIcon } from "./Icons";

export function AskDoctorBand() {
  return (
    <section className="section--tight" aria-labelledby="ask-title">
      <div className="wrap">
        <div className="ask-band reveal">
          <div>
            <span className="eyebrow">Ask the Doctor</span>
            <h2 id="ask-title" style={{ marginTop: ".8rem" }}>
              Can’t find it? <em className="accent">Ask Dr. Murray.</em>
            </h2>
            <p className="lede">
              Send your question — no account, no fuss. The questions parents ask most become new video answers in the library, and we’ll email you when yours is live.
            </p>
            <p className="muted" style={{ marginTop: ".8rem", fontSize: ".9rem" }}>
              General education only — not for emergencies or personal medical advice.
            </p>
            <p style={{ marginTop: "1.5rem" }}>
              <Link className="btn" href="/ask-the-doctor/">
                <ChatIcon />
                Ask a question
              </Link>
            </p>
          </div>

          <div className="ask-band__card" aria-hidden="true">
            <span className="from">Asked by a parent of a 2-year-old</span>
            <span className="q">
              “Every time she has antibiotics her tummy is upset for weeks. Is there anything we can do to help her bounce back?”
            </span>
            <div className="ans">
              <img
                src="/assets/img/dr-murray-clarke-cutout.webp"
                alt=""
                width={40}
                height={40}
              />
              <p>
                <strong>Answered on video</strong> · 9 min
                <br />
                <span className="ep-topic" style={{ "--sw": "#b2e6a8" } as React.CSSProperties}>
                  Gut health &amp; microbiome
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
