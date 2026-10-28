import { prisma } from '../db.js';

export const getAnswers = async (req, res) => {
  try {
    const answers = await prisma.answer.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, answers });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const approveAnswer = async (req, res) => {
  try {
    const { slug } = req.params;
    const { reviewed_by } = req.body;

    const ans = await prisma.answer.findUnique({ where: { slug } });
    if (!ans) {
      return res.status(404).json({ success: false, message: 'Answer not found' });
    }

    const updated = await prisma.answer.update({
      where: { slug },
      data: {
        reviewed_by: reviewed_by || 'Dr. Murray Clarke',
        reviewed_at: new Date().toISOString().split('T')[0],
        published: true,
        clinical_status: 'approved',
      },
    });

    res.json({
      success: true,
      answer: updated,
      message: `Clinically approved by ${updated.reviewed_by}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
