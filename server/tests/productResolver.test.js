import assert from 'node:assert/strict';
import {
  MultiSourceProductResolver,
  normalizeOpenFoodFactsProduct,
  normalizeSecondaryProduct,
  normalizeUsdaProduct,
} from '../services/productResolver.js';
import { OpenFoodFactsProvider } from '../services/productProviders/openFoodFactsProvider.js';
import { SecondaryProductProvider } from '../services/productProviders/secondaryProductProvider.js';
import { UsdaNutritionEnricher } from '../services/productProviders/usdaNutritionEnricher.js';
import { calculateFoodLensScore } from '../services/scoreService.js';
import { calculateCompatibility } from '../services/compatibilityService.js';
import { saveManualProductData, fetchProductByBarcode } from '../services/productService.js';
import { ApiError } from '../utils/ApiError.js';

console.log('Running FoodLens AI Phase 12 - Multi-Source Product Resolver Tests...\n');

// ----------------------------------------------------
// 1. Barcode Normalization & Checksum Validation (including 906097260049)
// ----------------------------------------------------
console.log('1. Testing Barcode Checksum & Explicit Handling of 906097260049...');

const resolver = new MultiSourceProductResolver();

// Test: 906097260049 has invalid checksum (expected 7, actual 9)
try {
  await resolver.resolve('906097260049');
  assert.fail('Should have rejected 906097260049 due to checksum verification failure');
} catch (error) {
  assert.equal(error instanceof ApiError, true, 'Error must be an ApiError');
  assert.equal(error.statusCode, 400, 'Checksum error must return HTTP 400');
  assert.equal(error.error?.errorType, 'CHECKSUM_FAILED');
  assert.equal(error.error?.actualCheckDigit, 9);
  assert.equal(error.error?.expectedCheckDigit, 7);
  assert.equal(error.error?.suggestedCorrection, '906097260047', 'Must suggest corrected barcode ending with 7');
}

// Test: Corrected barcode 906097260047 passes checksum validation
// (Fails with 404 since it does not exist in live databases, confirming checksum passed)
try {
  await resolver.resolve('906097260047');
} catch (error) {
  assert.equal(error.statusCode, 404, 'Valid checksum for nonexistent product must reach 404 lookup stage');
  assert.equal(error.error?.errorType, 'PRODUCT_NOT_FOUND');
  assert.deepEqual(error.error?.providersChecked, ['openfoodfacts', 'secondary', 'usda_fooddata_central']);
}

// Test: Invalid format / letters
try {
  await resolver.resolve('ABC123456789');
  assert.fail('Should have rejected alphabetic barcode');
} catch (error) {
  assert.equal(error.statusCode, 400);
  assert.equal(error.error?.errorType, 'CONTAINS_LETTERS');
}

console.log('✓ Checksum validation and explicit 906097260049 handling verified.');

// ----------------------------------------------------
// 2. Primary Provider (Open Food Facts) Resolution
// ----------------------------------------------------
console.log('2. Testing Primary Provider (Open Food Facts) Resolution...');

class MockOpenFoodFactsProvider extends OpenFoodFactsProvider {
  constructor(mockProduct) {
    super();
    this.mockProduct = mockProduct;
  }

  async getByBarcode(barcode) {
    if (this.mockProduct && this.mockProduct.barcode === barcode) {
      return {
        found: true,
        source: this.name,
        raw: {
          product_name: this.mockProduct.name,
          brands: this.mockProduct.brand,
          ingredients_text: this.mockProduct.ingredientsText,
          nutriments: this.mockProduct.nutriments,
          categories_tags: ['en:dairy', 'en:yogurt'],
          allergens_tags: ['en:milk'],
          traces_tags: [],
        },
        hasNutrition: true,
        hasIngredients: true,
      };
    }
    return {
      found: false,
      source: this.name,
      errorType: 'PRODUCT_NOT_FOUND',
      statusCode: 404,
    };
  }
}

const mockOffProduct = {
  barcode: '012345678905',
  name: 'Organic Greek Yogurt',
  brand: 'Greek Pure',
  ingredientsText: 'Cultured Pasteurized Nonfat Milk, Live and Active Cultures.',
  nutriments: {
    'energy-kcal_100g': 120,
    'proteins_100g': 15,
    'carbohydrates_100g': 6,
    'sugars_100g': 4,
    'fat_100g': 0,
    'saturated-fat_100g': 0,
    'sodium_100g': 0.05,
    'fiber_100g': 0,
  },
};

const offResolver = new MultiSourceProductResolver({
  offProvider: new MockOpenFoodFactsProvider(mockOffProduct),
});

const offResolved = await offResolver.resolve('012345678905');
assert.equal(offResolved.name, 'Organic Greek Yogurt');
assert.equal(offResolved.brand, 'Greek Pure');
assert.equal(offResolved.source, 'openfoodfacts');
assert.equal(offResolved.resolverMetadata.resolvedBy, 'openfoodfacts');
assert.equal(offResolved.resolverMetadata.fallbackUsed, false);
assert.equal(offResolved.resolverMetadata.enrichmentApplied, false);
assert.equal(offResolved.nutrition.proteins, 15);
assert.equal(offResolved.nutrition.sugars, 4);

console.log('✓ Primary provider resolution verified.');

// ----------------------------------------------------
// 3. Fallback to Secondary Provider (When OFF returns 404)
// ----------------------------------------------------
console.log('3. Testing Fallback to Secondary Provider...');

const mockSecondaryProvider = new SecondaryProductProvider();
mockSecondaryProvider.registerProduct('4006381333931', {
  name: 'Stabilo Point 88 Snack Bar',
  brand: 'Stabilo Foods',
  categories: ['Snacks', 'Energy Bars'],
  ingredientsText: 'Oats, honey, dried fruit, almond flour.',
  allergens: ['nuts'],
  nutrition: {
    energyKcal: 210,
    fat: 7,
    saturatedFat: 1.2,
    carbohydrates: 28,
    sugars: 12,
    fiber: 4,
    proteins: 6,
    sodium: 0.15,
  },
});

const secondaryFallbackResolver = new MultiSourceProductResolver({
  offProvider: new MockOpenFoodFactsProvider(null), // OFF fails to find it
  secondaryProvider: mockSecondaryProvider,
});

const secondaryResolved = await secondaryFallbackResolver.resolve('4006381333931');
assert.equal(secondaryResolved.name, 'Stabilo Point 88 Snack Bar');
assert.equal(secondaryResolved.brand, 'Stabilo Foods');
assert.equal(secondaryResolved.source, 'secondary');
assert.equal(secondaryResolved.resolverMetadata.resolvedBy, 'secondary');
assert.equal(secondaryResolved.resolverMetadata.fallbackUsed, true);
assert.equal(secondaryResolved.nutrition.energyKcal, 210);
assert.equal(secondaryResolved.nutrition.fiber, 4);

console.log('✓ Secondary provider fallback verified.');

// ----------------------------------------------------
// 4. Nutrition Enrichment via USDA FoodData Central
// ----------------------------------------------------
console.log('4. Testing Nutrition Enrichment via USDA FoodData Central...');

const mockUsdaEnricher = new UsdaNutritionEnricher();
mockUsdaEnricher.registerFood('73513537', {
  fdcId: 987654,
  description: 'Rustic Whole Grain Sourdough Loaf',
  brandOwner: 'Artisan Bakery',
  ingredients: 'Organic unbleached wheat flour, water, sourdough culture, sea salt.',
  foodNutrients: [
    { nutrientName: 'Energy', value: 240, unitName: 'KCAL' },
    { nutrientName: 'Total lipid (fat)', value: 1.5, unitName: 'G' },
    { nutrientName: 'Fatty acids, total saturated', value: 0.2, unitName: 'G' },
    { nutrientName: 'Carbohydrate, by difference', value: 48, unitName: 'G' },
    { nutrientName: 'Sugars, total including NLEA', value: 1, unitName: 'G' },
    { nutrientName: 'Fiber, total dietary', value: 3.5, unitName: 'G' },
    { nutrientName: 'Protein', value: 9, unitName: 'G' },
    { nutrientName: 'Sodium, Na', value: 450, unitName: 'MG' }, // 450mg = 0.45g
  ],
});

// Case: Secondary provider has name and brand but empty nutrition
const partialSecondaryProvider = new SecondaryProductProvider();
partialSecondaryProvider.registerProduct('73513537', {
  name: 'Rustic Whole Grain Sourdough Loaf',
  brand: 'Artisan Bakery',
  categories: ['Bakery', 'Bread'],
  ingredientsText: null, // missing ingredients
  nutrition: {}, // empty nutrition
});

const enrichedResolver = new MultiSourceProductResolver({
  offProvider: new MockOpenFoodFactsProvider(null),
  secondaryProvider: partialSecondaryProvider,
  nutritionEnricher: mockUsdaEnricher,
});

const enrichedProduct = await enrichedResolver.resolve('73513537');
assert.equal(enrichedProduct.name, 'Rustic Whole Grain Sourdough Loaf');
assert.equal(enrichedProduct.resolverMetadata.fallbackUsed, true);
assert.equal(enrichedProduct.resolverMetadata.enrichmentApplied, true);
assert.equal(enrichedProduct.resolverMetadata.sources.includes('usda_fooddata_central'), true);

// Check that nutrients were successfully enriched from USDA
assert.equal(enrichedProduct.nutrition.energyKcal, 240);
assert.equal(enrichedProduct.nutrition.proteins, 9);
assert.equal(enrichedProduct.nutrition.fiber, 3.5);
assert.equal(enrichedProduct.nutrition.sodium, 0.45); // converted from 450mg to 0.45g
assert.equal(enrichedProduct.ingredients.text.includes('sourdough culture'), true);

console.log('✓ USDA Nutrition enrichment verified.');

// ----------------------------------------------------
// 5. Direct USDA Lookup by GTIN
// ----------------------------------------------------
console.log('5. Testing Direct USDA Lookup by GTIN...');

const usdaDirectEnricher = new UsdaNutritionEnricher();
usdaDirectEnricher.registerFood('012345678905', {
  fdcId: 555111,
  description: 'Farmstead Aged White Cheddar',
  brandOwner: 'Valley Dairy Farms',
  ingredients: 'Pasteurized Milk, Cheese Culture, Salt, Enzymes.',
  brandedFoodCategory: 'Cheese',
  publicationDate: '2025-01-10',
  foodNutrients: [
    { nutrientName: 'Energy', value: 400, unitName: 'KCAL' },
    { nutrientName: 'Total lipid (fat)', value: 33, unitName: 'G' },
    { nutrientName: 'Fatty acids, total saturated', value: 20, unitName: 'G' },
    { nutrientName: 'Protein', value: 25, unitName: 'G' },
    { nutrientName: 'Sodium, Na', value: 650, unitName: 'MG' },
  ],
});

class MockSecondaryEmptyProvider extends SecondaryProductProvider {
  async lookupBarcode() {
    return { found: false, data: null, statusCode: 404 };
  }
}

const usdaDirectResolver = new MultiSourceProductResolver({
  offProvider: new MockOpenFoodFactsProvider(null),
  secondaryProvider: new MockSecondaryEmptyProvider(),
  nutritionEnricher: usdaDirectEnricher,
});

const usdaDirectProduct = await usdaDirectResolver.resolve('012345678905');
assert.equal(usdaDirectProduct.name, 'Farmstead Aged White Cheddar');
assert.equal(usdaDirectProduct.brand, 'Valley Dairy Farms');
assert.equal(usdaDirectProduct.source, 'usda_fooddata_central');
assert.equal(usdaDirectProduct.resolverMetadata.resolvedBy, 'usda_fooddata_central');
assert.equal(usdaDirectProduct.nutrition.proteins, 25);
assert.equal(usdaDirectProduct.nutrition.carbohydrates, null, 'Unspecified nutrients must remain null');

console.log('✓ Direct USDA lookup by GTIN verified.');

// ----------------------------------------------------
// 6. User-Provided / Manual Cache Priority
// ----------------------------------------------------
console.log('6. Testing User-Provided Manual Cache Priority...');

const manualProduct = saveManualProductData({
  barcode: '012345678905',
  name: 'Custom Handmade Granola Bar',
  brand: 'Home Kitchen',
  nutrition: {
    energyKcal: 180,
    proteins: 5,
    carbohydrates: 22,
    sugars: 8,
    fat: 6,
    saturatedFat: 1,
    fiber: 3,
    sodium: 0.1,
  },
});

const resolvedFromService = await fetchProductByBarcode('012345678905');
assert.equal(resolvedFromService.name, 'Custom Handmade Granola Bar');
assert.equal(resolvedFromService.brand, 'Home Kitchen');
assert.equal(resolvedFromService.source, 'user-provided');
assert.equal(resolvedFromService.resolverMetadata.resolvedBy, 'manual-cache');

console.log('✓ Manual product cache precedence verified.');

// ----------------------------------------------------
// 7. Deterministic Scoring & Compatibility Engine Verification
// ----------------------------------------------------
console.log('7. Testing Deterministic Scoring & Compatibility with Multi-Source Products...');

// Score the secondary resolved product
const secondaryScore = calculateFoodLensScore(secondaryResolved);
assert.equal(typeof secondaryScore.score, 'number');
assert.equal(secondaryScore.score >= 0 && secondaryScore.score <= 100, true);
assert.equal(typeof secondaryScore.label, 'string');
assert.equal(typeof secondaryScore.grade, 'string');
assert.equal(Array.isArray(secondaryScore.breakdown), true);

// Compatibility of enriched bread for user with gluten allergy
const glutenAllergicUser = {
  diet: 'Vegetarian',
  allergies: ['gluten'],
};
const compatResult = calculateCompatibility(enrichedProduct, glutenAllergicUser);
assert.equal(compatResult.status, 'not_compatible');
assert.equal(
  compatResult.reasons.some(
    (r) =>
      (r.message || r.preference || '').toLowerCase().includes('gluten') ||
      (r.message || r.matchedValue || '').toLowerCase().includes('gluten')
  ),
  true
);

console.log('✓ Scoring and compatibility engines operate deterministically on multi-source data.');

// ----------------------------------------------------
// 8. Canonical Normalization Invariant Check
// ----------------------------------------------------
console.log('8. Testing Canonical Normalization Invariants...');

// Ensure raw items with missing fields never invent data
const rawIncomplete = {
  product_name: 'Incomplete Test Snack',
};
const normalized = normalizeOpenFoodFactsProduct(rawIncomplete, '012345678905');
assert.equal(normalized.brand, 'Unknown Brand');
assert.equal(normalized.image, null);
assert.equal(normalized.ingredients.text, null);
assert.deepEqual(normalized.ingredients.tags, []);
assert.deepEqual(normalized.allergens, []);
assert.deepEqual(normalized.traces, []);
assert.equal(normalized.nutrition.energyKcal, null);
assert.equal(normalized.nutrition.proteins, null);
assert.equal(normalized.nutrition.sugars, null);
assert.equal(normalized.nutriscore, null);
assert.equal(normalized.novaGroup, null);

console.log('✓ Incomplete product data maintains strict null/empty invariant.');

console.log('\n======================================================');
console.log('ALL MULTI-SOURCE RESOLVER & ENRICHMENT TESTS PASSED');
console.log('======================================================\n');
