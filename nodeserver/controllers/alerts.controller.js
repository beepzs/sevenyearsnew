import { prisma } from '../db.js';

export const getAlerts = async (req, res) => {
  try {
    const alerts = await prisma.alert.findMany({ orderBy: { createdAt: 'desc' } });
    res.json({ success: true, alerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const toggleAlertRead = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }

    const updated = await prisma.alert.update({
      where: { id },
      data: { unread: !alert.unread },
    });
    res.json({ success: true, alert: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const markAllAlertsRead = async (req, res) => {
  try {
    await prisma.alert.updateMany({ data: { unread: false } });
    res.json({ success: true, message: 'All alerts marked as read' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
