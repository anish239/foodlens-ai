import { UsdaProvider, defaultUsdaProvider } from './usdaProvider.js';

/**
 * USDA FoodData Central Nutrition Enricher
 * Backwards-compatible wrapper around UsdaProvider.
 */
export class UsdaNutritionEnricher extends UsdaProvider {
  constructor(options = {}) {
    super(options);
    this.name = 'usda_fooddata_central';
  }

  /**
   * Backwards-compatible searchFood alias
   */
  async searchFood(query, barcode) {
    const result = await this.searchNutrition(query, { barcode });
    return result.food || null;
  }
}

export const defaultUsdaNutritionEnricher = new UsdaNutritionEnricher();
export { UsdaProvider, defaultUsdaProvider };
