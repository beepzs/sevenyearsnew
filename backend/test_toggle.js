const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const all = await prisma.topic.findMany();
  console.log('Total:', all.length, 'Published:', all.filter(t => t.published).length);

  // Set gut-health to published
  await prisma.topic.update({
    where: { slug: 'gut-health' },
    data: { published: true }
  });

  const res1 = await fetch('http://localhost:3000/topics');
  const html1 = await res1.text();
  console.log('With 1 published topic:');
  console.log('Has gut-health topic-row:', html1.includes('/topics/gut-health/'));
  console.log('Has allergies topic-row:', html1.includes('/topics/allergies/'));
  console.log('Topic count lede in main:', html1.includes('One area parents ask about most') || html1.includes('1 areas') || html1.includes('One areas'));

  // Revert back
  await prisma.topic.update({
    where: { slug: 'gut-health' },
    data: { published: false }
  });

  const res2 = await fetch('http://localhost:3000/topics');
  const html2 = await res2.text();
  console.log('Reverted to 0 published topics:');
  console.log('Has No topics published:', html2.includes('No topics are currently published.'));
  console.log('Has topic-index:', html2.includes('topic-index'));
}

run().catch(console.error).finally(() => prisma.$disconnect());
