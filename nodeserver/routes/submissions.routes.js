import { Router } from 'express';
import { getSubmissions, convertSubmission, createSubmission } from '../controllers/submissions.controller.js';

const router = Router();

router.get('/', getSubmissions);
router.post('/', createSubmission);
router.post('/:id/convert', convertSubmission);

export default router;
