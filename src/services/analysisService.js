// Food image and nutrition label analysis service
import apiClient from './api';

export const analysisService = {
  /**
   * Analyze food image or dish
   * @param {Object} params
   * @param {string} params.image - Base64 image or data URL
   * @param {string} params.mimeType - Image mime type (image/jpeg, image/png, image/webp)
   * @param {string} [params.type='image'] - Analysis type ('image' or 'label')
   */
  analyzeImage: async ({ image, mimeType = 'image/jpeg', type = 'image' }) => {
    const response = await apiClient.post(
      '/analysis/image',
      {
        image,
        mimeType,
        type,
      },
      {
        timeout: 25000, // Allow sufficient time for multimodal AI processing
      }
    );
    return response;
  },

  /**
   * Analyze nutrition facts label or packaging panel
   * @param {Object} params
   * @param {string} params.image - Base64 image or data URL
   * @param {string} params.mimeType - Image mime type (image/jpeg, image/png, image/webp)
   */
  analyzeLabel: async ({ image, mimeType = 'image/jpeg' }) => {
    const response = await apiClient.post(
      '/analysis/label',
      {
        image,
        mimeType,
        type: 'label',
      },
      {
        timeout: 25000,
      }
    );
    return response;
  },
};

