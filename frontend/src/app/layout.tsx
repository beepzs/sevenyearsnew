import type { Metadata, Viewport } from "next";
import { MedicalStrip } from "../components/MedicalStrip";
import { NavigationProvider, DynamicMenuItem, DynamicExpert, DynamicAnswer, DynamicVideo, DynamicBanner } from "../context/NavigationContext";
import { Topic } from "../data/content";
import "./globals.css";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

export const dynamic = "force-dynamic";

async function getInitialNavData(): Promise<{
  header: DynamicMenuItem[];
  footer: DynamicMenuItem[];
  topics?: Topic[];
  experts?: DynamicExpert[];
  answers?: DynamicAnswer[];
  videos?: DynamicVideo[];
  banners?: DynamicBanner[];
  settings?: any;
}> {
  try {
    const [menusRes, topicsRes, expertsRes, answersRes, videosRes, bannersRes, settingsRes] = await Promise.allSettled([
      fetch(`${API_BASE}/menus`, {
        cache: "no-store",
        signal: AbortSignal.timeout(4000)
      }),
      fetch(`${API_BASE}/topics`, {
        cache: "no-store",
        signal: AbortSignal.timeout(4000)
      }),
      fetch(`${API_BASE}/experts`, {
        cache: "no-store",
        signal: AbortSignal.timeout(4000)
      }),
      fetch(`${API_BASE}/answers`, {
        cache: "no-store",
        signal: AbortSignal.timeout(4000)
      }),
      fetch(`${API_BASE}/videos`, {
        cache: "no-store",
        signal: AbortSignal.timeout(4000)
      }),
      fetch(`${API_BASE}/banners`, {
        cache: "no-store",
        signal: AbortSignal.timeout(4000)
      }),
      fetch(`${API_BASE}/settings`, {
        cache: "no-store",
        signal: AbortSignal.timeout(4000)
      })
    ]);

    let header: DynamicMenuItem[] = [];
    let footer: DynamicMenuItem[] = [];
    let topics: Topic[] | undefined = undefined;
    let experts: DynamicExpert[] | undefined = undefined;
    let answers: DynamicAnswer[] | undefined = undefined;
    let videos: DynamicVideo[] | undefined = undefined;
    let banners: DynamicBanner[] | undefined = undefined;
    let settings: any = {};

    if (menusRes.status === "fulfilled" && menusRes.value.ok) {
      const data = await menusRes.value.json();
      if (data.success && data.menus) {
        if (Array.isArray(data.menus.header)) {
          header = data.menus.header
            .filter((item: DynamicMenuItem) => item.published !== false)
            .sort((a: DynamicMenuItem, b: DynamicMenuItem) => (a.order || 0) - (b.order || 0));
        }
        if (Array.isArray(data.menus.footer)) {
          footer = data.menus.footer
            .filter((item: DynamicMenuItem) => item.published !== false)
            .sort((a: DynamicMenuItem, b: DynamicMenuItem) => (a.order || 0) - (b.order || 0));
        }
      }
    }

    if (topicsRes.status === "fulfilled" && topicsRes.value.ok) {
      const tData = await topicsRes.value.json();
      if (tData.success && Array.isArray(tData.topics)) {
        topics = tData.topics
          .filter((t: any) => t.published !== false)
          .map((t: any) => ({
            slug: t.slug,
            name: t.name,
            desc: t.short || t.desc || "",
            color: t.swatch || "#bfe4c6",
            intro: t.intro || "",
            count: `${t.answers?.length || 0} answers · ${t.episodes?.length || 0} videos`
          }));
      }
    }

    if (expertsRes.status === "fulfilled" && expertsRes.value.ok) {
      const eData = await expertsRes.value.json();
      if (eData.success && Array.isArray(eData.experts)) {
        experts = eData.experts.filter((e: DynamicExpert) => e.published !== false);
      }
    }

    if (answersRes.status === "fulfilled" && answersRes.value.ok) {
      const aData = await answersRes.value.json();
      if (aData.success && Array.isArray(aData.answers)) {
        answers = aData.answers.filter((a: any) => a.published !== false);
      }
    }

    if (videosRes.status === "fulfilled" && videosRes.value.ok) {
      const vData = await videosRes.value.json();
      if (vData.success && Array.isArray(vData.videos)) {
        videos = vData.videos.filter((v: any) => v.published !== false);
      }
    }

    if (bannersRes.status === "fulfilled" && bannersRes.value.ok) {
      const bData = await bannersRes.value.json();
      if (bData.success && Array.isArray(bData.banners)) {
        banners = bData.banners;
      }
    }

    if (settingsRes.status === "fulfilled" && settingsRes.value.ok) {
      const sData = await settingsRes.value.json();
      if (sData.success && sData.settings) {
        settings = sData.settings;
      }
    }

    return { header, footer, topics, experts, answers, videos, banners, settings };
  } catch (err) {
    console.error("getInitialNavData error:", err);
    return { header: [], footer: [], settings: {} };
  }
}

export const metadata: Metadata = {
  metadataBase: new URL("https://thefirstsevenyears.com"),
  title: "The First Seven Years — Expert answers for parents of kids 0–7",
  description:
    "Reviewed answers to the questions parents of young children ask most — first foods, gut health, eczema, sleep and more — with Dr. Murray Clarke, Dr. Bill Sears and Bryce Wylde.",
  icons: {
    icon: "/assets/img/favicon.svg",
    apple: "/assets/img/logo.jpg"
  },
  openGraph: {
    title: "The First Seven Years — Expert answers for parents of kids 0–7",
    description:
      "Reviewed answers to the questions parents of young children ask most — first foods, gut health, eczema, sleep and more — with Dr. Murray Clarke, Dr. Bill Sears and Bryce Wylde.",
    url: "https://thefirstsevenyears.com/",
    siteName: "The First Seven Years",
    images: [
      {
        url: "/assets/img/logo.jpg",
        width: 800,
        height: 800,
        alt: "The First Seven Years"
      }
    ],
    type: "website"
  }
};

export const viewport: Viewport = {
  themeColor: "#2b3c56"
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const navData = await getInitialNavData();

  return (
    <html lang="en">
      <head>
        <link rel="preload" href="/assets/fonts/NantesWeb-Book.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/assets/fonts/LotaGrotesqueAlt1-Regular.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/assets/fonts/LotaGrotesqueAlt1-SemiBold.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://i.ytimg.com" />
        <script dangerouslySetInnerHTML={{ __html: `window.F7_ROOT = "/";` }} />
      </head>
      <body className="home">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <NavigationProvider
          initialHeaderItems={navData.header}
          initialFooterItems={navData.footer}
          initialTopics={navData.topics}
          initialExperts={navData.experts}
          initialAnswers={navData.answers}
          initialVideos={navData.videos}
          initialBanners={navData.banners}
          initialSettings={navData.settings}
        >
          <MedicalStrip />
          {children}
        </NavigationProvider>
      </body>
    </html>
  );
}
