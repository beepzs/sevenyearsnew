"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { TOPICS as DEFAULT_TOPICS, Topic } from "../data/content";

export interface DynamicMenuItem {
  id: string;
  location: "header" | "footer";
  col?: string | null;
  label: string;
  url: string;
  badge?: string | null;
  target?: string | null;
  order: number;
  published: boolean;
}

export interface DynamicExpert {
  slug: string;
  name: string;
  role: string;
  img?: string | null;
  swatch?: string | null;
  color?: string | null;
  short?: string | null;
  bio?: string[] | string | null;
  creds?: string[] | string | null;
  same?: string[] | null;
  published?: boolean;
}

export interface DynamicAnswer {
  slug: string;
  q: string;
  topic?: string | null;
  video?: string | null;
  expert?: string | null;
  ages?: any;
  quick?: string | null;
  body?: any;
  published: boolean;
  reviewed?: string | null;
  reviewed_by?: string | null;
  clinical_status?: string | null;
}

export interface DynamicVideo {
  id: string;
  youtube_id?: string | null;
  youtube_full_url?: string | null;
  youtube_short_url?: string | null;
  title: string;
  type?: string | null;
  duration?: string | null;
  topic?: string | null;
  expert?: string | null;
  guest?: string | null;
  caption?: string | null;
  description?: string | null;
  transcript?: string | null;
  slug?: string | null;
  published?: boolean;
  views?: number;
  likes?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface DynamicBanner {
  id: string;
  type: string;
  title?: string | null;
  content?: string | null;
  badge?: string | null;
  highlight?: string | null;
  link_text?: string | null;
  link_url?: string | null;
  bg_color?: string | null;
  text_color?: string | null;
  image?: string | null;
  secondary_text?: string | null;
  data?: any;
  published?: boolean;
  order?: number;
}

export interface NavigationContextType {
  headerItems: DynamicMenuItem[];
  footerItems: DynamicMenuItem[];
  topics: Topic[];
  experts: DynamicExpert[];
  answers: DynamicAnswer[];
  videos: DynamicVideo[];
  banners: DynamicBanner[];
  settings?: any;
  isLoading: boolean;
  isLive: boolean;
  refreshMenu: () => Promise<void>;
}

const DEFAULT_HEADER_ITEMS: DynamicMenuItem[] = [];

const DEFAULT_FOOTER_ITEMS: DynamicMenuItem[] = [];

const NavigationContext = createContext<NavigationContextType>({
  headerItems: [],
  footerItems: [],
  topics: [],
  experts: [],
  answers: [],
  videos: [],
  banners: [],
  settings: {},
  isLoading: false,
  isLive: false,
  refreshMenu: async () => { }
});

export interface NavigationProviderProps {
  children: React.ReactNode;
  initialHeaderItems?: DynamicMenuItem[];
  initialFooterItems?: DynamicMenuItem[];
  initialTopics?: Topic[];
  initialExperts?: DynamicExpert[];
  initialAnswers?: DynamicAnswer[];
  initialVideos?: DynamicVideo[];
  initialBanners?: DynamicBanner[];
  initialSettings?: any;
}

export function NavigationProvider({
  children,
  initialHeaderItems,
  initialFooterItems,
  initialTopics,
  initialExperts,
  initialAnswers,
  initialVideos,
  initialBanners,
  initialSettings
}: NavigationProviderProps) {
  const [headerItems, setHeaderItems] = useState<DynamicMenuItem[]>(
    initialHeaderItems !== undefined ? initialHeaderItems : []
  );
  const [footerItems, setFooterItems] = useState<DynamicMenuItem[]>(
    initialFooterItems !== undefined ? initialFooterItems : []
  );
  const [topics, setTopics] = useState<Topic[]>(
    initialTopics !== undefined ? initialTopics : []
  );
  const [experts, setExperts] = useState<DynamicExpert[]>(
    initialExperts !== undefined ? initialExperts : []
  );
  const [answers, setAnswers] = useState<DynamicAnswer[]>(
    initialAnswers !== undefined ? initialAnswers : []
  );
  const [videos, setVideos] = useState<DynamicVideo[]>(
    initialVideos !== undefined ? initialVideos : []
  );
  const [banners, setBanners] = useState<DynamicBanner[]>(
    initialBanners !== undefined ? initialBanners : []
  );
  const [settings, setSettings] = useState<any>(
    initialSettings !== undefined ? initialSettings : {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLive, setIsLive] = useState(Boolean(initialHeaderItems !== undefined));

  // Sync state if initial props change
  useEffect(() => {
    if (initialHeaderItems !== undefined) {
      setHeaderItems(initialHeaderItems);
      setIsLive(true);
    }
  }, [initialHeaderItems]);

  useEffect(() => {
    if (initialFooterItems !== undefined) {
      setFooterItems(initialFooterItems);
    }
  }, [initialFooterItems]);

  useEffect(() => {
    if (initialTopics !== undefined) {
      setTopics(initialTopics);
    }
  }, [initialTopics]);

  useEffect(() => {
    if (initialExperts !== undefined) {
      setExperts(initialExperts);
    }
  }, [initialExperts]);

  useEffect(() => {
    if (initialAnswers !== undefined) {
      setAnswers(initialAnswers);
    }
  }, [initialAnswers]);

  useEffect(() => {
    if (initialVideos !== undefined) {
      setVideos(initialVideos);
    }
  }, [initialVideos]);

  useEffect(() => {
    if (initialBanners !== undefined) {
      setBanners(initialBanners);
    }
  }, [initialBanners]);

  useEffect(() => {
    if (initialSettings !== undefined) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const fetchMenuData = useCallback(async () => {
    try {
      // 1. Fetch dynamic menus from DB
      const res = await fetch("/api/menus", { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.menus) {
          if (Array.isArray(json.menus.header)) {
            const activeHeader = json.menus.header
              .filter((item: DynamicMenuItem) => item.published !== false)
              .sort((a: DynamicMenuItem, b: DynamicMenuItem) => (a.order || 0) - (b.order || 0));
            setHeaderItems(activeHeader);
          }
          if (Array.isArray(json.menus.footer)) {
            const activeFooter = json.menus.footer
              .filter((item: DynamicMenuItem) => item.published !== false)
              .sort((a: DynamicMenuItem, b: DynamicMenuItem) => (a.order || 0) - (b.order || 0));
            setFooterItems(activeFooter);
          }
          setIsLive(true);
        }
      }

      // 2. Fetch dynamic topics from DB
      const topicsRes = await fetch("/api/topics", { cache: "no-store" });
      if (topicsRes.ok) {
        const topicsJson = await topicsRes.json();
        if (topicsJson.success && Array.isArray(topicsJson.topics)) {
          const mappedTopics: Topic[] = topicsJson.topics
            .filter((t: any) => t.published !== false)
            .map((t: any) => ({
              slug: t.slug,
              name: t.name,
              desc: t.short || t.desc || "",
              color: t.swatch || "#bfe4c6",
              intro: t.intro || "",
              count: `${t.answers?.length || 0} answers · ${t.episodes?.length || 0} videos`
            }));
          setTopics(mappedTopics);
        }
      }

      // 3. Fetch dynamic experts from DB
      const expertsRes = await fetch("/api/experts", { cache: "no-store" });
      if (expertsRes.ok) {
        const expertsJson = await expertsRes.json();
        if (expertsJson.success && Array.isArray(expertsJson.experts)) {
          const activeExperts = expertsJson.experts.filter((e: any) => e.published !== false);
          setExperts(activeExperts);
        }
      }

      // 4. Fetch dynamic answers from DB
      const answersRes = await fetch("/api/answers", { cache: "no-store" });
      if (answersRes.ok) {
        const answersJson = await answersRes.json();
        if (answersJson.success && Array.isArray(answersJson.answers)) {
          const activeAnswers = answersJson.answers.filter((a: any) => a.published !== false);
          setAnswers(activeAnswers);
        }
      }

      // 5. Fetch dynamic videos from DB
      const videosRes = await fetch("/api/videos", { cache: "no-store" });
      if (videosRes.ok) {
        const videosJson = await videosRes.json();
        if (videosJson.success && Array.isArray(videosJson.videos)) {
          const activeVideos = videosJson.videos.filter((v: any) => v.published !== false);
          setVideos(activeVideos);
        }
      }

      // 6. Fetch dynamic settings from DB
      const settingsRes = await fetch("/api/settings", { cache: "no-store" });
      if (settingsRes.ok) {
        const settingsJson = await settingsRes.json();
        if (settingsJson.success && settingsJson.settings) {
          setSettings(settingsJson.settings);
        }
      }

      // 7. Fetch dynamic banners from DB
      const bannersRes = await fetch("/api/banners", { cache: "no-store" });
      if (bannersRes.ok) {
        const bannersJson = await bannersRes.json();
        if (bannersJson.success && Array.isArray(bannersJson.banners)) {
          setBanners(bannersJson.banners);
        }
      }
    } catch (err) {
      console.warn("Using default navigation (backend API not reachable):", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuData();

    // Refetch on window focus (so edits in admin tab immediately sync)
    const handleFocus = () => {
      fetchMenuData();
    };
    window.addEventListener("focus", handleFocus);

    // Periodic check every 4 seconds
    const interval = setInterval(fetchMenuData, 4000);

    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
    };
  }, [fetchMenuData]);

  return (
    <NavigationContext.Provider
      value={{
        headerItems,
        footerItems,
        topics,
        experts,
        answers,
        videos,
        banners,
        settings,
        isLoading,
        isLive,
        refreshMenu: fetchMenuData
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}
