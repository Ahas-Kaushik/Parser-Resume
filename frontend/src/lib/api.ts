import axios, { InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

console.log('🔧 API initialized with base URL:', API_BASE_URL);

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// CRITICAL: Request interceptor to add token to EVERY request
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get fresh token from localStorage on EVERY request
    const token = localStorage.getItem('token');
    
    const url = config.url || 'unknown';
    const method = config.method?.toUpperCase() || 'unknown';
    
    console.log(`📤 [${method}] ${url}`);
    
    if (token) {
      // Add Authorization header
      config.headers.Authorization = `Bearer ${token}`;
      console.log(`   ✅ Token attached: ${token.substring(0, 20)}...`);
    } else {
      console.log(`   ⚠️ NO TOKEN FOUND in localStorage`);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    const url = response.config.url || 'unknown';
    const status = response.status;
    console.log(`✅ [${status}] ${url}`);
    return response;
  },
  (error) => {
    const url = error.config?.url || 'unknown';
    const status = error.response?.status || 'unknown';
    const data = error.response?.data;
    
    console.error(`❌ [${status}] ${url}`, data);
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      
      // Don't redirect if already on auth pages
      if (!currentPath.includes('/login') && 
          !currentPath.includes('/register') &&
          !currentPath.includes('/')) {
        console.log('🚫 Unauthorized - redirecting to login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;