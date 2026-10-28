import axios from 'axios';

/**
 * Resolve API base URL:
 * 1. Checks API_URL environment variable (from .env, .env.production, or system env)
 * 2. Falls back to relative '/api' for standard proxying (Vite in dev, Nginx / Caddy / reverse proxy in prod)
 */
export const API_URL = (
  import.meta.env.API_URL ||
  '/api'
).replace(/\/+$/, ''); // Strip any trailing slash

/**
 * Configured Axios instance for The First Seven Years Admin CMS
 */
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor to attach authentication token
api.interceptors.request.use(
  (config) => {
    const token =
      localStorage.getItem('f7_auth_token') ||
      sessionStorage.getItem('f7_auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for consistent error extraction and logging
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}:`, message);
    return Promise.reject(error);
  }
);

export default api;
