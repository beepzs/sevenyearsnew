import express from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import apiRouter from './routes/index.js';

const app = express();
const PORT = config.port;

// Global Middleware configured via central config
app.use(cors({ origin: config.corsOrigin }));
app.use(express.json({ limit: config.uploadLimit }));
app.use(express.urlencoded({ extended: true, limit: config.uploadLimit }));

// Request Logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Mount Centralized API Routes
app.use('/api', apiRouter);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 The First Seven Years - Node.js Admin API`);
  console.log(`📡 Environment:       ${config.env.toUpperCase()}`);
  console.log(`📡 Server running at: http://localhost:${PORT}`);
  console.log(`📊 Health check:      http://localhost:${PORT}/api/health`);
  console.log(`🌐 CORS Origin:       ${Array.isArray(config.corsOrigin) ? config.corsOrigin.join(', ') : config.corsOrigin}`);
  console.log(`🗄️ Database:          MySQL via Prisma`);
  console.log(`📁 Architecture:      Modular Routes & Controllers Pattern`);
  console.log(`======================================================\n`);
});

export default app;
