"use client";

import React, { useState } from "react";

interface YouTubePlayerProps {
  videoId?: string;
  id?: string;
  title: string;
  label?: string;
}

export function YouTubePlayer({ videoId, id, title, label }: YouTubePlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const activeVideoId = videoId || id || "";

  if (isPlaying) {
    return (
      <div className="yt is-playing" style={{ position: "relative", paddingBottom: "56.25%", height: 0, overflow: "hidden", borderRadius: "14px" }}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${activeVideoId}?autoplay=1&rel=0&modestbranding=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: 0 }}
        />
      </div>
    );
  }

  return (
    <button
      className="yt"
      type="button"
      data-id={activeVideoId}
      aria-label={`Play video: ${title}`}
      onClick={() => setIsPlaying(true)}
    >
      <img
        src={`https://i.ytimg.com/vi/${activeVideoId}/maxresdefault.jpg`}
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${activeVideoId}/hqdefault.jpg`;
        }}
        alt=""
        width={1280}
        height={720}
        loading="lazy"
        decoding="async"
      />
      <span className="yt__btn">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          focusable="false"
        >
          <path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none" />
        </svg>
      </span>
      {label && <span className="yt__label">{label}</span>}
    </button>
  );
}
