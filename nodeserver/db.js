import { PrismaClient } from '@prisma/client';
import { config } from './config/index.js';

export const prisma = new PrismaClient();

/**
 * Fetch all admin data structured exactly as the frontend admin expects.
 */
export async function getAllAdminData() {
  const [
    settingRec,
    alerts,
    topics,
    answers,
    faqs,
    videos,
    experts,
    users,
    roles,
    submissions,
    menuItems,
    pages,
    episodes,
    books,
    banners,
  ] = await Promise.all([
    prisma.setting.findUnique({ where: { key: 'global' } }),
    prisma.alert.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.topic.findMany({ orderBy: { order: 'asc' } }),
    prisma.answer.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.faq.findMany({ orderBy: { order: 'asc' } }),
    prisma.video.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.expert.findMany(),
    prisma.user.findMany(),
    prisma.role.findMany(),
    prisma.askSubmission.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.menuItem.findMany({ orderBy: { order: 'asc' } }),
    prisma.page.findMany(),
    prisma.episode.findMany({ orderBy: { ep: 'asc' } }),
    prisma.book.findMany({ orderBy: { order: 'asc' }, include: { subscribers: true } }),
    prisma.banner.findMany({ orderBy: { order: 'asc' } }).catch(() => []),
  ]);

  const rolesObj = {};
  roles.forEach((r) => {
    rolesObj[r.key] = {
      name: r.name,
      desc: r.desc || '',
      permissions: r.permissions || [],
    };
  });

  const expertsObj = {};
  experts.forEach((e) => {
    expertsObj[e.slug] = e;
  });

  const menus = {
    header: menuItems.filter((m) => m.location === 'header'),
    footer: menuItems.filter((m) => m.location === 'footer'),
  };

  return {
    settings: settingRec?.value || {},
    alerts,
    topics,
    answers,
    faqs,
    videos,
    experts: expertsObj,
    users,
    roles: rolesObj,
    ask_submissions: submissions,
    menus,
    pages,
    episodes,
    books,
    banners: banners || [],
  };
}

/**
 * Save an item to the appropriate Prisma model based on type.
 */
export async function saveItemToDb(type, item, idKey) {
  const idVal = item[idKey];
  if (!idVal) {
    throw new Error(`Item missing required key "${idKey}"`);
  }

  switch (type) {
    case 'videos': {
      const dataPayload = {
        youtube_id: item.youtube_id || item.id || null,
        youtube_full_url: item.youtube_full_url || null,
        youtube_short_url: item.youtube_short_url || null,
        title: item.title || '',
        type: item.type || item.kind || 'clip',
        duration: item.duration || '',
        topic: item.topic || null,
        expert: item.expert || item.guest || null,
        guest: item.guest || item.expert || null,
        caption: item.caption || item.description || '',
        description: item.caption || item.description || '',
        transcript: item.transcript || null,
        youtube_disclaimer: item.youtube_disclaimer || null,
        answers: item.answers || [],
        slug: item.slug || null,
        seo_title: item.seo_title || null,
        meta_desc: item.meta_desc || null,
        focus_keyword: item.focus_keyword || null,
        canonical_url: item.canonical_url || null,
        robots_index: item.robots_index || null,
        published: item.published !== false,
        views: item.views !== undefined ? Number(item.views) : 0,
        likes: item.likes !== undefined ? Number(item.likes) : 0,
      };

      return await prisma.video.upsert({
        where: { id: idVal },
        update: dataPayload,
        create: {
          id: idVal,
          ...dataPayload,
        },
      });
    }

    case 'topics': {
      return await prisma.topic.upsert({
        where: { slug: idVal },
        update: {
          name: item.name || '',
          short: item.short || '',
          swatch: item.swatch || null,
          intro: item.intro || '',
          published: item.published !== false,
          order: item.order !== undefined ? Number(item.order) : 0,
          answers: item.answers || [],
          episodes: item.episodes || [],
          experts: item.experts || [],
          main_video: item.main_video || null,
          ages: item.ages || [],
          seo_title: item.seo_title || null,
          meta_desc: item.meta_desc || null,
          focus_keyword: item.focus_keyword || null,
          canonical_url: item.canonical_url || null,
          robots_index: item.robots_index || null,
        },
        create: {
          slug: idVal,
          name: item.name || '',
          short: item.short || '',
          swatch: item.swatch || null,
          intro: item.intro || '',
          published: item.published !== false,
          order: item.order !== undefined ? Number(item.order) : 0,
          answers: item.answers || [],
          episodes: item.episodes || [],
          experts: item.experts || [],
          main_video: item.main_video || null,
          ages: item.ages || [],
          seo_title: item.seo_title || null,
          meta_desc: item.meta_desc || null,
          focus_keyword: item.focus_keyword || null,
          canonical_url: item.canonical_url || null,
          robots_index: item.robots_index || null,
        },
      });
    }

    case 'answers': {
      const answerPayload = {
        q: item.q || item.question || '',
        topic: item.topic || null,
        also: item.also || [],
        video: item.video || null,
        expert: item.expert || null,
        ages: item.ages || [],
        quick: item.quick || item.short_answer || '',
        body: item.body || [],
        published: item.published !== false,
        reviewed: item.reviewed || null,
        reviewed_by: item.reviewed_by || null,
        reviewed_at: item.reviewed_at || null,
        clinical_status: item.clinical_status || 'approved',
        seo_title: item.seo_title || null,
        meta_desc: item.meta_desc || null,
        focus_keyword: item.focus_keyword || null,
        schema_type: item.schema_type || null,
        canonical_url: item.canonical_url || null,
        robots_index: item.robots_index || null,
        order: item.order !== undefined ? Number(item.order) : 0,
        tags: item.tags || [],
      };

      return await prisma.answer.upsert({
        where: { slug: idVal },
        update: answerPayload,
        create: {
          slug: idVal,
          ...answerPayload,
        },
      });
    }

    case 'faqs': {
      return await prisma.faq.upsert({
        where: { id: idVal },
        update: {
          category: item.category || null,
          topic: item.topic || null,
          question: item.question || '',
          answer: item.answer || '',
          order: item.order !== undefined ? Number(item.order) : 0,
          published: item.published !== false,
        },
        create: {
          id: idVal,
          category: item.category || null,
          topic: item.topic || null,
          question: item.question || '',
          answer: item.answer || '',
          order: item.order !== undefined ? Number(item.order) : 0,
          published: item.published !== false,
        },
      });
    }

    case 'experts': {
      const answersList = Array.isArray(item.answers) ? item.answers : [];
      const episodesList = Array.isArray(item.episodes) ? item.episodes : [];

      const expertPayload = {
        name: item.name || '',
        role: item.role || '',
        img: item.img || null,
        swatch: item.swatch || null,
        short: item.short || (Array.isArray(item.bio) ? item.bio[0] : (item.bio || '')),
        bio: item.bio || [],
        creds: item.creds || [],
        same: item.same || [],
        answers: answersList,
        episodes: episodesList,
        seo_title: item.seo_title || null,
        meta_desc: item.meta_desc || null,
        focus_keyword: item.focus_keyword || null,
        keywords: item.keywords || null,
        canonical_url: item.canonical_url || null,
        robots_index: item.robots_index || null,
        published: item.published !== false,
      };

      const savedExpert = await prisma.expert.upsert({
        where: { slug: idVal },
        update: expertPayload,
        create: {
          slug: idVal,
          ...expertPayload,
        },
      });

      // Synchronize assigned Q&As if provided
      if (Array.isArray(item.answers)) {
        if (answersList.length > 0) {
          await prisma.answer.updateMany({
            where: { slug: { in: answersList } },
            data: { expert: idVal, published: true },
          });
        }
        await prisma.answer.updateMany({
          where: {
            expert: idVal,
            slug: { notIn: answersList },
          },
          data: { expert: null },
        });
      }

      // Synchronize assigned videos if provided
      if (Array.isArray(item.episodes)) {
        if (episodesList.length > 0) {
          await prisma.video.updateMany({
            where: {
              OR: [
                { id: { in: episodesList } },
                { youtube_id: { in: episodesList } },
                { slug: { in: episodesList } },
              ],
            },
            data: { expert: idVal, guest: idVal, published: true },
          });
        }
        await prisma.video.updateMany({
          where: {
            OR: [{ expert: idVal }, { guest: idVal }],
            AND: [
              { id: { notIn: episodesList } },
              { youtube_id: { notIn: episodesList } },
              { slug: { notIn: episodesList } },
            ],
          },
          data: { expert: null, guest: null },
        });
      }

      return savedExpert;
    }

    case 'users': {
      return await prisma.user.upsert({
        where: { id: idVal },
        update: {
          name: item.name,
          email: item.email,
          username: item.username || item.email.split('@')[0],
          password: item.password || 'admin@999999',
          role: item.role || 'super_admin',
          status: item.status || 'Active',
          last_active: item.last_active || 'Just now',
          permissions: item.permissions || {},
        },
        create: {
          id: idVal,
          name: item.name,
          email: item.email,
          username: item.username || item.email.split('@')[0],
          password: item.password || 'admin@999999',
          role: item.role || 'super_admin',
          status: item.status || 'Active',
          last_active: item.last_active || 'Just now',
          permissions: item.permissions || {},
        },
      });
    }

    case 'ask_submissions': {
      return await prisma.askSubmission.upsert({
        where: { id: idVal },
        update: {
          parent_name: item.parent_name || '',
          child_age: item.child_age || null,
          email: item.email || '',
          topic: item.topic || null,
          topics: item.topics || [],
          question: item.question || '',
          date: item.date || null,
          status: item.status || 'New',
          red_flag: item.red_flag === true,
          notes: item.notes || '',
        },
        create: {
          id: idVal,
          parent_name: item.parent_name || '',
          child_age: item.child_age || null,
          email: item.email || '',
          topic: item.topic || null,
          topics: item.topics || [],
          question: item.question || '',
          date: item.date || null,
          status: item.status || 'New',
          red_flag: item.red_flag === true,
          notes: item.notes || '',
        },
      });
    }

    case 'menu_header': {
      return await prisma.menuItem.upsert({
        where: { id: idVal },
        update: {
          location: 'header',
          label: item.label || '',
          url: item.url || '',
          badge: item.badge || null,
          target: item.target || '_self',
          order: item.order !== undefined ? Number(item.order) : 0,
          published: item.published !== false,
        },
        create: {
          id: idVal,
          location: 'header',
          label: item.label || '',
          url: item.url || '',
          badge: item.badge || null,
          target: item.target || '_self',
          order: item.order !== undefined ? Number(item.order) : 0,
          published: item.published !== false,
        },
      });
    }

    case 'menu_footer': {
      return await prisma.menuItem.upsert({
        where: { id: idVal },
        update: {
          location: 'footer',
          col: item.col || null,
          label: item.label || '',
          url: item.url || '',
          badge: item.badge || null,
          target: item.target || '_self',
          order: item.order !== undefined ? Number(item.order) : 0,
          published: item.published !== false,
        },
        create: {
          id: idVal,
          location: 'footer',
          col: item.col || null,
          label: item.label || '',
          url: item.url || '',
          badge: item.badge || null,
          target: item.target || '_self',
          order: item.order !== undefined ? Number(item.order) : 0,
          published: item.published !== false,
        },
      });
    }

    case 'pages': {
      return await prisma.page.upsert({
        where: { id: idVal },
        update: {
          title: item.title || '',
          slug: item.slug || idVal,
          url: item.url || '',
          template: item.template || null,
          seo_title: item.seo_title || null,
          meta_desc: item.meta_desc || null,
          focus_keyword: item.focus_keyword || null,
          keywords: item.keywords || null,
          canonical_url: item.canonical_url || null,
          robots_index: item.robots_index || null,
          robots_follow: item.robots_follow || null,
          og_title: item.og_title || null,
          og_type: item.og_type || null,
          og_desc: item.og_desc || null,
          og_image: item.og_image || null,
          schema_type: item.schema_type || null,
          twitter_card: item.twitter_card || null,
          excerpt: item.excerpt || null,
          body: item.body || '',
          updated: item.updated || null,
          published: item.published !== false,
        },
        create: {
          id: idVal,
          title: item.title || '',
          slug: item.slug || idVal,
          url: item.url || '',
          template: item.template || null,
          seo_title: item.seo_title || null,
          meta_desc: item.meta_desc || null,
          focus_keyword: item.focus_keyword || null,
          keywords: item.keywords || null,
          canonical_url: item.canonical_url || null,
          robots_index: item.robots_index || null,
          robots_follow: item.robots_follow || null,
          og_title: item.og_title || null,
          og_type: item.og_type || null,
          og_desc: item.og_desc || null,
          og_image: item.og_image || null,
          schema_type: item.schema_type || null,
          twitter_card: item.twitter_card || null,
          excerpt: item.excerpt || null,
          body: item.body || '',
          updated: item.updated || null,
          published: item.published !== false,
        },
      });
    }

    case 'alerts': {
      return await prisma.alert.upsert({
        where: { id: idVal },
        update: {
          type: item.type || 'submission',
          title: item.title || '',
          meta: item.meta || null,
          time: item.time || null,
          unread: item.unread !== false,
          actionTab: item.actionTab || null,
        },
        create: {
          id: idVal,
          type: item.type || 'submission',
          title: item.title || '',
          meta: item.meta || null,
          time: item.time || null,
          unread: item.unread !== false,
          actionTab: item.actionTab || null,
        },
      });
    }

    case 'settings': {
      const cleaned = { ...item };
      delete cleaned['The First Seven Years'];
      if (cleaned.site_title) delete cleaned[cleaned.site_title];

      return await prisma.setting.upsert({
        where: { key: 'global' },
        update: { value: cleaned },
        create: { key: 'global', value: cleaned },
      });
    }

    case 'banners': {
      return await prisma.banner.upsert({
        where: { id: idVal },
        update: {
          type: item.type || 'promo',
          title: item.title || null,
          content: item.content || null,
          badge: item.badge || null,
          highlight: item.highlight || null,
          link_text: item.link_text || null,
          link_url: item.link_url || null,
          bg_color: item.bg_color || '#2B3C56',
          text_color: item.text_color || '#ffffff',
          image: item.image || null,
          secondary_text: item.secondary_text || null,
          data: item.data || null,
          published: item.published !== false,
          order: item.order !== undefined ? Number(item.order) : 0,
        },
        create: {
          id: idVal,
          type: item.type || 'promo',
          title: item.title || null,
          content: item.content || null,
          badge: item.badge || null,
          highlight: item.highlight || null,
          link_text: item.link_text || null,
          link_url: item.link_url || null,
          bg_color: item.bg_color || '#2B3C56',
          text_color: item.text_color || '#ffffff',
          image: item.image || null,
          secondary_text: item.secondary_text || null,
          data: item.data || null,
          published: item.published !== false,
          order: item.order !== undefined ? Number(item.order) : 0,
        },
      });
    }

    case 'books': {
      return await prisma.book.upsert({
        where: { id: idVal },
        update: {
          slug: item.slug || null,
          title: item.title || '',
          subtitle: item.subtitle || null,
          eyebrow: item.eyebrow || null,
          author: item.author || null,
          author_role: item.author_role || 'Co-host · Functional medicine',
          author_image: item.author_image || null,
          approver1_name: item.approver1_name || 'Dr. Bill Sears',
          approver1_role: item.approver1_role || 'Pediatrician · Author · Featured expert',
          approver1_image: item.approver1_image || null,
          approver2_name: item.approver2_name || 'Dr. Murray Clarke',
          approver2_role: item.approver2_role || 'Host · The First Seven Years',
          approver2_image: item.approver2_image || null,
          approved_by: item.approved_by || null,
          description: item.description || null,
          note: item.note || null,
          status: item.status || 'In Production',
          publisher: item.publisher || null,
          published: item.published !== false,
          is_featured: item.is_featured === true,
          order: item.order !== undefined ? Number(item.order) : 0,
          cover_type: item.cover_type || 'concept',
          cover_image: item.cover_image || null,
          preorder_url: item.preorder_url || null,
        },
        create: {
          id: idVal,
          slug: item.slug || null,
          title: item.title || '',
          subtitle: item.subtitle || null,
          eyebrow: item.eyebrow || null,
          author: item.author || null,
          author_role: item.author_role || 'Co-host · Functional medicine',
          author_image: item.author_image || null,
          approver1_name: item.approver1_name || 'Dr. Bill Sears',
          approver1_role: item.approver1_role || 'Pediatrician · Author · Featured expert',
          approver1_image: item.approver1_image || null,
          approver2_name: item.approver2_name || 'Dr. Murray Clarke',
          approver2_role: item.approver2_role || 'Host · The First Seven Years',
          approver2_image: item.approver2_image || null,
          approved_by: item.approved_by || null,
          description: item.description || null,
          note: item.note || null,
          status: item.status || 'In Production',
          publisher: item.publisher || null,
          published: item.published !== false,
          is_featured: item.is_featured === true,
          order: item.order !== undefined ? Number(item.order) : 0,
          cover_type: item.cover_type || 'concept',
          cover_image: item.cover_image || null,
          preorder_url: item.preorder_url || null,
        },
      });
    }

    case 'menu_header':
    case 'menu_footer':
    case 'menus': {
      const loc = type === 'menu_header' ? 'header' : type === 'menu_footer' ? 'footer' : (item.location || 'header');
      const dataPayload = {
        location: loc,
        col: item.col || null,
        label: item.label || '',
        url: item.url || '/',
        badge: item.badge || null,
        target: item.target || '_self',
        order: item.order !== undefined ? Number(item.order) : 0,
        published: item.published !== false,
      };

      return await prisma.menuItem.upsert({
        where: { id: idVal },
        update: dataPayload,
        create: {
          id: idVal,
          ...dataPayload,
        },
      });
    }

    default:
      throw new Error(`Unsupported type "${type}" for saveItemToDb`);
  }
}

/**
 * Delete an item by ID from the appropriate model.
 */
export async function deleteItemFromDb(type, idKey, idVal) {
  switch (type) {
    case 'videos':
      return await prisma.video.delete({ where: { id: idVal } });
    case 'topics':
      return await prisma.topic.delete({ where: { slug: idVal } });
    case 'answers':
      return await prisma.answer.delete({ where: { slug: idVal } });
    case 'faqs':
      return await prisma.faq.delete({ where: { id: idVal } });
    case 'experts':
      return await prisma.expert.delete({ where: { slug: idVal } });
    case 'users':
      return await prisma.user.delete({ where: { id: idVal } });
    case 'ask_submissions':
      return await prisma.askSubmission.delete({ where: { id: idVal } });
    case 'menu_header':
    case 'menu_footer':
      return await prisma.menuItem.delete({ where: { id: idVal } });
    case 'pages':
      return await prisma.page.delete({ where: { id: idVal } });
    case 'alerts':
      return await prisma.alert.delete({ where: { id: idVal } });
    case 'books':
      return await prisma.book.delete({ where: { id: idVal } });
    case 'banners':
      return await prisma.banner.delete({ where: { id: idVal } });
    default:
      throw new Error(`Unsupported type "${type}" for deleteItemFromDb`);
  }
}

/**
 * Toggle published state for a given item.
 */
export async function togglePublishInDb(type, idKey, idVal) {
  let model;
  let where;

  switch (type) {
    case 'videos':
      model = prisma.video;
      where = { id: idVal };
      break;
    case 'topics':
      model = prisma.topic;
      where = { slug: idVal };
      break;
    case 'answers':
      model = prisma.answer;
      where = { slug: idVal };
      break;
    case 'faqs':
      model = prisma.faq;
      where = { id: idVal };
      break;
    case 'experts':
      model = prisma.expert;
      where = { slug: idVal };
      break;
    case 'pages':
      model = prisma.page;
      where = { id: idVal };
      break;
    case 'books':
      model = prisma.book;
      where = { id: idVal };
      break;
    case 'banners':
      model = prisma.banner;
      where = { id: idVal };
      break;
    case 'menu_header':
    case 'menu_footer':
      model = prisma.menuItem;
      where = { id: idVal };
      break;
    default:
      throw new Error(`Unsupported type "${type}" for togglePublish`);
  }

  const existing = await model.findUnique({ where });
  if (!existing) {
    throw new Error(`Item ${idVal} not found in ${type}`);
  }

  const updated = await model.update({
    where,
    data: { published: !existing.published },
  });

  return updated.published;
}
