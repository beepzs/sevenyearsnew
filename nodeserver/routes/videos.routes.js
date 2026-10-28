import { Router } from 'express';
import { getVideos } from '../controllers/videos.controller.js';

const router = Router();

router.get('/', getVideos);

export default router;
