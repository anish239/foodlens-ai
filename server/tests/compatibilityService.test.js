import { calculateCompatibility } from '../services/compatibilityService.js';
import assert from 'assert';

console.log('Running Dietary Compatibility Engine Unit Tests...');

// Test 1: Vegetarian compatible product
const vegProduct = {
  allergens: [],
  traces: [],
  ingredients: { text: 'Water, organic tofu, soy sauce, spices.' },
  nutrition: { sugars: 2.0, proteins: 8.0, sodium: 0.3 },
};
const vegPrefs = { diet: 'vegetarian', allergies: [], restrictions: [], healthGoals: [] };
const res1 = calculateCompatibility(vegProduct, vegPrefs);
assert.strictEqual(res1.status, 'compatible');
console.log('✓ Test 1 Passed: Vegetarian product compatible =', res1.status);

// Test 2: Vegetarian conflict (contains chicken)
const meatProduct = {
  allergens: [],
  traces: [],
  ingredients: { text: 'Water, chicken breast, salt, spices.' },
  nutrition: { sugars: 0.5, proteins: 20.0, sodium: 0.5 },
};
const res2 = calculateCompatibility(meatProduct, vegPrefs);
assert.strictEqual(res2.status, 'not_compatible');
console.log('✓ Test 2 Passed: Vegetarian conflict correctly detected =', res2.status);

// Test 3: Peanut allergy conflict
const peanutProduct = {
  allergens: ['en:peanuts'],
  traces: [],
  ingredients: { text: 'Milk chocolate, roasted peanuts, sugar.' },
  nutrition: { sugars: 40.0, proteins: 6.0, sodium: 0.2 },
};
const allergyPrefs = { diet: 'non-vegetarian', allergies: ['peanuts'], restrictions: ['peanut-free'], healthGoals: [] };
const res3 = calculateCompatibility(peanutProduct, allergyPrefs);
assert.strictEqual(res3.status, 'not_compatible');
console.log('✓ Test 3 Passed: Peanut allergy conflict detected =', res3.status);

// Test 4: Peanut trace warning
const traceProduct = {
  allergens: [],
  traces: ['en:peanuts'],
  ingredients: { text: 'Oats, honey, almonds.' },
  nutrition: { sugars: 10.0, proteins: 5.0, sodium: 0.1 },
};
const res4 = calculateCompatibility(traceProduct, allergyPrefs);
assert.strictEqual(res4.status, 'caution');
console.log('✓ Test 4 Passed: Peanut trace warning correctly set to caution =', res4.status);

// Test 5: Determinism test
const res5a = calculateCompatibility(vegProduct, vegPrefs);
const res5b = calculateCompatibility(vegProduct, vegPrefs);
assert.deepStrictEqual(res5a, res5b);
console.log('✓ Test 5 Passed: Compatibility calculation is fully deterministic');

console.log('All Dietary Compatibility Engine unit tests passed successfully!');
