import axios from 'axios';

// Ensure a persistent guest session ID exists in localStorage
const getOrCreateSessionId = () => {
  let sessionId = localStorage.getItem('loom_session_id');
  if (!sessionId) {
    sessionId = 'guest_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem('loom_session_id', sessionId);
  }
  return sessionId;
};

const getBaseUrl = () => {
  let url = (import.meta.env.VITE_API_URL || '/api').trim();
  if (/^https?:\/\//i.test(url)) {
    url = url.replace(/\/+$/, '');
    if (!url.endsWith('/api')) {
      url = `${url}/api`;
    }
  }
  return url;
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token and session ID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('loom_auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const sessionId = getOrCreateSessionId();
    config.headers['x-session-id'] = sessionId;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Extract unified error message
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';

    return Promise.reject({
      message,
      statusCode: error.response?.status || 500,
      originalError: error,
    });
  }
);

// Built-in health check helper
export const checkHealth = async () => {
  return api.get('/health');
};

export default api;
