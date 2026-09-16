import axios from 'axios';
import { ApiError } from '../utils/ApiError.js';
import {
  normalizeBarcode,
  validateBarcode,
  validateGtinChecksum,
  verifyBarcode,
  calculateGtinCheckDigit,
  detectBarcodeFormat,
} from '../utils/barcodeValidator.js';
import {
  MultiSourceProductResolver,
  normalizeOpenFoodFactsProduct,
  normalizeSecondaryProduct,
  normalizeUsdaProduct,
} from './productResolver.js';

export {
  normalizeBarcode,
  validateBarcode,
  validateGtinChecksum,
  verifyBarcode,
  calculateGtinCheckDigit,
  detectBarcodeFormat,
  MultiSourceProductResolver,
  normalizeOpenFoodFactsProduct,
  normalizeSecondaryProduct,
  normalizeUsdaProduct,
};

export const normalizeProductData = (rawProduct, barcode) => {
  if (!rawProduct) return null;

  const getCleanText = (val) => (typeof val === 'string' && val.trim() ? val.trim() : null);

  const allergensTags = Array.isArray(rawProduct.allergens_tags) ? rawProduct.allergens_tags : [];
  const normalizedAllergens = allergensTags.map((tag) => {
    // e.g. "en:milk" -> "milk"
    const parts = tag.split(':');
    return parts.length > 1 ? parts[1].trim() : tag.trim();
  }).filter(Boolean);

  const tracesTags = Array.isArray(rawProduct.traces_tags) ? rawProduct.traces_tags : [];
  const normalizedTraces = tracesTags.map((tag) => {
    const parts = tag.split(':');
    return parts.length > 1 ? parts[1].trim() : tag.trim();
  }).filter(Boolean);

  const categoriesTags = Array.isArray(rawProduct.categories_tags) ? rawProduct.categories_tags : [];
  const normalizedCategories = categoriesTags.map((cat) => {
    const parts = cat.split(':');
    return parts.length > 1 ? parts[1].trim() : cat.trim();
  }).filter(Boolean);

  const labelsTags = Array.isArray(rawProduct.labels_tags) ? rawProduct.labels_tags : [];
  const normalizedLabels = labelsTags.map((l) => {
    const parts = l.split(':');
    return parts.length > 1 ? parts[1].trim() : l.trim();
  }).filter(Boolean);

  const nutriments = rawProduct.nutriments || {};

  const getNutrient = (key) => {
    const val = nutriments[key];
    return typeof val === 'number' && !isNaN(val) ? val : null;
  };

  return {
    barcode: String(barcode),
    name: getCleanText(rawProduct.product_name) || getCleanText(rawProduct.product_name_en) || 'Unknown Product',
    brand: getCleanText(rawProduct.brands) || 'Unknown Brand',
    image: getCleanText(rawProduct.image_url) || getCleanText(rawProduct.image_front_url) || null,
    quantity: getCleanText(rawProduct.quantity) || null,
    servingSize: getCleanText(rawProduct.serving_size) || null,
    categories: normalizedCategories,
    ingredients: {
      text: getCleanText(rawProduct.ingredients_text) || getCleanText(rawProduct.ingredients_text_en) || null,
      tags: Array.isArray(rawProduct.ingredients_tags) ? rawProduct.ingredients_tags : [],
    },
    allergens: normalizedAllergens,
    traces: normalizedTraces,
    nutrition: {
      energyKcal: getNutrient('energy-kcal_100g') ?? getNutrient('energy-kcal') ?? getNutrient('energy_100g'),
      fat: getNutrient('fat_100g') ?? getNutrient('fat'),
      saturatedFat: getNutrient('saturated-fat_100g') ?? getNutrient('saturated_fat'),
      carbohydrates: getNutrient('carbohydrates_100g') ?? getNutrient('carbohydrates'),
      sugars: getNutrient('sugars_100g') ?? getNutrient('sugars'),
      fiber: getNutrient('fiber_100g') ?? getNutrient('fiber'),
      proteins: getNutrient('proteins_100g') ?? getNutrient('proteins'),
      salt: getNutrient('salt_100g') ?? getNutrient('salt'),
      sodium: getNutrient('sodium_100g') ?? getNutrient('sodium'),
    },
    nutriscore: getCleanText(rawProduct.nutriscore_grade)?.toUpperCase() || null,
    novaGroup: typeof rawProduct.nova_group === 'number' ? rawProduct.nova_group : null,
    labels: normalizedLabels,
    countries: Array.isArray(rawProduct.countries_tags) ? rawProduct.countries_tags : [],
    packaging: getCleanText(rawProduct.packaging) ? [rawProduct.packaging] : [],
    source: 'openfoodfacts',
    sourceUrl: `https://world.openfoodfacts.org/product/${barcode}`,
    lastUpdated: rawProduct.last_modified_t ? new Date(rawProduct.last_modified_t * 1000).toISOString() : null,
  };
};

export const sanitizeSearchQuery = (query) => {
  if (typeof query !== 'string') return '';
  return query.trim().replace(/\s+/g, ' ');
};

export const searchProductsFromAPI = async (query, page = 1, pageSize = 20) => {
  const sanitizedQuery = sanitizeSearchQuery(query);

  if (!sanitizedQuery || sanitizedQuery.length < 2) {
    throw new ApiError(400, 'Search query must be at least 2 characters long');
  }

  if (sanitizedQuery.length > 100) {
    throw new ApiError(400, 'Search query cannot exceed 100 characters');
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const pageSizeNum = Math.min(50, Math.max(1, parseInt(pageSize, 10) || 20));

  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(sanitizedQuery)}&search_simple=1&action=process&json=1&page=${pageNum}&page_size=${pageSizeNum}`;

  try {
    const response = await axios.get(url, {
      timeout: 8000,
      headers: {
        'User-Agent': 'FoodLensAI/1.0 (Contact: support@foodlens.ai)',
      },
    });

    const data = response.data || {};
    const rawProducts = Array.isArray(data.products) ? data.products : [];

    const normalizedItems = rawProducts
      .map((p) => {
        const code = p.code || p.id || p._id || p.barcode;
        if (!code) return null;
        return normalizeProductData(p, code);
      })
      .filter(Boolean);

    const totalCount = typeof data.count === 'number' ? data.count : (typeof data.total === 'number' ? data.total : null);
    const hasNextPage = totalCount !== null ? (pageNum * pageSizeNum < totalCount) : (normalizedItems.length === pageSizeNum);

    return {
      items: normalizedItems,
      pagination: {
        page: pageNum,
        pageSize: pageSizeNum,
        total: totalCount,
        hasNextPage: Boolean(hasNextPage),
      },
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    if (error.response?.status === 429) {
      throw new ApiError(429, 'Search rate limit exceeded on food database. Please try again in a moment.');
    }
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new ApiError(504, 'Search request timed out. Please try again.');
    }
    throw new ApiError(502, `Search service temporarily unavailable: ${error.message || 'Upstream error'}`);
  }
};

// In-memory cache for user-provided / manual fallback products (TTL: 2 hours)
const manualProductCache = new Map();
const MANUAL_CACHE_TTL_MS = 2 * 60 * 60 * 1000;

export const saveManualProductData = ({
  barcode,
  name,
  brand,
  image,
  quantity,
  servingSize,
  categories = [],
  ingredientsText = '',
  allergens = [],
  traces = [],
  nutrition = {},
}) => {
  const normalizedBarcode = normalizeBarcode(barcode);
  if (!validateBarcode(normalizedBarcode)) {
    throw new ApiError(400, 'Invalid barcode format', { errorType: 'INVALID_BARCODE', barcode });
  }

  const cleanText = (val) => (typeof val === 'string' && val.trim() ? val.trim() : null);
  const cleanNumber = (val) => {
    if (val === null || val === undefined || val === '') return null;
    const num = Number(val);
    return !isNaN(num) && num >= 0 ? num : null;
  };

  const normalizedCategories = Array.isArray(categories)
    ? categories.map(c => String(c).trim().toLowerCase()).filter(Boolean)
    : [];
  const normalizedAllergens = Array.isArray(allergens)
    ? allergens.map(a => String(a).trim().toLowerCase()).filter(Boolean)
    : [];
  const normalizedTraces = Array.isArray(traces)
    ? traces.map(t => String(t).trim().toLowerCase()).filter(Boolean)
    : [];

  const manualProduct = {
    barcode: normalizedBarcode,
    name: cleanText(name) || 'User-Submitted Product',
    brand: cleanText(brand) || 'Unspecified Brand',
    image: cleanText(image) || null,
    quantity: cleanText(quantity) || null,
    servingSize: cleanText(servingSize) || null,
    categories: normalizedCategories,
    ingredients: {
      text: cleanText(ingredientsText) || null,
      tags: [],
    },
    allergens: normalizedAllergens,
    traces: normalizedTraces,
    nutrition: {
      energyKcal: cleanNumber(nutrition.energyKcal),
      fat: cleanNumber(nutrition.fat),
      saturatedFat: cleanNumber(nutrition.saturatedFat),
      carbohydrates: cleanNumber(nutrition.carbohydrates),
      sugars: cleanNumber(nutrition.sugars),
      fiber: cleanNumber(nutrition.fiber),
      proteins: cleanNumber(nutrition.proteins),
      salt: cleanNumber(nutrition.salt),
      sodium: cleanNumber(nutrition.sodium),
    },
    nutriscore: null,
    novaGroup: null,
    labels: ['user-provided'],
    countries: [],
    packaging: [],
    source: 'user-provided',
    isUserProvided: true,
    sourceUrl: null,
    lastUpdated: new Date().toISOString(),
  };

  manualProductCache.set(normalizedBarcode, {
    product: manualProduct,
    expiresAt: Date.now() + MANUAL_CACHE_TTL_MS,
  });

  return manualProduct;
};

// Central Multi-Source Product Resolver instance with manual cache integration
export const productResolver = new MultiSourceProductResolver({
  manualCache: manualProductCache,
});

export const resolveBarcode = async (barcode, options = {}) => {
  return await productResolver.resolveBarcode(barcode, options);
};

export const fetchProductByBarcode = async (barcode, options = {}) => {
  return await productResolver.resolveBarcode(barcode, options);
};


