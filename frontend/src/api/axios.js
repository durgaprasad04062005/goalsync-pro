import axios from 'axios';

/**
 * Determine the API base URL:
 * - In production (Vercel): uses VITE_API_URL env variable set in Vercel dashboard
 * - In development: uses Vite proxy (/api → localhost:5000)
 */
const getBaseURL = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    // Remove trailing slash if present
    return `${envUrl.replace(/\/$/, '')}/api`;
  }
  // Development: use Vite proxy
  return '/api';
};

const BASE_URL = getBaseURL();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: false,
});

/**
 * Recursively normalize MongoDB _id → id on every object/array.
 * This lets all frontend code use .id consistently.
 */
const normalizeIds = (data) => {
  if (Array.isArray(data)) return data.map(normalizeIds);
  if (data && typeof data === 'object' && !(data instanceof Blob)) {
    const out = {};
    for (const key of Object.keys(data)) {
      out[key] = normalizeIds(data[key]);
    }
    if (out._id !== undefined && out.id === undefined) {
      out.id = out._id;
    }
    return out;
  }
  return data;
};

// ── Request interceptor: attach JWT token ────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response interceptor: normalize IDs + handle errors ──────────────────────
api.interceptors.response.use(
  (response) => {
    // Skip normalization for binary downloads
    if (response.config.responseType === 'blob') return response;
    if (response.data) {
      response.data = normalizeIds(response.data);
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;

    // Auto logout on 401
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    // Network error (backend unreachable / CORS)
    if (!error.response) {
      console.error('Network error - backend unreachable:', error.message);
      error.message = 'Cannot connect to server. Please check your connection.';
    }

    return Promise.reject(error);
  }
);

export default api;
