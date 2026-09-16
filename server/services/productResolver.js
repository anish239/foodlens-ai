import { ApiError } from '../utils/ApiError.js';
import {
  normalizeBarcode,
  validateBarcode,
  calculateGtinCheckDigit,
} from '../utils/barcodeUtils.js';
import { defaultOpenFoodFactsProvider } from './productProviders/openFoodFactsProvider.js';
import { defaultUpcitemdbProvider } from './productProviders/upcitemdbProvider.js';
import { defaultUsdaProvider } from './productProviders/usdaProvider.js';

/**
 * Normalizes any raw product from Open Food Facts into canonical FoodLens product shape.
 * Preserves truthfulness: missing values remain strictly null or empty arrays.
 */
export const normalizeOpenFoodFactsProduct = (rawProduct, barcode) => {
  if (!rawProduct) return null;

  const getCleanText = (val) => (typeof val === 'string' && val.trim() ? val.trim() : null);

  const allergensTags = Array.isArray(rawProduct.allergens_tags) ? rawProduct.allergens_tags : [];
  const normalizedAllergens = allergensTags
    .map((tag) => {
      const parts = tag.split(':');
      return parts.length > 1 ? parts[1].trim() : tag.trim();
    })
    .filter(Boolean);

  const tracesTags = Array.isArray(rawProduct.traces_tags) ? rawProduct.traces_tags : [];
  const normalizedTraces = tracesTags
    .map((tag) => {
      const parts = tag.split(':');
      return parts.length > 1 ? parts[1].trim() : tag.trim();
    })
    .filter(Boolean);

  const categoriesTags = Array.isArray(rawProduct.categories_tags) ? rawProduct.categories_tags : [];
  const normalizedCategories = categoriesTags
    .map((cat) => {
      const parts = cat.split(':');
      return parts.length > 1 ? parts[1].trim() : cat.trim();
    })
    .filter(Boolean);

  const labelsTags = Array.isArray(rawProduct.labels_tags) ? rawProduct.labels_tags : [];
  const normalizedLabels = labelsTags
    .map((l) => {
      const parts = l.split(':');
      return parts.length > 1 ? parts[1].trim() : l.trim();
    })
    .filter(Boolean);

  const nutriments = rawProduct.nutriments || {};
  const getNutrient = (key) => {
    const val = nutriments[key];
    return typeof val === 'number' && !isNaN(val) ? val : null;
  };

  const nutrition = {
    energyKcal: getNutrient('energy-kcal_100g') ?? getNutrient('energy-kcal') ?? getNutrient('energy_100g'),
    fat: getNutrient('fat_100g') ?? getNutrient('fat'),
    saturatedFat: getNutrient('saturated-fat_100g') ?? getNutrient('saturated_fat'),
    carbohydrates: getNutrient('carbohydrates_100g') ?? getNutrient('carbohydrates'),
    sugars: getNutrient('sugars_100g') ?? getNutrient('sugars'),
    fiber: getNutrient('fiber_100g') ?? getNutrient('fiber'),
    proteins: getNutrient('proteins_100g') ?? getNutrient('proteins'),
    salt: getNutrient('salt_100g') ?? getNutrient('salt'),
    sodium: getNutrient('sodium_100g') ?? getNutrient('sodium'),
  };

  const ingredientsText =
    getCleanText(rawProduct.ingredients_text) ||
    getCleanText(rawProduct.ingredients_text_en) ||
    null;

  return {
    barcode: String(barcode),
    name: getCleanText(rawProduct.product_name) || getCleanText(rawProduct.product_name_en) || 'Unknown Product',
    brand: getCleanText(rawProduct.brands) || 'Unknown Brand',
    image: getCleanText(rawProduct.image_url) || getCleanText(rawProduct.image_front_url) || null,
    quantity: getCleanText(rawProduct.quantity) || null,
    servingSize: getCleanText(rawProduct.serving_size) || null,
    categories: normalizedCategories,
    ingredients: {
      text: ingredientsText,
      tags: Array.isArray(rawProduct.ingredients_tags) ? rawProduct.ingredients_tags : [],
    },
    allergens: normalizedAllergens,
    traces: normalizedTraces,
    nutrition,
    nutriscore: getCleanText(rawProduct.nutriscore_grade)?.toUpperCase() || null,
    nutriScore: getCleanText(rawProduct.nutriscore_grade)?.toUpperCase() || null,
    novaGroup: typeof rawProduct.nova_group === 'number' ? rawProduct.nova_group : null,
    labels: normalizedLabels,
    countries: Array.isArray(rawProduct.countries_tags) ? rawProduct.countries_tags : [],
    packaging: getCleanText(rawProduct.packaging) ? [rawProduct.packaging] : [],
    source: 'openfoodfacts',
    sources: {
      identity: 'open_food_facts',
    },
    sourceUrl: `https://world.openfoodfacts.org/product/${barcode}`,
    lastUpdated: rawProduct.last_modified_t ? new Date(rawProduct.last_modified_t * 1000).toISOString() : null,
  };
};

/**
 * Normalizes UPCitemdb data into standard FoodLens canonical product shape.
 */
export const normalizeSecondaryProduct = (secondaryItem, barcode) => {
  if (!secondaryItem) return null;

  const getCleanText = (val) => (typeof val === 'string' && val.trim() ? val.trim() : null);
  const cleanNumber = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const num = Number(val);
    return !isNaN(num) && num >= 0 ? num : null;
  };

  const rawNutrition = secondaryItem.nutrition || {};

  return {
    barcode: String(barcode),
    name: getCleanText(secondaryItem.name) || getCleanText(secondaryItem.title) || 'Unknown Product',
    brand: getCleanText(secondaryItem.brand) || 'Unknown Brand',
    image: getCleanText(secondaryItem.image) || null,
    quantity: getCleanText(secondaryItem.quantity) || null,
    servingSize: getCleanText(secondaryItem.servingSize) || null,
    categories: Array.isArray(secondaryItem.categories)
      ? secondaryItem.categories.map((c) => String(c).trim()).filter(Boolean)
      : [],
    ingredients: {
      text: getCleanText(secondaryItem.ingredientsText) || getCleanText(secondaryItem.ingredients?.text) || null,
      tags: [],
    },
    allergens: Array.isArray(secondaryItem.allergens)
      ? secondaryItem.allergens.map((a) => String(a).trim().toLowerCase()).filter(Boolean)
      : [],
    traces: Array.isArray(secondaryItem.traces)
      ? secondaryItem.traces.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
      : [],
    nutrition: {
      energyKcal: cleanNumber(rawNutrition.energyKcal),
      fat: cleanNumber(rawNutrition.fat),
      saturatedFat: cleanNumber(rawNutrition.saturatedFat),
      carbohydrates: cleanNumber(rawNutrition.carbohydrates),
      sugars: cleanNumber(rawNutrition.sugars),
      fiber: cleanNumber(rawNutrition.fiber),
      proteins: cleanNumber(rawNutrition.proteins),
      salt: cleanNumber(rawNutrition.salt),
      sodium: cleanNumber(rawNutrition.sodium),
    },
    nutriscore: null,
    nutriScore: null,
    novaGroup: null,
    labels: ['secondary-source'],
    countries: [],
    packaging: [],
    source: 'secondary',
    sources: {
      identity: 'upcitemdb',
    },
    sourceUrl: null,
    lastUpdated: new Date().toISOString(),
  };
};

/**
 * Normalizes USDA FoodData Central food item into standard FoodLens canonical shape.
 */
export const normalizeUsdaProduct = (usdaFood, barcode, enricher) => {
  if (!usdaFood) return null;

  const nutrients = enricher.extractNutrients(usdaFood.foodNutrients || []);
  const cleanBrand = usdaFood.brandOwner || usdaFood.brandName || 'Unknown Brand';
  const cleanCategory = usdaFood.brandedFoodCategory ? [usdaFood.brandedFoodCategory.trim()] : [];

  return {
    barcode: String(barcode),
    name: usdaFood.description?.trim() || 'Unknown Product',
    brand: cleanBrand,
    image: null,
    quantity: usdaFood.packageWeight || null,
    servingSize: usdaFood.servingSize ? `${usdaFood.servingSize} ${usdaFood.servingSizeUnit || 'g'}` : null,
    categories: cleanCategory,
    ingredients: {
      text: usdaFood.ingredients ? usdaFood.ingredients.trim() : null,
      tags: [],
    },
    allergens: [],
    traces: [],
    nutrition: {
      energyKcal: nutrients.energyKcal,
      fat: nutrients.fat,
      saturatedFat: nutrients.saturatedFat,
      carbohydrates: nutrients.carbohydrates,
      sugars: nutrients.sugars,
      fiber: nutrients.fiber,
      proteins: nutrients.proteins,
      salt: nutrients.salt,
      sodium: nutrients.sodium,
    },
    nutriscore: null,
    nutriScore: null,
    novaGroup: null,
    labels: ['usda-fdc'],
    countries: ['United States'],
    packaging: [],
    source: 'usda_fooddata_central',
    sources: {
      identity: 'usda_fooddata_central',
      nutrition: 'usda_fooddata_central',
    },
    sourceUrl: `https://fdc.nal.usda.gov/fdc-app.html#/food-details/${usdaFood.fdcId}/nutrients`,
    lastUpdated: usdaFood.publicationDate ? new Date(usdaFood.publicationDate).toISOString() : new Date().toISOString(),
  };
};

/**
 * MultiSourceProductResolver (Phase 12)
 * Coordinates barcode normalization, GS1 checksum verification, deterministic provider fallback,
 * conservative USDA nutrition enrichment, in-memory deduplication & caching, and canonical output schema.
 */
export class MultiSourceProductResolver {
  constructor(options = {}) {
    this.offProvider = options.offProvider || defaultOpenFoodFactsProvider;
    this.secondaryProvider = options.secondaryProvider || defaultUpcitemdbProvider;
    this.nutritionEnricher = options.nutritionEnricher || defaultUsdaProvider;
    this.manualCache = options.manualCache || null;

    // Resolved product cache (TTL: 10 minutes)
    this.cache = new Map();
    this.cacheTtlMs = options.cacheTtlMs || 10 * 60 * 1000;

    // In-flight request deduplication map
    this.pendingResolutions = new Map();
  }

  /**
   * Helper to check if canonical nutrition has sufficient core values
   */
  hasCompleteNutrition(nutrition) {
    if (!nutrition) return false;
    const requiredKeys = ['energyKcal', 'fat', 'carbohydrates', 'proteins', 'sugars'];
    return requiredKeys.every((k) => nutrition[k] !== null && nutrition[k] !== undefined);
  }

  /**
   * Checks whether a product has partial information (missing nutrition or ingredients)
   */
  evaluatePartialStatus(product) {
    const hasNutri = this.hasCompleteNutrition(product.nutrition);
    const hasIngr = Boolean(product.ingredients?.text && product.ingredients.text.trim());

    const isPartial = !hasNutri || !hasIngr;
    return {
      isPartial,
      status: isPartial ? 'partial' : 'complete',
      missingFields: [
        ...(!hasNutri ? ['nutrition'] : []),
        ...(!hasIngr ? ['ingredients'] : []),
      ],
    };
  }

  /**
   * Resolves a barcode across all configured sources with strict validation,
   * deterministic fallback, and optional nutrition enrichment.
   *
   * @param {string} barcode - Raw barcode string
   * @param {Object} [options]
   * @param {boolean} [options.requireChecksum=true]
   * @param {boolean} [options.allowEnrichment=true]
   * @returns {Promise<Object>} Canonical FoodLens product object
   */
  async resolve(barcode, options = {}) {
    const normalizedBarcode = normalizeBarcode(barcode);
    const requireChecksum = options.requireChecksum !== false;

    // 1. Barcode Format and GS1 Checksum Validation
    const validation = validateBarcode(normalizedBarcode, { requireChecksum });
    if (!validation.valid) {
      if (validation.errorCode === 'INVALID_CHECKSUM') {
        const payload = normalizedBarcode.slice(0, -1);
        const expectedCheckDigit = calculateGtinCheckDigit(payload);
        const actualCheckDigit = validation.actualCheckDigit;
        const suggestedCorrection = expectedCheckDigit !== null ? `${payload}${expectedCheckDigit}` : null;

        throw new ApiError(
          400,
          `Barcode checksum verification failed. The calculated check digit is ${expectedCheckDigit}, but barcode ends with ${actualCheckDigit}.`,
          {
            errorType: 'CHECKSUM_FAILED',
            errorCode: 'INVALID_CHECKSUM',
            barcode: normalizedBarcode,
            actualCheckDigit,
            expectedCheckDigit,
            suggestedCorrection,
            message: 'This barcode appears invalid. Please check the barcode and try again.',
          }
        );
      }

      if (validation.errorCode === 'CONTAINS_LETTERS') {
        throw new ApiError(400, 'Barcode must contain numbers only.', {
          errorType: 'CONTAINS_LETTERS',
          errorCode: 'INVALID_BARCODE',
          barcode: normalizedBarcode,
          message: 'Barcode must contain numbers only.',
        });
      }

      if (validation.errorCode === 'INVALID_LENGTH') {
        throw new ApiError(
          400,
          `Barcode must be 8, 12, or 13 digits (current length: ${normalizedBarcode.length}).`,
          {
            errorType: 'INVALID_LENGTH',
            errorCode: 'INVALID_BARCODE',
            barcode: normalizedBarcode,
            message: 'Invalid barcode format. Expected 8, 12, or 13 digits.',
          }
        );
      }

      throw new ApiError(400, 'Invalid barcode format', {
        errorType: 'INVALID_BARCODE',
        errorCode: 'INVALID_BARCODE',
        barcode: normalizedBarcode,
      });
    }

    // 2. Check User-Provided / Manual Cache First
    if (this.manualCache && typeof this.manualCache.get === 'function') {
      const cachedManual = this.manualCache.get(normalizedBarcode);
      if (cachedManual && cachedManual.expiresAt > Date.now()) {
        const cachedProduct = { ...cachedManual.product };
        const partialMeta = this.evaluatePartialStatus(cachedProduct);
        cachedProduct.isPartial = partialMeta.isPartial;
        cachedProduct.status = partialMeta.status;
        cachedProduct.sources = { identity: 'user-provided' };
        cachedProduct.resolverMetadata = {
          resolvedBy: 'manual-cache',
          fallbackUsed: false,
          enrichmentApplied: false,
          sources: ['user-provided'],
          checkedAt: new Date().toISOString(),
        };
        return cachedProduct;
      }
    }

    // 3. Check In-Memory Resolution Cache
    const cachedResolution = this.cache.get(normalizedBarcode);
    if (cachedResolution && cachedResolution.expiresAt > Date.now()) {
      return cachedResolution.product;
    }

    // 4. In-Flight Request Deduplication
    if (this.pendingResolutions.has(normalizedBarcode)) {
      return await this.pendingResolutions.get(normalizedBarcode);
    }

    const resolutionPromise = this._executeResolution(normalizedBarcode, options);
    this.pendingResolutions.set(normalizedBarcode, resolutionPromise);

    try {
      const resolvedProduct = await resolutionPromise;
      this.cache.set(normalizedBarcode, {
        product: resolvedProduct,
        expiresAt: Date.now() + this.cacheTtlMs,
      });
      return resolvedProduct;
    } finally {
      this.pendingResolutions.delete(normalizedBarcode);
    }
  }

  /**
   * Main alias required by prompt: resolveBarcode(barcode, options)
   */
  async resolveBarcode(barcode, options = {}) {
    return this.resolve(barcode, options);
  }

  /**
   * Multi-provider resolution pipeline
   */
  async _executeResolution(normalizedBarcode, options) {
    const providersChecked = [];

    // Step A: Primary Provider - Open Food Facts
    providersChecked.push('openfoodfacts');
    const offResult = await this.offProvider.getByBarcode(normalizedBarcode);

    if (offResult.found && offResult.raw) {
      const canonicalProduct = normalizeOpenFoodFactsProduct(offResult.raw, normalizedBarcode);
      const sources = { identity: 'open_food_facts' };

      const hasOffNutrition = this.hasCompleteNutrition(canonicalProduct.nutrition);
      if (hasOffNutrition) {
        sources.nutrition = 'open_food_facts';
      }

      // If nutrition is incomplete or missing, attempt USDA enrichment
      if (options.allowEnrichment !== false && !hasOffNutrition) {
        const enrichmentResult = await this.nutritionEnricher.enrichProduct(canonicalProduct);
        if (enrichmentResult.enriched) {
          sources.nutrition = 'usda_fooddata_central';
        }
      }

      const partialStatus = this.evaluatePartialStatus(canonicalProduct);
      canonicalProduct.isPartial = partialStatus.isPartial;
      canonicalProduct.status = partialStatus.status;
      canonicalProduct.sources = sources;
      canonicalProduct.resolverMetadata = {
        resolvedBy: 'openfoodfacts',
        fallbackUsed: false,
        enrichmentApplied: Boolean(sources.nutrition === 'usda_fooddata_central'),
        sources: Object.values(sources),
        checkedAt: new Date().toISOString(),
      };

      return canonicalProduct;
    }

    // Step B: Secondary Fallback Provider - UPCitemdb / Secondary Provider
    providersChecked.push('secondary');
    const secondaryResult = typeof this.secondaryProvider.lookupBarcode === 'function'
      ? await this.secondaryProvider.lookupBarcode(normalizedBarcode)
      : await this.secondaryProvider.getByBarcode(normalizedBarcode);

    if (secondaryResult.found && secondaryResult.data) {
      const canonicalProduct = normalizeSecondaryProduct(secondaryResult.data, normalizedBarcode);
      const sources = { identity: 'upcitemdb' };

      // Secondary databases rarely have complete nutrition; attempt USDA enrichment
      if (options.allowEnrichment !== false) {
        const enrichmentResult = await this.nutritionEnricher.enrichProduct(canonicalProduct);
        if (enrichmentResult.enriched) {
          sources.nutrition = 'usda_fooddata_central';
        }
      }

      const partialStatus = this.evaluatePartialStatus(canonicalProduct);
      canonicalProduct.isPartial = partialStatus.isPartial;
      canonicalProduct.status = partialStatus.status;
      canonicalProduct.sources = sources;
      canonicalProduct.resolverMetadata = {
        resolvedBy: 'secondary',
        fallbackUsed: true,
        enrichmentApplied: Boolean(sources.nutrition === 'usda_fooddata_central'),
        sources: Object.values(sources),
        checkedAt: new Date().toISOString(),
      };

      return canonicalProduct;
    }

    // Step C: Direct USDA Lookup by Barcode
    providersChecked.push('usda_fooddata_central');
    let usdaFood = null;
    if (typeof this.nutritionEnricher.searchNutrition === 'function') {
      const usdaResult = await this.nutritionEnricher.searchNutrition(normalizedBarcode, {
        barcode: normalizedBarcode,
      });
      if (usdaResult.found && usdaResult.food) {
        usdaFood = usdaResult.food;
      }
    } else if (typeof this.nutritionEnricher.searchFood === 'function') {
      usdaFood = await this.nutritionEnricher.searchFood(null, normalizedBarcode);
    }

    if (usdaFood) {
      const canonicalProduct = normalizeUsdaProduct(usdaFood, normalizedBarcode, this.nutritionEnricher);
      const partialStatus = this.evaluatePartialStatus(canonicalProduct);
      canonicalProduct.isPartial = partialStatus.isPartial;
      canonicalProduct.status = partialStatus.status;
      canonicalProduct.sources = {
        identity: 'usda_fooddata_central',
        nutrition: 'usda_fooddata_central',
      };
      canonicalProduct.resolverMetadata = {
        resolvedBy: 'usda_fooddata_central',
        fallbackUsed: true,
        enrichmentApplied: false,
        sources: ['usda_fooddata_central'],
        checkedAt: new Date().toISOString(),
      };
      return canonicalProduct;
    }

    // Step D: All Providers Exhausted - Clean 404
    throw new ApiError(404, "We couldn't find this product in our available product databases.", {
      errorType: 'PRODUCT_NOT_FOUND',
      errorCode: 'PRODUCT_NOT_FOUND',
      barcode: normalizedBarcode,
      providersChecked,
      message: "We couldn't find this product in our available product databases.",
    });
  }
}

export const defaultProductResolver = new MultiSourceProductResolver();

/**
 * Top-level resolveBarcode function
 */
export const resolveBarcode = async (barcode, options = {}) => {
  return await defaultProductResolver.resolveBarcode(barcode, options);
};
