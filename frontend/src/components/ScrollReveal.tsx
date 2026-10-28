"use client";

import { useEffect } from "react";

export function ScrollReveal() {
  useEffect(() => {
    const handleReveal = () => {
      const elements = document.querySelectorAll(".reveal:not(.is-in)");
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;

      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        // Trigger reveal when element is within 100px from the bottom of the viewport
        if (rect.top <= windowHeight - 40) {
          el.classList.add("is-in");
        }
      });
    };

    // Run immediately on mount
    handleReveal();

    // IntersectionObserver for performant scroll triggering
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-in");
              io.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -40px 0px" }
      );

      document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    }

    // Scroll listener fallback
    window.addEventListener("scroll", handleReveal, { passive: true });
    window.addEventListener("resize", handleReveal, { passive: true });

    const t1 = setTimeout(handleReveal, 100);
    const t2 = setTimeout(handleReveal, 500);

    return () => {
      window.removeEventListener("scroll", handleReveal);
      window.removeEventListener("resize", handleReveal);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return null;
}
