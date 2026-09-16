import assert from 'node:assert/strict';
import {
  normalizeBarcode,
  calculateGtinCheckDigit,
  validateBarcode,
} from '../utils/barcodeUtils.js';
import { UpcitemdbProvider } from '../services/productProviders/upcitemdbProvider.js';
import { UsdaProvider } from '../services/productProviders/usdaProvider.js';
import {
  MultiSourceProductResolver,
  normalizeOpenFoodFactsProduct,
  normalizeSecondaryProduct,
  normalizeUsdaProduct,
} from '../services/productResolver.js';
import { ApiError } from '../utils/ApiError.js';

console.log('Running FoodLens AI Phase 12: Barcode Validation & Multi-Source Resolution Tests...\n');

// ----------------------------------------------------
// Test Suite 1: Barcode Normalization & Validation Engine
// ----------------------------------------------------
console.log('1. Testing Barcode Normalization and Validation Engine...');

// Preserves leading zeros as strings
assert.equal(normalizeBarcode(' 012345678905 '), '012345678905');
assert.equal(normalizeBarcode('0012345678905'), '0012345678905');
assert.equal(typeof normalizeBarcode('012345678905'), 'string');

// Checksum calculation (GS1 Modulo-10)
assert.equal(calculateGtinCheckDigit('01234567890'), 5);
assert.equal(calculateGtinCheckDigit('90609726004'), 7);
assert.equal(calculateGtinCheckDigit('73762806450'), 2);
assert.equal(calculateGtinCheckDigit('9638507'), 4);

// Explicit validation for 906097260049 (Invalid Checksum)
const val906 = validateBarcode('906097260049');
assert.equal(val906.valid, false);
assert.equal(val906.normalized, '906097260049');
assert.equal(val906.type, 'UPC-A');
assert.equal(val906.checksumValid, false);
assert.equal(val906.errorCode, 'INVALID_CHECKSUM');
assert.equal(val906.expectedCheckDigit, 7);
assert.equal(val906.actualCheckDigit, 9);
assert.equal(val906.suggestedCorrection, '906097260047');

// Valid corrected barcode 906097260047
const valCorrected = validateBarcode('906097260047');
assert.equal(valCorrected.valid, true);
assert.equal(valCorrected.checksumValid, true);
assert.equal(valCorrected.type, 'UPC-A');

// Valid EAN-13, EAN-8, UPC-A
const validEan13 = validateBarcode('737628064502'); // 12 digits (UPC-A)
assert.equal(validEan13.valid, true);

const validEan8 = validateBarcode('96385074');
assert.equal(validEan8.valid, true);
assert.equal(validEan8.type, 'EAN-8');

// Invalid non-digits
const valLetters = validateBarcode('01234567890A');
assert.equal(valLetters.valid, false);
assert.equal(valLetters.errorCode, 'CONTAINS_LETTERS');

// Invalid length
const valShort = validateBarcode('12345');
assert.equal(valShort.valid, false);
assert.equal(valShort.errorCode, 'INVALID_LENGTH');

console.log('✓ Barcode normalization and validation engine passed.');

// ----------------------------------------------------
// Test Suite 2: Provider In-Memory Deduplication & Caching
// ----------------------------------------------------
console.log('2. Testing Provider In-Memory Deduplication & Caching...');

const upcProvider = new UpcitemdbProvider({ cacheTtlMs: 5000 });
upcProvider.registerProduct('012345678905', {
  title: 'Test Bar',
  brand: 'Health Brand',
});

// First call hits registered mock
const res1 = await upcProvider.lookupBarcode('012345678905');
assert.equal(res1.found, true);
assert.equal(res1.data.title, 'Test Bar');

// Second call should serve from cache
const res2 = await upcProvider.lookupBarcode('012345678905');
assert.equal(res2.found, true);
assert.equal(res2.cached, true);

// USDA provider caching
const usdaProvider = new UsdaProvider({ cacheTtlMs: 5000 });
usdaProvider.registerFood('012345678905', {
  fdcId: 1001,
  description: 'Whole Milk',
  foodNutrients: [{ nutrientName: 'Protein', value: 8, unitName: 'G' }],
});

const usdaRes1 = await usdaProvider.searchNutrition('012345678905', { barcode: '012345678905' });
assert.equal(usdaRes1.found, true);
assert.equal(usdaRes1.food.description, 'Whole Milk');

const usdaRes2 = await usdaProvider.searchNutrition('012345678905', { barcode: '012345678905' });
assert.equal(usdaRes2.found, true);
assert.equal(usdaRes2.cached, true);

console.log('✓ Provider caching and deduplication passed.');

// ----------------------------------------------------
// Test Suite 3: Multi-Source Product Resolution & Truthful Normalization
// ----------------------------------------------------
console.log('3. Testing Multi-Source Product Resolution & Truthful Normalization...');

// Mock Open Food Facts provider that has partial info
class MockOffProvider {
  constructor(product) {
    this.product = product;
  }
  async getByBarcode(barcode) {
    if (this.product && this.product.barcode === barcode) {
      return {
        found: true,
        source: 'openfoodfacts',
        raw: this.product,
      };
    }
    return { found: false, source: 'openfoodfacts' };
  }
}

const partialOffProduct = {
  barcode: '012345678905',
  product_name: 'Raw Oat Snack',
  brands: 'Clean Oats Co',
  ingredients_text: 'Rolled oats, sea salt',
  // Nutriments missing protein, fat, calories
  nutriments: {},
};

const offMock = new MockOffProvider(partialOffProduct);

const resolverWithEnrichment = new MultiSourceProductResolver({
  offProvider: offMock,
  secondaryProvider: upcProvider,
  nutritionEnricher: usdaProvider,
});

const resolvedEnriched = await resolverWithEnrichment.resolve('012345678905');
assert.equal(resolvedEnriched.name, 'Raw Oat Snack');
assert.equal(resolvedEnriched.brand, 'Clean Oats Co');
assert.equal(resolvedEnriched.sources.identity, 'open_food_facts');
assert.equal(resolvedEnriched.sources.nutrition, 'usda_fooddata_central');
assert.equal(resolvedEnriched.resolverMetadata.enrichmentApplied, true);
assert.equal(resolvedEnriched.nutrition.proteins, 8); // Enriched from USDA mock

// Test complete vs partial determination
const completeProduct = {
  barcode: '737628064502',
  product_name: 'Complete Pasta',
  brands: 'Barilla',
  ingredients_text: 'Semolina flour',
  nutriments: {
    'energy-kcal_100g': 350,
    'fat_100g': 1.5,
    'carbohydrates_100g': 71,
    'proteins_100g': 12,
    'sugars_100g': 3,
  },
};

const completeResolver = new MultiSourceProductResolver({
  offProvider: new MockOffProvider(completeProduct),
  secondaryProvider: upcProvider,
  nutritionEnricher: usdaProvider,
});

const completeRes = await completeResolver.resolve('737628064502');
assert.equal(completeRes.isPartial, false);
assert.equal(completeRes.status, 'complete');
assert.equal(completeRes.sources.identity, 'open_food_facts');
assert.equal(completeRes.sources.nutrition, 'open_food_facts');

// Test 404 behavior when barcode is valid but not in any catalog
const emptyResolver = new MultiSourceProductResolver({
  offProvider: new MockOffProvider(null),
  secondaryProvider: { lookupBarcode: async () => ({ found: false, statusCode: 404 }) },
  nutritionEnricher: { searchNutrition: async () => ({ found: false, statusCode: 404 }), enrichProduct: async () => ({ enriched: false }) },
});
try {
  await emptyResolver.resolve('96385074');
  assert.fail('Should have thrown 404 for uncataloged product');
} catch (err) {
  assert.equal(err instanceof ApiError, true);
  assert.equal(err.statusCode, 404);
  assert.equal(err.error?.errorCode, 'PRODUCT_NOT_FOUND');
  assert.equal(err.error?.message, "We couldn't find this product in our available product databases.");
}

console.log('✓ Multi-source resolution and truthful normalization passed.');

console.log('\n======================================================');
console.log('ALL PHASE 12 BARCODE VALIDATION & RESOLVER TESTS PASSED');
console.log('======================================================\n');
