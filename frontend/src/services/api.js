import axios from 'axios';

// Determine base API URL
const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl.trim() !== '') {
    return `${envUrl.replace(/\/$/, '')}/api`;
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
  const envUrl = import.meta.env.VITE_API_URL;
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
