import React from "react";
import Link from "next/link";
import { ShieldIcon, UsersIcon, LinkIcon, AlertIcon } from "./Icons";

export function TrustSection() {
  return (
    <section className="section" aria-labelledby="trust-title">
      <div className="wrap">
        <h2 id="trust-title" className="sr-only">
          Why you can trust this library
        </h2>
        <div className="trust reveal">
          <div>
            <ShieldIcon />
            <h3>Reviewed, then published</h3>
            <p>Every answer is reviewed before it goes live, and shows the date it was last checked.</p>
          </div>
          <div>
            <UsersIcon />
            <h3>Named experts</h3>
            <p>You always know who is speaking, what their background is, and where the answer came from.</p>
          </div>
          <div>
            <LinkIcon />
            <h3>Sponsors disclosed</h3>
            <p>AskDrSears.com and OmegaQuant sponsor the show. Sponsor messages are labelled and never shape the answers.</p>
          </div>
          <div>
            <AlertIcon />
            <h3>Education, not diagnosis</h3>
            <p>
              We explain the why. Your child’s own doctor is always the right person for their care.{" "}
              <Link href="/medical-disclaimer/">Medical disclaimer</Link>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
