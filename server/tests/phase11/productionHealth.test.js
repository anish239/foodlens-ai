import assert from 'node:assert/strict';
import { requestIdMiddleware } from '../../middleware/requestIdMiddleware.js';

console.log('Running Phase 11 Production Health & Observability Tests...\n');

// Test 1: Request ID Middleware generates unique UUID if not provided
const req1 = { headers: {} };
const res1 = {
  headers: {},
  setHeader(name, val) {
    this.headers[name] = val;
  },
};
let calledNext1 = false;
requestIdMiddleware(req1, res1, () => {
  calledNext1 = true;
});
assert.equal(calledNext1, true);
assert.ok(req1.id && typeof req1.id === 'string' && req1.id.length >= 16, 'Request should have generated UUID');
assert.equal(res1.headers['X-Request-Id'], req1.id, 'X-Request-Id response header should match req.id');

// Test 2: Request ID Middleware preserves incoming valid X-Request-Id
const incomingTraceId = 'trace-corr-12345-abcdef';
const req2 = { headers: { 'x-request-id': incomingTraceId } };
const res2 = {
  headers: {},
  setHeader(name, val) {
    this.headers[name] = val;
  },
};
requestIdMiddleware(req2, res2, () => {});
assert.equal(req2.id, incomingTraceId, 'Should preserve incoming valid correlation ID');
assert.equal(res2.headers['X-Request-Id'], incomingTraceId);

// Test 3: Request ID Middleware sanitizes overly long / malformed trace IDs
const overlyLongId = 'a'.repeat(200);
const req3 = { headers: { 'x-request-id': overlyLongId } };
const res3 = {
  headers: {},
  setHeader(name, val) {
    this.headers[name] = val;
  },
};
requestIdMiddleware(req3, res3, () => {});
assert.notEqual(req3.id, overlyLongId, 'Overly long request IDs should be replaced with safe UUID');

console.log('✓ All Phase 11 Production Health & Observability tests passed successfully!');
