import { Router } from 'express';
import { prisma } from '../db.js';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';
import topicsRoutes from './topics.routes.js';
import answersRoutes from './answers.routes.js';
import videosRoutes from './videos.routes.js';
import expertsRoutes from './experts.routes.js';
import faqsRoutes from './faqs.routes.js';
import pagesRoutes from './pages.routes.js';
import menusRoutes from './menus.routes.js';
import submissionsRoutes from './submissions.routes.js';
import alertsRoutes from './alerts.routes.js';
import settingsRoutes from './settings.routes.js';
import usersRoutes from './users.routes.js';
import bookRoutes from './book.routes.js';
import bannersRoutes from './banners.routes.js';

const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', async (req, res) => {
  let dbStatus = 'connected';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  res.json({
    status: 'ok',
    database: dbStatus,
    orm: 'Prisma 6',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'The First Seven Years - Node Admin API (MySQL + Prisma)',
  });
});

// Mount module sub-routes
apiRouter.use('/auth', authRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/topics', topicsRoutes);
apiRouter.use('/answers', answersRoutes);
apiRouter.use('/videos', videosRoutes);
apiRouter.use('/experts', expertsRoutes);
apiRouter.use('/faqs', faqsRoutes);
apiRouter.use('/pages', pagesRoutes);
apiRouter.use('/menus', menusRoutes);
apiRouter.use('/submissions', submissionsRoutes);
apiRouter.use('/alerts', alertsRoutes);
apiRouter.use('/settings', settingsRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/book', bookRoutes);
apiRouter.use('/banners', bannersRoutes);

export default apiRouter;
