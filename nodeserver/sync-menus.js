import { prisma } from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HEADER_MENUS = [
  { id: "nav-1", location: "header", label: "Topics", url: "/topics/", badge: null, target: "_self", order: 1, published: true },
  { id: "nav-2", location: "header", label: "Parent answers", url: "/search/", badge: null, target: "_self", order: 2, published: true },
  { id: "nav-3", location: "header", label: "Watch & listen", url: "/videos/", badge: null, target: "_self", order: 3, published: true },
  { id: "nav-4", location: "header", label: "Experts", url: "/experts/", badge: null, target: "_self", order: 4, published: true },
  { id: "nav-5", location: "header", label: "The book", url: "/book/", badge: null, target: "_self", order: 5, published: true },
  { id: "nav-6", location: "header", label: "About", url: "/about/", badge: null, target: "_self", order: 6, published: true }
];

const FOOTER_MENUS = [
  // Col: Topics
  { id: "fn-1", location: "footer", col: "Topics", label: "Gut health & microbiome", url: "/topics/gut-health/", badge: null, target: "_self", order: 1, published: true },
  { id: "fn-2", location: "footer", col: "Topics", label: "Nutrition & first foods", url: "/topics/first-foods/", badge: null, target: "_self", order: 2, published: true },
  { id: "fn-3", location: "footer", col: "Topics", label: "Picky eating", url: "/topics/picky-eating/", badge: null, target: "_self", order: 3, published: true },
  { id: "fn-4", location: "footer", col: "Topics", label: "Skin & eczema", url: "/topics/skin-eczema/", badge: null, target: "_self", order: 4, published: true },
  { id: "fn-5", location: "footer", col: "Topics", label: "Allergies", url: "/topics/allergies/", badge: null, target: "_self", order: 5, published: true },
  { id: "fn-6", location: "footer", col: "Topics", label: "Immunity & everyday illness", url: "/topics/immunity/", badge: null, target: "_self", order: 6, published: true },
  { id: "fn-7", location: "footer", col: "Topics", label: "Brain, focus & ADHD", url: "/topics/brain-focus/", badge: null, target: "_self", order: 7, published: true },
  { id: "fn-8", location: "footer", col: "Topics", label: "All 13 topics →", url: "/topics/", badge: null, target: "_self", order: 8, published: true },

  // Col: Watch & listen
  { id: "fn-9", location: "footer", col: "Watch & listen", label: "Full episodes", url: "/videos/full-episodes/", badge: null, target: "_self", order: 1, published: true },
  { id: "fn-10", location: "footer", col: "Watch & listen", label: "Short videos", url: "/videos/short-videos/", badge: null, target: "_self", order: 2, published: true },
  { id: "fn-11", location: "footer", col: "Watch & listen", label: "Social clips", url: "/videos/social-clips/", badge: null, target: "_self", order: 3, published: true },
  { id: "fn-12", location: "footer", col: "Watch & listen", label: "Experts", url: "/experts/", badge: null, target: "_self", order: 4, published: true },
  { id: "fn-13", location: "footer", col: "Watch & listen", label: "Search answers", url: "/search/", badge: null, target: "_self", order: 5, published: true },
  { id: "fn-14", location: "footer", col: "Watch & listen", label: "Ask the Doctor", url: "/ask-the-doctor/", badge: null, target: "_self", order: 6, published: true },

  // Col: About
  { id: "fn-15", location: "footer", col: "About", label: "Our story", url: "/about/", badge: null, target: "_self", order: 1, published: true },
  { id: "fn-16", location: "footer", col: "About", label: "Editorial standards", url: "/about/#standards", badge: null, target: "_self", order: 2, published: true },
  { id: "fn-17", location: "footer", col: "About", label: "Sponsors & relationships", url: "/about/#disclosure", badge: null, target: "_self", order: 3, published: true },
  { id: "fn-18", location: "footer", col: "About", label: "Medical disclaimer", url: "/medical-disclaimer/", badge: null, target: "_self", order: 4, published: true },
  { id: "fn-19", location: "footer", col: "About", label: "The book", url: "/book/", badge: null, target: "_self", order: 5, published: true },
  { id: "fn-20", location: "footer", col: "About", label: "Privacy", url: "/privacy/", badge: null, target: "_self", order: 6, published: true }
];

async function sync() {
  console.log("Deleting old menu items...");
  await prisma.menuItem.deleteMany();

  console.log("Inserting new header menu items...");
  for (const item of HEADER_MENUS) {
    await prisma.menuItem.create({ data: item });
  }

  console.log("Inserting new footer menu items...");
  for (const item of FOOTER_MENUS) {
    await prisma.menuItem.create({ data: item });
  }

  // Also update json files for consistency
  for (const file of ['admin-data.json', 'seed-defaults.json']) {
    const p = path.join(__dirname, 'data', file);
    if (fs.existsSync(p)) {
      const data = JSON.parse(fs.readFileSync(p, 'utf-8'));
      data.menus = {
        header: HEADER_MENUS,
        footer: FOOTER_MENUS
      };
      fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf-8');
      console.log(`Updated ${file}`);
    }
  }

  console.log("Sync completed successfully!");
  process.exit(0);
}

sync().catch(err => {
  console.error("Sync error:", err);
  process.exit(1);
});
