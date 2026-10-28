import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  const dataPath = fs.existsSync(path.join(__dirname, 'data', 'admin-data.json'))
    ? path.join(__dirname, 'data', 'admin-data.json')
    : path.join(__dirname, 'data', 'seed-defaults.json');

  console.log(`Loading seed data from: ${dataPath}`);
  const raw = fs.readFileSync(dataPath, 'utf-8');
  const data = JSON.parse(raw);

  console.log('Seeding database...');

  // 1. Settings
  if (data.settings) {
    await prisma.setting.upsert({
      where: { key: 'global' },
      update: { value: data.settings },
      create: { key: 'global', value: data.settings },
    });
    console.log('✔ Settings seeded');
  }

  // 2. Roles
  if (data.roles) {
    for (const [key, role] of Object.entries(data.roles)) {
      await prisma.role.upsert({
        where: { key },
        update: {
          name: role.name,
          desc: role.desc || '',
          permissions: role.permissions || [],
        },
        create: {
          key,
          name: role.name,
          desc: role.desc || '',
          permissions: role.permissions || [],
        },
      });
    }
    console.log('✔ Roles seeded');
  }

  // 3. Users
  if (Array.isArray(data.users)) {
    for (const u of data.users) {
      const username = u.username || (u.id === 'usr-1' ? 'admin' : u.email.split('@')[0]);
      await prisma.user.upsert({
        where: { id: u.id },
        update: {
          name: u.name,
          email: u.email,
          username,
          password: u.password || 'admin@999999',
          role: u.role || 'super_admin',
          status: u.status || 'Active',
          last_active: u.last_active || 'Just now',
          permissions: u.permissions || {},
        },
        create: {
          id: u.id,
          name: u.name,
          email: u.email,
          username,
          password: u.password || 'admin@999999',
          role: u.role || 'super_admin',
          status: u.status || 'Active',
          last_active: u.last_active || 'Just now',
          permissions: u.permissions || {},
        },
      });
    }
    console.log(`✔ Users seeded (${data.users.length})`);
  }

  // 4. Topics
  const topicsList = Array.isArray(data.topics) ? data.topics : Object.values(data.topics || {});
  for (const t of topicsList) {
    await prisma.topic.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name,
        short: t.short || '',
        swatch: t.swatch || null,
        intro: t.intro || '',
        published: t.published !== false,
        order: t.order || 0,
        answers: t.answers || [],
        episodes: t.episodes || [],
        experts: t.experts || [],
        main_video: t.main_video || null,
        ages: t.ages || [],
        seo_title: t.seo_title || null,
        meta_desc: t.meta_desc || null,
        focus_keyword: t.focus_keyword || null,
        canonical_url: t.canonical_url || null,
        robots_index: t.robots_index || null,
      },
      create: {
        slug: t.slug,
        name: t.name,
        short: t.short || '',
        swatch: t.swatch || null,
        intro: t.intro || '',
        published: t.published !== false,
        order: t.order || 0,
        answers: t.answers || [],
        episodes: t.episodes || [],
        experts: t.experts || [],
        main_video: t.main_video || null,
        ages: t.ages || [],
        seo_title: t.seo_title || null,
        meta_desc: t.meta_desc || null,
        focus_keyword: t.focus_keyword || null,
        canonical_url: t.canonical_url || null,
        robots_index: t.robots_index || null,
      },
    });
  }
  console.log(`✔ Topics seeded (${topicsList.length})`);

  // 5. Answers
  const answersList = Array.isArray(data.answers) ? data.answers : Object.values(data.answers || {});
  for (const a of answersList) {
    await prisma.answer.upsert({
      where: { slug: a.slug },
      update: {
        q: a.q || a.question || '',
        topic: a.topic || null,
        also: a.also || [],
        video: a.video || null,
        expert: a.expert || null,
        ages: a.ages || [],
        quick: a.quick || a.short_answer || '',
        body: a.body || [],
        published: a.published !== false,
        reviewed: a.reviewed || null,
        reviewed_by: a.reviewed_by || null,
        reviewed_at: a.reviewed_at || null,
        clinical_status: a.clinical_status || 'approved',
      },
      create: {
        slug: a.slug,
        q: a.q || a.question || '',
        topic: a.topic || null,
        also: a.also || [],
        video: a.video || null,
        expert: a.expert || null,
        ages: a.ages || [],
        quick: a.quick || a.short_answer || '',
        body: a.body || [],
        published: a.published !== false,
        reviewed: a.reviewed || null,
        reviewed_by: a.reviewed_by || null,
        reviewed_at: a.reviewed_at || null,
        clinical_status: a.clinical_status || 'approved',
      },
    });
  }
  console.log(`✔ Answers seeded (${answersList.length})`);

  // 6. Videos
  const videosList = Array.isArray(data.videos) ? data.videos : Object.values(data.videos || {});
  for (const v of videosList) {
    await prisma.video.upsert({
      where: { id: v.id },
      update: {
        youtube_id: v.youtube_id || null,
        title: v.title || '',
        type: v.type || 'clip',
        duration: v.duration || '',
        topic: v.topic || null,
        expert: v.expert || null,
        description: v.description || '',
        published: v.published !== false,
        views: v.views || 0,
        likes: v.likes || 0,
      },
      create: {
        id: v.id,
        youtube_id: v.youtube_id || null,
        title: v.title || '',
        type: v.type || 'clip',
        duration: v.duration || '',
        topic: v.topic || null,
        expert: v.expert || null,
        description: v.description || '',
        published: v.published !== false,
        views: v.views || 0,
        likes: v.likes || 0,
      },
    });
  }
  console.log(`✔ Videos seeded (${videosList.length})`);

  // 7. Experts
  const expertsList = Array.isArray(data.experts) ? data.experts : Object.values(data.experts || {});
  for (const e of expertsList) {
    await prisma.expert.upsert({
      where: { slug: e.slug },
      update: {
        name: e.name,
        role: e.role || '',
        img: e.img || null,
        swatch: e.swatch || null,
        short: e.short || '',
        bio: e.bio || [],
        creds: e.creds || [],
        same: e.same || [],
        published: e.published !== false,
      },
      create: {
        slug: e.slug,
        name: e.name,
        role: e.role || '',
        img: e.img || null,
        swatch: e.swatch || null,
        short: e.short || '',
        bio: e.bio || [],
        creds: e.creds || [],
        same: e.same || [],
        published: e.published !== false,
      },
    });
  }
  console.log(`✔ Experts seeded (${expertsList.length})`);

  // 8. FAQs
  if (Array.isArray(data.faqs)) {
    for (const f of data.faqs) {
      await prisma.faq.upsert({
        where: { id: f.id },
        update: {
          category: f.category || null,
          topic: f.topic || null,
          question: f.question || '',
          answer: f.answer || '',
          order: f.order || 0,
          published: f.published !== false,
        },
        create: {
          id: f.id,
          category: f.category || null,
          topic: f.topic || null,
          question: f.question || '',
          answer: f.answer || '',
          order: f.order || 0,
          published: f.published !== false,
        },
      });
    }
    console.log(`✔ FAQs seeded (${data.faqs.length})`);
  }

  // 9. Episodes
  if (Array.isArray(data.episodes)) {
    for (const ep of data.episodes) {
      await prisma.episode.upsert({
        where: { id: ep.id },
        update: {
          title: ep.title,
          guest: ep.guest || null,
          kind: ep.kind || null,
          tags: ep.tags || [],
          ep: typeof ep.ep === 'number' ? ep.ep : parseInt(ep.ep) || null,
          slug: ep.slug || null,
          date: ep.date || null,
          published: ep.published !== false,
        },
        create: {
          id: ep.id,
          title: ep.title,
          guest: ep.guest || null,
          kind: ep.kind || null,
          tags: ep.tags || [],
          ep: typeof ep.ep === 'number' ? ep.ep : parseInt(ep.ep) || null,
          slug: ep.slug || null,
          date: ep.date || null,
          published: ep.published !== false,
        },
      });
    }
    console.log(`✔ Episodes seeded (${data.episodes.length})`);
  }

  // 10. Ask Murray Submissions
  if (Array.isArray(data.ask_submissions)) {
    for (const s of data.ask_submissions) {
      await prisma.askSubmission.upsert({
        where: { id: s.id },
        update: {
          parent_name: s.parent_name,
          child_age: s.child_age || null,
          email: s.email,
          topic: s.topic || null,
          topics: s.topics || [],
          question: s.question,
          date: s.date || null,
          status: s.status || 'New',
          red_flag: s.red_flag === true,
          notes: s.notes || '',
        },
        create: {
          id: s.id,
          parent_name: s.parent_name,
          child_age: s.child_age || null,
          email: s.email,
          topic: s.topic || null,
          topics: s.topics || [],
          question: s.question,
          date: s.date || null,
          status: s.status || 'New',
          red_flag: s.red_flag === true,
          notes: s.notes || '',
        },
      });
    }
    console.log(`✔ Ask Submissions seeded (${data.ask_submissions.length})`);
  }

  // 11. Menus (Header & Footer)
  if (data.menus) {
    if (Array.isArray(data.menus.header)) {
      for (const m of data.menus.header) {
        await prisma.menuItem.upsert({
          where: { id: m.id },
          update: {
            location: 'header',
            label: m.label,
            url: m.url,
            badge: m.badge || null,
            target: m.target || '_self',
            order: m.order || 0,
            published: m.published !== false,
          },
          create: {
            id: m.id,
            location: 'header',
            label: m.label,
            url: m.url,
            badge: m.badge || null,
            target: m.target || '_self',
            order: m.order || 0,
            published: m.published !== false,
          },
        });
      }
    }
    if (Array.isArray(data.menus.footer)) {
      for (const m of data.menus.footer) {
        await prisma.menuItem.upsert({
          where: { id: m.id },
          update: {
            location: 'footer',
            col: m.col || null,
            label: m.label,
            url: m.url,
            badge: m.badge || null,
            target: m.target || '_self',
            order: m.order || 0,
            published: m.published !== false,
          },
          create: {
            id: m.id,
            location: 'footer',
            col: m.col || null,
            label: m.label,
            url: m.url,
            badge: m.badge || null,
            target: m.target || '_self',
            order: m.order || 0,
            published: m.published !== false,
          },
        });
      }
    }
    console.log('✔ Menus seeded');
  }

  // 12. Pages
  if (Array.isArray(data.pages)) {
    for (const p of data.pages) {
      await prisma.page.upsert({
        where: { id: p.id },
        update: {
          title: p.title,
          slug: p.slug,
          url: p.url,
          template: p.template || null,
          seo_title: p.seo_title || null,
          meta_desc: p.meta_desc || null,
          focus_keyword: p.focus_keyword || null,
          keywords: p.keywords || null,
          canonical_url: p.canonical_url || null,
          robots_index: p.robots_index || null,
          robots_follow: p.robots_follow || null,
          og_title: p.og_title || null,
          og_type: p.og_type || null,
          og_desc: p.og_desc || null,
          og_image: p.og_image || null,
          schema_type: p.schema_type || null,
          twitter_card: p.twitter_card || null,
          excerpt: p.excerpt || null,
          body: p.body || '',
          updated: p.updated || null,
          published: p.published !== false,
        },
        create: {
          id: p.id,
          title: p.title,
          slug: p.slug,
          url: p.url,
          template: p.template || null,
          seo_title: p.seo_title || null,
          meta_desc: p.meta_desc || null,
          focus_keyword: p.focus_keyword || null,
          keywords: p.keywords || null,
          canonical_url: p.canonical_url || null,
          robots_index: p.robots_index || null,
          robots_follow: p.robots_follow || null,
          og_title: p.og_title || null,
          og_type: p.og_type || null,
          og_desc: p.og_desc || null,
          og_image: p.og_image || null,
          schema_type: p.schema_type || null,
          twitter_card: p.twitter_card || null,
          excerpt: p.excerpt || null,
          body: p.body || '',
          updated: p.updated || null,
          published: p.published !== false,
        },
      });
    }
    console.log(`✔ Pages seeded (${data.pages.length})`);
  }

  // 13. Alerts
  if (Array.isArray(data.alerts)) {
    for (const al of data.alerts) {
      await prisma.alert.upsert({
        where: { id: al.id },
        update: {
          type: al.type,
          title: al.title,
          meta: al.meta || null,
          time: al.time || null,
          unread: al.unread !== false,
          actionTab: al.actionTab || null,
        },
        create: {
          id: al.id,
          type: al.type,
          title: al.title,
          meta: al.meta || null,
          time: al.time || null,
          unread: al.unread !== false,
          actionTab: al.actionTab || null,
        },
      });
    }
    console.log(`✔ Alerts seeded (${data.alerts.length})`);
  }

  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
