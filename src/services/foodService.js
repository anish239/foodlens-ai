import apiClient from './api';

export const foodService = {
  searchProducts: async (query, page = 1, pageSize = 20) => {
    const response = await apiClient.get('/products/search', {
      params: {
        q: query,
        page,
        pageSize,
      },
    });
    return response;
  },
  compareProducts: async (barcodes) => {
    const barcodeParam = Array.isArray(barcodes) ? barcodes.join(',') : barcodes;
    const response = await apiClient.get('/products/compare', {
      params: {
        barcodes: barcodeParam,
      },
    });
    return response;
  },
  getProductByBarcode: async (barcode) => {
    const response = await apiClient.get(`/products/barcode/${barcode}`);
    return response;
  },
  getProductById: async (id) => {
    const response = await apiClient.get(`/products/barcode/${id}`);
    return response;
  },
  getProductScore: async (barcode) => {
    const response = await apiClient.get(`/products/barcode/${barcode}/score`);
    return response;
  },
  getProductCompatibility: async (barcode) => {
    const response = await apiClient.get(`/products/barcode/${barcode}/compatibility`);
    return response;
  },
  getProductInsight: async (barcode) => {
    const response = await apiClient.get(`/products/barcode/${barcode}/insight`);
    return response;
  },
  submitManualProduct: async (productData) => {
    const response = await apiClient.post('/products/manual', productData);
    return response;
  },

  // Scan History
  getScanHistory: async (page = 1, pageSize = 20) => {
    const response = await apiClient.get('/history', {
      params: { page, pageSize },
    });
    return response;
  },
  recordScan: async (barcode) => {
    const response = await apiClient.post('/history', { barcode });
    return response;
  },
  deleteScanHistory: async (id) => {
    const response = await apiClient.delete(`/history/${id}`);
    return response;
  },
  clearScanHistory: async () => {
    const response = await apiClient.delete('/history');
    return response;
  },

  // Favorites
  getFavorites: async (page = 1, pageSize = 50) => {
    const response = await apiClient.get('/favorites', {
      params: { page, pageSize },
    });
    return response;
  },
  checkIsFavorite: async (barcode) => {
    const response = await apiClient.get(`/favorites/check/${barcode}`);
    return response;
  },
  addFavorite: async (barcode) => {
    const response = await apiClient.post('/favorites', { barcode });
    return response;
  },
  removeFavorite: async (barcode) => {
    const response = await apiClient.delete(`/favorites/${barcode}`);
    return response;
  },

  // Analytics
  getAnalyticsSummary: async (period = 'all') => {
    const response = await apiClient.get('/analytics/summary', {
      params: { period },
    });
    return response;
  },
};


