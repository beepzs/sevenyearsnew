import { Router } from 'express';
import {
  getAdminData,
  saveItem,
  deleteItem,
  togglePublish,
  bulkUpdate,
  resetData,
  exportData,
  rebuildSite,
} from '../controllers/admin.controller.js';

const router = Router();

router.get('/data', getAdminData);
router.post('/save-item', saveItem);
router.post('/delete-item', deleteItem);
router.post('/toggle-publish', togglePublish);
router.post('/bulk-update', bulkUpdate);
router.post('/reset', resetData);
router.get('/export', exportData);
router.post('/rebuild-site', rebuildSite);

export default router;
