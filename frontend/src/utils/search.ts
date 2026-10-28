export interface SearchItem {
  k: "answer" | "topic" | "episode" | "expert";
  t: string;
  s?: string;
  u: string;
  x?: string;
}

export const KIND_LABELS: Record<SearchItem["k"], string> = {
  answer: "Answer",
  episode: "Video",
  topic: "Topic",
  expert: "Expert"
};

const KIND_ORDER: Record<SearchItem["k"], number> = {
  answer: 0,
  topic: 1,
  episode: 2,
  expert: 3
};

const SYNONYMS: Record<string, string> = {
  "won't eat": "picky eating",
  "wont eat": "picky eating",
  fussy: "picky eating",
  poop: "constipation gut",
  tummy: "gut",
  rash: "eczema skin",
  itchy: "eczema skin",
  focus: "adhd attention",
  hyper: "adhd",
  vitamins: "supplements",
  bugs: "probiotics",
  germs: "immune",
  cold: "immune illness",
  sleep: "sleep bedtime",
  tantrum: "emotions behaviour",
  meltdown: "emotions behaviour"
};

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ");
}

function expandSynonyms(query: string): string {
  let expanded = query;
  for (const key in SYNONYMS) {
    if (query.includes(key)) {
      expanded += " " + SYNONYMS[key];
    }
  }
  return expanded;
}

/**
 * Builds dynamic search index purely from live database content
 */
export function buildSearchIndex(
  dynamicAnswers?: any[],
  dynamicTopics?: any[],
  dynamicVideos?: any[],
  dynamicExperts?: any[]
): SearchItem[] {
  const merged: SearchItem[] = [];
  const seenUrls = new Set<string>();

  const expertMap = new Map<string, string>();
  if (Array.isArray(dynamicExperts)) {
    for (const e of dynamicExperts) {
      if (e.slug && e.name) expertMap.set(e.slug, e.name);
    }
  }

  const topicMap = new Map<string, string>();
  if (Array.isArray(dynamicTopics)) {
    for (const t of dynamicTopics) {
      if (t.slug && t.name) topicMap.set(t.slug, t.name);
    }
  }

  // Add dynamic answers
  if (Array.isArray(dynamicAnswers)) {
    for (const a of dynamicAnswers) {
      if (a.published === false || !a.slug) continue;
      const url = `/answers/${a.slug}/`;
      seenUrls.add(url);
      const expName = expertMap.get(a.expert) || a.expert || "Dr. Murray Clarke";
      const topName = topicMap.get(a.topic) || a.topic || "";
      const subtitle = topName ? `${expName} · ${topName}` : `${expName} · Expert answer`;

      merged.push({
        k: "answer",
        t: a.q,
        s: subtitle,
        u: url,
        x: `${a.q} ${a.quick || ""} ${expName} ${topName}`
      });
    }
  }

  // Add dynamic topics
  if (Array.isArray(dynamicTopics)) {
    for (const t of dynamicTopics) {
      if (!t.slug) continue;
      const url = `/topics/${t.slug}/`;
      seenUrls.add(url);
      merged.push({
        k: "topic",
        t: t.name,
        s: t.desc || "",
        u: url,
        x: `${t.name} ${t.desc || ""} ${t.intro || ""}`
      });
    }
  }

  // Add dynamic videos
  if (Array.isArray(dynamicVideos)) {
    for (const v of dynamicVideos) {
      if (v.published === false || !v.slug) continue;
      const url = `/videos/${v.slug}/`;
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        const expName = expertMap.get(v.expert || v.guest) || v.expert || v.guest || "";
        const dur = v.duration ? `${v.duration} · ` : "";
        const sub = `${v.type || "Video"} · ${dur}${expName}`.replace(/ · $/, "");
        merged.push({
          k: "episode",
          t: v.title,
          s: sub,
          u: url,
          x: `${v.title} ${v.description || ""} ${expName}`
        });
      }
    }
  }

  // Add dynamic experts
  if (Array.isArray(dynamicExperts)) {
    for (const e of dynamicExperts) {
      if (e.published === false || !e.slug) continue;
      const url = `/experts/${e.slug}/`;
      if (!seenUrls.has(url)) {
        seenUrls.add(url);
        merged.push({
          k: "expert",
          t: e.name,
          s: e.role || "Expert",
          u: url,
          x: `${e.name} ${e.role || ""} ${e.short || ""}`
        });
      }
    }
  }

  return merged;
}

/**
 * Searches items by query string using term scoring and synonym expansion
 */
export function searchIndex(
  query: string,
  items: SearchItem[] = [],
  limit = 8,
  scope?: SearchItem["k"]
): SearchItem[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed || !items.length) return [];

  const scopedItems = scope ? items.filter((d) => d.k === scope) : items;
  const terms = normalizeString(expandSynonyms(trimmed))
    .split(/\s+/)
    .filter((t) => t.length > 1);

  if (!terms.length) {
    if (trimmed.length === 1) {
      return scopedItems
        .filter((d) => normalizeString(d.t).startsWith(trimmed))
        .slice(0, limit);
    }
    return [];
  }

  const scored = scopedItems
    .map((d) => {
      const hay = normalizeString(`${d.t} ${d.s || ""} ${d.x || ""}`);
      const title = normalizeString(d.t);
      let score = 0;

      for (const t of terms) {
        if (title.includes(t)) {
          score += 3;
        } else if (hay.includes(t)) {
          score += 1;
        }
      }

      return { d, score };
    })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || KIND_ORDER[a.d.k] - KIND_ORDER[b.d.k])
    .slice(0, limit)
    .sort((a, b) => KIND_ORDER[a.d.k] - KIND_ORDER[b.d.k] || b.score - a.score)
    .map((r) => r.d);

  return scored;
}
