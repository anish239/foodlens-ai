import apiClient from './api';

export const authService = {
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    if (response.success && response.data.token) {
      localStorage.setItem('foodlens_token', response.data.token);
      localStorage.setItem('foodlens_user', JSON.stringify(response.data.user));
    }
    return response;
  },
  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    if (response.success && response.data.token) {
      localStorage.setItem('foodlens_token', response.data.token);
      localStorage.setItem('foodlens_user', JSON.stringify(response.data.user));
    }
    return response;
  },
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // ignore
    } finally {
      localStorage.removeItem('foodlens_token');
      localStorage.removeItem('foodlens_user');
    }
    return { success: true };
  },
  getCurrentUser: async () => {
    const response = await apiClient.get('/auth/me');
    if (response.success && response.data.user) {
      localStorage.setItem('foodlens_user', JSON.stringify(response.data.user));
    }
    return response;
  },
};
