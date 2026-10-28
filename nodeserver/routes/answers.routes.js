import { Router } from 'express';
import { getAnswers, approveAnswer } from '../controllers/answers.controller.js';

const router = Router();

router.get('/', getAnswers);
router.post('/:slug/approve', approveAnswer);

export default router;
