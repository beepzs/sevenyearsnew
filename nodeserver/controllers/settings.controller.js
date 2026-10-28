import { prisma } from '../db.js';

export const getSettings = async (req, res) => {
  try {
    const rec = await prisma.setting.findUnique({ where: { key: 'global' } });
    res.json({ success: true, settings: rec?.value || {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const rec = await prisma.setting.findUnique({ where: { key: 'global' } });
    const current = rec?.value || {};
    const merged = { ...current, ...req.body };

    const updated = await prisma.setting.upsert({
      where: { key: 'global' },
      update: { value: merged },
      create: { key: 'global', value: merged },
    });

    res.json({ success: true, settings: updated.value, message: 'Settings saved to database' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
