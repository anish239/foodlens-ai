import axios from 'axios';

/**
 * Open Food Facts Provider (Primary Food Data Source)
 */
export class OpenFoodFactsProvider {
  constructor(options = {}) {
    this.name = 'openfoodfacts';
    this.baseUrl = options.baseUrl || process.env.OPEN_FOOD_FACTS_BASE_URL || 'https://world.openfoodfacts.org/api/v2';
    this.timeoutMs = options.timeoutMs || 7000;
  }

  /**
   * Fetches raw product from Open Food Facts API by barcode.
   * Never throws uncaught network errors to the caller; returns standardized result object.
   *
   * @param {string} barcode
   * @returns {Promise<{ found: boolean, source: string, raw?: Object, errorType?: string, statusCode?: number }>}
   */
  async getByBarcode(barcode) {
    const cleanBarcode = String(barcode).trim();
    const url = `${this.baseUrl}/product/${cleanBarcode}.json`;

    try {
      const response = await axios.get(url, {
        timeout: this.timeoutMs,
        headers: {
          'User-Agent': 'FoodLensAI/1.0 (Contact: support@foodlens.ai)',
          Accept: 'application/json',
        },
      });

      const data = response.data;

      if (!data || data.status === 0 || !data.product) {
        return {
          found: false,
          source: this.name,
          errorType: 'PRODUCT_NOT_FOUND',
          statusCode: 404,
          message: 'Product not found in Open Food Facts',
        };
      }

      const product = data.product;
      const nutriments = product.nutriments || {};
      const hasNutrition = Boolean(
        nutriments['energy-kcal_100g'] !== undefined ||
        nutriments['energy_100g'] !== undefined ||
        nutriments['proteins_100g'] !== undefined ||
        nutriments['carbohydrates_100g'] !== undefined ||
        nutriments['fat_100g'] !== undefined
      );

      const hasIngredients = Boolean(
        product.ingredients_text ||
        product.ingredients_text_en ||
        (Array.isArray(product.ingredients) && product.ingredients.length > 0)
      );

      return {
        found: true,
        source: this.name,
        raw: product,
        hasNutrition,
        hasIngredients,
        sourceUrl: `https://world.openfoodfacts.org/product/${cleanBarcode}`,
      };
    } catch (error) {
      if (error.response?.status === 404) {
        return {
          found: false,
          source: this.name,
          errorType: 'PRODUCT_NOT_FOUND',
          statusCode: 404,
          message: 'Product not cataloged in Open Food Facts',
        };
      }

      if (error.response?.status === 429) {
        return {
          found: false,
          source: this.name,
          errorType: 'RATE_LIMITED',
          statusCode: 429,
          message: 'Open Food Facts rate limit reached',
        };
      }

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        return {
          found: false,
          source: this.name,
          errorType: 'TIMEOUT',
          statusCode: 504,
          message: 'Open Food Facts request timed out',
        };
      }

      return {
        found: false,
        source: this.name,
        errorType: 'UPSTREAM_ERROR',
        statusCode: error.response?.status || 502,
        message: error.message || 'Open Food Facts upstream error',
      };
    }
  }
}

export const defaultOpenFoodFactsProvider = new OpenFoodFactsProvider();
