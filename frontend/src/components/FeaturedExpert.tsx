"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PlayIcon, ArrowIcon, LinkIcon } from "./Icons";
import { useNavigation } from "../context/NavigationContext";
import { getVideoUrl, getVideoThumbnail } from "../utils/videos";

export function FeaturedExpert() {
  const { experts, videos } = useNavigation();
  const [isPlaying, setIsPlaying] = useState(false);

  const activeExperts = (experts || []).filter((e) => e.published !== false);
  if (activeExperts.length === 0) {
    return null;
  }

  // Prioritize Dr. Bill Sears if present & published, otherwise the first published expert
  const featExp =
    activeExperts.find((e) => e.slug === "dr-bill-sears") ||
    activeExperts.find((e) => e.slug !== "dr-murray-clarke") ||
    activeExperts[0];

  if (!featExp) {
    return null;
  }

  const activeVideos = (videos || []).filter((v) => v.published !== false);
  const expVideo =
    activeVideos.find(
      (v) =>
        v.expert === featExp.slug ||
        v.guest === featExp.slug ||
        (typeof v.expert === "string" && typeof featExp.name === "string" && v.expert.toLowerCase() === featExp.name.toLowerCase()) ||
        (typeof v.guest === "string" && typeof featExp.name === "string" && v.guest.toLowerCase() === featExp.name.toLowerCase())
    ) ||
    activeVideos.find((v) => typeof v.type === "string" && v.type.toLowerCase().includes("episode")) ||
    activeVideos[0] ||
    null;

  const credsList = Array.isArray(featExp.creds)
    ? featExp.creds
    : typeof featExp.creds === "string"
    ? [featExp.creds]
    : [];

  const initials = (featExp.name || "Expert")
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("");

  const videoTarget = expVideo ? getVideoUrl(expVideo) : null;
  const videoThumb = expVideo ? getVideoThumbnail(expVideo, false) : "";
  const youtubeId = expVideo?.youtube_id || expVideo?.id;

  return (
    <section className="section--tight sears" aria-labelledby="sears-title">
      <div className="wrap">
        <div className="sears__band">
          <div className="sears__media">
            {expVideo && youtubeId ? (
              !isPlaying ? (
                <button
                  className="yt"
                  type="button"
                  onClick={() => setIsPlaying(true)}
                  aria-label={`Play video: ${expVideo.title}`}
                >
                  <img
                    src={videoThumb}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`;
                    }}
                    alt={expVideo.title}
                    width={1280}
                    height={720}
                    loading="lazy"
                  />
                  <span className="yt__btn">
                    <PlayIcon />
                  </span>
                  <span className="yt__label">
                    {expVideo.type?.toLowerCase().includes("episode") || !expVideo.type
                      ? "Full episode · "
                      : ""}
                    {expVideo.duration ? `${expVideo.duration} · ` : ""}
                    {featExp.name}
                  </span>
                </button>
              ) : (
                <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "1.25rem" }}>
                  <iframe
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
                    src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1`}
                    title={expVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: featExp.swatch || featExp.color || "var(--peach-soft, #fdf1e8)",
                  borderRadius: "1.25rem",
                  minHeight: "280px"
                }}
              >
                {featExp.img ? (
                  <img
                    src={featExp.img}
                    alt={featExp.name}
                    style={{ maxHeight: "260px", objectFit: "contain", borderRadius: "1rem" }}
                  />
                ) : (
                  <span style={{ fontSize: "5rem", fontWeight: 700, color: "var(--ink, #1f2d3d)" }}>
                    {initials}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="sears__copy">
            <span className="eyebrow">Featured expert</span>
            <div className="sears__who">
              {featExp.img ? (
                <img
                  className="avatar avatar--cut"
                  src={featExp.img}
                  alt={featExp.name}
                  width={64}
                  height={64}
                  style={{ "--s": "64px", background: featExp.swatch || "#ffdab5" } as React.CSSProperties}
                  loading="lazy"
                />
              ) : (
                <span
                  className="avatar avatar--ini"
                  style={{
                    "--s": "64px",
                    width: 64,
                    height: 64,
                    display: "grid",
                    placeItems: "center",
                    fontWeight: 700,
                    fontSize: "1.5rem",
                    borderRadius: "50%",
                    background: featExp.swatch || "#ffdab5"
                  } as React.CSSProperties}
                >
                  {initials}
                </span>
              )}
              <div>
                <h2 id="sears-title">{featExp.name}</h2>
                <p>{featExp.role}</p>
              </div>
            </div>
            {featExp.short && <p className="lede">{featExp.short}</p>}
            {credsList.length > 0 && (
              <ul className="cred-chips">
                {credsList.slice(0, 4).map((c: string, idx: number) => (
                  <li key={idx}>{c}</li>
                ))}
              </ul>
            )}
            <div className="btn-row">
              {expVideo && videoTarget && (
                <Link className="btn" href={videoTarget.url}>
                  <PlayIcon />
                  Watch the full episode
                </Link>
              )}
              <Link className="link-arrow" href={`/experts/${featExp.slug}/`}>
                {featExp.name}’s profile <ArrowIcon />
              </Link>
            </div>
          </div>
        </div>

        {featExp.slug === "dr-bill-sears" && (
          <p className="sponsor-note">
            <LinkIcon />
            <span>
              Dr. Sears is associated with AskDrSears.com, a sponsor of The First Seven Years. Sponsors have no say over which questions we answer or what the answers say.
            </span>
          </p>
        )}
      </div>
    </section>
  );
}
