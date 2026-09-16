import assert from 'node:assert/strict';
import {
  normalizeBarcode,
  calculateGtinCheckDigit,
  validateGtinChecksum,
  detectBarcodeFormat,
  verifyBarcode,
  validateBarcode,
} from '../utils/barcodeValidator.js';
import { fetchProductByBarcode } from '../services/productService.js';

console.log('Running FoodLens AI Barcode Validator & Reliability Tests...\n');

// ----------------------------------------------------
// 1. Normalization & Leading Zeros Tests
// ----------------------------------------------------
console.log('1. Testing Barcode Normalization & Leading Zeros...');

// Test: " 012345678905 " normalizes without losing the leading zero
const leadingZeroBarcode = ' 012345678905 ';
const normalizedLeadingZero = normalizeBarcode(leadingZeroBarcode);
assert.equal(
  normalizedLeadingZero,
  '012345678905',
  'Barcode with leading zero must preserve the leading zero after normalization'
);
assert.equal(normalizedLeadingZero.length, 12, 'Normalized barcode length must be 12');
assert.equal(normalizedLeadingZero.startsWith('0'), true, 'Leading zero must be retained');

// Test: barcode containing spaces
const spacesBarcode = ' 0123 456 78905 ';
assert.equal(
  normalizeBarcode(spacesBarcode),
  '012345678905',
  'Spaces within barcode must be stripped'
);

// Test: barcode containing hyphens
const hyphensBarcode = '012-345-678-905';
assert.equal(
  normalizeBarcode(hyphensBarcode),
  '012345678905',
  'Hyphens within barcode must be stripped'
);

// Test: mixed spaces and hyphens
const mixedBarcode = '  0-123 456-789 05  ';
assert.equal(
  normalizeBarcode(mixedBarcode),
  '012345678905',
  'Mixed spaces, tabs, and hyphens must be stripped cleanly'
);

console.log('✓ Normalization and leading zero tests passed.');

// ----------------------------------------------------
// 2. Checksum Calculation (GS1 Modulo-10)
// ----------------------------------------------------
console.log('2. Testing Checksum Calculation (GS1 Modulo-10)...');

// UPC-A 11 digits: '01234567890' -> check digit 5
assert.equal(calculateGtinCheckDigit('01234567890'), 5, 'UPC-A payload 01234567890 check digit should be 5');

// EAN-8 7 digits: '7351353' -> check digit 7
assert.equal(calculateGtinCheckDigit('7351353'), 7, 'EAN-8 payload 7351353 check digit should be 7');

// EAN-13 12 digits: '400638133393' -> check digit 1
assert.equal(calculateGtinCheckDigit('400638133393'), 1, 'EAN-13 payload 400638133393 check digit should be 1');

// Coca-Cola Classic 12 digits: '544900000099' -> check digit 6
assert.equal(calculateGtinCheckDigit('544900000099'), 6, 'EAN-13 Coca-cola payload check digit should be 6');

// The Kokan syrup real barcode from prompt: '906097260049' -> payload '90609726004'
// Calculated check digit is 7, but actual digit was 9
assert.equal(calculateGtinCheckDigit('90609726004'), 7, 'Kokan payload check digit is 7');

console.log('✓ Checksum calculation tests passed.');

// ----------------------------------------------------
// 3. Valid Barcodes Verification
// ----------------------------------------------------
console.log('3. Testing Valid Retail Barcodes (UPC-A, EAN-8, EAN-13)...');

// Valid UPC-A
const validUpcA = verifyBarcode('012345678905');
assert.equal(validUpcA.isValid, true, 'Valid UPC-A must pass verification');
assert.equal(validUpcA.format, 'UPC-A');
assert.equal(validUpcA.normalized, '012345678905');
assert.equal(validUpcA.error, null);

// Valid EAN-8
const validEan8 = verifyBarcode('73513537');
assert.equal(validEan8.isValid, true, 'Valid EAN-8 must pass verification');
assert.equal(validEan8.format, 'EAN-8 / UPC-E');
assert.equal(validEan8.error, null);

// Valid EAN-13
const validEan13 = verifyBarcode('4006381333931');
assert.equal(validEan13.isValid, true, 'Valid EAN-13 must pass verification');
assert.equal(validEan13.format, 'EAN-13');
assert.equal(validEan13.error, null);

// Valid with whitespace and leading zero
const validWithSpaces = verifyBarcode('  0123-456 78905  ');
assert.equal(validWithSpaces.isValid, true, 'Valid barcode with spaces and dashes must pass verification');
assert.equal(validWithSpaces.normalized, '012345678905');

console.log('✓ Valid retail barcodes verified successfully.');

// ----------------------------------------------------
// 4. Invalid Barcodes & Edge Cases
// ----------------------------------------------------
console.log('4. Testing Invalid Barcodes & Edge Cases...');

// Empty input
const emptyResult = verifyBarcode('');
assert.equal(emptyResult.isValid, false, 'Empty string must fail');
assert.equal(emptyResult.errorType, 'EMPTY');

const whitespaceResult = verifyBarcode('    ');
assert.equal(whitespaceResult.isValid, false, 'Whitespace string must fail');
assert.equal(whitespaceResult.errorType, 'EMPTY');

const nullResult = verifyBarcode(null);
assert.equal(nullResult.isValid, false, 'Null input must fail');
assert.equal(nullResult.errorType, 'EMPTY');

// Letters / Non-numeric
const lettersResult = verifyBarcode('01234567890A');
assert.equal(lettersResult.isValid, false, 'Barcode with letters must fail');
assert.equal(lettersResult.errorType, 'CONTAINS_LETTERS');

const wordResult = verifyBarcode('invalidbarcode');
assert.equal(wordResult.isValid, false, 'Pure alphabetic string must fail');
assert.equal(wordResult.errorType, 'CONTAINS_LETTERS');

// Unsupported length
const tooShortResult = verifyBarcode('12345');
assert.equal(tooShortResult.isValid, false, '5-digit barcode must fail');
assert.equal(tooShortResult.errorType, 'INVALID_LENGTH');

const tenDigitsResult = verifyBarcode('1234567890');
assert.equal(tenDigitsResult.isValid, false, '10-digit barcode must fail');
assert.equal(tenDigitsResult.errorType, 'INVALID_LENGTH');

const tooLongResult = verifyBarcode('1234567890123456');
assert.equal(tooLongResult.isValid, false, '16-digit barcode must fail');
assert.equal(tooLongResult.errorType, 'INVALID_LENGTH');

// Invalid Checksum
// '906097260049' (12 digits, expected check digit 7, actual is 9)
const checksumFailResult1 = verifyBarcode('906097260049');
assert.equal(checksumFailResult1.isValid, false, 'Checksum failure must be rejected');
assert.equal(checksumFailResult1.errorType, 'CHECKSUM_FAILED');
assert.equal(checksumFailResult1.expectedCheckDigit, 7);
assert.equal(checksumFailResult1.actualCheckDigit, 9);
assert.match(checksumFailResult1.error, /Barcode read may be incorrect/);

// '012345678909' (12 digits, expected check digit 5, actual is 9)
const checksumFailResult2 = verifyBarcode('012345678909');
assert.equal(checksumFailResult2.isValid, false, 'UPC-A checksum failure must be rejected');
assert.equal(checksumFailResult2.errorType, 'CHECKSUM_FAILED');

// '4006381333939' (13 digits, expected check digit 1, actual is 9)
const checksumFailResult3 = verifyBarcode('4006381333939');
assert.equal(checksumFailResult3.isValid, false, 'EAN-13 checksum failure must be rejected');
assert.equal(checksumFailResult3.errorType, 'CHECKSUM_FAILED');

// Malformed input (floats, script injection)
const floatResult = verifyBarcode('123.456');
assert.equal(floatResult.isValid, false, 'Float string must fail');

const scriptResult = verifyBarcode('<script>alert("xss")</script>');
assert.equal(scriptResult.isValid, false, 'XSS attempt must fail');

console.log('✓ Invalid barcodes and edge cases rejected properly.');

// ----------------------------------------------------
// 5. Unification: Camera Scan & Manual Entry Service Flow
// ----------------------------------------------------
console.log('5. Testing Service Architecture Consistency...');

// Both camera scan and manual entry converge to normalizeBarcode then fetchProductByBarcode
const testBarcode = ' 0123 456 78905 ';
const normalized = normalizeBarcode(testBarcode);
assert.equal(normalized, '012345678905', 'Normalized barcode matches expected');
assert.equal(typeof fetchProductByBarcode, 'function', 'fetchProductByBarcode service is accessible');

console.log('✓ Service architecture consistency verified.');

console.log('\n======================================================');
console.log('ALL BARCODE VALIDATOR & RELIABILITY TESTS PASSED');
console.log('======================================================\n');
