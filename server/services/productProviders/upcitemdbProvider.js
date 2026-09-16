import axios from 'axios';

/**
 * UPCitemdb Product Identity Provider (Phase 12)
 * Free tier endpoint: https://api.upcitemdb.com/prod/trial/lookup
 * Does NOT require signup or API key for trial lookup.
 * Implements backend-only requests, short-lived in-memory caching, and request deduplication.
 */
export class UpcitemdbProvider {
  constructor(options = {}) {
    this.name = 'upcitemdb';
    this.apiUrl =
      options.apiUrl ||
      process.env.SECONDARY_PRODUCT_API_URL ||
      'https://api.upcitemdb.com/prod/trial/lookup';
    this.apiKey = options.apiKey || process.env.SECONDARY_PRODUCT_API_KEY || null;
    this.timeoutMs = options.timeoutMs || 6000;

    // Short-lived in-memory cache (TTL: 10 minutes)
    this.cache = new Map();
    this.cacheTtlMs = options.cacheTtlMs || 10 * 60 * 1000;

    // In-flight request deduplication map
    this.pendingRequests = new Map();

    // Mock registry for test suites
    this.customRegistry = new Map();
  }

  /**
   * Register a custom secondary product for testing
   */
  registerProduct(barcode, product) {
    if (barcode && product) {
      this.customRegistry.set(String(barcode).trim(), product);
    }
  }

  /**
   * Clear test registry and cache
   */
  clearCustomRegistry() {
    this.customRegistry.clear();
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Looks up product identity by normalized barcode.
   *
   * @param {string} barcode - Normalized barcode (UPC-A, EAN-8, EAN-13)
   * @returns {Promise<{ found: boolean, source: string, providerName: string, data?: Object, errorType?: string, statusCode?: number }>}
   */
  async lookupBarcode(barcode) {
    const cleanBarcode = String(barcode || '').trim();
    if (!cleanBarcode) {
      return {
        found: false,
        source: this.name,
        providerName: 'UPCitemdb',
        errorType: 'INVALID_BARCODE',
        statusCode: 400,
        message: 'Empty barcode provided',
      };
    }

    // 1. Check in-memory cache
    const cached = this.cache.get(cleanBarcode);
    if (cached && cached.expiresAt > Date.now()) {
      return { ...cached.result, cached: true };
    }

    // 2. Check test registry
    if (this.customRegistry.has(cleanBarcode)) {
      const customItem = this.customRegistry.get(cleanBarcode);
      const res = {
        found: true,
        source: this.name,
        providerName: 'UPCitemdb',
        data: {
          barcode: cleanBarcode,
          name: customItem.name || customItem.title || 'Product',
          title: customItem.title || customItem.name || 'Product',
          brand: customItem.brand || null,
          image: customItem.image || null,
          quantity: customItem.quantity || null,
          servingSize: customItem.servingSize || null,
          categories: Array.isArray(customItem.categories) ? customItem.categories : [],
          ingredients: {
            text: customItem.ingredientsText || customItem.ingredients?.text || null,
            tags: [],
          },
          nutrition: customItem.nutrition || {},
          allergens: Array.isArray(customItem.allergens) ? customItem.allergens : [],
          traces: Array.isArray(customItem.traces) ? customItem.traces : [],
        },
      };
      this.cache.set(cleanBarcode, {
        result: res,
        expiresAt: Date.now() + this.cacheTtlMs,
      });
      return res;
    }

    // 3. In-flight request deduplication
    if (this.pendingRequests.has(cleanBarcode)) {
      return await this.pendingRequests.get(cleanBarcode);
    }

    const lookupPromise = this._executeLookup(cleanBarcode);
    this.pendingRequests.set(cleanBarcode, lookupPromise);

    try {
      const result = await lookupPromise;
      if (result.found) {
        this.cache.set(cleanBarcode, {
          result,
          expiresAt: Date.now() + this.cacheTtlMs,
        });
      }
      return result;
    } finally {
      this.pendingRequests.delete(cleanBarcode);
    }
  }

  /**
   * Alias for backwards-compatibility with getByBarcode
   */
  async getByBarcode(barcode) {
    return this.lookupBarcode(barcode);
  }

  /**
   * Private executor for HTTP request to UPCitemdb
   */
  async _executeLookup(barcode) {
    const isPaidEndpoint = this.apiUrl.includes('/prod/v1') && Boolean(this.apiKey);

    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'User-Agent': 'FoodLensAI/1.0 (support@foodlens.ai)',
    };

    // Only include authentication headers if using the paid endpoint
    // Do NOT send user_key or key_type to the free /prod/trial endpoint
    if (isPaidEndpoint) {
      headers['user_key'] = this.apiKey;
      headers['key_type'] = '3scale';
    }

    try {
      const response = await axios.get(this.apiUrl, {
        params: { upc: barcode },
        headers,
        timeout: this.timeoutMs,
      });

      const data = response.data;
      if (!data || !Array.isArray(data.items) || data.items.length === 0) {
        return {
          found: false,
          source: this.name,
          providerName: 'UPCitemdb',
          errorType: 'PRODUCT_NOT_FOUND',
          statusCode: 404,
          message: 'Product not found in secondary provider',
        };
      }

      const item = data.items[0];
      const image = Array.isArray(item.images) && item.images.length > 0 ? item.images[0] : null;
      const categories = item.category
        ? item.category.split('>').map((c) => c.trim()).filter(Boolean)
        : [];

      return {
        found: true,
        source: this.name,
        providerName: 'UPCitemdb',
        data: {
          barcode,
          name: item.title?.trim() || 'Unknown Product',
          brand: item.brand?.trim() || null,
          image,
          description: item.description?.trim() || null,
          categories,
          ingredients: {
            text: null,
            tags: [],
          },
          allergens: [],
          traces: [],
          nutrition: {
            energyKcal: null,
            fat: null,
            saturatedFat: null,
            carbohydrates: null,
            sugars: null,
            fiber: null,
            proteins: null,
            sodium: null,
            salt: null,
          },
        },
      };
    } catch (error) {
      const status = error.response?.status;

      if (status === 404) {
        return {
          found: false,
          source: this.name,
          providerName: 'UPCitemdb',
          errorType: 'PRODUCT_NOT_FOUND',
          statusCode: 404,
          message: 'Product not found in secondary catalog',
        };
      }

      if (status === 429) {
        return {
          found: false,
          source: this.name,
          providerName: 'UPCitemdb',
          errorType: 'RATE_LIMITED',
          statusCode: 429,
          message: 'Secondary provider rate limit reached',
        };
      }

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
          found: false,
          source: this.name,
          providerName: 'UPCitemdb',
          errorType: 'TIMEOUT',
          statusCode: 504,
          message: 'Secondary provider request timed out',
        };
      }

      return {
        found: false,
        source: this.name,
        providerName: 'UPCitemdb',
        errorType: 'PROVIDER_UNAVAILABLE',
        statusCode: status || 502,
        message: 'Secondary provider temporarily unavailable',
      };
    }
  }
}

export const defaultUpcitemdbProvider = new UpcitemdbProvider();
