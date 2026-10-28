import { Router } from 'express';
import {
  getAlerts,
  toggleAlertRead,
  markAllAlertsRead,
} from '../controllers/alerts.controller.js';

const router = Router();

router.get('/', getAlerts);
router.post('/:id/toggle-read', toggleAlertRead);
router.post('/mark-all-read', markAllAlertsRead);

export default router;
