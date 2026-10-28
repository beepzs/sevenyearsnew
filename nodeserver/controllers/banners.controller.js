import { prisma } from '../db.js';

export const getBanners = async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { order: 'asc' },
    });
    res.json({ success: true, banners });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const saveBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const banner = await prisma.banner.upsert({
      where: { id },
      update: {
        type: data.type || 'promo',
        title: data.title || null,
        content: data.content || null,
        badge: data.badge || null,
        highlight: data.highlight || null,
        link_text: data.link_text || null,
        link_url: data.link_url || null,
        bg_color: data.bg_color || '#2B3C56',
        text_color: data.text_color || '#ffffff',
        image: data.image || null,
        secondary_text: data.secondary_text || null,
        data: data.data || null,
        published: data.published !== false,
        order: data.order !== undefined ? Number(data.order) : 0,
      },
      create: {
        id,
        type: data.type || 'promo',
        title: data.title || null,
        content: data.content || null,
        badge: data.badge || null,
        highlight: data.highlight || null,
        link_text: data.link_text || null,
        link_url: data.link_url || null,
        bg_color: data.bg_color || '#2B3C56',
        text_color: data.text_color || '#ffffff',
        image: data.image || null,
        secondary_text: data.secondary_text || null,
        data: data.data || null,
        published: data.published !== false,
        order: data.order !== undefined ? Number(data.order) : 0,
      },
    });

    res.json({ success: true, banner, message: 'Banner saved successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.banner.delete({ where: { id } });
    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
