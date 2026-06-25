import axios from 'axios';

// Create API Client with baseUrl and support for cookie credentials
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api', 
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Cache & Deduplication maps for optimizing frontend loading performance
const responseCache = new Map();
const inflightRequests = new Map();
const CACHE_TTL = 15000; // 15 seconds default cache TTL
const CACHE_TTL_MAP = {
  '/lessons': 60000,
  '/leaderboards/current': 30000,
  '/leaderboards/friends': 30000,
  '/social/friends': 20000,
  '/social/feed': 20000,
  '/auth/me': 10000,
};
const getCacheTTL = (url) => {
  for (const [pattern, ttl] of Object.entries(CACHE_TTL_MAP)) {
    if (url && url.includes(pattern)) return ttl;
  }
  return CACHE_TTL;
};

const getCacheKey = (config) => {
  const url = config.url || '';
  const params = config.params ? JSON.stringify(config.params) : '';
  const data = config.data ? (typeof config.data === 'string' ? config.data : JSON.stringify(config.data)) : '';
  return `${config.method || 'get'}_${url}_${params}_${data}`;
};

// Wrap api.request to support request deduplication and short-term caching
const originalRequest = api.request.bind(api);

api.request = function (configOrUrl, config) {
  let finalConfig = {};
  if (typeof configOrUrl === 'string') {
    finalConfig = config || {};
    finalConfig.url = configOrUrl;
  } else {
    finalConfig = configOrUrl || {};
  }
  
  const method = (finalConfig.method || 'get').toLowerCase();
  
  // If not a GET request, invalidate the cache and bypass caching
  if (method !== 'get') {
    const basePath = (finalConfig.url || '').split('?')[0];
    for (const [key] of responseCache) {
      if (key.includes(basePath) || key.includes('/auth/me')) {
        responseCache.delete(key);
      }
    }
    return originalRequest(configOrUrl, config);
  }

  const key = getCacheKey(finalConfig);
  const now = Date.now();

  // 1. Check response cache
  if (responseCache.has(key)) {
    const cached = responseCache.get(key);
    if (now - cached.timestamp < getCacheTTL(finalConfig.url)) {
      return Promise.resolve({
        data: cached.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: finalConfig,
      });
    } else {
      responseCache.delete(key);
    }
  }

  // 2. Check inflight requests (coalescing)
  if (inflightRequests.has(key)) {
    return inflightRequests.get(key);
  }

  // 3. Perform request and manage states
  let promise;
  try {
    promise = originalRequest(configOrUrl, config)
      .then((response) => {
        responseCache.set(key, {
          data: response.data,
          timestamp: Date.now(),
        });
        inflightRequests.delete(key);
        return response;
      })
      .catch((error) => {
        inflightRequests.delete(key);
        throw error;
      });
  } catch (err) {
    inflightRequests.delete(key);
    return Promise.reject(err);
  }

  inflightRequests.set(key, promise);
  return promise;
};

// Request interceptor to attach JWT token if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token expiry / unauthenticated responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear local storage and redirect if token is expired/invalid
      localStorage.removeItem('token');
      const path = window.location.pathname;
      const isPublicPath = path === '/login' || path === '/' || path === '/register' ||
                           path.startsWith('/verify-email') || path === '/resend-verification' ||
                           path === '/forgot-password' || path.startsWith('/reset-password');
      if (!isPublicPath) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
