import axios from 'axios';

/**
 * USDA FoodData Central Nutrition Provider & Enricher (Phase 12)
 * Endpoints:
 *   GET /foods/search?api_key=...&query=...
 *   GET /food/{fdcId}?api_key=...
 * Enforces conservative confidence matching, unit normalization, and zero fabrication.
 */
export class UsdaProvider {
  constructor(options = {}) {
    this.name = 'usda_fooddata_central';
    this.baseUrl =
      options.baseUrl ||
      process.env.USDA_API_BASE_URL ||
      'https://api.nal.usda.gov/fdc/v1';
    this.apiKey = options.apiKey || process.env.USDA_API_KEY || null;
    this.timeoutMs = options.timeoutMs || 6000;

    // In-memory cache (TTL: 15 minutes)
    this.cache = new Map();
    this.cacheTtlMs = options.cacheTtlMs || 15 * 60 * 1000;

    // In-flight request deduplication map
    this.pendingRequests = new Map();

    // Mock registry for test suites and offline verification
    this.customRegistry = new Map();
  }

  /**
   * Register custom food mock for testing
   */
  registerFood(key, foodData) {
    if (key && foodData) {
      this.customRegistry.set(String(key).trim().toLowerCase(), foodData);
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
   * Checks if USDA API key is configured
   */
  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim() && this.apiKey !== 'DEMO_KEY');
  }

  /**
   * Extracts canonical FoodLens nutrient values from USDA nutrient list.
   * Enforces explicit unit conversion:
   *   - Sodium stored in grams per 100g (USDA provides mg -> / 1000)
   *   - Energy in kcal
   *
   * @param {Array} foodNutrients - Array of USDA nutrient objects
   * @returns {Object} Canonical nutrition values
   */
  extractNutrients(foodNutrients = []) {
    if (!Array.isArray(foodNutrients)) return {};

    const findVal = (names) => {
      const match = foodNutrients.find((n) => {
        const nName = (n.nutrientName || n.name || '').toLowerCase();
        return names.some(
          (target) => nName === target.toLowerCase() || nName.includes(target.toLowerCase())
        );
      });
      if (!match) return null;
      const num = Number(match.value ?? match.amount);
      return !isNaN(num) && num >= 0 ? num : null;
    };

    // 1. Energy (kcal)
    let energyKcal = findVal([
      'Energy',
      'Energy (Atwater General Factors)',
      'Energy (Atwater Specific Factors)',
    ]);

    // 2. Fat (g)
    const fat = findVal(['Total lipid (fat)', 'Total Fat']);

    // 3. Saturated Fat (g)
    const saturatedFat = findVal(['Fatty acids, total saturated', 'Saturated Fat']);

    // 4. Carbs (g)
    const carbohydrates = findVal(['Carbohydrate, by difference', 'Total Carbohydrate']);

    // 5. Sugars (g)
    const sugars = findVal(['Sugars, total including NLEA', 'Total Sugars', 'Sugars, total']);

    // 6. Fiber (g)
    const fiber = findVal(['Fiber, total dietary', 'Dietary Fiber']);

    // 7. Protein (g)
    const proteins = findVal(['Protein']);

    // 8. Sodium (g per 100g)
    // USDA returns Sodium in milligrams (MG). Convert to grams.
    const rawSodiumMg = findVal(['Sodium, Na', 'Sodium']);
    let sodium = null;
    let salt = null;
    if (rawSodiumMg !== null) {
      sodium = Number((rawSodiumMg / 1000).toFixed(4));
      salt = Number((sodium * 2.5).toFixed(4));
    }

    return {
      energyKcal,
      fat,
      saturatedFat,
      carbohydrates,
      sugars,
      fiber,
      proteins,
      sodium,
      salt,
    };
  }

  /**
   * Calculates conservative matching confidence score (0.0 to 1.0)
   *
   * @param {Object} candidateFood - Food candidate from USDA
   * @param {string} targetBarcode - Target barcode if known
   * @param {string} targetName - Target product name
   * @param {string} targetBrand - Target brand name
   * @returns {number} Confidence score
   */
  calculateMatchConfidence(candidateFood, targetBarcode, targetName, targetBrand) {
    if (!candidateFood) return 0;

    // 1. Exact UPC / GTIN match -> strongest (1.0)
    const candidateGtin = candidateFood.gtinUpc ? String(candidateFood.gtinUpc).trim() : null;
    if (targetBarcode && candidateGtin) {
      const cleanTarget = String(targetBarcode).trim();
      if (candidateGtin === cleanTarget || candidateGtin.endsWith(cleanTarget) || cleanTarget.endsWith(candidateGtin)) {
        return 1.0;
      }
    }

    const desc = (candidateFood.description || '').toLowerCase().trim();
    const cleanName = (targetName || '').toLowerCase().trim();
    const cleanBrand = (targetBrand || '').toLowerCase().trim();
    const candidateBrand = (candidateFood.brandOwner || candidateFood.brandName || '').toLowerCase().trim();

    // 2. Exact normalized name match -> strong (0.85)
    if (cleanName && desc === cleanName) {
      return 0.85;
    }

    // 3. Brand match + Strong name match -> strong (0.80)
    const brandMatches = cleanBrand && candidateBrand && (candidateBrand.includes(cleanBrand) || cleanBrand.includes(candidateBrand));
    if (brandMatches && cleanName && (desc.includes(cleanName) || cleanName.includes(desc))) {
      return 0.80;
    }

    // 4. Name substring match without brand -> moderate (0.50)
    if (cleanName && desc.includes(cleanName)) {
      return 0.50;
    }

    // 5. Weak keyword overlap -> insufficient (<0.50)
    return 0.30;
  }

  /**
   * Search USDA FoodData Central for food items.
   *
   * @param {string} query
   * @param {Object} [options]
   * @returns {Promise<{ found: boolean, foods: Array, confidence: number }>}
   */
  async searchNutrition(query, options = {}) {
    const cleanQuery = String(query || '').trim();
    const barcode = options.barcode ? String(options.barcode).trim() : null;
    const targetBrand = options.brand ? String(options.brand).trim() : null;

    const searchKey = barcode || cleanQuery;
    const cacheKey = `search:${searchKey.toLowerCase()}`;

    // 1. Check cache
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return { ...cached.result, cached: true };
    }

    // 2. Check custom registry
    const regKey = (barcode || cleanQuery).toLowerCase();
    if (this.customRegistry.has(regKey)) {
      const customFood = this.customRegistry.get(regKey);
      const res = {
        found: true,
        food: customFood,
        confidence: 1.0,
        fdcId: customFood.fdcId || 1001,
      };
      this.cache.set(cacheKey, {
        result: res,
        expiresAt: Date.now() + this.cacheTtlMs,
      });
      return res;
    }

    // 3. If no API key configured, return gracefully without failing product resolution
    const apiKey = this.apiKey || process.env.USDA_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      return {
        found: false,
        food: null,
        confidence: 0,
        reason: 'NUTRITION_UNAVAILABLE',
        message: 'USDA_API_KEY is not configured',
      };
    }

    // 4. Request deduplication
    if (this.pendingRequests.has(cacheKey)) {
      return await this.pendingRequests.get(cacheKey);
    }

    const searchPromise = this._executeSearch(searchKey, apiKey, barcode, cleanQuery, targetBrand);
    this.pendingRequests.set(cacheKey, searchPromise);

    try {
      const result = await searchPromise;
      if (result.found) {
        this.cache.set(cacheKey, {
          result,
          expiresAt: Date.now() + this.cacheTtlMs,
        });
      }
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  /**
   * Fetch food details by FDC ID
   *
   * @param {string|number} fdcId
   * @returns {Promise<Object|null>}
   */
  async getFoodDetails(fdcId) {
    if (!fdcId) return null;
    const apiKey = this.apiKey || process.env.USDA_API_KEY;
    if (!apiKey) return null;

    const cacheKey = `details:${fdcId}`;
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    try {
      const response = await axios.get(`${this.baseUrl}/food/${fdcId}`, {
        params: { api_key: apiKey },
        timeout: this.timeoutMs,
      });

      const data = response.data;
      if (data) {
        this.cache.set(cacheKey, {
          data,
          expiresAt: Date.now() + this.cacheTtlMs,
        });
      }
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Search food executor with conservative confidence evaluation
   */
  async _executeSearch(searchKey, apiKey, barcode, targetName, targetBrand) {
    try {
      const response = await axios.get(`${this.baseUrl}/foods/search`, {
        params: {
          api_key: apiKey,
          query: searchKey,
          pageSize: 3,
          dataType: 'Branded,Foundation,SR Legacy',
        },
        timeout: this.timeoutMs,
      });

      const data = response.data;
      if (!data || !Array.isArray(data.foods) || data.foods.length === 0) {
        return {
          found: false,
          food: null,
          confidence: 0,
          reason: 'NO_MATCH',
        };
      }

      // Evaluate candidate confidence scores conservatively
      const candidates = data.foods.map((food) => ({
        food,
        confidence: this.calculateMatchConfidence(food, barcode, targetName, targetBrand),
      }));

      // Sort by highest confidence
      candidates.sort((a, b) => b.confidence - a.confidence);
      const best = candidates[0];

      // Conservative threshold: Must have confidence >= 0.70 to enrich
      if (best.confidence < 0.70) {
        return {
          found: false,
          food: null,
          confidence: best.confidence,
          reason: 'INSUFFICIENT_CONFIDENCE',
          message: `Match confidence ${best.confidence.toFixed(2)} is below safe threshold 0.70`,
        };
      }

      return {
        found: true,
        food: best.food,
        confidence: best.confidence,
        fdcId: best.food.fdcId || null,
      };
    } catch (error) {
      const status = error.response?.status;
      return {
        found: false,
        food: null,
        confidence: 0,
        reason: status === 429 ? 'RATE_LIMITED' : 'PROVIDER_UNAVAILABLE',
        statusCode: status || 502,
      };
    }
  }

  /**
   * Enriches a canonical product's missing nutrition/ingredients without fabricating facts.
   *
   * @param {Object} product - Canonical FoodLens product
   * @returns {Promise<{ enriched: boolean, nutrientsEnriched: string[], ingredientsEnriched: boolean, source?: string, confidence?: number }>}
   */
  async enrichProduct(product) {
    if (!product) {
      return { enriched: false, nutrientsEnriched: [], ingredientsEnriched: false };
    }

    const nutrition = product.nutrition || {};
    const missingNutrients = [
      'energyKcal',
      'fat',
      'saturatedFat',
      'carbohydrates',
      'sugars',
      'fiber',
      'proteins',
      'sodium',
    ].filter((k) => nutrition[k] === null || nutrition[k] === undefined);

    const missingIngredients = !product.ingredients?.text;

    // If nutrition and ingredients are already complete, enrichment is not needed
    if (missingNutrients.length === 0 && !missingIngredients) {
      return { enriched: false, nutrientsEnriched: [], ingredientsEnriched: false };
    }

    const searchQuery =
      product.name && product.name !== 'Unknown Product'
        ? `${product.brand || ''} ${product.name}`.trim()
        : null;

    const searchResult = await this.searchNutrition(searchQuery || product.barcode, {
      barcode: product.barcode,
      brand: product.brand,
    });

    if (!searchResult.found || !searchResult.food) {
      return {
        enriched: false,
        nutrientsEnriched: [],
        ingredientsEnriched: false,
        reason: searchResult.reason || 'NUTRITION_UNAVAILABLE',
      };
    }

    const usdaFood = searchResult.food;
    const usdaNutrients = this.extractNutrients(usdaFood.foodNutrients || []);
    const enrichedKeys = [];

    // Enrich only fields that are missing in the original product
    for (const key of missingNutrients) {
      if (usdaNutrients[key] !== null && usdaNutrients[key] !== undefined) {
        nutrition[key] = usdaNutrients[key];
        enrichedKeys.push(key);
      }
    }

    if (
      usdaNutrients.salt !== null &&
      (nutrition.salt === null || nutrition.salt === undefined)
    ) {
      nutrition.salt = usdaNutrients.salt;
    }

    let ingredientsEnriched = false;
    if (missingIngredients && usdaFood.ingredients) {
      product.ingredients = product.ingredients || { text: null, tags: [] };
      product.ingredients.text = usdaFood.ingredients.trim();
      ingredientsEnriched = true;
    }

    const hasEnrichedAnything = enrichedKeys.length > 0 || ingredientsEnriched;

    return {
      enriched: hasEnrichedAnything,
      nutrientsEnriched: enrichedKeys,
      ingredientsEnriched,
      source: this.name,
      fdcId: usdaFood.fdcId || null,
      confidence: searchResult.confidence,
    };
  }
}

export const defaultUsdaProvider = new UsdaProvider();
