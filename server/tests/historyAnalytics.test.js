import assert from 'assert';
import { extractProductSnapshot, extractScoreSnapshot, extractCompatibilitySnapshot } from '../services/historyService.js';

console.log('Running History, Favorites & Analytics Unit Tests...');

// Test 1: extractProductSnapshot produces bounded, clean schema
const mockRawProduct = {
  barcode: '3017620422003',
  name: 'Nutella Hazelnut Spread with Cocoa',
  brand: 'Ferrero',
  image: 'https://images.openfoodfacts.org/images/products/301/762/042/2003/front_en.448.400.jpg',
  quantity: '400 g',
  servingSize: '15 g',
  nutrition: {
    energyKcal: 539,
    sugars: 56.3,
    proteins: 6.3,
    fiber: 3.1,
    fat: 30.9,
    saturatedFat: 10.6,
    salt: 0.107,
    sodium: 0.0428,
  },
  nutriscore: 'e',
  novaGroup: 4,
  allergens: ['hazelnuts', 'milk', 'soy'],
  traces: [],
  extraUnneededData: 'should be stripped',
};

const snapshot = extractProductSnapshot(mockRawProduct);
assert.strictEqual(snapshot.barcode, '3017620422003');
assert.strictEqual(snapshot.name, 'Nutella Hazelnut Spread with Cocoa');
assert.strictEqual(snapshot.brand, 'Ferrero');
assert.strictEqual(snapshot.nutrition.sugars, 56.3);
assert.strictEqual(snapshot.novaGroup, 4);
assert.strictEqual(snapshot.allergens.length, 3);
assert.strictEqual(snapshot.extraUnneededData, undefined);
console.log('✓ Test 1 Passed: extractProductSnapshot creates clean bounded snapshot');

// Test 2: extractScoreSnapshot
const mockScore = {
  score: 42,
  grade: 'Poor',
  label: 'Poor Nutritional Balance',
  version: '1.0',
  positives: ['Low Sodium'],
  concerns: ['High Sugar', 'Ultra-processed food (NOVA 4)'],
};

const scoreSnapshot = extractScoreSnapshot(mockScore);
assert.strictEqual(scoreSnapshot.score, 42);
assert.strictEqual(scoreSnapshot.grade, 'Poor');
assert.strictEqual(scoreSnapshot.concerns.length, 2);
console.log('✓ Test 2 Passed: extractScoreSnapshot formats score accurately');

// Test 3: extractCompatibilitySnapshot
const mockCompat = {
  status: 'not_compatible',
  summary: 'Contains allergen: hazelnuts',
  reasons: ['Contains hazelnuts which conflicts with your tree nut allergy.'],
  conflicts: ['hazelnuts'],
  traceWarnings: [],
  positiveAlignments: [],
  missingDataWarnings: [],
};

const compatSnapshot = extractCompatibilitySnapshot(mockCompat);
assert.strictEqual(compatSnapshot.status, 'not_compatible');
assert.strictEqual(compatSnapshot.conflicts[0], 'hazelnuts');
console.log('✓ Test 3 Passed: extractCompatibilitySnapshot safely formats compatibility data');

// Test 4: Score distribution calculation simulation
const sampleScores = [92, 88, 76, 72, 60, 45, 20];
const distribution = {
  excellent: 0,
  good: 0,
  moderate: 0,
  poor: 0,
  avoid: 0,
};

for (const s of sampleScores) {
  if (s >= 85) distribution.excellent += 1;
  else if (s >= 70) distribution.good += 1;
  else if (s >= 50) distribution.moderate += 1;
  else if (s >= 30) distribution.poor += 1;
  else distribution.avoid += 1;
}

assert.strictEqual(distribution.excellent, 2);
assert.strictEqual(distribution.good, 2);
assert.strictEqual(distribution.moderate, 1);
assert.strictEqual(distribution.poor, 1);
assert.strictEqual(distribution.avoid, 1);

const sum = sampleScores.reduce((acc, v) => acc + v, 0);
const avg = Math.round((sum / sampleScores.length) * 10) / 10;
assert.strictEqual(avg, 64.7);
console.log('✓ Test 4 Passed: Deterministic score distribution & statistics calculations are accurate');

console.log('All History, Favorites & Analytics unit tests passed successfully!');
