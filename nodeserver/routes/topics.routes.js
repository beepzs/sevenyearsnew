import { Router } from 'express';
import {
  getTopics,
  saveTopic,
  deleteTopic,
  togglePublishTopic,
  reorderTopics,
} from '../controllers/topics.controller.js';

const router = Router();

router.get('/', getTopics);
router.post('/', saveTopic);
router.delete('/:slug', deleteTopic);
router.post('/:slug/toggle-publish', togglePublishTopic);
router.post('/reorder', reorderTopics);

export default router;
