import { prisma } from '../db.js';

export const getMenus = async (req, res) => {
  try {
    const menuItems = await prisma.menuItem.findMany({ orderBy: { order: 'asc' } });
    res.json({
      success: true,
      menus: {
        header: menuItems.filter((m) => m.location === 'header'),
        footer: menuItems.filter((m) => m.location === 'footer'),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
