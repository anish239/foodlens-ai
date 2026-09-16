import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('foodlens_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const customError = {
      message: error.response?.data?.message || error.message || 'An unexpected error occurred',
      status: error.response?.status || 500,
      data: error.response?.data || null,
    };
    // Only trigger unauthorized handling for non-auth requests
    const isAuthRequest = error.config?.url?.includes('/auth/login') ||
                          error.config?.url?.includes('/auth/register') ||
                          error.config?.url?.includes('/auth/logout');

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('foodlens_token');
      localStorage.removeItem('foodlens_user');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(customError);
  }
);

export default apiClient;
