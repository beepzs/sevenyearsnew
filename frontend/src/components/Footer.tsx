"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useNavigation } from "../context/NavigationContext";
import { ShieldIcon, YouTubeIcon, MailIcon, ChatIcon } from "./Icons";

export function Footer() {
  const { footerItems, settings } = useNavigation();

  // Group footer items by column if available and sort by order
  const columnGroups: Record<string, typeof footerItems> = {};
  if (footerItems && footerItems.length > 0) {
    footerItems.forEach((item) => {
      const colName = item.col || "Links";
      if (!columnGroups[colName]) {
        columnGroups[colName] = [];
      }
      columnGroups[colName].push(item);
    });

    // Ensure items within each column group are sorted by order
    Object.keys(columnGroups).forEach((col) => {
      columnGroups[col].sort((a, b) => (a.order || 0) - (b.order || 0));
    });
  }

  const hasDynamicFooter = Object.keys(columnGroups).length > 0;

  return (
    <footer className="footer">
      <div className="wrap">
        <div className="footer__disclaimer" role="note">
          <ShieldIcon />
          <p>
            <strong>Medical disclaimer.</strong> {settings?.medical_disclaimer || "The First Seven Years shares general health education from doctors, researchers and health experts. It is not medical advice, diagnosis or treatment, and it does not replace care from your child’s own pediatrician or health professional. Never ignore professional advice or delay seeking it because of something you read or watched here. In an emergency, call 911 or your local emergency number."}{" "}
            <Link href="/medical-disclaimer/">Read the full medical disclaimer</Link>.
          </p>
        </div>

        <div className="footer__grid">
          <div className="footer__brand">
            <Image
              className="logo-img"
              src="/assets/img/logo.jpg"
              alt={settings?.site_title || "The First Seven Years"}
              width={104}
              height={104}
              loading="lazy"
            />
            <p>
              {settings?.site_tagline || settings?.description || "Honest, expert answers for parents of children aged 0 to 7 — from the doctors and researchers on The First Seven Years."}
            </p>
            <ul className="socials" aria-label="Follow">
              <li>
                <a
                  href={settings?.youtube_channel || "https://www.youtube.com/@thefirstsevenyears"}
                  rel="me noopener noreferrer"
                  target="_blank"
                  aria-label="YouTube (opens in a new tab)"
                >
                  <YouTubeIcon />
                </a>
              </li>
              <li>
                <Link href={settings?.newsletter_url || "/#newsletter"} aria-label="Newsletter">
                  <MailIcon />
                </Link>
              </li>
              <li>
                <Link href={settings?.contact_url || "/ask-the-doctor/"} aria-label="Ask the Doctor">
                  <ChatIcon />
                </Link>
              </li>
            </ul>
          </div>

          {hasDynamicFooter &&
            Object.entries(columnGroups).map(([colTitle, items]) => (
              <div key={colTitle}>
                <h2>{colTitle}</h2>
                <ul>
                  {items.map((it) => (
                    <li key={it.id}>
                      <Link href={it.url} target={it.target || "_self"}>
                        {it.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
        </div>

        <div className="footer__legal">
          <p>{settings?.organization?.copyright_notice || settings?.copyright || `© ${new Date().getFullYear()} ${settings?.site_title || "The First Seven Years"}. All rights reserved.`}</p>
        </div>

        <div className="wordmark" aria-hidden="true">
          {settings?.site_title || "First Seven Years"}
        </div>
      </div>
    </footer>
  );
}
