import axios from 'axios';

// Determine base API URL
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return `${envUrl.replace(/\/$/, '')}/api`;
  }
  // In production builds outside localhost, default directly to the live Render backend
  if (import.meta.env.PROD && typeof window !== 'undefined' && !window.location.hostname.includes('localhost') && !window.location.hostname.includes('127.0.0.1')) {
    return 'https://ecocycle-backend-oc27.onrender.com/api';
  }
  return '/api';
};

export const API_BASE_URL = getBaseUrl();

// Helper to resolve upload images
export const getUploadUrl = (imagePath) => {
  if (!imagePath) return '';
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  const envUrl = import.meta.env.VITE_API_URL || (
    import.meta.env.PROD && typeof window !== 'undefined' && !window.location.hostname.includes('localhost')
      ? 'https://ecocycle-backend-oc27.onrender.com'
      : ''
  );
  if (envUrl && envUrl.trim() !== '') {
    return `${envUrl.replace(/\/$/, '')}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  }
  return imagePath;
};

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('ecocycle_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to handle global 401s (token expiry)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (!currentPath.includes('/login') && !currentPath.includes('/register') && currentPath !== '/') {
        localStorage.removeItem('ecocycle_token');
        localStorage.removeItem('ecocycle_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
