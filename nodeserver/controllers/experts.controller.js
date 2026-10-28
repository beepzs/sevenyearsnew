import { prisma } from '../db.js';

export const getExperts = async (req, res) => {
  try {
    const experts = await prisma.expert.findMany();
    res.json({ success: true, experts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getExpertBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const expert = await prisma.expert.findUnique({
      where: { slug }
    });
    if (!expert) {
      return res.status(404).json({ success: false, message: 'Expert not found' });
    }
    res.json({ success: true, expert });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

