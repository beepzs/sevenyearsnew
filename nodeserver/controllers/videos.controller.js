import { prisma } from '../db.js';

export const getVideos = async (req, res) => {
  try {
    const videos = await prisma.video.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, videos });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
