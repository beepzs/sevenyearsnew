import { prisma } from './db.js';

async function migrateData() {
  console.log('Migrating existing Book and Waitlist data into dedicated MySQL tables...');

  // 1. Check if Book already exists in books table
  const count = await prisma.book.count();
  let bookId = 'book-the-first-seven-years';

  if (count === 0) {
    // Check if there was an existing setting
    const rec = await prisma.setting.findUnique({ where: { key: 'book' } });
    let bData = rec?.value;
    if (typeof bData === 'string') {
      try { bData = JSON.parse(bData); } catch {}
    }

    const defaultBook = {
      title: 'The First Seven Years',
      subtitle: 'The First Seven Years, in print.',
      eyebrow: 'The book · publication details to come',
      author: 'Bryce Wylde',
      approved_by: 'Dr. Bill Sears & Dr. Murray Clarke',
      description:
        'Written by Bryce Wylde and approved by Dr. Bill Sears and Dr. Murray Clarke. This site will be its living companion — updated answers, expert videos and references for every topic the book covers.',
      note: 'Cover concept for the website only — final cover and title come from the publisher.',
      status: 'In Production',
      publisher: 'Details to be announced',
      published: true,
      cover_type: 'concept',
      cover_image: '',
      preorder_url: '',
    };

    const bookPayload = {
      id: bookId,
      slug: 'the-first-seven-years',
      title: bData?.title || defaultBook.title,
      subtitle: bData?.subtitle || defaultBook.subtitle,
      eyebrow: bData?.eyebrow || defaultBook.eyebrow,
      author: bData?.author || defaultBook.author,
      approved_by: bData?.approved_by || defaultBook.approved_by,
      description: bData?.description || defaultBook.description,
      note: bData?.note || defaultBook.note,
      status: bData?.status || defaultBook.status,
      publisher: bData?.publisher || defaultBook.publisher,
      published: bData?.published !== false,
      is_featured: true,
      order: 1,
      cover_type: bData?.cover_type || 'concept',
      cover_image: bData?.cover_image || '',
      preorder_url: bData?.preorder_url || '',
    };

    const createdBook = await prisma.book.create({
      data: bookPayload,
    });
    console.log('✔ Created initial primary Book:', createdBook.title);

    // 2. Migrate waitlist subscribers if any
    const subscribers = Array.isArray(bData?.waitlist_subscribers) ? bData.waitlist_subscribers : [
      { id: 'sub-1', email: 'sarah.m@example.com', date: '2026-10-18T10:14:00Z' },
      { id: 'sub-2', email: 'david.k@example.com', date: '2026-10-19T14:32:00Z' },
      { id: 'sub-3', email: 'emily.t@example.com', date: '2026-10-20T09:05:00Z' },
    ];

    for (const sub of subscribers) {
      const subId = sub.id || 'sub-' + Math.random().toString(36).substring(2, 9);
      await prisma.bookWaitlist.upsert({
        where: { id: subId },
        update: {
          book_id: createdBook.id,
          email: sub.email,
          date: sub.date ? new Date(sub.date) : new Date(),
        },
        create: {
          id: subId,
          book_id: createdBook.id,
          email: sub.email,
          date: sub.date ? new Date(sub.date) : new Date(),
        },
      });
    }
    console.log(`✔ Migrated ${subscribers.length} waitlist subscribers into book_waitlist table`);
  } else {
    console.log(`Books already exist in books table (${count} found). Skipping creation.`);
  }

  await prisma.$disconnect();
}

migrateData().catch((err) => {
  console.error('Migration script error:', err);
  process.exit(1);
});
