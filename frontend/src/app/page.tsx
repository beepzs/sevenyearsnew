"use client";

import React, { useRef } from "react";
import { PageShell } from "../components/PageShell";
import { HeroBanner } from "../components/HeroBanner";
import { FeaturedExpert } from "../components/FeaturedExpert";
import { TopicsSection } from "../components/TopicsSection";
import { WatchListenSection } from "../components/WatchListenSection";
import { DoctorSection } from "../components/DoctorSection";
import { AskDoctorBand } from "../components/AskDoctorBand";
import { RecentlyAnswered } from "../components/RecentlyAnswered";
import { BookSection } from "../components/BookSection";
import { TrustSection } from "../components/TrustSection";
import { NewsletterSection } from "../components/NewsletterSection";

export default function HomePage() {
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleFocusSearch = () => {
    if (searchInputRef.current) {
      searchInputRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 350);
    }
  };

  return (
    <PageShell onFocusSearch={handleFocusSearch}>
      <main id="main">
        <HeroBanner searchInputRef={searchInputRef} />
        <FeaturedExpert />
        <TopicsSection />
        <WatchListenSection />
        <DoctorSection />
        <AskDoctorBand />
        <RecentlyAnswered />
        <BookSection />
        <TrustSection />
        <NewsletterSection />
      </main>
    </PageShell>
  );
}
