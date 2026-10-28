import { prisma, saveItemToDb, deleteItemFromDb, togglePublishInDb } from '../db.js';

export const getTopics = async (req, res) => {
  try {
    const topics = await prisma.topic.findMany({ orderBy: { order: 'asc' } });
    res.json({ success: true, topics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const saveTopic = async (req, res) => {
  try {
    const topic = req.body;
    if (!topic.slug || !topic.name) {
      return res.status(400).json({ success: false, message: 'slug and name are required' });
    }
    const saved = await saveItemToDb('topics', topic, 'slug');
    res.json({ success: true, topic: saved, message: `Topic ${saved.name} saved successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteTopic = async (req, res) => {
  try {
    const { slug } = req.params;
    await deleteItemFromDb('topics', 'slug', slug);
    res.json({ success: true, message: `Topic ${slug} deleted successfully` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const togglePublishTopic = async (req, res) => {
  try {
    const { slug } = req.params;
    const newStatus = await togglePublishInDb('topics', 'slug', slug);
    res.json({
      success: true,
      published: newStatus,
      message: `Topic ${slug} marked as ${newStatus ? 'Published' : 'Draft'}`,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const reorderTopics = async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ success: false, message: 'items array is required' });
    }
    await Promise.all(
      items.map((it) =>
        prisma.topic.update({
          where: { slug: it.slug },
          data: { order: Number(it.order) },
        })
      )
    );
    const updated = await prisma.topic.findMany({ orderBy: { order: 'asc' } });
    res.json({ success: true, topics: updated, message: 'Topics reordered successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
