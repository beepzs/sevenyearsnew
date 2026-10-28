"use client";

import React, { useState, useEffect } from "react";
import { Header } from "./Header";
import { Drawer } from "./Drawer";
import { Footer } from "./Footer";
import { ScrollReveal } from "./ScrollReveal";

interface PageShellProps {
  children: React.ReactNode;
  onFocusSearch?: () => void;
}

export function PageShell({ children, onFocusSearch }: PageShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    // Enable YouTube click-to-play facade for all video embeds on any page
    const handleYtClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest(".yt") as HTMLElement | null;
      if (!target) return;
      const id = target.dataset.id;
      if (!id) return;

      const ifr = document.createElement("iframe");
      ifr.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
      ifr.title = target.getAttribute("aria-label") || "YouTube video";
      ifr.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture";
      ifr.allowFullscreen = true;
      target.replaceWith(ifr);
    };

    document.addEventListener("click", handleYtClick);
    return () => document.removeEventListener("click", handleYtClick);
  }, []);

  return (
    <>
      <ScrollReveal />
      <Header
        onOpenDrawer={() => setDrawerOpen(true)}
        onFocusSearch={onFocusSearch}
      />
      <Drawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
      />
      {children}
      <Footer />
    </>
  );
}
