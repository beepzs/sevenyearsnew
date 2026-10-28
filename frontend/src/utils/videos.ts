import { DynamicVideo, DynamicExpert } from "../context/NavigationContext";

export function slugify(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type VideoCategory = "episode" | "clip" | "short";

export function getVideoFormat(v?: any): VideoCategory {
  if (!v) return "clip";
  const raw = (v.type || v.kind || v.category || "").toLowerCase();
  if (raw.includes("episode") || raw === "full") return "episode";
  if (raw.includes("short") || raw.includes("social") || raw === "reel") return "short";
  return "clip";
}

export function getVideoUrl(v: any): { url: string; isExternal: boolean } {
  if (!v) return { url: "#", isExternal: false };
  const fmt = getVideoFormat(v);

  if (fmt === "short") {
    if (v.youtube_short_url) {
      return { url: v.youtube_short_url, isExternal: true };
    }
    const yId = v.youtube_id || v.id;
    if (yId && !yId.startsWith("vid-")) {
      return { url: `https://www.youtube.com/shorts/${yId}`, isExternal: true };
    }
  }

  const s = v.slug || slugify(v.title || v.id);
  return { url: `/videos/${s}/`, isExternal: false };
}

export function getVideoThumbnail(v: any, isShort: boolean = false): string {
  const yId = v.youtube_id || v.id;
  if (!yId || yId.startsWith("vid-")) {
    return "/assets/img/logo.jpg";
  }
  return `https://i.ytimg.com/vi/${yId}/${isShort ? "oar2" : "hqdefault"}.jpg`;
}

export function getExpertDisplayName(expertSlug?: string | null, experts?: DynamicExpert[]): string {
  if (!expertSlug) return "Dr. Murray Clarke";
  if (experts && experts.length > 0) {
    const found = experts.find((e) => e.slug === expertSlug);
    if (found?.name) return found.name;
  }
  // Standard known expert display names
  const known: Record<string, string> = {
    "dr-murray-clarke": "Dr. Murray Clarke",
    "dr-bill-sears": "Dr. Bill Sears",
    "bryce-wylde": "Bryce Wylde",
    "dr-dan-sullivan": "Dr. Dan Sullivan",
    "dr-elisa-song": "Dr. Elisa Song",
    "joy-mccarthy": "Joy McCarthy",
    "erinn-askin": "Erinn Askin"
  };
  if (known[expertSlug]) return known[expertSlug];

  return expertSlug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}
