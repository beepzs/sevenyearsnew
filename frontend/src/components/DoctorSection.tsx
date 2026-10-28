import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowIcon } from "./Icons";

export function DoctorSection() {
  return (
    <section className="section" aria-labelledby="doc-title">
      <div className="wrap doctor">
        <div className="doctor__photo reveal">
          <span className="blob" />
          <img
            src="/assets/img/dr-murray-clarke-cutout.webp"
            alt="Dr. Murray Clarke, smiling, in a navy blazer"
            width={800}
            height={875}
            loading="lazy"
          />
          <div className="doctor__tag">
            <b>Dr. Murray Clarke</b>
            <span>Host · answers Ask the Doctor</span>
          </div>
        </div>

        <div className="reveal" style={{ "--d": "120ms" } as React.CSSProperties}>
          <span className="eyebrow">Meet your host</span>
          <h2 id="doc-title" className="h1" style={{ marginTop: ".8rem" }}>
            The doctor in your corner.
          </h2>
          <p className="lede" style={{ marginTop: "1.25rem" }}>
            Dr. Murray Clarke hosts The First Seven Years with Bryce Wylde, sitting down with pediatricians, researchers and practitioners — then turning those conversations into short answers you can use tonight.
          </p>
          <div className="doctor__facts">
            <div>
              <b>116+</b>
              <span>episodes &amp; clips</span>
            </div>
            <div>
              <b>13</b>
              <span>topic hubs</span>
            </div>
            <div>
              <b>0–7</b>
              <span>every age covered</span>
            </div>
          </div>
          <Link className="btn" href="/experts/dr-murray-clarke/">
            About Dr. Murray <ArrowIcon />
          </Link>
          <Link className="link-arrow" style={{ marginLeft: "1rem" }} href="/about/#standards">
            How answers are reviewed <ArrowIcon />
          </Link>
        </div>
      </div>
    </section>
  );
}
