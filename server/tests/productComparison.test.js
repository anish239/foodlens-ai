import assert from 'node:assert';
import { parseAndValidateBarcodes } from '../services/comparisonService.js';
import { calculateFoodLensScore } from '../services/scoreService.js';
import { calculateCompatibility } from '../services/compatibilityService.js';
import { ApiError } from '../utils/ApiError.js';

console.log('Running Product Comparison Unit Tests...');

// Test 1: Valid 2 product barcodes accepted
{
  const barcodes = ['12345678', '87654321'];
  const validated = parseAndValidateBarcodes(barcodes);
  assert.strictEqual(validated.length, 2);
  assert.strictEqual(validated[0], '12345678');
  assert.strictEqual(validated[1], '87654321');
  console.log('✓ Test 1 Passed: Valid 2 product comparison array parsed');
}

// Test 2: Valid 4 product barcodes comma-separated string accepted
{
  const rawString = '12345678, 23456789, 34567890, 45678901';
  const validated = parseAndValidateBarcodes(rawString);
  assert.strictEqual(validated.length, 4);
  console.log('✓ Test 2 Passed: Valid 4 product comma-separated string parsed');
}

// Test 3: Reject 0 or empty product list (400)
{
  assert.throws(
    () => parseAndValidateBarcodes([]),
    (err) => err instanceof ApiError && err.statusCode === 400 && err.message.includes('between 2 and 4'),
    'Should reject empty comparison array'
  );
  console.log('✓ Test 3 Passed: 0 products rejected with 400');
}

// Test 4: Reject 1 product comparison (400)
{
  assert.throws(
    () => parseAndValidateBarcodes(['12345678']),
    (err) => err instanceof ApiError && err.statusCode === 400 && err.message.includes('between 2 and 4'),
    'Should reject single product comparison'
  );
  console.log('✓ Test 4 Passed: 1 product rejected with 400');
}

// Test 5: Reject 5 product comparison (400)
{
  assert.throws(
    () => parseAndValidateBarcodes(['12345678', '23456789', '34567890', '45678901', '56789012']),
    (err) => err instanceof ApiError && err.statusCode === 400 && err.message.includes('between 2 and 4'),
    'Should reject 5+ products comparison'
  );
  console.log('✓ Test 5 Passed: 5 products rejected with 400');
}

// Test 6: Reject duplicate barcodes (400)
{
  assert.throws(
    () => parseAndValidateBarcodes(['12345678', '12345678']),
    (err) => err instanceof ApiError && err.statusCode === 400 && err.message.includes('Duplicate barcodes'),
    'Should reject duplicate barcodes'
  );
  console.log('✓ Test 6 Passed: Duplicate barcodes rejected with 400');
}

// Test 7: Reject invalid barcode characters (400)
{
  assert.throws(
    () => parseAndValidateBarcodes(['12345678', 'INVALID_BC_123']),
    (err) => err instanceof ApiError && err.statusCode === 400 && err.message.includes('Invalid barcode format'),
    'Should reject invalid barcode format'
  );
  console.log('✓ Test 7 Passed: Invalid barcode format rejected with 400');
}

// Test 8: Deterministic comparison evaluation (Score + Compatibility)
{
  const productA = {
    barcode: '11112222',
    name: 'Plain Greek Yogurt',
    brand: 'Dairy Co',
    nutrition: {
      energyKcal: 70,
      proteins: 10,
      sugars: 3.5,
      saturatedFat: 0.2,
      sodium: 0.04,
      fiber: 0,
    },
    nutriscore: 'A',
    novaGroup: 1,
    allergens: ['milk'],
    traces: [],
    ingredients: { text: 'Pasteurized milk, active cultures.' },
  };

  const productB = {
    barcode: '33334444',
    name: 'Chocolate Cream Cookie',
    brand: 'Sweet Treats',
    nutrition: {
      energyKcal: 490,
      proteins: 4.8,
      sugars: 38,
      saturatedFat: 9.8,
      sodium: 0.45,
      fiber: 2.1,
    },
    nutriscore: 'E',
    novaGroup: 4,
    allergens: ['gluten', 'soy', 'milk'],
    traces: ['peanuts'],
    ingredients: { text: 'Sugar, palm oil, wheat flour, cocoa, emulsifier E322.' },
  };

  const userPreferences = {
    diet: 'Vegetarian',
    allergies: ['Peanuts'],
    goals: ['Low Sugar', 'High Protein'],
  };

  const scoreA = calculateFoodLensScore(productA);
  const scoreB = calculateFoodLensScore(productB);

  const compatA = calculateCompatibility(productA, userPreferences);
  const compatB = calculateCompatibility(productB, userPreferences);

  // Score comparison assertions
  assert.strictEqual(scoreA.score > scoreB.score, true, 'Product A should score higher than Product B');
  assert.strictEqual(scoreA.grade, 'Excellent');

  // Compatibility comparison assertions
  assert.strictEqual(compatA.status, 'compatible', 'Product A has no peanut or vegetarian conflict');
  assert.strictEqual(compatB.status, 'caution', 'Product B contains peanut traces conflict');

  console.log('✓ Test 8 Passed: Deterministic multi-product score & dietary comparison verified');
}

console.log('All Product Comparison unit tests passed successfully!');
