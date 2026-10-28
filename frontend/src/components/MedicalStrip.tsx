"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ShieldIcon, CloseIcon } from "./Icons";
import { useNavigation } from "../context/NavigationContext";

export function MedicalStrip() {
  const { banners } = useNavigation();
  const [dismissed, setDismissed] = useState(false);

  // Look up dedicated banner row from MySQL banners table
  const bannerRow = (banners || []).find((b) => b.type === "promo" || b.id === "promo_strip");

  // If no promo banner exists in database, or if it is disabled/unpublished, do not render
  if (!bannerRow || bannerRow.published === false) {
    return null;
  }
  if (dismissed) return null;

  const boldText = bannerRow.title || "";
  const text = bannerRow.content || "";
  const linkText = bannerRow.link_text || "";
  const linkUrl = bannerRow.link_url || "/medical-disclaimer/";
  const showClose = bannerRow.data?.show_close !== false;
  const customBg = bannerRow.bg_color;
  const customColor = bannerRow.text_color;

  const style: React.CSSProperties = {};
  if (customBg) style.backgroundColor = customBg;
  if (customColor) style.color = customColor;

  return (
    <div className="med-strip" id="med-strip" role="note" aria-label="Medical disclaimer" style={style}>
      <div className="wrap med-strip__in">
        <ShieldIcon />
        <p style={customColor ? { color: customColor } : undefined}>
          {boldText && <strong>{boldText} </strong>}
          {text}{" "}
          {linkText && linkUrl && (
            <Link href={linkUrl} style={customColor ? { color: customColor } : undefined}>
              {linkText}
            </Link>
          )}
        </p>
        {showClose && (
          <button
            className="med-strip__close"
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Dismiss medical disclaimer notice"
            style={customColor ? { color: customColor } : undefined}
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  );
}
