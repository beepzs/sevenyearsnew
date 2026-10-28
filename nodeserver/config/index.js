import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const NODESERVER_DIR = path.resolve(__dirname, '..');
const ROOT_DIR = path.resolve(NODESERVER_DIR, '..');

// Load environment variables from .env file
dotenv.config({ path: path.join(NODESERVER_DIR, '.env') });

const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';
const isDevelopment = NODE_ENV === 'development';

export const config = {
  // Environment
  env: NODE_ENV,
  isProduction,
  isDevelopment,

  // Server
  port: parseInt(process.env.PORT || '5000', 10),
  host: process.env.HOST || '0.0.0.0',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'mysql://root:@localhost:3306/first_seven_years',

  // CORS (supports comma-separated string in prod, e.g. "https://admin.domain.com,https://domain.com")
  corsOrigin: process.env.CORS_ORIGIN
    ? (process.env.CORS_ORIGIN.includes(',')
        ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
        : process.env.CORS_ORIGIN.trim())
    : '*',

  // Security / Auth
  jwtSecret: process.env.JWT_SECRET || 'f7_jwt_secret_change_in_production_999999',
  sessionDuration: process.env.SESSION_DURATION || '7d',

  // Request limits
  uploadLimit: process.env.UPLOAD_LIMIT || '50mb',

  // System Paths
  paths: {
    nodeServerDir: NODESERVER_DIR,
    rootDir: ROOT_DIR,
    buildScript: path.join(ROOT_DIR, 'build.py'),
    seedScript: path.join(NODESERVER_DIR, 'seed.js'),
    dataDir: path.join(NODESERVER_DIR, 'data'),
  },
};

// Log validation warnings in production mode
if (isProduction) {
  if (!process.env.DATABASE_URL) {
    console.warn('⚠️ [Production Warning] DATABASE_URL is missing. Falling back to local default.');
  }
  if (!process.env.JWT_SECRET) {
    console.warn('⚠️ [Production Warning] JWT_SECRET is using the fallback. Please provide a secure JWT_SECRET.');
  }
}

export default config;
