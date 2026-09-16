import assert from 'node:assert/strict';
import { validateEnvironment, getJwtSecret, getSanitizedEnvSummary } from '../../config/envValidator.js';
import { sanitizeMongoUri } from '../../config/db.js';

console.log('Running Phase 11 Environment Validation & Secret Hardening Tests...\n');

// Test 1: Production validation rejects missing JWT_SECRET
const prodMissingJwt = {
  NODE_ENV: 'production',
  PORT: '5000',
  MONGODB_URI: 'mongodb+srv://cluster.example.com/foodlens',
};
const res1 = validateEnvironment(prodMissingJwt);
assert.equal(res1.isValid, false, 'Production without JWT_SECRET should be invalid');
assert.ok(res1.errors.some(e => e.includes('JWT_SECRET is required')), 'Should report missing JWT_SECRET error');

// Test 2: Production validation rejects trivial/short JWT_SECRET
const prodInsecureJwt = {
  NODE_ENV: 'production',
  PORT: '5000',
  MONGODB_URI: 'mongodb+srv://cluster.example.com/foodlens',
  JWT_SECRET: 'secret',
};
const res2 = validateEnvironment(prodInsecureJwt);
assert.equal(res2.isValid, false, 'Production with trivial JWT_SECRET should be invalid');
assert.ok(res2.errors.some(e => e.includes('at least 16 characters long')), 'Should report weak JWT_SECRET error');

// Test 3: Production validation rejects missing MONGODB_URI
const prodMissingMongo = {
  NODE_ENV: 'production',
  PORT: '5000',
  JWT_SECRET: 'a_very_secure_long_production_secret_key_12345',
};
const res3 = validateEnvironment(prodMissingMongo);
assert.equal(res3.isValid, false, 'Production without MONGODB_URI should be invalid');
assert.ok(res3.errors.some(e => e.includes('MONGODB_URI is required')), 'Should report missing MONGODB_URI error');

// Test 4: Production validation passes with valid secure parameters
const prodValid = {
  NODE_ENV: 'production',
  PORT: '5000',
  MONGODB_URI: 'mongodb+srv://cluster.example.com/foodlens',
  JWT_SECRET: 'a_very_secure_long_production_secret_key_12345',
  CLIENT_URL: 'https://foodlens.ai',
};
const res4 = validateEnvironment(prodValid);
assert.equal(res4.isValid, true, 'Valid production environment should pass');
assert.equal(res4.errors.length, 0);

// Test 5: Invalid PORT is rejected
const invalidPortEnv = {
  PORT: '999999',
  MONGODB_URI: 'mongodb://localhost:27017/foodlens',
};
const res5 = validateEnvironment(invalidPortEnv);
assert.equal(res5.isValid, false, 'Invalid port should be rejected');

// Test 6: Sanitized environment summary never leaks secrets
const sensitiveEnv = {
  NODE_ENV: 'production',
  PORT: '5000',
  MONGODB_URI: 'mongodb+srv://super_admin:P@ssw0rd123@cluster.example.com/foodlens',
  JWT_SECRET: 'super_secret_jwt_key_that_must_never_leak_in_logs',
  GEMINI_API_KEY: 'AIzaSySecretApiKey123456789',
};
const summary = getSanitizedEnvSummary(sensitiveEnv);
assert.equal(summary.nodeEnv, 'production');
assert.equal(summary.mongoConfigured, true);
assert.equal(summary.mongoProtocol, 'mongodb+srv');
assert.equal(summary.jwtSecretConfigured, true);
assert.equal(summary.geminiApiKeyConfigured, true);
// Assert that the raw sensitive strings are NOT present in the summary object
const summaryString = JSON.stringify(summary);
assert.equal(summaryString.includes('super_admin'), false, 'Database username must not leak in summary');
assert.equal(summaryString.includes('P@ssw0rd123'), false, 'Database password must not leak in summary');
assert.equal(summaryString.includes('super_secret_jwt_key'), false, 'JWT secret must not leak in summary');
assert.equal(summaryString.includes('AIzaSySecretApiKey'), false, 'Gemini API key must not leak in summary');

// Test 7: sanitizeMongoUri masks Atlas and standard credentials safely
const atlasRawUri = 'mongodb+srv://user_john:P%40ssw0rd!@cluster0.abcde.mongodb.net/foodlens?retryWrites=true&w=majority';
const sanitizedAtlas = sanitizeMongoUri(atlasRawUri);
assert.equal(sanitizedAtlas.includes('P%40ssw0rd!'), false, 'Password must be masked in sanitized URI');
assert.equal(sanitizedAtlas.includes('user_john'), false, 'Username must be masked in sanitized URI');
assert.ok(sanitizedAtlas.includes('mongodb+srv://****:****@cluster0.abcde.mongodb.net/foodlens'), 'Sanitized URI format must match');

console.log('✓ All Phase 11 Environment Validation & Secret Hardening tests passed successfully!');
