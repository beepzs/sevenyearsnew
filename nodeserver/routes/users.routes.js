import { Router } from 'express';
import { getUsersAndRoles } from '../controllers/users.controller.js';

const router = Router();

router.get('/', getUsersAndRoles);

export default router;
