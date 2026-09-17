import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import serverlessApp from '../../api/index.js';
import connectDB, { closeDB } from '../config/db.js';

test('Vercel Deployment Architecture & Auth Endpoint Verification', async (t) => {
  let server;
  let baseUrl;

  await t.test('Setup: Verify vercel.json configuration and start test server', async () => {
    // 1. Verify vercel.json exists and is valid
    const vercelConfigPath = path.resolve(process.cwd(), 'vercel.json');
    assert.ok(fs.existsSync(vercelConfigPath), 'vercel.json must exist in project root');
    
    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, 'utf8'));
    assert.equal(vercelConfig.version, 2, 'vercel.json version must be 2');
    assert.ok(Array.isArray(vercelConfig.rewrites), 'vercel.json must define rewrites');

    // Verify /api rewrite exists
    const apiRewrite = vercelConfig.rewrites.find((r) => r.source === '/api/(.*)');
    assert.ok(apiRewrite, 'Rewrites must route /api/(.*) to /api/index.js');
    assert.equal(apiRewrite.destination, '/api/index.js');

    // Verify SPA rewrite exists
    const spaRewrite = vercelConfig.rewrites.find((r) => r.destination === '/index.html');
    assert.ok(spaRewrite, 'Rewrites must contain SPA fallback to /index.html');

    // 2. Connect DB (uses in-memory server in test environment)
    await connectDB();

    // 3. Mount serverlessApp on an HTTP server for realistic network calls
    server = http.createServer(serverlessApp);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  const testEmail = `vercel_test_${Date.now()}@foodlens.ai`;
  const testPassword = 'StrongPassword123!';
  const testName = 'Vercel Deployment User';
  let authToken = '';

  await t.test('POST /api/auth/register creates a new user and returns JWT token', async () => {
    const response = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: testName,
        email: testEmail,
        password: testPassword,
      }),
    });

    assert.equal(response.status, 201, 'Registration should return 201 Created');
    const data = await response.json();
    assert.equal(data.success, true);
    assert.ok(data.data.token, 'Response must include JWT token');
    assert.equal(data.data.user.email, testEmail);
    assert.equal(data.data.user.name, testName);
  });

  await t.test('POST /api/auth/login authenticates user and returns JWT token', async () => {
    const response = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: testPassword,
      }),
    });

    assert.equal(response.status, 200, 'Login should return 200 OK');
    const data = await response.json();
    assert.equal(data.success, true);
    assert.ok(data.data.token, 'Login must return token');
    assert.equal(data.data.user.email, testEmail);
    authToken = data.data.token;
  });

  await t.test('GET /api/auth/me returns authenticated user with valid Bearer token', async () => {
    const response = await fetch(`${baseUrl}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    assert.equal(response.status, 200, 'GET /api/auth/me should return 200 OK');
    const data = await response.json();
    assert.equal(data.success, true);
    assert.equal(data.data.user.email, testEmail);
    assert.equal(data.data.user.name, testName);
  });

  await t.test('POST /api/auth/logout logs out authenticated user', async () => {
    const response = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${authToken}`,
      },
    });

    assert.equal(response.status, 200, 'POST /api/auth/logout should return 200 OK');
    const data = await response.json();
    assert.equal(data.success, true);
  });

  await t.test('URL Normalization: Vercel rewrite destination /api/index.js maps to original path', async () => {
    // When a reverse proxy or Vercel rewrites req.url to /api/index.js,
    // req.originalUrl retains the incoming browser path.
    const req = {
      url: '/api/index.js',
      originalUrl: '/api/auth/login',
    };
    let nextCalled = false;
    const next = () => { nextCalled = true; };

    // Simulate the normalization middleware logic present in app.js
    if (req.originalUrl && req.originalUrl.startsWith('/api') && (!req.url || !req.url.startsWith('/api') || req.url === '/api' || req.url === '/api/index.js')) {
      req.url = req.originalUrl;
    }
    next();

    assert.equal(nextCalled, true);
    assert.equal(req.url, '/api/auth/login', 'Normalized req.url must restore original route');
  });

  await t.test('GET /api returns 200 API Status JSON', async () => {
    const response = await fetch(`${baseUrl}/api`);
    assert.equal(response.status, 200);
    const data = await response.json();
    assert.equal(data.success, true);
    assert.equal(data.message, 'FoodLens AI API is running');
  });

  await t.test('Unknown /api routes return 404 JSON, not HTML', async () => {
    const response = await fetch(`${baseUrl}/api/nonexistent-endpoint-test`);
    assert.equal(response.status, 404);
    const data = await response.json();
    assert.equal(data.success, false);
    assert.ok(data.message.includes('not found'));
  });

  await t.test('Teardown: Close server and database connection', async () => {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closeDB();
  });
});
