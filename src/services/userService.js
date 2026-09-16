import apiClient from './api';

export const userService = {
  getProfile: async () => {
    return await apiClient.get('/users/profile');
  },
  updateProfile: async (profileData) => {
    const response = await apiClient.patch('/users/profile', profileData);
    if (response.success && response.data.user) {
      localStorage.setItem('foodlens_user', JSON.stringify(response.data.user));
    }
    return response;
  },
  updatePreferences: async (preferencesData) => {
    const response = await apiClient.patch('/users/preferences', preferencesData);
    if (response.success && response.data.user) {
      localStorage.setItem('foodlens_user', JSON.stringify(response.data.user));
    }
    return response;
  },
};
