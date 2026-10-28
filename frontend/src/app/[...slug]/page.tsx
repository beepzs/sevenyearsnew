import fs from "fs";
import path from "path";
import { notFound, redirect } from "next/navigation";
import { PageShell } from "../../components/PageShell";
import { YouTubePlayer } from "../../components/YouTubePlayer";
import { getVideoFormat, getVideoUrl, getVideoThumbnail, getExpertDisplayName } from "../../utils/videos";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{
    slug: string[];
  }>;
}


const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const dynamic = "force-dynamic";

function extractYouTubeId(url?: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  const m = trimmed.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/);
  return m ? m[1] : trimmed;
}

function formatAgesLabel(ages: any): string {
  let list: number[] = [];

  if (Array.isArray(ages)) {
    list = ages
      .map((n) => Number(n))
      .filter((n) => !Number.isNaN(n) && Number.isInteger(n) && n >= 0 && n <= 7);
  } else if (typeof ages === "string") {
    try {
      const parsed = JSON.parse(ages);
      if (Array.isArray(parsed)) {
        list = parsed
          .map((n) => Number(n))
          .filter((n) => !Number.isNaN(n) && Number.isInteger(n) && n >= 0 && n <= 7);
      }
    } catch {
      list = ages
        .split(",")
        .map((s) => Number(s.trim()))
        .filter((n) => !Number.isNaN(n) && Number.isInteger(n) && n >= 0 && n <= 7);
    }
  }

  // Deduplicate and sort numerically
  const sorted = Array.from(new Set(list)).sort((a, b) => a - b);

  if (sorted.length === 0 || sorted.length === 8) {
    return "Ages 0–7";
  }

  if (sorted.length === 1) {
    return `Age ${sorted[0]}`;
  }

  // Group consecutive numbers into ranges
  const ranges: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i];
    if (curr === prev + 1) {
      prev = curr;
    } else {
      ranges.push(start === prev ? `${start}` : `${start}–${prev}`);
      start = curr;
      prev = curr;
    }
  }

  ranges.push(start === prev ? `${start}` : `${start}–${prev}`);

  return `Ages ${ranges.join(", ")}`;
}

function findHtmlFile(slugParts: string[]): string | null {
  // Topics, answers, videos, experts, and ask-the-doctor are completely managed dynamically; never serve static files
  if (slugParts.length > 0 && (slugParts[0] === "topics" || slugParts[0] === "answers" || slugParts[0] === "videos" || slugParts[0] === "experts" || slugParts[0] === "ask-the-doctor")) {
    return null;
  }

  // Use only local content_pages inside frontend directory — zero Python / site dependency
  const baseDir = path.join(process.cwd(), "content_pages");

  const candidates = [
    path.join(baseDir, ...slugParts, "index.html"),
    path.join(baseDir, ...slugParts) + ".html",
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(/*turbopackIgnore: true*/ candidate)) {
      try {
        const stat = fs.statSync(/*turbopackIgnore: true*/ candidate);
        if (stat.size > 0) {
          return candidate;
        }
      } catch {}
    }
  }

  return null;
}

function extractPageData(html: string) {
  const titleMatch = html.match(/<title>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : "The First Seven Years";

  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/i);
  const description = descMatch ? descMatch[1].trim() : "";

  const mainMatch = html.match(/<main id=["']main["']>([\s\S]*?)<\/main>/i);
  let mainContent = mainMatch ? mainMatch[1] : "";

  // Normalize static relative links to clean Next.js paths
  mainContent = mainContent
    .replace(/href=["']\.\.\/index\.html["']/g, 'href="/"')
    .replace(/href=["']\.\.\/([^"']+)index\.html#([^"']+)["']/g, 'href="/$1#$2"')
    .replace(/href=["']\.\.\/([^"']+)index\.html["']/g, 'href="/$1"')
    .replace(/href=["']\.\.\/([^"']+)["']/g, 'href="/$1"');

  return { title, description, mainContent };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug || !slug.length) return {};

  // Dynamic /topics listing metadata
  if (slug.length === 1 && slug[0] === "topics") {
    try {
      const res = await fetch(`${API_BASE}/topics`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        const count = data.success && Array.isArray(data.topics)
          ? data.topics.filter((t: any) => t.published !== false).length
          : 0;
        return {
          title: "Topics — The First Seven Years",
          description: count > 0
            ? `Browse ${count} topic hubs for parents of children aged 0–7: gut health, nutrition, picky eating, eczema, allergies, immunity, sleep, ADHD and more.`
            : "Browse topic hubs for parents of children aged 0–7."
        };
      }
    } catch {}
    return {
      title: "Topics — The First Seven Years",
      description: "Browse topic hubs for parents of children aged 0–7: gut health, nutrition, picky eating, eczema, allergies, immunity, sleep, ADHD and more."
    };
  }

  // Dynamic topic metadata
  if (slug.length === 2 && slug[0] === "topics") {
    const topicSlug = slug[1];
    try {
      const res = await fetch(`${API_BASE}/topics`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.topics)) {
          const topic = data.topics.find((t: any) => t.slug === topicSlug);
          if (topic) {
            return {
              title: topic.seo_title || `${topic.name} — Answers & Videos | The First Seven Years`,
              description: topic.meta_desc || topic.short || topic.intro || `Learn about ${topic.name} on The First Seven Years.`
            };
          }
        }
      }
    } catch {}
  }

  // Dynamic answer metadata
  if (slug.length === 2 && slug[0] === "answers") {
    const answerSlug = slug[1];
    try {
      const res = await fetch(`${API_BASE}/answers`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.answers)) {
          const ans = data.answers.find((a: any) => a.slug === answerSlug);
          if (ans && ans.published !== false) {
            return {
              title: `${ans.q} — The First Seven Years`,
              description: ans.quick || ans.q
            };
          }
        }
      }
    } catch {}
  }

  // Dynamic expert metadata
  if (slug.length === 2 && slug[0] === "experts") {
    const expertSlug = slug[1];
    try {
      const res = await fetch(`${API_BASE}/experts`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.experts)) {
          const expert = data.experts.find((e: any) => e.slug === expertSlug);
          if (expert) {
            return {
              title: expert.seo_title || `${expert.name} — ${expert.role} | The First Seven Years`,
              description: expert.meta_desc || expert.short || `Meet ${expert.name} on The First Seven Years.`
            };
          }
        }
      }
    } catch {}
  }

  // Dynamic videos metadata
  if (slug.length === 1 && slug[0] === "videos") {
    return {
      title: "Watch & listen — The First Seven Years",
      description: "Three ways in, depending on how much time you have: the full conversation, a short video on one question, or a quick clip for your phone."
    };
  }
  if (slug.length === 2 && slug[0] === "videos") {
    const videoSlug = slug[1];
    if (videoSlug === "full-episodes") {
      return {
        title: "Full episodes — The First Seven Years",
        description: "The long-form podcast conversations — 45 minutes to 1.5 hours with a guest expert."
      };
    }
    if (videoSlug === "short-videos") {
      return {
        title: "Short videos — The First Seven Years",
        description: "7–12 minutes on a single question — one expert, one idea, straight to the point."
      };
    }
    if (videoSlug === "social-clips") {
      return {
        title: "Social clips — The First Seven Years",
        description: "A minute or two, made for your phone. Vertical clips from YouTube Shorts and social."
      };
    }

    try {
      const res = await fetch(`${API_BASE}/videos`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.videos)) {
          const video = data.videos.find((v: any) =>
            v.slug === videoSlug ||
            v.id === videoSlug ||
            v.youtube_id === videoSlug ||
            (v.title && v.title.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") === videoSlug)
          );
          if (video) {
            return {
              title: video.seo_title || `${video.title} — The First Seven Years`,
              description: video.meta_desc || video.caption || video.description || video.title
            };
          }
        }
      }
    } catch {}
  }

  // Dynamic CMS Page metadata (from MySQL `pages` table)
  if (slug.length === 1) {
    const pageSlug = slug[0];
    try {
      const pageRes = await fetch(`${API_BASE}/pages`, { cache: "no-store" });
      if (pageRes.ok) {
        const pageData = await pageRes.json();
        if (pageData.success && Array.isArray(pageData.pages)) {
          const dbPage = pageData.pages.find((p: any) => p.slug === pageSlug);
          if (dbPage && dbPage.published !== false) {
            const title = dbPage.seo_title || `${dbPage.title} — The First Seven Years`;
            const desc =
              dbPage.meta_desc ||
              (dbPage.excerpt ? dbPage.excerpt.replace(/<[^>]+>/g, "").trim() : "") ||
              `Read about ${dbPage.title} on The First Seven Years.`;
            return {
              title,
              description: desc,
              robots: {
                index: dbPage.robots_index !== "noindex",
                follow: dbPage.robots_follow !== "nofollow",
              },
              alternates: dbPage.canonical_url ? { canonical: dbPage.canonical_url } : undefined,
              openGraph: {
                title: dbPage.og_title || title,
                description: dbPage.og_desc || desc,
                url: dbPage.canonical_url || `https://thefirstsevenyears.com/${dbPage.slug}/`,
                images: dbPage.og_image ? [{ url: dbPage.og_image }] : undefined,
                type: (dbPage.og_type as any) || "article",
              },
              twitter: {
                card: (dbPage.twitter_card as any) || "summary_large_image",
                title: dbPage.og_title || title,
                description: dbPage.og_desc || desc,
                images: dbPage.og_image ? [dbPage.og_image] : undefined,
              },
            };
          }
        }
      }
    } catch {}
  }

  const filePath = findHtmlFile(slug);
  if (!filePath) return {};

  const html = fs.readFileSync(/*turbopackIgnore: true*/ filePath, "utf-8");
  const { title, description } = extractPageData(html);

  return {
    title,
    description
  };
}

export async function generateStaticParams() {
  const baseDir = path.join(process.cwd(), "content_pages");
  if (!fs.existsSync(baseDir)) return [];

  const results: { slug: string[] }[] = [];

  function walk(currentDir: string, currentParts: string[]) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (currentParts.length === 0 && (entry.name === "topics" || entry.name === "answers" || entry.name === "videos" || entry.name === "experts")) {
          continue;
        }
        const nextParts = [...currentParts, entry.name];
        const hasIndex = fs.existsSync(path.join(currentDir, entry.name, "index.html"));
        if (hasIndex) {
          results.push({ slug: nextParts });
        }
        walk(path.join(currentDir, entry.name), nextParts);
      }
    }
  }

  walk(baseDir, []);
  return results;
}

function renderFormattedPageTitle(titleStr: string) {
  if (!titleStr) return "";
  const match = titleStr.match(/^(.*?)first\s+seven(.*?)$/i);
  if (match) {
    return (
      <>
        {match[1]}
        <em className="accent accent--strong">first seven</em>
        {match[2]}
      </>
    );
  }
  return titleStr;
}

export default async function CatchAllPage({ params }: PageProps) {
  const { slug } = await params;
  if (!slug || !slug.length) {
    notFound();
  }

  // ==========================================
  // 0. DYNAMIC ALL TOPICS PAGE (/topics)
  // ==========================================
  if (slug.length === 1 && slug[0] === "topics") {
    try {
      const [topicsRes, answersRes, videosRes] = await Promise.allSettled([
        fetch(`${API_BASE}/topics`, { cache: "no-store" }),
        fetch(`${API_BASE}/answers`, { cache: "no-store" }),
        fetch(`${API_BASE}/videos`, { cache: "no-store" })
      ]);

      let allTopics: any[] = [];
      let allAnswers: any[] = [];
      let allVideos: any[] = [];

      if (topicsRes.status === "fulfilled" && topicsRes.value.ok) {
        const tData = await topicsRes.value.json();
        if (tData.success && Array.isArray(tData.topics)) allTopics = tData.topics;
      }
      if (answersRes.status === "fulfilled" && answersRes.value.ok) {
        const aData = await answersRes.value.json();
        if (aData.success && Array.isArray(aData.answers)) allAnswers = aData.answers;
      }
      if (videosRes.status === "fulfilled" && videosRes.value.ok) {
        const vData = await videosRes.value.json();
        if (vData.success && Array.isArray(vData.videos)) allVideos = vData.videos;
      }

      const publishedTopics = allTopics
        .filter((t: any) => t.published !== false)
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

      const numWords = [
        "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
        "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen", "Twenty"
      ];
      const topicCountLabel = publishedTopics.length === 0
        ? "No"
        : (numWords[publishedTopics.length] || publishedTopics.length.toString());

      return (
        <PageShell>
          <main id="main">
            <div className="page-head page-head--tint">
              <div className="wrap">
                <nav aria-label="Breadcrumb">
                  <ol className="crumbs">
                    <li><a href="/">Home</a></li>
                    <li aria-current="page">Topics</li>
                  </ol>
                </nav>
                <h1>All topics</h1>
                <p className="lede">
                  {publishedTopics.length === 0
                    ? "No topics are currently published."
                    : `${topicCountLabel} areas parents ask about most. Each hub collects the short answers, full episodes and experts for that topic.`}
                </p>
                <div style={{ marginTop: "2rem" }}>
                  <div
                    className="qsearch"
                    data-prompts="Why won’t my toddler eat vegetables?|Is my child’s eczema a gut problem?|How do I help their gut after antibiotics?|Are pets good for my baby’s immune system?|Why are ADHD diagnoses rising?|What’s the difference between probiotics and prebiotics?"
                  >
                    <form role="search" action="/search/" method="get">
                      <div className="qsearch__field">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                          <circle cx="11" cy="11" r="7" />
                          <path d="m20 20-3.5-3.5" />
                        </svg>
                        <label className="sr-only" htmlFor="t-q">Ask a question or search</label>
                        <input
                          id="t-q"
                          name="q"
                          type="search"
                          autoComplete="off"
                          placeholder="Why won’t my toddler eat vegetables?"
                          role="combobox"
                          aria-autocomplete="list"
                          aria-expanded="false"
                          aria-controls="t-q-list"
                        />
                        <button className="btn" type="submit">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                            <path d="M5 12h14" />
                            <path d="m13 6 6 6-6 6" />
                          </svg>
                          <span>Find answers</span>
                        </button>
                      </div>
                    </form>
                    <ul className="qsearch__results" id="t-q-list" role="listbox" aria-label="Suggestions" hidden></ul>
                  </div>
                </div>
              </div>
            </div>

            <section className="section--tight">
              <div className="wrap">
                {publishedTopics.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "4rem 1rem", color: "var(--ink-soft)" }}>
                    <p style={{ fontSize: "1.1rem" }}>No topics are currently published.</p>
                  </div>
                ) : (
                  <ul className="topic-index">
                    {publishedTopics.map((topic: any, idx: number) => {
                      const num = (idx + 1).toString().padStart(2, "0");

                      const ansCount = (Array.isArray(topic.answers) && topic.answers.length > 0)
                        ? topic.answers.length
                        : allAnswers.filter((a: any) =>
                            a.published !== false && (
                              a.topic === topic.slug ||
                              (Array.isArray(a.topics) && a.topics.includes(topic.slug)) ||
                              (Array.isArray(topic.answers) && topic.answers.includes(a.slug)) ||
                              (Array.isArray(a.also) && a.also.includes(topic.slug))
                            )
                          ).length;

                      const vidCount = (Array.isArray(topic.episodes) && topic.episodes.length > 0)
                        ? topic.episodes.length
                        : allVideos.filter((v: any) =>
                            v.published !== false && (
                              v.topic === topic.slug ||
                              (Array.isArray(v.tags) && v.tags.includes(topic.slug)) ||
                              (Array.isArray(topic.episodes) && (
                                topic.episodes.includes(v.id) ||
                                topic.episodes.includes(v.youtube_id) ||
                                topic.episodes.includes(v.slug)
                              ))
                            )
                          ).length;

                      let countText = "New answers soon";
                      if (ansCount > 0 && vidCount > 0) {
                        countText = `${ansCount} ${ansCount === 1 ? "answer" : "answers"} · ${vidCount} ${vidCount === 1 ? "video" : "videos"}`;
                      } else if (ansCount > 0) {
                        countText = `${ansCount} ${ansCount === 1 ? "answer" : "answers"}`;
                      } else if (vidCount > 0) {
                        countText = `${vidCount} ${vidCount === 1 ? "video" : "videos"}`;
                      }

                      return (
                        <li key={topic.slug}>
                          <a
                            className="topic-row"
                            href={`/topics/${topic.slug}/`}
                            style={{ "--sw": topic.swatch || "#bfe4c6" } as React.CSSProperties}
                          >
                            <span className="n">{num}</span>
                            <span className="name">{topic.name}</span>
                            <span className="desc">{topic.short || topic.desc || topic.intro || ""}</span>
                            <span className="count">{countText}</span>
                            <span className="go">
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                                <path d="M5 12h14" />
                                <path d="m13 6 6 6-6 6" />
                              </svg>
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </section>
          </main>
        </PageShell>
      );
    } catch (err) {
      console.error("Error rendering dynamic topics list:", err);
      return (
        <PageShell>
          <main id="main">
            <div className="page-head page-head--tint">
              <div className="wrap">
                <nav aria-label="Breadcrumb">
                  <ol className="crumbs">
                    <li><a href="/">Home</a></li>
                    <li aria-current="page">Topics</li>
                  </ol>
                </nav>
                <h1>All topics</h1>
                <p className="lede">No topics are currently published.</p>
              </div>
            </div>
          </main>
        </PageShell>
      );
    }
  }

  // ==========================================
  // 1. DYNAMIC TOPICS HUB (Always from CMS DB)
  // ==========================================
  if (slug.length === 2 && slug[0] === "topics") {
    const topicSlug = slug[1];
    try {
      const [topicsRes, answersRes, videosRes, expertsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/topics`, { cache: "no-store" }),
        fetch(`${API_BASE}/answers`, { cache: "no-store" }),
        fetch(`${API_BASE}/videos`, { cache: "no-store" }),
        fetch(`${API_BASE}/experts`, { cache: "no-store" })
      ]);

      let allTopics: any[] = [];
      let allAnswers: any[] = [];
      let allVideos: any[] = [];
      let allExperts: any[] = [];

      if (topicsRes.status === "fulfilled" && topicsRes.value.ok) {
        const tData = await topicsRes.value.json();
        if (tData.success && Array.isArray(tData.topics)) allTopics = tData.topics;
      }
      if (answersRes.status === "fulfilled" && answersRes.value.ok) {
        const aData = await answersRes.value.json();
        if (aData.success && Array.isArray(aData.answers)) allAnswers = aData.answers;
      }
      if (videosRes.status === "fulfilled" && videosRes.value.ok) {
        const vData = await videosRes.value.json();
        if (vData.success && Array.isArray(vData.videos)) allVideos = vData.videos;
      }
      if (expertsRes.status === "fulfilled" && expertsRes.value.ok) {
        const eData = await expertsRes.value.json();
        if (eData.success && Array.isArray(eData.experts)) allExperts = eData.experts;
      }

      const topic = allTopics.find((t: any) => t.slug === topicSlug);
      if (topic) {
        if (topic.published === false) {
          notFound();
        }

        const getExpert = (expertSlug?: string | null) => {
          if (!expertSlug) return null;
          return allExperts.find((e: any) => e.slug === expertSlug) || null;
        };

        // Filter answers for this topic
        const topicAnswers = allAnswers.filter((a: any) => {
          if (a.published === false) return false;
          const inTopicAnswers = Array.isArray(topic.answers) && topic.answers.includes(a.slug);
          const directTopic = a.topic === topicSlug;
          const inAlso = Array.isArray(a.also) && a.also.includes(topicSlug);
          return inTopicAnswers || directTopic || inAlso;
        });

        // Filter videos for this topic
        const topicVideos = allVideos.filter((v: any) => {
          if (v.published === false) return false;
          const inEpisodes = Array.isArray(topic.episodes) && (
            topic.episodes.includes(v.youtube_id) ||
            topic.episodes.includes(v.id) ||
            topic.episodes.includes(v.slug)
          );
          const directTopic = v.topic === topicSlug;
          return inEpisodes || directTopic;
        });

        // Categorize videos
        const fullEpisodes = topicVideos.filter((v: any) => v.type === "episode");
        const shortVideos = topicVideos.filter((v: any) => v.type === "video" || v.type === "short" || (!v.type && !v.youtube_short_url));
        const socialClips = topicVideos.filter((v: any) => v.type === "clip" || v.type === "social" || Boolean(v.youtube_short_url));

        // Featured main video ("Start here")
        let mainVideo: any = null;
        if (topic.main_video) {
          const rawId = extractYouTubeId(topic.main_video);

          mainVideo = allVideos.find((v: any) =>
            v.youtube_id === rawId ||
            v.id === rawId ||
            v.slug === rawId ||
            v.youtube_id === topic.main_video ||
            v.id === topic.main_video ||
            v.slug === topic.main_video
          );

          if (!mainVideo && rawId) {
            mainVideo = {
              id: rawId,
              youtube_id: rawId,
              title: topic.name,
              type: "video"
            };
          }
        }

        if (!mainVideo) {
          mainVideo = fullEpisodes[0] || shortVideos[0] || topicVideos[0];
        }

        // Filter experts on this topic:
        // STRICTLY use the assigned experts if topic.experts is defined.
        // Do NOT automatically infer extra unassigned experts from answers or videos.
        let topicExperts: any[] = [];
        if (Array.isArray(topic.experts)) {
          topicExperts = topic.experts
            .filter((expSlug: any) => typeof expSlug === "string" && expSlug.trim().length > 0)
            .map((expSlug: string) => allExperts.find((e: any) => e.slug === expSlug.trim() && e.published !== false))
            .filter(Boolean);
        } else {
          topicExperts = allExperts.filter((e: any) => {
            if (e.published === false) return false;
            return (
              topicAnswers.some((a: any) => a.expert === e.slug) ||
              topicVideos.some((v: any) => v.expert === e.slug || v.guest === e.slug)
            );
          });
        }

        // Other topics
        const otherTopics = allTopics.filter((t: any) => t.slug !== topicSlug && t.published !== false).slice(0, 6);

        return (
          <PageShell>
            <main id="main">
              <div
                className="page-head page-head--tint"
                style={{ "--tint": topic.swatch || "#bfe4c6" } as React.CSSProperties}
              >
                <div className="wrap">
                  <nav aria-label="Breadcrumb">
                    <ol className="crumbs">
                      <li><a href="/">Home</a></li>
                      <li><a href="/topics/">Topics</a></li>
                      <li aria-current="page">{topic.name}</li>
                    </ol>
                  </nav>
                  <span className="eyebrow">Topic hub</span>
                  <h1 style={{ marginTop: ".6rem" }}>{topic.name}</h1>
                  <p className="lede">
                    {topic.intro || topic.short || `Much of your child's health and wellness connects to ${topic.name.toLowerCase()}.`}
                  </p>
                  <div className="hub-meta">
                    <span className="pill">{topicAnswers.length} answers</span>
                    {fullEpisodes.length > 0 && <span className="pill">{fullEpisodes.length} full episodes</span>}
                    {shortVideos.length > 0 && <span className="pill">{shortVideos.length} short videos</span>}
                    {socialClips.length > 0 && <span className="pill">{socialClips.length} social clips</span>}
                    <span className="pill">{formatAgesLabel(topic.ages)}</span>
                  </div>
                </div>
              </div>

              <section className="section--tight">
                <div className="wrap layout-2">
                  <div>
                    {mainVideo && (
                      <div style={{ marginBottom: "2.5rem" }}>
                        <h2 className="h3" style={{ marginBottom: "1rem" }}>Start here</h2>
                        <YouTubePlayer
                          videoId={mainVideo.youtube_id || mainVideo.id}
                          title={mainVideo.title}
                          label={`Start here · ${mainVideo.type === "episode" ? "Full episode" : "Video"}${mainVideo.duration ? ` · ${mainVideo.duration}` : ""}`}
                        />
                        <p className="muted" style={{ marginTop: ".8rem" }}>{mainVideo.title}</p>
                      </div>
                    )}

                    {topicAnswers.length > 0 && (
                      <>
                        <h2 className="h2" style={{ margin: "2.5rem 0 1.25rem" }}>Parent questions</h2>
                        <ul className="answers">
                          {topicAnswers.map((a: any) => {
                            const exp = getExpert(a.expert);
                            return (
                              <li key={a.id || a.slug}>
                                <a className="answer-card" href={`/answers/${a.slug}/`}>
                                  <span className="q">{a.q || a.question || a.title}</span>
                                  <span className="who">
                                    <i style={{ background: exp?.swatch || topic.swatch || "#bfe4c6" }} />
                                    {exp ? exp.name : "Medical Expert"} · {topic.name}
                                  </span>
                                </a>
                              </li>
                            );
                          })}
                        </ul>
                      </>
                    )}

                    {(fullEpisodes.length > 0 || shortVideos.length > 0 || socialClips.length > 0) && (
                      <>
                        <h2 className="h2" style={{ margin: "3rem 0 1.25rem" }}>Watch &amp; listen</h2>

                        {fullEpisodes.length > 0 && (
                          <div className="hub-fmt">
                            <h3>
                              <span className="fmt-badge fmt-badge--episode">Full episode</span> Full episodes <small>{fullEpisodes.length}</small>
                            </h3>
                            <div className="ep-grid">
                              {fullEpisodes.map((ep: any) => {
                                const exp = getExpert(ep.expert || ep.guest);
                                return (
                                  <a key={ep.id || ep.slug} className="ep-card ep-card--episode" href={`/videos/${ep.slug || ep.id}/`}>
                                    <div className="ep-card__thumb">
                                      <img
                                        src={`https://i.ytimg.com/vi/${ep.youtube_id || ep.id}/hqdefault.jpg`}
                                        alt=""
                                        width={480}
                                        height={270}
                                        loading="lazy"
                                      />
                                      <span className="fmt-badge fmt-badge--episode">Full episode</span>
                                      {ep.duration && <span className="ep-card__dur">{ep.duration}</span>}
                                      <span className="ep-card__play">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none"/></svg>
                                      </span>
                                    </div>
                                    <h3>{ep.title}</h3>
                                    <div className="ep-card__meta">
                                      <span>{exp ? exp.name : "Expert"}</span>
                                      <span>{topic.name}</span>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {shortVideos.length > 0 && (
                          <div className="hub-fmt">
                            <h3>
                              <span className="fmt-badge fmt-badge--video">Short video</span> Short videos <small>{shortVideos.length}</small>
                            </h3>
                            <div className="ep-grid">
                              {shortVideos.map((vid: any) => {
                                const exp = getExpert(vid.expert || vid.guest);
                                return (
                                  <a key={vid.id || vid.slug} className="ep-card ep-card--video" href={`/videos/${vid.slug || vid.id}/`}>
                                    <div className="ep-card__thumb">
                                      <img
                                        src={`https://i.ytimg.com/vi/${vid.youtube_id || vid.id}/hqdefault.jpg`}
                                        alt=""
                                        width={480}
                                        height={270}
                                        loading="lazy"
                                      />
                                      <span className="fmt-badge fmt-badge--video">Short video</span>
                                      {vid.duration && <span className="ep-card__dur">{vid.duration}</span>}
                                      <span className="ep-card__play">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none"/></svg>
                                      </span>
                                    </div>
                                    <h3>{vid.title}</h3>
                                    <div className="ep-card__meta">
                                      <span>{exp ? exp.name : "Expert"}</span>
                                      <span>{topic.name}</span>
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {socialClips.length > 0 && (
                          <div className="hub-fmt">
                            <h3>
                              <span className="fmt-badge fmt-badge--social">Social clip</span> Social clips <small>{socialClips.length}</small>
                            </h3>
                            <div className="social-row">
                              {socialClips.map((clip: any) => {
                                const exp = getExpert(clip.expert || clip.guest);
                                return (
                                  <a
                                    key={clip.id || clip.slug}
                                    className="social-card"
                                    href={clip.youtube_short_url || `https://www.youtube.com/shorts/${clip.youtube_id || clip.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <img
                                      src={`https://i.ytimg.com/vi/${clip.youtube_id || clip.id}/hqdefault.jpg`}
                                      alt=""
                                      width={270}
                                      height={480}
                                      loading="lazy"
                                    />
                                    <span className="fmt-badge fmt-badge--social">{clip.duration || "Short"}</span>
                                    <span className="social-card__txt">
                                      <b>{clip.title}</b>
                                      <small>{exp ? exp.name : "Expert"}</small>
                                    </span>
                                  </a>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    {topicAnswers.length === 0 && topicVideos.length === 0 && (
                      <div style={{ padding: "3rem 0", color: "var(--ink-muted, #667)" }}>
                        <p className="lede">New expert answers and videos for {topic.name} are coming soon.</p>
                      </div>
                    )}

                    <p className="hub-note">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                        <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/>
                        <path d="m9 12 2 2 4-4"/>
                      </svg>
                      <span>Answers and videos here are general education, not medical advice for your child. <a href="/medical-disclaimer/">Medical disclaimer</a></span>
                    </p>
                  </div>

                  <aside className="aside" aria-label="About this topic">
                    {topicExperts.length > 0 && (
                      <div className="card">
                        <h2>Experts on this topic</h2>
                        <ul className="related" style={{ marginTop: ".5rem" }}>
                          {topicExperts.map((exp: any) => (
                            <li key={exp.slug}>
                              <a href={`/experts/${exp.slug}/`}>
                                {exp.name}
                                <small>{exp.role}</small>
                              </a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="card" style={{ background: "var(--peach-soft)", borderColor: "transparent" }}>
                      <h2>Still wondering?</h2>
                      <p style={{ margin: ".5rem 0 1rem", fontSize: ".95rem" }}>
                        Send Dr. Murray your {topic.name.toLowerCase()} question.
                      </p>
                      <a className="btn" href="/ask-the-doctor/">Ask the Doctor</a>
                    </div>

                    {otherTopics.length > 0 && (
                      <div className="card">
                        <h2>Other topics</h2>
                        <ul className="tags" style={{ marginTop: ".8rem" }}>
                          {otherTopics.map((ot: any) => (
                            <li key={ot.slug}>
                              <a href={`/topics/${ot.slug}/`}>{ot.name}</a>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </aside>
                </div>
              </section>
            </main>
          </PageShell>
        );
      }
      notFound();
    } catch (err) {
      console.error("Error rendering dynamic topic:", err);
      notFound();
    }
  }

  // ==========================================
  // 2. DYNAMIC EXPERTS PROFILE (/experts/[slug])
  // ==========================================
  if (slug.length === 2 && slug[0] === "experts") {
    const expertSlug = slug[1];
    try {
      const [expertsRes, answersRes, videosRes, topicsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/experts`, { cache: "no-store", signal: AbortSignal.timeout(4000) }),
        fetch(`${API_BASE}/answers`, { cache: "no-store", signal: AbortSignal.timeout(4000) }),
        fetch(`${API_BASE}/videos`, { cache: "no-store", signal: AbortSignal.timeout(4000) }),
        fetch(`${API_BASE}/topics`, { cache: "no-store", signal: AbortSignal.timeout(4000) })
      ]);

      let allExperts: any[] = [];
      let allAnswers: any[] = [];
      let allVideos: any[] = [];
      let allTopics: any[] = [];

      if (expertsRes.status === "fulfilled" && expertsRes.value.ok) {
        const eData = await expertsRes.value.json();
        if (eData.success && Array.isArray(eData.experts)) allExperts = eData.experts;
      }
      if (answersRes.status === "fulfilled" && answersRes.value.ok) {
        const aData = await answersRes.value.json();
        if (aData.success && Array.isArray(aData.answers)) allAnswers = aData.answers;
      }
      if (videosRes.status === "fulfilled" && videosRes.value.ok) {
        const vData = await videosRes.value.json();
        if (vData.success && Array.isArray(vData.videos)) allVideos = vData.videos;
      }
      if (topicsRes.status === "fulfilled" && topicsRes.value.ok) {
        const tData = await topicsRes.value.json();
        if (tData.success && Array.isArray(tData.topics)) allTopics = tData.topics;
      }

      const expert = allExperts.find((e: any) => e.slug === expertSlug);
      if (!expert || expert.published === false) {
        notFound();
      }

      const rawBioList = Array.isArray(expert.bio)
        ? expert.bio
        : typeof expert.bio === "string"
        ? expert.bio.split("\n\n").map((s: string) => s.trim()).filter(Boolean)
        : [];

      const bioParagraphs = rawBioList.length > 0
        ? rawBioList
        : expert.short
        ? [expert.short]
        : [];

      const ledeParagraph = bioParagraphs[0] || expert.short || "";
      const remainingParagraphs = bioParagraphs
        .slice(1)
        .filter((p: string) => p.trim() && p.trim() !== ledeParagraph.trim());

      const credsList = Array.isArray(expert.creds)
        ? expert.creds
        : typeof expert.creds === "string"
        ? [expert.creds]
        : [];
      const initials = expert.name
        .split(" ")
        .filter(Boolean)
        .map((n: string) => n[0])
        .slice(0, 2)
        .join("");

      // Filter answers by this expert
      const hasCustomAnswers = Array.isArray(expert.answers) && expert.answers.length > 0;
      const expertAnswers = allAnswers.filter((a: any) => {
        if (hasCustomAnswers) {
          return expert.answers.includes(a.slug);
        }
        if (a.published === false) return false;
        return (
          a.expert === expert.slug ||
          a.expert === expert.name ||
          (typeof a.expert === "string" && a.expert.toLowerCase().trim() === expert.name.toLowerCase().trim()) ||
          (typeof a.expert === "string" && a.expert.toLowerCase().trim() === expert.slug.toLowerCase().trim())
        );
      });

      // Filter videos by this expert
      const hasCustomEpisodes = Array.isArray(expert.episodes) && expert.episodes.length > 0;
      const expertVideos = allVideos.filter((v: any) => {
        if (hasCustomEpisodes) {
          return (
            expert.episodes.includes(v.id) ||
            (v.youtube_id && expert.episodes.includes(v.youtube_id)) ||
            (v.slug && expert.episodes.includes(v.slug))
          );
        }
        if (v.published === false) return false;
        const eMatch =
          v.expert === expert.slug ||
          v.guest === expert.slug ||
          v.expert === expert.name ||
          v.guest === expert.name ||
          (typeof v.expert === "string" && v.expert.toLowerCase().includes(expert.slug.toLowerCase())) ||
          (typeof v.guest === "string" && v.guest.toLowerCase().includes(expert.slug.toLowerCase())) ||
          (typeof v.expert === "string" && v.expert.toLowerCase().includes(expert.name.toLowerCase())) ||
          (typeof v.guest === "string" && v.guest.toLowerCase().includes(expert.name.toLowerCase())) ||
          (typeof v.title === "string" && v.title.toLowerCase().includes(expert.name.toLowerCase()));
        return Boolean(eMatch);
      });

      const episodesAndShorts = expertVideos.filter((v: any) => getVideoFormat(v) !== "short");
      const socialClips = expertVideos.filter((v: any) => getVideoFormat(v) === "short");

      const getTopicInfo = (topicSlug?: string) => {
        if (!topicSlug) return null;
        return allTopics.find((t: any) => t.slug === topicSlug) || null;
      };

      return (
        <PageShell>
          <main id="main">
            <div className="page-head" style={{ paddingBottom: "1rem" }}>
              <div className="wrap">
                <nav aria-label="Breadcrumb">
                  <ol className="crumbs">
                    <li><a href="/">Home</a></li>
                    <li><a href="/experts/">Experts</a></li>
                    <li aria-current="page">{expert.name}</li>
                  </ol>
                </nav>
              </div>
            </div>

            <section className="section--tight" style={{ paddingTop: 0 }}>
              <div className="wrap profile">
                <div
                  className="profile__img"
                  style={{ background: expert.swatch || expert.color || "#a6d6b0" }}
                >
                  {expert.img ? (
                    <img
                      src={expert.img}
                      alt={`Portrait of ${expert.name}`}
                      width={800}
                      height={875}
                    />
                  ) : (
                    <div
                      style={{
                        height: "100%",
                        display: "grid",
                        placeItems: "center",
                        background: expert.swatch || expert.color || "#ddd6f5",
                        fontFamily: "var(--font-display, serif)",
                        fontSize: "5rem",
                        fontWeight: 700,
                        color: "var(--navy, #2b3c56)"
                      }}
                    >
                      {initials}
                    </div>
                  )}
                </div>

                <div>
                  <span className="eyebrow">{expert.role}</span>
                  <h1 className="display" style={{ marginTop: ".6rem" }}>
                    {expert.name}
                  </h1>

                  <div className="prose" style={{ marginTop: "1.5rem" }}>
                    {ledeParagraph && <p className="lede">{ledeParagraph}</p>}
                    {remainingParagraphs.map((p: string, idx: number) => (
                      <p key={idx}>{p}</p>
                    ))}
                  </div>

                  {credsList.length > 0 && (
                    <ul className="creds">
                      {credsList.map((c: string, idx: number) => (
                        <li key={idx}>
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
                            <path d="m5 12.5 4.5 4.5L19 7.5" />
                          </svg>
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {expert.slug === "dr-murray-clarke" && (
                    <div className="profile-disclosure" role="note" style={{ marginTop: "1.5rem" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                        <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" />
                        <path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
                      </svg>
                      <div>
                        <b>Relationship disclosure</b>
                        <p>Dr. Murray Clarke is the founder of ChildLife Essentials, a children’s nutritional supplement company. The First Seven Years does not recommend or sell products, and his answers on this site are educational, not product advice.</p>
                      </div>
                    </div>
                  )}

                  <p style={{ marginTop: "2rem" }}>
                    <a className="btn" href="/ask-the-doctor/">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                        <path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.1A8 8 0 1 1 20 12z" />
                      </svg>
                      Ask Dr. Murray a question
                    </a>
                  </p>

                  {/* Answers by this expert */}
                  {expertAnswers.length > 0 && (
                    <>
                      <h2 className="h3" style={{ margin: "3rem 0 1rem" }}>Answers</h2>
                      <ul className="answers">
                        {expertAnswers.map((a: any) => {
                          const topInfo = getTopicInfo(a.topic);
                          return (
                            <li key={a.slug}>
                              <a className="answer-card" href={`/answers/${a.slug}/`}>
                                <span className="q">{a.q}</span>
                                <span className="who">
                                  <i style={{ background: topInfo?.swatch || "#bfe4c6" }} />
                                  {expert.name}{topInfo ? ` · ${topInfo.name}` : ""}
                                </span>
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </>
                  )}

                  {/* Episodes & videos */}
                  {episodesAndShorts.length > 0 && (
                    <>
                      <h2 className="h3" style={{ margin: "3rem 0 1rem" }}>Episodes &amp; videos</h2>
                      <div className="ep-grid">
                        {episodesAndShorts.map((v: any) => {
                          const target = getVideoUrl(v);
                          const thumb = getVideoThumbnail(v, false);
                          const fmt = getVideoFormat(v);
                          const fmtBadgeClass = fmt === "episode" ? "fmt-badge--episode" : "fmt-badge--video";
                          const fmtLabel = fmt === "episode" ? "Full episode" : "Short video";
                          const topInfo = getTopicInfo(v.topic);

                          return (
                            <a key={v.id || v.slug} className={`ep-card ep-card--${fmt === "episode" ? "episode" : "video"}`} href={target.url}>
                              <div className="ep-card__thumb">
                                <img src={thumb} alt={v.title} width={480} height={270} loading="lazy" />
                                <span className={`fmt-badge ${fmtBadgeClass}`}>{fmtLabel}</span>
                                {v.duration && <span className="ep-card__dur">{v.duration}</span>}
                                <span className="ep-card__play">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                                    <path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none" />
                                  </svg>
                                </span>
                              </div>
                              <h3>{v.title}</h3>
                              <div className="ep-card__meta">
                                <span>{expert.name}</span>
                                {topInfo && <span>{topInfo.name}</span>}
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    </>
                  )}

                  {/* Social clips */}
                  {socialClips.length > 0 && (
                    <div className="social-row" style={{ marginTop: "1.5rem" }}>
                      {socialClips.map((sh: any) => {
                        const target = getVideoUrl(sh);
                        const thumb = getVideoThumbnail(sh, true);

                        return (
                          <a
                            key={sh.id || sh.slug}
                            className="social-card"
                            href={target.url}
                            target={target.isExternal ? "_blank" : undefined}
                            rel={target.isExternal ? "noopener noreferrer" : undefined}
                            aria-label={`${sh.title} — ${expert.name}`}
                          >
                            <img src={thumb} alt={sh.title} width={270} height={480} loading="lazy" />
                            <span className="fmt-badge fmt-badge--social">{sh.duration || "1:00"}</span>
                            <span className="social-card__txt">
                              <b>{sh.title}</b>
                              <small>{expert.name}</small>
                            </span>
                          </a>
                        );
                      })}
                    </div>
                  )}

                  <p className="muted" style={{ marginTop: "2rem", fontSize: ".85rem" }}>
                    Credentials are supplied and confirmed by the expert.
                  </p>
                </div>
              </div>
            </section>
          </main>
        </PageShell>
      );
    } catch (err) {
      console.error("Error in dynamic expert handler:", err);
      notFound();
    }
  }

  // ==========================================
  // 3. DYNAMIC PARENT ANSWERS (/answers & /answers/[slug])
  // ==========================================
  if (slug.length === 1 && slug[0] === "answers") {
    redirect("/search/");
  }

  if (slug.length === 2 && slug[0] === "answers") {
    const answerSlug = slug[1];
    try {
      const [answersRes, topicsRes, expertsRes, videosRes] = await Promise.allSettled([
        fetch(`${API_BASE}/answers`, { cache: "no-store" }),
        fetch(`${API_BASE}/topics`, { cache: "no-store" }),
        fetch(`${API_BASE}/experts`, { cache: "no-store" }),
        fetch(`${API_BASE}/videos`, { cache: "no-store" })
      ]);

      let allAnswers: any[] = [];
      let allTopics: any[] = [];
      let allExperts: any[] = [];
      let allVideos: any[] = [];

      if (answersRes.status === "fulfilled" && answersRes.value.ok) {
        const aData = await answersRes.value.json();
        if (aData.success && Array.isArray(aData.answers)) allAnswers = aData.answers;
      }
      if (topicsRes.status === "fulfilled" && topicsRes.value.ok) {
        const tData = await topicsRes.value.json();
        if (tData.success && Array.isArray(tData.topics)) allTopics = tData.topics;
      }
      if (expertsRes.status === "fulfilled" && expertsRes.value.ok) {
        const eData = await expertsRes.value.json();
        if (eData.success && Array.isArray(eData.experts)) allExperts = eData.experts;
      }
      if (videosRes.status === "fulfilled" && videosRes.value.ok) {
        const vData = await videosRes.value.json();
        if (vData.success && Array.isArray(vData.videos)) allVideos = vData.videos;
      }

      const answer = allAnswers.find((a: any) => a.slug === answerSlug);
      if (!answer || answer.published === false) {
        notFound();
      }

      const topic = allTopics.find((t: any) => t.slug === answer.topic) || null;
      const expert = allExperts.find((e: any) => e.slug === answer.expert) || null;
      const expertInitials = expert?.name
        ? expert.name.split(" ").filter(Boolean).map((n: string) => n[0]).slice(0, 2).join("")
        : "E";

      // Related answers in same topic
      const moreInTopic = allAnswers.filter((a: any) =>
        a.published !== false &&
        a.slug !== answer.slug &&
        (a.topic === answer.topic || (Array.isArray(a.also) && a.also.includes(answer.topic)))
      ).slice(0, 4);

      // Related videos in same topic
      const relatedVideos = allVideos.filter((v: any) =>
        v.published !== false &&
        (v.topic === answer.topic || (Array.isArray(v.tags) && v.tags.includes(answer.topic)))
      ).slice(0, 3);

      const publishedDate = answer.createdAt
        ? new Date(answer.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
        : null;
      const reviewedDate = answer.reviewed || answer.reviewed_at || "2026-09-25";

      return (
        <PageShell>
          <main id="main">
            <div className="page-head" style={{ paddingBottom: 0 }}>
              <div className="wrap">
                <nav aria-label="Breadcrumb">
                  <ol className="crumbs">
                    <li><a href="/">Home</a></li>
                    <li><a href="/topics/">Topics</a></li>
                    {topic && <li><a href={`/topics/${topic.slug}/`}>{topic.name}</a></li>}
                    <li aria-current="page">{answer.q}</li>
                  </ol>
                </nav>
              </div>
            </div>

            <article className="section--tight" style={{ paddingTop: 0 }}>
              <div className="wrap layout-2">
                <div>
                  {topic && <span className="eyebrow">{topic.name}</span>}
                  <h1 className="h1" style={{ marginTop: ".7rem", maxWidth: "22ch" }}>
                    {answer.q}
                  </h1>

                  <div className="byline">
                    <div className="byline__who">
                      {expert?.img ? (
                        <img
                          src={expert.img}
                          alt={expert.name}
                          width={44}
                          height={44}
                          style={{ width: "44px", height: "44px", borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : (
                        <span
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "50%",
                            background: expert?.swatch || expert?.color || "#fad7c4",
                            display: "grid",
                            placeItems: "center",
                            fontFamily: "var(--font-display)",
                            fontWeight: 600
                          }}
                        >
                          {expertInitials}
                        </span>
                      )}
                      <div>
                        {expert ? (
                          <>
                            <a href={`/experts/${expert.slug}/`}>{expert.name}</a>
                            <small>{expert.role}</small>
                          </>
                        ) : (
                          <>
                            <span>Dr. Murray Clarke</span>
                            <small>Host · The First Seven Years</small>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="byline__dates">
                      {publishedDate && (
                        <span>
                          Published <b><time>{publishedDate}</time></b>
                        </span>
                      )}
                      <span className="badge-review">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                          <path d="m5 12.5 4.5 4.5L19 7.5" />
                        </svg>
                        Reviewed <time>{reviewedDate}</time>
                      </span>
                      {answer.clinical_status && (
                        <span className="badge-draft">{answer.clinical_status}</span>
                      )}
                    </div>
                  </div>

                  <div className="review-line">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                      <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/>
                      <path d="m9 12 2 2 4-4"/>
                    </svg>
                    <span>
                      <b>Reviewed by {answer.reviewed_by || "Dr. Murray Clarke"}</b>, clinical lead
                    </span>
                    <details>
                      <summary>How we review</summary>
                      <p>
                        Every answer goes through scientific review — and legal and regulatory review where needed — before it is published. Each page shows when it was published and last reviewed, and high-traffic pages are re-checked every quarter. <a href="/about/#standards">Our editorial standards</a>
                      </p>
                    </details>
                  </div>

                  {answer.quick && (
                    <section className="quick" aria-labelledby="qa">
                      <h2 id="qa">The short answer</h2>
                      <p className="speakable">{answer.quick}</p>
                    </section>
                  )}

                  <aside className="med-notice" aria-label="Medical disclaimer">
                    <div className="med-notice__main">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                        <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/>
                        <path d="m9 12 2 2 4-4"/>
                      </svg>
                      <div>
                        <h2>Medical disclaimer</h2>
                        <p>
                          This answer is general education from a named expert, reviewed before publishing. It is <strong>not medical advice, a diagnosis or a treatment plan for your child</strong>, and reading it does not create a doctor–patient relationship. Always check with your child’s own doctor before changing their care, diet or supplements. <a href="/medical-disclaimer/">Full medical disclaimer</a>
                        </p>
                      </div>
                    </div>
                    <div className="med-notice__urgent">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                        <path d="M12 3 2 20h20z"/>
                        <path d="M12 10v4M12 17.5v.01"/>
                      </svg>
                      <div>
                        <h3>Get urgent help now — call 911 or your local emergency number — if your child:</h3>
                        <ul>
                          <li>is struggling to breathe, or has blue or grey lips</li>
                          <li>is very drowsy, floppy or hard to wake</li>
                          <li>has a seizure</li>
                          <li>has swelling of the face or lips, or hives with breathing trouble</li>
                          <li>is under 3 months old with a temperature of 100.4°F (38°C) or higher</li>
                        </ul>
                      </div>
                    </div>
                  </aside>

                  {answer.video && (
                    <div style={{ marginTop: "2rem" }}>
                      <YouTubePlayer
                        videoId={extractYouTubeId(answer.video)}
                        title={`Watch the answer: ${answer.q}`}
                      />
                    </div>
                  )}

                  {answer.body && (
                    <div
                      className="prose"
                      style={{ marginTop: "2.5rem" }}
                      dangerouslySetInnerHTML={{
                        __html: typeof answer.body === "string"
                          ? answer.body
                          : Array.isArray(answer.body)
                          ? answer.body.join("")
                          : ""
                      }}
                    />
                  )}

                  <section className="refs" aria-labelledby="refs-h">
                    <h2 id="refs-h">References</h2>
                    <p className="muted">
                      Numbered references are added during scientific review, before this answer is published. <span className="badge-draft">Draft</span>
                    </p>
                  </section>

                  {expert && (
                    <div className="expert-card-lg">
                      {expert.img ? (
                        <img
                          src={expert.img}
                          alt={expert.name}
                          width={72}
                          height={72}
                          style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover" }}
                        />
                      ) : (
                        <span className="avatar avatar--ini" style={{ "--s": "72px", background: expert.swatch || expert.color || "#fad7c4" } as React.CSSProperties} aria-hidden="true">
                          {expertInitials}
                        </span>
                      )}
                      <div>
                        <span className="eyebrow">About the expert</span>
                        <b><a href={`/experts/${expert.slug}/`}>{expert.name}</a></b>
                        <small>{expert.role}</small>
                        {expert.short && <p>{expert.short}</p>}
                      </div>
                    </div>
                  )}

                  <div className="disclosure" style={{ marginTop: "2rem" }}>
                    <b>About this answer</b>
                    <span>
                      Experts share their own clinical views and experience; appearing here is not an endorsement of any product or service. <a href="/about/#disclosure">Sponsors &amp; relationships</a> · <a href="/medical-disclaimer/">Medical disclaimer</a>
                    </span>
                  </div>
                </div>

                <aside className="aside" aria-label="Related">
                  {moreInTopic.length > 0 && topic && (
                    <div className="card">
                      <h2>More in {topic.name}</h2>
                      <ul className="related">
                        {moreInTopic.map((item: any) => {
                          const exp = allExperts.find((e: any) => e.slug === item.expert);
                          return (
                            <li key={item.slug}>
                              <a href={`/answers/${item.slug}/`}>
                                {item.q}
                                {exp && <small>{exp.name}</small>}
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                      <p style={{ marginTop: "1rem" }}>
                        <a className="link-arrow" href={`/topics/${topic.slug}/`}>
                          Topic hub <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d="M5 12h14"/><path d="m13 6 6 6-6 6"/></svg>
                        </a>
                      </p>
                    </div>
                  )}

                  {relatedVideos.length > 0 && (
                    <div className="card">
                      <h2>Related videos</h2>
                      <ul className="related">
                        {relatedVideos.map((v: any) => {
                          const exp = allExperts.find((e: any) => e.slug === (v.expert || v.guest));
                          return (
                            <li key={v.id || v.slug}>
                              <a href={`/videos/${v.slug || v.id}/`}>
                                {v.title}
                                <small>
                                  {v.duration ? `${v.duration} · ` : ""}{exp ? exp.name : "Expert"}
                                </small>
                              </a>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}

                  <div className="card" style={{ background: "var(--mint-soft)", borderColor: "transparent" }}>
                    <h2>Different question?</h2>
                    <p style={{ margin: ".5rem 0 1rem", fontSize: ".95rem" }}>
                      Dr. Murray answers the questions parents ask most.
                    </p>
                    <a className="btn" href="/ask-the-doctor/">Ask the Doctor</a>
                  </div>
                </aside>
              </div>
            </article>
          </main>
        </PageShell>
      );
    } catch (err) {
      console.error("Error rendering dynamic answer:", err);
      notFound();
    }
  }

  // ==========================================
  // 3.5. DYNAMIC VIDEOS PAGES (/videos, /videos/full-episodes, /videos/short-videos, /videos/social-clips, /videos/[slug])
  // ==========================================
  if (slug[0] === "videos") {
    try {
      const [videosRes, expertsRes, topicsRes] = await Promise.allSettled([
        fetch(`${API_BASE}/videos`, { cache: "no-store" }),
        fetch(`${API_BASE}/experts`, { cache: "no-store" }),
        fetch(`${API_BASE}/topics`, { cache: "no-store" })
      ]);

      let allVideos: any[] = [];
      let allExperts: any[] = [];
      let allTopics: any[] = [];

      if (videosRes.status === "fulfilled" && videosRes.value.ok) {
        const vData = await videosRes.value.json();
        if (vData.success && Array.isArray(vData.videos)) allVideos = vData.videos;
      }
      if (expertsRes.status === "fulfilled" && expertsRes.value.ok) {
        const eData = await expertsRes.value.json();
        if (eData.success && Array.isArray(eData.experts)) allExperts = eData.experts;
      }
      if (topicsRes.status === "fulfilled" && topicsRes.value.ok) {
        const tData = await topicsRes.value.json();
        if (tData.success && Array.isArray(tData.topics)) allTopics = tData.topics;
      }

      const publishedVideos = allVideos.filter((v: any) => v.published !== false);

      const episodes = publishedVideos.filter((v: any) => getVideoFormat(v) === "episode");
      const clips = publishedVideos.filter((v: any) => getVideoFormat(v) === "clip");
      const shorts = publishedVideos.filter((v: any) => getVideoFormat(v) === "short");

      const episodeCount = episodes.length;
      const clipCount = clips.length;
      const shortCount = shorts.length;
      const totalCount = publishedVideos.length;

      // Helper to render Tabs Nav
      const renderFmtTabs = (current: "all" | "episode" | "video" | "social") => (
        <nav className="fmt-tabs" aria-label="Video formats">
          <a
            className="fmt-tab fmt-tab--all"
            href="/videos/"
            aria-current={current === "all" ? "page" : undefined}
          >
            <b>All formats</b>
            <small>{totalCount}</small>
          </a>
          <a
            className="fmt-tab fmt-tab--episode"
            href="/videos/full-episodes/"
            aria-current={current === "episode" ? "page" : undefined}
          >
            <b>Full episodes</b>
            <small>{episodeCount}</small>
          </a>
          <a
            className="fmt-tab fmt-tab--video"
            href="/videos/short-videos/"
            aria-current={current === "video" ? "page" : undefined}
          >
            <b>Short videos</b>
            <small>{clipCount}</small>
          </a>
          <a
            className="fmt-tab fmt-tab--social"
            href="/videos/social-clips/"
            aria-current={current === "social" ? "page" : undefined}
          >
            <b>Social clips</b>
            <small>{shortCount}</small>
          </a>
        </nav>
      );

      // Helper to get topic label for video meta
      const getTopicName = (topicSlug?: string) => {
        if (!topicSlug) return null;
        const top = allTopics.find((t: any) => t.slug === topicSlug);
        return top ? top.name : null;
      };

      // 1. ALL FORMATS PAGE (/videos)
      if (slug.length === 1) {
        return (
          <PageShell>
            <main id="main">
              <div className="page-head page-head--tint" style={{ "--tint": "var(--lilac-soft)" } as React.CSSProperties}>
                <div className="wrap">
                  <nav aria-label="Breadcrumb">
                    <ol className="crumbs">
                      <li><a href="/">Home</a></li>
                      <li aria-current="page">Watch &amp; listen</li>
                    </ol>
                  </nav>
                  <h1>Watch &amp; listen</h1>
                  <p className="lede">
                    Three ways in, depending on how much time you have: the full conversation, a short video on one question, or a quick clip for your phone.
                  </p>
                  <div className="qsearch__chips" style={{ justifyContent: "flex-start" }} aria-label="Listen on">
                    <a className="chip" href="https://www.youtube.com/@thefirstsevenyears" target="_blank" rel="noopener noreferrer">YouTube</a>
                    <a className="chip" href="https://podcasts.apple.com/us/search?term=The%20First%20Seven%20Years%20Murray%20Clarke" target="_blank" rel="noopener noreferrer">Apple Podcasts</a>
                    <a className="chip" href="https://open.spotify.com/search/The%20First%20Seven%20Years%20podcast" target="_blank" rel="noopener noreferrer">Spotify</a>
                  </div>
                </div>
              </div>

              <section className="section--tight">
                <div className="wrap">
                  {renderFmtTabs("all")}

                  {/* Section 1: Full episodes */}
                  <section className="fmt-section fmt-section--episode" aria-labelledby="fs-episode">
                    <div className="fmt-section__head">
                      <div>
                        <span className="fmt-badge fmt-badge--episode fmt-badge--lg">Full episode</span>
                        <h2 id="fs-episode" className="h2">Full episodes</h2>
                        <p className="muted">The long-form podcast conversations — 45 minutes to 1.5 hours with a guest expert.</p>
                      </div>
                      {episodeCount > 0 && (
                        <a className="link-arrow" href="/videos/full-episodes/">
                          All full episodes ({episodeCount}){" "}
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                            <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
                          </svg>
                        </a>
                      )}
                    </div>
                    {episodes.length === 0 ? (
                      <p style={{ padding: "2rem 0", color: "var(--ink-muted, #778)", fontSize: "1rem" }}>
                        No full episodes are currently published.
                      </p>
                    ) : (
                      <div className="ep-grid">
                        {episodes.map((ep: any) => {
                          const target = getVideoUrl(ep);
                          const thumb = getVideoThumbnail(ep, false);
                          const expName = getExpertDisplayName(ep.expert || ep.guest, allExperts);
                          const topName = getTopicName(ep.topic);

                          return (
                            <a key={ep.id || ep.slug} className="ep-card ep-card--episode" href={target.url}>
                              <div className="ep-card__thumb">
                                <img src={thumb} alt={ep.title} width={480} height={270} loading="lazy" />
                                <span className="fmt-badge fmt-badge--episode">Full episode</span>
                                {ep.duration && <span className="ep-card__dur">{ep.duration}</span>}
                                <span className="ep-card__play">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                                    <path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none" />
                                  </svg>
                                </span>
                              </div>
                              <h3>{ep.title}</h3>
                              <div className="ep-card__meta">
                                <span>{expName}</span>
                                {topName && <span>{topName}</span>}
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  {/* Section 2: Short videos */}
                  <section className="fmt-section fmt-section--video" aria-labelledby="fs-video">
                    <div className="fmt-section__head">
                      <div>
                        <span className="fmt-badge fmt-badge--video fmt-badge--lg">Short video</span>
                        <h2 id="fs-video" className="h2">Short videos</h2>
                        <p className="muted">7–12 minutes on a single question — one expert, one idea, straight to the point.</p>
                      </div>
                      {clipCount > 0 && (
                        <a className="link-arrow" href="/videos/short-videos/">
                          All short videos ({clipCount}){" "}
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                            <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
                          </svg>
                        </a>
                      )}
                    </div>
                    {clips.length === 0 ? (
                      <p style={{ padding: "2rem 0", color: "var(--ink-muted, #778)", fontSize: "1rem" }}>
                        No short videos are currently published.
                      </p>
                    ) : (
                      <div className="ep-grid">
                        {clips.slice(0, 8).map((clip: any) => {
                          const target = getVideoUrl(clip);
                          const thumb = getVideoThumbnail(clip, false);
                          const expName = getExpertDisplayName(clip.expert || clip.guest, allExperts);
                          const topName = getTopicName(clip.topic);

                          return (
                            <a key={clip.id || clip.slug} className="ep-card ep-card--video" href={target.url}>
                              <div className="ep-card__thumb">
                                <img src={thumb} alt={clip.title} width={480} height={270} loading="lazy" />
                                <span className="fmt-badge fmt-badge--video">Short video</span>
                                {clip.duration && <span className="ep-card__dur">{clip.duration}</span>}
                                <span className="ep-card__play">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                                    <path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none" />
                                  </svg>
                                </span>
                              </div>
                              <h3>{clip.title}</h3>
                              <div className="ep-card__meta">
                                <span>{expName}</span>
                                {topName && <span>{topName}</span>}
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </section>

                  {/* Section 3: Social clips */}
                  <section className="fmt-section fmt-section--social" aria-labelledby="fs-social">
                    <div className="fmt-section__head">
                      <div>
                        <span className="fmt-badge fmt-badge--social fmt-badge--lg">Social clip</span>
                        <h2 id="fs-social" className="h2">Social clips</h2>
                        <p className="muted">A minute or two, made for your phone. Vertical clips from YouTube Shorts and social.</p>
                      </div>
                      {shortCount > 0 && (
                        <a className="link-arrow" href="/videos/social-clips/">
                          All social clips ({shortCount}){" "}
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                            <path d="M5 12h14" /><path d="m13 6 6 6-6 6" />
                          </svg>
                        </a>
                      )}
                    </div>
                    {shorts.length === 0 ? (
                      <p style={{ padding: "2rem 0", color: "var(--ink-muted, #778)", fontSize: "1rem" }}>
                        No social clips are currently published.
                      </p>
                    ) : (
                      <div className="social-row">
                        {shorts.slice(0, 7).map((sh: any) => {
                          const target = getVideoUrl(sh);
                          const thumb = getVideoThumbnail(sh, true);
                          const expName = getExpertDisplayName(sh.expert || sh.guest, allExperts);

                          return (
                            <a
                              key={sh.id || sh.slug}
                              className="social-card"
                              href={target.url}
                              target={target.isExternal ? "_blank" : undefined}
                              rel={target.isExternal ? "noopener noreferrer" : undefined}
                              aria-label={`${sh.title} — ${expName}`}
                            >
                              <img src={thumb} alt={sh.title} width={270} height={480} loading="lazy" />
                              <span className="fmt-badge fmt-badge--social">{sh.duration || "Clip"}</span>
                              <span className="social-card__txt">
                                <b>{sh.title}</b>
                                <small>{expName}</small>
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>
              </section>
            </main>
          </PageShell>
        );
      }

      // 2. FULL EPISODES LISTING (/videos/full-episodes)
      if (slug.length === 2 && slug[1] === "full-episodes") {
        return (
          <PageShell>
            <main id="main">
              <div className="page-head page-head--tint" style={{ "--tint": "var(--lilac-soft)" } as React.CSSProperties}>
                <div className="wrap">
                  <nav aria-label="Breadcrumb">
                    <ol className="crumbs">
                      <li><a href="/">Home</a></li>
                      <li><a href="/videos/">Watch &amp; listen</a></li>
                      <li aria-current="page">Full episodes</li>
                    </ol>
                  </nav>
                  <span className="fmt-badge fmt-badge--episode fmt-badge--lg">Full episode</span>
                  <h1 style={{ marginTop: ".8rem" }}>Full episodes</h1>
                  <p className="lede">The long-form podcast conversations — 45 minutes to 1.5 hours with a guest expert.</p>
                </div>
              </div>

              <section className="section--tight">
                <div className="wrap">
                  {renderFmtTabs("episode")}

                  <section className="fmt-section fmt-section--episode" aria-labelledby="fs-episode">
                    <div className="fmt-section__head">
                      <div>
                        <span className="fmt-badge fmt-badge--episode fmt-badge--lg">Full episode</span>
                        <h2 id="fs-episode" className="h2">Full episodes</h2>
                        <p className="muted">The long-form podcast conversations — 45 minutes to 1.5 hours with a guest expert.</p>
                      </div>
                    </div>
                    {episodes.length === 0 ? (
                      <p style={{ padding: "2rem 0", color: "var(--ink-muted, #778)", fontSize: "1rem" }}>
                        No full episodes are currently published.
                      </p>
                    ) : (
                      <div className="ep-grid">
                        {episodes.map((ep: any) => {
                          const target = getVideoUrl(ep);
                          const thumb = getVideoThumbnail(ep, false);
                          const expName = getExpertDisplayName(ep.expert || ep.guest, allExperts);
                          const topName = getTopicName(ep.topic);

                          return (
                            <a key={ep.id || ep.slug} className="ep-card ep-card--episode" href={target.url}>
                              <div className="ep-card__thumb">
                                <img src={thumb} alt={ep.title} width={480} height={270} loading="lazy" />
                                <span className="fmt-badge fmt-badge--episode">Full episode</span>
                                {ep.duration && <span className="ep-card__dur">{ep.duration}</span>}
                                <span className="ep-card__play">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                                    <path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none" />
                                  </svg>
                                </span>
                              </div>
                              <h3>{ep.title}</h3>
                              <div className="ep-card__meta">
                                <span>{expName}</span>
                                {topName && <span>{topName}</span>}
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>
              </section>
            </main>
          </PageShell>
        );
      }

      // 3. SHORT VIDEOS LISTING (/videos/short-videos)
      if (slug.length === 2 && slug[1] === "short-videos") {
        return (
          <PageShell>
            <main id="main">
              <div className="page-head page-head--tint" style={{ "--tint": "var(--lilac-soft)" } as React.CSSProperties}>
                <div className="wrap">
                  <nav aria-label="Breadcrumb">
                    <ol className="crumbs">
                      <li><a href="/">Home</a></li>
                      <li><a href="/videos/">Watch &amp; listen</a></li>
                      <li aria-current="page">Short videos</li>
                    </ol>
                  </nav>
                  <span className="fmt-badge fmt-badge--video fmt-badge--lg">Short video</span>
                  <h1 style={{ marginTop: ".8rem" }}>Short videos</h1>
                  <p className="lede">7–12 minutes on a single question — one expert, one idea, straight to the point.</p>
                </div>
              </div>

              <section className="section--tight">
                <div className="wrap">
                  {renderFmtTabs("video")}

                  <section className="fmt-section fmt-section--video" aria-labelledby="fs-video">
                    <div className="fmt-section__head">
                      <div>
                        <span className="fmt-badge fmt-badge--video fmt-badge--lg">Short video</span>
                        <h2 id="fs-video" className="h2">Short videos</h2>
                        <p className="muted">7–12 minutes on a single question — one expert, one idea, straight to the point.</p>
                      </div>
                    </div>
                    {clips.length === 0 ? (
                      <p style={{ padding: "2rem 0", color: "var(--ink-muted, #778)", fontSize: "1rem" }}>
                        No short videos are currently published.
                      </p>
                    ) : (
                      <div className="ep-grid">
                        {clips.map((clip: any) => {
                          const target = getVideoUrl(clip);
                          const thumb = getVideoThumbnail(clip, false);
                          const expName = getExpertDisplayName(clip.expert || clip.guest, allExperts);
                          const topName = getTopicName(clip.topic);

                          return (
                            <a key={clip.id || clip.slug} className="ep-card ep-card--video" href={target.url}>
                              <div className="ep-card__thumb">
                                <img src={thumb} alt={clip.title} width={480} height={270} loading="lazy" />
                                <span className="fmt-badge fmt-badge--video">Short video</span>
                                {clip.duration && <span className="ep-card__dur">{clip.duration}</span>}
                                <span className="ep-card__play">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                                    <path d="M7 4.5v15l13-7.5z" fill="currentColor" stroke="none" />
                                  </svg>
                                </span>
                              </div>
                              <h3>{clip.title}</h3>
                              <div className="ep-card__meta">
                                <span>{expName}</span>
                                {topName && <span>{topName}</span>}
                              </div>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>
              </section>
            </main>
          </PageShell>
        );
      }

      // 4. SOCIAL CLIPS LISTING (/videos/social-clips)
      if (slug.length === 2 && slug[1] === "social-clips") {
        return (
          <PageShell>
            <main id="main">
              <div className="page-head page-head--tint" style={{ "--tint": "var(--lilac-soft)" } as React.CSSProperties}>
                <div className="wrap">
                  <nav aria-label="Breadcrumb">
                    <ol className="crumbs">
                      <li><a href="/">Home</a></li>
                      <li><a href="/videos/">Watch &amp; listen</a></li>
                      <li aria-current="page">Social clips</li>
                    </ol>
                  </nav>
                  <span className="fmt-badge fmt-badge--social fmt-badge--lg">Social clip</span>
                  <h1 style={{ marginTop: ".8rem" }}>Social clips</h1>
                  <p className="lede">A minute or two, made for your phone. Vertical clips from YouTube Shorts and social.</p>
                </div>
              </div>

              <section className="section--tight">
                <div className="wrap">
                  {renderFmtTabs("social")}

                  <section className="fmt-section fmt-section--social" aria-labelledby="fs-social">
                    <div className="fmt-section__head">
                      <div>
                        <span className="fmt-badge fmt-badge--social fmt-badge--lg">Social clip</span>
                        <h2 id="fs-social" className="h2">Social clips</h2>
                        <p className="muted">A minute or two, made for your phone. Vertical clips from YouTube Shorts and social.</p>
                      </div>
                    </div>
                    {shorts.length === 0 ? (
                      <p style={{ padding: "2rem 0", color: "var(--ink-muted, #778)", fontSize: "1rem" }}>
                        No social clips are currently published.
                      </p>
                    ) : (
                      <div className="social-row">
                        {shorts.map((sh: any) => {
                          const target = getVideoUrl(sh);
                          const thumb = getVideoThumbnail(sh, true);
                          const expName = getExpertDisplayName(sh.expert || sh.guest, allExperts);

                          return (
                            <a
                              key={sh.id || sh.slug}
                              className="social-card"
                              href={target.url}
                              target={target.isExternal ? "_blank" : undefined}
                              rel={target.isExternal ? "noopener noreferrer" : undefined}
                              aria-label={`${sh.title} — ${expName}`}
                            >
                              <img src={thumb} alt={sh.title} width={270} height={480} loading="lazy" />
                              <span className="fmt-badge fmt-badge--social">{sh.duration || "Clip"}</span>
                              <span className="social-card__txt">
                                <b>{sh.title}</b>
                                <small>{expName}</small>
                              </span>
                            </a>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>
              </section>
            </main>
          </PageShell>
        );
      }

      // 5. INDIVIDUAL VIDEO DETAIL PAGE (/videos/[slug])
      if (slug.length === 2) {
        const videoSlug = slug[1];
        const video = allVideos.find((v: any) =>
          v.slug === videoSlug ||
          v.id === videoSlug ||
          v.youtube_id === videoSlug ||
          (v.title && v.title.toLowerCase().replace(/['’]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") === videoSlug)
        );

        if (video && video.published !== false) {
          const rawFmt = (video.type || "").toLowerCase();
          const fmt = rawFmt.includes("episode") || rawFmt === "full" ? "episode" : rawFmt.includes("short") || rawFmt.includes("social") ? "social" : "video";
          const fmtLabel = fmt === "episode" ? "Full episode" : fmt === "social" ? "Social clip" : "Short video";
          const fmtBadgeClass = fmt === "episode" ? "fmt-badge--episode" : fmt === "social" ? "fmt-badge--social" : "fmt-badge--video";
          const parentFmtUrl = fmt === "episode" ? "/videos/full-episodes/" : fmt === "social" ? "/videos/social-clips/" : "/videos/short-videos/";
          const parentFmtLabel = fmt === "episode" ? "Full episodes" : fmt === "social" ? "Social clips" : "Short videos";

          const yId = video.youtube_id || video.id;
          const expSlug = video.expert || video.guest;
          const expertObj = allExperts.find((e: any) => e.slug === expSlug);
          const expertName = expertObj ? expertObj.name : "Dr. Murray Clarke";

          return (
            <PageShell>
              <main id="main">
                <div className="page-head" style={{ paddingBottom: "1.5rem" }}>
                  <div className="wrap">
                    <nav aria-label="Breadcrumb">
                      <ol className="crumbs">
                        <li><a href="/">Home</a></li>
                        <li><a href="/videos/">Watch &amp; listen</a></li>
                        <li><a href={parentFmtUrl}>{parentFmtLabel}</a></li>
                        <li aria-current="page">{video.title}</li>
                      </ol>
                    </nav>
                    <div className="hub-meta" style={{ margin: "0 0 1rem" }}>
                      <span className={`fmt-badge ${fmtBadgeClass} fmt-badge--lg`}>{fmtLabel}</span>
                      {video.duration && <span className="pill">{video.duration}</span>}
                    </div>
                    <h1 className="h1" style={{ maxWidth: "24ch" }}>{video.title}</h1>
                  </div>
                </div>

                <article className="section--tight" style={{ paddingTop: 0 }}>
                  <div className="wrap layout-2">
                    <div>
                      {yId && (
                        <div style={{ marginBottom: "1.5rem" }}>
                          <YouTubePlayer videoId={yId} title={video.title} label={`${fmtLabel}${video.duration ? ` · ${video.duration}` : ""}${expertName ? ` · ${expertName}` : ""}`} />
                        </div>
                      )}

                      <aside className="med-notice med-notice--compact" aria-label="Medical disclaimer">
                        <div className="med-notice__main">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
                            <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6z"/>
                            <path d="m9 12 2 2 4-4"/>
                          </svg>
                          <div>
                            <h2>Before you watch</h2>
                            <p>
                              {video.youtube_disclaimer || "Conversations reflect the views of the host and guests and are for general education — not medical advice for your child."}{" "}
                              <a href="/medical-disclaimer/">Medical disclaimer</a> · <a href="/about/#disclosure">Disclosures</a>
                            </p>
                          </div>
                        </div>
                      </aside>

                      <div className="byline">
                        <div className="byline__who">
                          <div>
                            Guest / Expert: {expSlug ? <a href={`/experts/${expSlug}/`}>{expertName}</a> : expertName}
                          </div>
                        </div>
                        <div className="byline__dates">
                          <span>Hosted by <b>Dr. Murray Clarke</b> &amp; <b>Bryce Wylde</b></span>
                        </div>
                      </div>

                      {video.description && (
                        <div className="prose" style={{ marginTop: "1.5rem" }}>
                          <p>{video.description}</p>
                        </div>
                      )}

                      {video.transcript && (
                        <div style={{ marginTop: "2rem" }}>
                          <h3>Transcript</h3>
                          <div className="prose" style={{ whiteSpace: "pre-line", marginTop: "1rem" }}>
                            {video.transcript}
                          </div>
                        </div>
                      )}
                    </div>

                    <aside className="aside" aria-label="Related">
                      <div className="card" style={{ background: "var(--mint-soft)", borderColor: "transparent" }}>
                        <h2>Have a question?</h2>
                        <p style={{ margin: ".5rem 0 1rem", fontSize: ".95rem" }}>
                          Dr. Murray answers the questions parents ask most.
                        </p>
                        <a className="btn" href="/ask-the-doctor/">Ask the Doctor</a>
                      </div>
                    </aside>
                  </div>
                </article>
              </main>
            </PageShell>
          );
        }
      }
    } catch (err) {
      console.error("Error in dynamic videos handler:", err);
    }

    notFound();
  }

  // ==========================================
  // 4. DYNAMIC DATABASE CMS PAGES (from MySQL `pages` table)
  // ==========================================
  if (slug.length === 1) {
    const pageSlug = slug[0];

    // Alias /serach to /search/
    if (pageSlug === "serach") {
      redirect("/search/");
    }

    try {
      const pageRes = await fetch(`${API_BASE}/pages`, { cache: "no-store" });
      if (pageRes.ok) {
        const pageData = await pageRes.json();
        if (pageData.success && Array.isArray(pageData.pages)) {
          let dbPage = pageData.pages.find((p: any) => p.slug === pageSlug);

          // If /terms was accessed but disclaimer is published under /medical-disclaimer, smoothly redirect
          if (!dbPage && pageSlug === "terms") {
            const hasDisclaimer = pageData.pages.some((p: any) => p.slug === "medical-disclaimer" && p.published !== false);
            if (hasDisclaimer) {
              redirect("/medical-disclaimer/");
            }
          }

          if (dbPage) {
            // Strictly respect publication status: draft pages are hidden
            if (dbPage.published === false) {
              notFound();
            }

            const pageTitle = dbPage.title || pageSlug;

            // Only use explicit excerpt authored in Page Management (never fall back to meta_desc or static text)
            const rawExcerpt = dbPage.excerpt ? dbPage.excerpt.trim() : "";
            const cleanExcerptText = rawExcerpt.replace(/<[^>]*>/g, "").trim();
            const hasExcerpt = cleanExcerptText.length > 0;
            const pageExcerpt = hasExcerpt ? rawExcerpt : "";

            const rawBody = dbPage.body ? dbPage.body.trim() : "";
            const isLegal =
              dbPage.template === "Legal & Privacy Policy" ||
              dbPage.template === "Legal / Policy" ||
              pageSlug === "privacy" ||
              pageSlug === "terms" ||
              pageSlug === "medical-disclaimer";

            return (
              <PageShell>
                <main id="main">
                  {/* PAGE HEADER */}
                  <div className="page-head page-head--tint page-head--compact page-head--wide">
                    <div className="wrap">
                      <nav aria-label="Breadcrumb">
                        <ol className="crumbs">
                          <li>
                            <a href="/">Home</a>
                          </li>
                          <li aria-current="page">{pageTitle}</li>
                        </ol>
                      </nav>
                      <h1>{renderFormattedPageTitle(pageTitle)}</h1>
                      {hasExcerpt && (
                        <div
                          className="lede"
                          style={{ maxWidth: "68ch" }}
                          dangerouslySetInnerHTML={{
                            __html: pageExcerpt.startsWith("<")
                              ? pageExcerpt
                              : `<p>${pageExcerpt}</p>`,
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* DYNAMIC FULL BODY CONTENT FROM PAGE MANAGEMENT */}
                  {rawBody ? (
                    rawBody.includes("<section") ||
                    rawBody.includes('class="wrap"') ||
                    rawBody.includes("class='wrap'") ? (
                      <div dangerouslySetInnerHTML={{ __html: rawBody }} />
                    ) : (
                      <section className="section--tight">
                        <div className="wrap">
                          <div
                            className="prose"
                            style={{
                              maxWidth: isLegal ? "72ch" : "68ch",
                              lineHeight: 1.75,
                              fontSize: "1.05rem",
                            }}
                            dangerouslySetInnerHTML={{ __html: rawBody }}
                          />
                        </div>
                      </section>
                    )
                  ) : null}
                </main>
              </PageShell>
            );
          }
        }
      }
    } catch (err) {
      console.warn("Could not load dynamic CMS page from API:", err);
    }
  }

  // ==========================================
  // 5. LOCAL STATIC HTML FILE FALLBACK
  // ==========================================
  const filePath = findHtmlFile(slug);
  if (!filePath) {
    notFound();
  }

  const html = fs.readFileSync(/*turbopackIgnore: true*/ filePath, "utf-8");
  const { mainContent } = extractPageData(html);

  if (!mainContent) {
    notFound();
  }

  return (
    <PageShell>
      <main id="main" dangerouslySetInnerHTML={{ __html: mainContent }} />
    </PageShell>
  );
}
