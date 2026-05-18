import axios from 'axios';

// In production, use the full backend URL. In dev, use Vite proxy (/api).
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Recursively normalize MongoDB _id → id on every object/array in the response.
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

// Request interceptor – attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor – normalize _id → id + handle 401
api.interceptors.response.use(
  (response) => {
    if (response.config.responseType === 'blob') return response;
    if (response.data) response.data = normalizeIds(response.data);
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
