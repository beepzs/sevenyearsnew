import { prisma } from './db.js';

async function main() {
  try {
    await prisma.page.upsert({
      where: { id: 'pg-4' },
      update: {
        title: 'Terms and Conditions & Medical Disclaimer',
        slug: 'terms',
        url: '/terms/',
        template: 'Legal / Policy',
        seo_title: 'Terms and Conditions & Medical Disclaimer — The First Seven Years',
        meta_desc: 'Terms of use, user submission guidelines, and explicit educational medical disclaimer for The First Seven Years.',
        focus_keyword: 'terms and conditions medical disclaimer',
        keywords: 'terms and conditions, terms of service, medical disclaimer, pediatric education disclaimer',
        canonical_url: 'https://thefirstsevenyears.com/terms/',
        robots_index: 'index',
        robots_follow: 'follow',
        og_title: 'Terms and Conditions — The First Seven Years',
        og_type: 'website',
        og_desc: 'Educational content only. Nothing on this website constitutes direct individual medical diagnosis or treatment.',
        og_image: 'https://thefirstsevenyears.com/assets/img/og-share.jpg',
        schema_type: 'WebPage',
        twitter_card: 'summary',
        excerpt: 'Legal conditions for browsing the site, watching episodes, and reading expert answers.',
        body: '<p><strong>Educational content only.</strong> Nothing on this website constitutes direct medical advice, diagnosis, or treatment. The First Seven Years shares general health education from pediatricians, doctors, researchers and practitioners.</p><p>Always consult your child’s pediatrician or primary care provider regarding any medical symptoms, diagnosis, treatment, or medications. In an emergency, call 911 or your local emergency services immediately.</p>',
        updated: new Date().toISOString().split('T')[0],
        published: true,
      },
      create: {
        id: 'pg-4',
        title: 'Terms and Conditions & Medical Disclaimer',
        slug: 'terms',
        url: '/terms/',
        template: 'Legal / Policy',
        seo_title: 'Terms and Conditions & Medical Disclaimer — The First Seven Years',
        meta_desc: 'Terms of use, user submission guidelines, and explicit educational medical disclaimer for The First Seven Years.',
        focus_keyword: 'terms and conditions medical disclaimer',
        keywords: 'terms and conditions, terms of service, medical disclaimer, pediatric education disclaimer',
        canonical_url: 'https://thefirstsevenyears.com/terms/',
        robots_index: 'index',
        robots_follow: 'follow',
        og_title: 'Terms and Conditions — The First Seven Years',
        og_type: 'website',
        og_desc: 'Educational content only. Nothing on this website constitutes direct individual medical diagnosis or treatment.',
        og_image: 'https://thefirstsevenyears.com/assets/img/og-share.jpg',
        schema_type: 'WebPage',
        twitter_card: 'summary',
        excerpt: 'Legal conditions for browsing the site, watching episodes, and reading expert answers.',
        body: '<p><strong>Educational content only.</strong> Nothing on this website constitutes direct medical advice, diagnosis, or treatment. The First Seven Years shares general health education from pediatricians, doctors, researchers and practitioners.</p><p>Always consult your child’s pediatrician or primary care provider regarding any medical symptoms, diagnosis, treatment, or medications. In an emergency, call 911 or your local emergency services immediately.</p>',
        updated: new Date().toISOString().split('T')[0],
        published: true,
      },
    });
    console.log('Terms page ensured successfully');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
