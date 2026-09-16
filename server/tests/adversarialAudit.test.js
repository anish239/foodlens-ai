import assert from 'node:assert/strict';
import { normalizeBarcode, validateBarcode, normalizeProductData, sanitizeSearchQuery } from '../services/productService.js';
import { calculateFoodLensScore } from '../services/scoreService.js';
import { calculateCompatibility } from '../services/compatibilityService.js';
import { parseAndValidateBarcodes } from '../services/comparisonService.js';
import { validateAndNormalizeAIResponse, DEFAULT_AI_DISCLAIMER } from '../utils/aiResponseValidator.js';
import { extractProductSnapshot, extractScoreSnapshot, extractCompatibilitySnapshot } from '../services/historyService.js';

console.log('Running FoodLens AI Phase 10 Adversarial & Boundary Audit Tests...\n');

// ----------------------------------------------------
// 1. Barcode & Sanitization Adversarial Tests
// ----------------------------------------------------
console.log('1. Testing Barcode Normalization & Adversarial Inputs...');

// Test 1.1: Barcode with mixed spaces, dashes, leading zeroes
const b1 = normalizeBarcode('  001-2345-6789 0  ');
assert.equal(b1, '001234567890', 'Barcode normalization should remove spaces and hyphens while preserving leading zeros');

// Test 1.2: Barcode with invalid non-numeric characters
assert.equal(validateBarcode('001234567890'), true, 'Valid 12-digit UPC should pass');
assert.equal(validateBarcode('0012345678901'), true, 'Valid 13-digit EAN should pass');
assert.equal(validateBarcode('00123456'), true, 'Valid 8-digit EAN-8 should pass');
assert.equal(validateBarcode('abc123456789'), false, 'Non-numeric barcode should fail validation');
assert.equal(validateBarcode('<script>alert(1)</script>'), false, 'XSS attempt in barcode should fail validation');
assert.equal(validateBarcode('{"$gt": ""}'), false, 'NoSQL injection attempt in barcode should fail validation');
assert.equal(validateBarcode('123'), false, 'Short barcode (<5 chars) should fail validation');

console.log('✓ Barcode normalization and adversarial validation tests passed.');

// ----------------------------------------------------
// 2. Product Normalization Edge Cases
// ----------------------------------------------------
console.log('2. Testing Product Normalization with Corrupt / Edge-case Data...');

// Test 2.1: Corrupt / empty raw product
assert.equal(normalizeProductData(null, '12345678'), null);

// Test 2.2: Product with missing nutriments, unicode text, missing fields
const corruptRaw = {
  product_name: '  有机燕麦奶 Organic Oat Milk (Épeautre & Noisette)  ',
  brands: '  BioNatur®  ',
  nutriments: {
    'energy-kcal_100g': 'invalid_string', // Should not crash, fallback to null
    'sugars_100g': -5,                    // Negative number handled safely
    'proteins_100g': 12.5,
    'salt_100g': 1.2,
  },
  allergens_tags: ['en:nuts', 'en:hazelnut', ''],
  traces_tags: ['en:gluten'],
  categories_tags: ['en:plant-based-foods-and-beverages', 'en:beverages'],
};

const normalized = normalizeProductData(corruptRaw, '3017620422003');
assert.equal(normalized.name, '有机燕麦奶 Organic Oat Milk (Épeautre & Noisette)');
assert.equal(normalized.brand, 'BioNatur®');
assert.equal(normalized.nutrition.energyKcal, null, 'Invalid string in energy should be converted to null');
assert.equal(normalized.nutrition.proteins, 12.5);
assert.equal(normalized.nutrition.salt, 1.2);
assert.deepEqual(normalized.allergens, ['nuts', 'hazelnut']);
assert.deepEqual(normalized.traces, ['gluten']);
assert.deepEqual(normalized.categories, ['plant-based-foods-and-beverages', 'beverages']);

console.log('✓ Product data normalization with corrupt and Unicode inputs passed.');

// ----------------------------------------------------
// 3. FoodLens Score Engine Boundaries & Determinism
// ----------------------------------------------------
console.log('3. Testing Score Engine Boundary Clamping & Negative Values...');

// Test 3.1: Product with extreme negative penalties
const extremeUnhealthy = {
  nutrition: {
    sugars: 99,
    saturatedFat: 80,
    salt: 25,
    fiber: 0,
    proteins: 0,
  },
  novaGroup: 4,
  nutriscore: 'E',
};
const scoreUnhealthy = calculateFoodLensScore(extremeUnhealthy);
assert.ok(scoreUnhealthy.score >= 0 && scoreUnhealthy.score <= 100, 'Score must be clamped between 0 and 100');
assert.equal(scoreUnhealthy.score, 44, 'Extreme unhealthy score correctly computed');

// Test 3.2: Product with maximum bonuses
const superHealthy = {
  nutrition: {
    sugars: 0,
    saturatedFat: 0,
    sodium: 0.05,
    fiber: 10,
    proteins: 25,
  },
  novaGroup: 1,
  nutriscore: 'A',
};
const scoreHealthy = calculateFoodLensScore(superHealthy);
assert.equal(scoreHealthy.score, 100, 'Max score should be capped at 100');

// Test 3.3: Product with negative/corrupt nutrient numbers
const corruptNutrients = {
  nutrition: {
    sugars: -10,
    saturatedFat: -5,
    sodium: -1,
    fiber: -2,
    proteins: -8,
  },
};
const scoreCorrupt = calculateFoodLensScore(corruptNutrients);
assert.equal(scoreCorrupt.score, 100, 'Negative nutrient values should be safely ignored and not crash');

console.log('✓ FoodLens Score Engine boundary and edge-case tests passed.');

// ----------------------------------------------------
// 4. Dietary Compatibility Adversarial Cases
// ----------------------------------------------------
console.log('4. Testing Dietary Compatibility Engine Complex Matrices...');

const complexProduct = {
  allergens: ['milk', 'hazelnut'],
  traces: ['peanuts', 'sesame'],
  ingredients: {
    text: 'Water, organic oats, whey protein, hazelnuts, natural flavor, gelatin.',
  },
  nutrition: {
    proteins: 15,
    sugars: 2,
    sodium: 0.1,
  },
};

// Test 4.1: Vegan user with nut allergy (should detect both gelatin/whey and hazelnut)
const veganWithAllergy = {
  diet: 'vegan',
  allergies: ['nuts', 'peanuts'],
  restrictions: ['dairy-free'],
};
const compatResult = calculateCompatibility(complexProduct, veganWithAllergy);
assert.equal(compatResult.status, 'not_compatible');
assert.ok(compatResult.reasons.length >= 2, 'Should have recorded multiple conflict reasons');
assert.ok(compatResult.warnings.length >= 1, 'Should have trace warnings for peanuts');

// Test 4.2: Missing data warnings when ingredients and allergens are absent
const emptyProduct = {
  allergens: [],
  traces: [],
  ingredients: { text: null },
  nutrition: {},
};
const allergyCheck = calculateCompatibility(emptyProduct, { allergies: ['gluten'] });
assert.equal(allergyCheck.status, 'caution', 'Should caution user when allergen info is missing');

console.log('✓ Dietary compatibility adversarial cases passed.');

// ----------------------------------------------------
// 5. Comparison Service Validation
// ----------------------------------------------------
console.log('5. Testing Comparison Barcode Bounds and Formats...');

// 5.1 Array and CSV formats
const validCSV = '3017620422003, 5449000000996, 737628064502';
assert.deepEqual(parseAndValidateBarcodes(validCSV), ['3017620422003', '5449000000996', '737628064502']);

// 5.2 Bounds: less than 2
assert.throws(() => parseAndValidateBarcodes(['3017620422003']), /Comparison requires between 2 and 4/);

// 5.3 Bounds: more than 4
assert.throws(() => parseAndValidateBarcodes(['11111111', '22222222', '33333333', '44444444', '55555555']), /Comparison requires between 2 and 4/);

// 5.4 Duplicate check
assert.throws(() => parseAndValidateBarcodes(['3017620422003', '3017620422003']), /Duplicate barcodes/);

console.log('✓ Comparison validation tests passed.');

// ----------------------------------------------------
// 6. Gemini Response Validator & Sanitization
// ----------------------------------------------------
console.log('6. Testing AI Response Validator & Security Boundaries...');

// 6.1 Valid response with markdown wrapping
const rawMarkdown = '```json\n{"summary":"Good product.","highlights":["High protein"],"concerns":["None"],"scoreExplanation":"Well balanced.","compatibilityExplanation":"Matches diet.","recommendation":"Recommended."}\n```';
const parsed = validateAndNormalizeAIResponse(rawMarkdown);
assert.equal(parsed.summary, 'Good product.');
assert.equal(parsed.disclaimer, DEFAULT_AI_DISCLAIMER, 'Default disclaimer should be attached if not in response');

// 6.2 Bounding overlong text to protect UI layout
const longSummary = 'A'.repeat(1000);
const longResponse = {
  summary: longSummary,
  highlights: ['H1'],
  concerns: ['C1'],
  scoreExplanation: 'Explanation',
  compatibilityExplanation: 'Compat',
  recommendation: 'Rec',
};
const bounded = validateAndNormalizeAIResponse(longResponse);
assert.ok(bounded.summary.length <= 400, 'Summary must be bounded to 400 chars');

console.log('✓ AI Response Validator & Security tests passed.');

// ----------------------------------------------------
// 7. Snapshot Extraction Safety
// ----------------------------------------------------
console.log('7. Testing Snapshot Extraction Functions...');

const snapProduct = extractProductSnapshot({
  barcode: '123456789012',
  name: 'X'.repeat(500),
  brand: 'Y'.repeat(300),
  nutrition: { energyKcal: 250, sugars: 'not_a_num' },
});
assert.ok(snapProduct.name.length <= 200, 'Snapshot product name should be bounded');
assert.ok(snapProduct.brand.length <= 100, 'Snapshot brand should be bounded');
assert.equal(snapProduct.nutrition.sugars, null, 'Non-number nutrition value should be safely normalized to null');

console.log('✓ Snapshot extraction safety tests passed.');

console.log('\n======================================================');
console.log('ALL PHASE 10 ADVERSARIAL & BOUNDARY AUDIT TESTS PASSED');
console.log('======================================================');
