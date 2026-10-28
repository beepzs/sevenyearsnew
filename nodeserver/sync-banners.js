import { prisma } from './db.js';

const INITIAL_BANNERS = [
  {
    id: "promo_strip",
    type: "promo",
    title: "Education, not medical advice.",
    content: "In an emergency, call 911.",
    badge: "Notice",
    highlight: null,
    link_text: "Learn more",
    link_url: "/medical-disclaimer/",
    bg_color: "#2B3C56",
    text_color: "#ffffff",
    image: null,
    secondary_text: null,
    data: { show_close: true },
    published: true,
    order: 1,
  },
  {
    id: "home_hero",
    type: "hero",
    title: "Every question about the first seven years, answered by people who know.",
    content: "Short, reviewed answers from doctors and health experts — with the video behind every one.",
    badge: "For parents of children 0–7",
    highlight: "first seven years",
    link_text: "Find answers",
    link_url: "/search/",
    bg_color: "#2B3C56",
    text_color: "#ffffff",
    image: "/assets/img/dr-murray-clarke-cutout.webp",
    secondary_text: "With Dr. Murray Clarke, Dr. Bill Sears and Bryce Wylde",
    data: {
      search_prompts: [
        "Why won’t my toddler eat vegetables?",
        "Is my child’s eczema a gut problem?",
        "How do I help their gut after antibiotics?",
        "Are pets good for my baby’s immune system?",
        "Why are ADHD diagnoses rising?",
        "What’s the difference between probiotics and prebiotics?"
      ],
      chips: [
        { label: "First foods", url: "/answers/what-should-my-babys-first-food-be/" },
        { label: "Eczema & the gut", url: "/answers/is-my-childs-eczema-a-gut-problem/" },
        { label: "After antibiotics", url: "/answers/restoring-the-gut-after-antibiotics/" },
        { label: "Picky eating", url: "/topics/picky-eating/" }
      ],
      welcome_card: {
        enabled: true,
        title: "Welcome to The First Seven Years",
        subtitle: "Dr. Murray Clarke & Bryce Wylde on what this library is and how to use it",
        url: "/about/",
        image: "/assets/img/dr-murray-clarke-cutout.webp"
      }
    },
    published: true,
    order: 2,
  }
];

async function main() {
  console.log("Checking and syncing banners table in MySQL...");

  for (const b of INITIAL_BANNERS) {
    await prisma.banner.upsert({
      where: { id: b.id },
      update: {
        type: b.type,
        title: b.title,
        content: b.content,
        badge: b.badge,
        highlight: b.highlight,
        link_text: b.link_text,
        link_url: b.link_url,
        bg_color: b.bg_color,
        text_color: b.text_color,
        image: b.image,
        secondary_text: b.secondary_text,
        data: b.data,
        published: b.published,
        order: b.order,
      },
      create: b,
    });
    console.log(`Synced banner: ${b.id} (${b.type})`);
  }

  // Also clean up setting 'global' if any recursive key exists
  const rec = await prisma.setting.findUnique({ where: { key: 'global' } });
  if (rec?.value && typeof rec.value === 'object') {
    const val = { ...rec.value };
    let cleaned = false;
    for (const k of Object.keys(val)) {
      if (k === 'The First Seven Years' || (val[k] && typeof val[k] === 'object' && val[k].site_title)) {
        delete val[k];
        cleaned = true;
      }
    }
    if (cleaned) {
      await prisma.setting.update({
        where: { key: 'global' },
        data: { value: val },
      });
      console.log("Cleaned up corrupted recursive key from settings table.");
    }
  }

  console.log("Banners sync completed successfully.");
}

main()
  .catch((e) => {
    console.error("Error in sync-banners:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
