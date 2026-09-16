import assert from 'node:assert/strict';
import { sanitizeSearchQuery, validateBarcode } from '../../services/productService.js';
import { parseAndValidateBarcodes } from '../../services/comparisonService.js';

console.log('Running Phase 11 Security & Injection Audit Tests...\n');

// Test 1: NoSQL injection in barcode is safely rejected
const noSqlBarcodes = [
  '{"$gt": ""}',
  '{"$ne": null}',
  '123456789012$where',
  '<script>alert(1)</script>',
  'undefined',
  'null',
  'true',
  '[object Object]',
];

for (const maliciousInput of noSqlBarcodes) {
  assert.equal(validateBarcode(maliciousInput), false, `Barcode "${maliciousInput}" must be rejected`);
}

// Test 2: Multi-product comparison validates and sanitizes every element
assert.throws(() => {
  parseAndValidateBarcodes(['12345678', '{"$gt": ""}']);
}, /Invalid barcode format/, 'Should reject comparison query containing injection payload');

// Test 3: Search query boundary sanitization
assert.equal(sanitizeSearchQuery('   organic   oats   '), 'organic oats');
assert.equal(sanitizeSearchQuery('a'.repeat(50)).length, 50);
assert.equal(sanitizeSearchQuery(''), '');
assert.equal(sanitizeSearchQuery(null), '');
assert.equal(sanitizeSearchQuery({ $gt: '' }), '');

console.log('✓ All Phase 11 Security & Injection Audit tests passed successfully!');
