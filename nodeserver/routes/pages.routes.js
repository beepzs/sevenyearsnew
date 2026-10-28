import { Router } from 'express';
import { getPages } from '../controllers/pages.controller.js';

const router = Router();

router.get('/', getPages);

export default router;
