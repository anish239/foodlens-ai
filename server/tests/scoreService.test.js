import { calculateFoodLensScore } from '../services/scoreService.js';
import assert from 'assert';

console.log('Running FoodLens Score Engine Unit Tests...');

// Test 1: Excellent product (Low sugar, low fat, high fiber, high protein, NOVA 1, Nutri-Score A)
const excellentProduct = {
  nutrition: {
    sugars: 2.0,
    saturatedFat: 0.5,
    sodium: 0.1,
    fiber: 6.0,
    proteins: 12.0,
  },
  novaGroup: 1,
  nutriscore: 'a',
};

const res1 = calculateFoodLensScore(excellentProduct);
assert.strictEqual(res1.grade, 'Excellent');
assert.ok(res1.score >= 90, `Expected score >= 90, got ${res1.score}`);
console.log('✓ Test 1 Passed: Excellent product score =', res1.score);

// Test 2: Poor nutritional profile product
const poorProduct = {
  nutrition: {
    sugars: 35.0,
    saturatedFat: 8.0,
    sodium: 1.2,
    fiber: 0.5,
    proteins: 1.0,
  },
  novaGroup: 4,
  nutriscore: 'e',
};

const res2 = calculateFoodLensScore(poorProduct);
assert.ok(res2.score < 50, `Expected score < 50 for poor nutritional profile, got ${res2.score}`);
console.log('✓ Test 2 Passed: Poor nutritional profile product score =', res2.score);

// Test 3: Missing nutrition data (should not penalize or reward)
const incompleteProduct = {
  nutrition: {
    sugars: null,
    saturatedFat: undefined,
    sodium: NaN,
    fiber: null,
    proteins: null,
  },
  novaGroup: null,
  nutriscore: null,
};

const res3 = calculateFoodLensScore(incompleteProduct);
assert.strictEqual(res3.score, 100, `Expected baseline 100 for missing data, got ${res3.score}`);
console.log('✓ Test 3 Passed: Missing nutrition data maintains baseline score =', res3.score);

// Test 4: Determinism test (same input produces identical output)
const res4a = calculateFoodLensScore(excellentProduct);
const res4b = calculateFoodLensScore(excellentProduct);
assert.deepStrictEqual(res4a, res4b);
console.log('✓ Test 4 Passed: Score calculation is fully deterministic');

// Test 5: Score bounds (clamped between 0 and 100)
assert.ok(res2.score >= 0 && res2.score <= 100, 'Score is properly clamped between 0 and 100');
console.log('✓ Test 5 Passed: Score correctly clamped within [0, 100]');

console.log('All FoodLens Score Engine unit tests passed successfully!');
