"use client";

import React from "react";
import Link from "next/link";
import { ArrowIcon } from "./Icons";
import { useNavigation } from "../context/NavigationContext";
import { getVideoFormat, getVideoUrl, getVideoThumbnail, getExpertDisplayName } from "../utils/videos";

export function WatchListenSection() {
  const { videos, experts } = useNavigation();

  const publishedVideos = (videos || []).filter((v) => v.published !== false);

  // Split into categories
  const episodes = publishedVideos.filter((v) => getVideoFormat(v) === "episode");
  const clips = publishedVideos.filter((v) => getVideoFormat(v) === "clip");
  const shorts = publishedVideos.filter((v) => getVideoFormat(v) === "short");

  const episodeCount = episodes.length;
  const clipCount = clips.length;
  const shortCount = shorts.length;

  const displayEpisodes = episodes.slice(0, 3);
  const displayClips = clips.slice(0, 3);
  const displayShorts = shorts.slice(0, 3);

  return (
    <section className="section--tight watch" aria-labelledby="watch-title">
      <div className="wrap">
        <div className="section-head reveal">
          <h2 id="watch-title">Watch &amp; listen, your way</h2>
          <p className="lede">
            Got an hour on a walk, ten minutes at nap time, or one minute in the school queue? Each format is labelled, so you always know what you’re starting.
          </p>
        </div>

        {publishedVideos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--ink-soft)" }}>
            <p style={{ fontSize: "1.05rem", color: "var(--ink-muted, #667)" }}>
              No videos are currently published in the library.
            </p>
          </div>
        ) : (
          <div className="fmt-cols reveal">
            {/* Full episodes */}
            <div className="fmt-col fmt-col--episode">
              <span className="fmt-badge fmt-badge--episode fmt-badge--lg">Full episode</span>
              <h3>Full episodes</h3>
              <p>The long-form podcast conversations — 45 minutes to 1.5 hours with a guest expert.</p>
              {displayEpisodes.length > 0 ? (
                <ul>
                  {displayEpisodes.map((ep) => {
                    const target = getVideoUrl(ep);
                    const thumb = getVideoThumbnail(ep, false);
                    const expName = getExpertDisplayName(ep.expert || (ep as any).guest, experts);
                    const durText = ep.duration ? `${ep.duration} · ${expName}` : expName;

                    return (
                      <li key={ep.id || ep.title}>
                        {target.isExternal ? (
                          <a href={target.url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={thumb}
                              alt={ep.title}
                              width={120}
                              height={68}
                              loading="lazy"
                            />
                            <span>
                              {ep.title}
                              <small>{durText}</small>
                            </span>
                          </a>
                        ) : (
                          <Link href={target.url}>
                            <img
                              src={thumb}
                              alt={ep.title}
                              width={120}
                              height={68}
                              loading="lazy"
                            />
                            <span>
                              {ep.title}
                              <small>{durText}</small>
                            </span>
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p style={{ padding: "1.5rem 0", color: "var(--ink-muted, #778)", fontSize: ".9rem" }}>
                  No full episodes published yet.
                </p>
              )}
              <Link className="link-arrow" href="/videos/full-episodes/">
                All full episodes ({episodeCount}) <ArrowIcon />
              </Link>
            </div>

            {/* Short videos */}
            <div className="fmt-col fmt-col--video">
              <span className="fmt-badge fmt-badge--video fmt-badge--lg">Short video</span>
              <h3>Short videos</h3>
              <p>7–12 minutes on a single question — one expert, one idea, straight to the point.</p>
              {displayClips.length > 0 ? (
                <ul>
                  {displayClips.map((clip) => {
                    const target = getVideoUrl(clip);
                    const thumb = getVideoThumbnail(clip, false);
                    const expName = getExpertDisplayName(clip.expert || (clip as any).guest, experts);
                    const durText = clip.duration ? `${clip.duration} · ${expName}` : expName;

                    return (
                      <li key={clip.id || clip.title}>
                        {target.isExternal ? (
                          <a href={target.url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={thumb}
                              alt={clip.title}
                              width={120}
                              height={68}
                              loading="lazy"
                            />
                            <span>
                              {clip.title}
                              <small>{durText}</small>
                            </span>
                          </a>
                        ) : (
                          <Link href={target.url}>
                            <img
                              src={thumb}
                              alt={clip.title}
                              width={120}
                              height={68}
                              loading="lazy"
                            />
                            <span>
                              {clip.title}
                              <small>{durText}</small>
                            </span>
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p style={{ padding: "1.5rem 0", color: "var(--ink-muted, #778)", fontSize: ".9rem" }}>
                  No short videos published yet.
                </p>
              )}
              <Link className="link-arrow" href="/videos/short-videos/">
                All short videos ({clipCount}) <ArrowIcon />
              </Link>
            </div>

            {/* Social clips */}
            <div className="fmt-col fmt-col--social">
              <span className="fmt-badge fmt-badge--social fmt-badge--lg">Social clip</span>
              <h3>Social clips</h3>
              <p>A minute or two, made for your phone. Vertical clips from YouTube Shorts and social.</p>
              {displayShorts.length > 0 ? (
                <ul>
                  {displayShorts.map((short) => {
                    const target = getVideoUrl(short);
                    const thumb = getVideoThumbnail(short, true);
                    const expName = getExpertDisplayName(short.expert || (short as any).guest, experts);
                    const durText = short.duration ? `${short.duration} · ${expName}` : expName;

                    return (
                      <li key={short.id || short.title}>
                        {target.isExternal ? (
                          <a href={target.url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={thumb}
                              alt={short.title}
                              width={120}
                              height={68}
                              loading="lazy"
                            />
                            <span>
                              {short.title}
                              <small>{durText}</small>
                            </span>
                          </a>
                        ) : (
                          <Link href={target.url}>
                            <img
                              src={thumb}
                              alt={short.title}
                              width={120}
                              height={68}
                              loading="lazy"
                            />
                            <span>
                              {short.title}
                              <small>{durText}</small>
                            </span>
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p style={{ padding: "1.5rem 0", color: "var(--ink-muted, #778)", fontSize: ".9rem" }}>
                  No social clips published yet.
                </p>
              )}
              <Link className="link-arrow" href="/videos/social-clips/">
                All social clips ({shortCount}) <ArrowIcon />
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
