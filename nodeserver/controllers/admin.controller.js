import { exec } from 'child_process';
import { config } from '../config/index.js';
import {
  prisma,
  getAllAdminData,
  saveItemToDb,
  deleteItemFromDb,
  togglePublishInDb,
} from '../db.js';

export const getAdminData = async (req, res) => {
  try {
    const data = await getAllAdminData();
    res.json({ success: true, data });
  } catch (err) {
    console.error('Error fetching admin data:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch admin data from MySQL' });
  }
};

export const saveItem = async (req, res) => {
  try {
    const { type, item, idKey } = req.body;
    if (!type || !item || !idKey) {
      return res.status(400).json({ success: false, message: 'type, item, and idKey are required' });
    }

    const saved = await saveItemToDb(type, item, idKey);
    res.json({ success: true, item: saved, message: 'Saved successfully to database' });
  } catch (err) {
    console.error('Error saving item:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to save item' });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const { type, idKey, idVal } = req.body;
    if (!type || !idKey || idVal === undefined) {
      return res.status(400).json({ success: false, message: 'type, idKey, and idVal are required' });
    }

    await deleteItemFromDb(type, idKey, idVal);
    res.json({ success: true, message: 'Item deleted successfully from database' });
  } catch (err) {
    console.error('Error deleting item:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to delete item' });
  }
};

export const togglePublish = async (req, res) => {
  try {
    const { type, idKey, idVal } = req.body;
    if (!type || !idKey || idVal === undefined) {
      return res.status(400).json({ success: false, message: 'type, idKey, and idVal are required' });
    }

    const newStatus = await togglePublishInDb(type, idKey, idVal);
    res.json({
      success: true,
      published: newStatus,
      message: `Item marked as ${newStatus ? 'Published' : 'Draft'}`,
    });
  } catch (err) {
    console.error('Error toggling publish state:', err);
    res.status(500).json({ success: false, message: err.message || 'Failed to update publish state' });
  }
};

export const bulkUpdate = async (req, res) => {
  try {
    const updated = req.body;
    if (!updated || typeof updated !== 'object') {
      return res.status(400).json({ success: false, message: 'Invalid payload' });
    }

    if (updated.settings) {
      await prisma.setting.upsert({
        where: { key: 'global' },
        update: { value: updated.settings },
        create: { key: 'global', value: updated.settings },
      });
    }

    const fullData = await getAllAdminData();
    res.json({ success: true, data: fullData, message: 'Admin data updated successfully' });
  } catch (err) {
    console.error('Error during bulk-update:', err);
    res.status(500).json({ success: false, message: 'Bulk update failed' });
  }
};

export const resetData = async (req, res) => {
  try {
    const seedScript = config.paths.seedScript;
    exec(`node "${seedScript}"`, { cwd: config.paths.nodeServerDir }, async (error, stdout, stderr) => {
      if (error) {
        console.error('Reset error:', error, stderr);
        return res.status(500).json({ success: false, message: 'Reset failed' });
      }
      const data = await getAllAdminData();
      res.json({ success: true, data, message: 'Reset database to default seed data' });
    });
  } catch (err) {
    console.error('Reset error:', err);
    res.status(500).json({ success: false, message: 'Reset failed' });
  }
};

export const exportData = async (req, res) => {
  try {
    const data = await getAllAdminData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=admin-data-export.json');
    res.send(JSON.stringify(data, null, 2));
  } catch (err) {
    res.status(500).json({ success: false, message: 'Export failed' });
  }
};

export const rebuildSite = (req, res) => {
  const buildScript = config.paths.buildScript;
  console.log(`[Rebuild] Executing python ${buildScript}...`);

  exec(`python "${buildScript}"`, { cwd: config.paths.rootDir }, (error, stdout, stderr) => {
    if (error) {
      console.error(`[Rebuild Error]:`, error);
      return res.status(500).json({
        success: false,
        message: 'Build script failed',
        error: error.message,
        stderr,
      });
    }

    console.log(`[Rebuild Success]:\n${stdout}`);
    res.json({
      success: true,
      message: 'Static site rebuilt successfully!',
      stdout,
    });
  });
};
