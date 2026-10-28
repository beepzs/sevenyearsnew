import { prisma } from '../db.js';

export const getPages = async (req, res) => {
  try {
    const pages = await prisma.page.findMany();
    res.json({ success: true, pages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
