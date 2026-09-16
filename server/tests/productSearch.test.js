import assert from 'node:assert';
import { sanitizeSearchQuery, normalizeProductData } from '../services/productService.js';
import { ApiError } from '../utils/ApiError.js';

console.log('Running Product Search Unit Tests...');

// Test 1: Query sanitization collapses whitespace and trims
{
  const raw = '   greek   yogurt   vanilla   ';
  const sanitized = sanitizeSearchQuery(raw);
  assert.strictEqual(sanitized, 'greek yogurt vanilla', 'Query should be trimmed and multiple spaces collapsed');
  console.log('✓ Test 1 Passed: Query sanitization collapses whitespace');
}

// Test 2: Reject empty or too short query (<2 chars)
{
  const empty = sanitizeSearchQuery('   a   ');
  assert.strictEqual(empty.length < 2, true);
  console.log('✓ Test 2 Passed: Short query (<2 chars) correctly identified');
}

// Test 3: Reject query exceeding 100 characters
{
  const longQuery = 'a'.repeat(105);
  const sanitized = sanitizeSearchQuery(longQuery);
  assert.strictEqual(sanitized.length > 100, true);
  console.log('✓ Test 3 Passed: Over-length query (>100 chars) correctly detected');
}

// Test 4: Canonical normalization of Open Food Facts search result
{
  const mockRawProduct = {
    product_name: 'Organic Whole Oats',
    brands: 'Nature Pure',
    image_url: 'https://images.openfoodfacts.org/oats.jpg',
    quantity: '500g',
    serving_size: '40g',
    categories_tags: ['en:plant-based-foods', 'en:cereals-and-potatoes'],
    allergens_tags: ['en:gluten'],
    traces_tags: ['en:nuts'],
    nutriments: {
      'energy-kcal_100g': 370,
      'sugars_100g': 1.2,
      'proteins_100g': 13.5,
      'fiber_100g': 10.0,
      'fat_100g': 7.0,
      'saturated-fat_100g': 1.3,
      'salt_100g': 0.02,
      'sodium_100g': 0.008,
    },
    nutriscore_grade: 'a',
    nova_group: 1,
    ingredients_text: '100% whole grain rolled oats.',
  };

  const normalized = normalizeProductData(mockRawProduct, '1234567890123');

  assert.strictEqual(normalized.barcode, '1234567890123');
  assert.strictEqual(normalized.name, 'Organic Whole Oats');
  assert.strictEqual(normalized.brand, 'Nature Pure');
  assert.strictEqual(normalized.nutriscore, 'A');
  assert.strictEqual(normalized.novaGroup, 1);
  assert.strictEqual(normalized.nutrition.proteins, 13.5);
  assert.strictEqual(normalized.nutrition.sugars, 1.2);
  assert.deepStrictEqual(normalized.allergens, ['gluten']);
  assert.deepStrictEqual(normalized.traces, ['nuts']);
  assert.strictEqual(normalized.source, 'openfoodfacts');
  console.log('✓ Test 4 Passed: Raw search product normalized to FoodLens canonical shape');
}

// Test 5: Missing product fields handled safely without hallucination
{
  const incompleteRaw = {
    product_name: 'Simple Bread',
  };

  const normalized = normalizeProductData(incompleteRaw, '8901234567890');

  assert.strictEqual(normalized.name, 'Simple Bread');
  assert.strictEqual(normalized.brand, 'Unknown Brand');
  assert.strictEqual(normalized.image, null);
  assert.strictEqual(normalized.quantity, null);
  assert.strictEqual(normalized.nutriscore, null);
  assert.strictEqual(normalized.novaGroup, null);
  assert.strictEqual(normalized.nutrition.sugars, null);
  assert.strictEqual(normalized.nutrition.proteins, null);
  assert.deepStrictEqual(normalized.allergens, []);
  assert.deepStrictEqual(normalized.traces, []);
  console.log('✓ Test 5 Passed: Incomplete search items maintain null values safely');
}

console.log('All Product Search unit tests passed successfully!');
