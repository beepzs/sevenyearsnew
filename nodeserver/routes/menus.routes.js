import { Router } from 'express';
import { getMenus } from '../controllers/menus.controller.js';

const router = Router();

router.get('/', getMenus);

export default router;
