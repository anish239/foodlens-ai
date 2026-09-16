import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { generateToken, formatSafeUser } from '../../services/authService.js';
import { getJwtSecret } from '../../config/envValidator.js';

console.log('Running Phase 11 Authentication & Authorization Security Tests...\n');

// Test 1: Token generation signs with configured secret
const userId = '654321098765432109876543';
const token = generateToken(userId);
assert.ok(typeof token === 'string' && token.split('.').length === 3, 'Token should be a valid 3-part JWT');

// Test 2: Token verification decodes userId correctly
const decoded = jwt.verify(token, getJwtSecret());
assert.equal(decoded.userId, userId, 'Decoded token should match generated userId');

// Test 3: Tampered token is rejected by jwt.verify
const tamperedToken = token.slice(0, -5) + 'abcde';
assert.throws(() => {
  jwt.verify(tamperedToken, getJwtSecret());
}, jwt.JsonWebTokenError, 'Tampered token must throw JsonWebTokenError');

// Test 4: Expired token rejection
const expiredToken = jwt.sign({ userId }, getJwtSecret(), { expiresIn: '0s' });
assert.throws(() => {
  jwt.verify(expiredToken, getJwtSecret());
}, jwt.TokenExpiredError, 'Expired token must throw TokenExpiredError');

// Test 5: Safe user formatting strips sensitive password/hash fields
const mockDbUser = {
  _id: '654321098765432109876543',
  name: 'Jane Doe',
  email: 'jane@example.com',
  password: '$2a$12$eX4mP1eH4sH3dPa55w0rdH4sh3dStr1ngH3r3',
  profileImage: null,
  preferences: {
    diet: 'vegetarian',
    healthGoals: ['High Protein'],
    allergies: ['peanuts'],
    restrictions: ['gluten-free'],
  },
  createdAt: new Date(),
  updatedAt: new Date(),
};

const safeUser = formatSafeUser(mockDbUser);
assert.equal(safeUser.name, 'Jane Doe');
assert.equal(safeUser.email, 'jane@example.com');
assert.equal(safeUser.password, undefined, 'Password field must never be included in safe user payload');
assert.equal(JSON.stringify(safeUser).includes('eX4mP1eH4sH3d'), false, 'Password hash must not appear in JSON serialization');

// Test 6: Bcrypt password hashing verification
const rawPassword = 'SuperSecretSecurePassword!2026';
const salt = await bcrypt.genSalt(10);
const hashed = await bcrypt.hash(rawPassword, salt);
assert.notEqual(rawPassword, hashed);
const isMatch = await bcrypt.compare(rawPassword, hashed);
assert.equal(isMatch, true, 'Bcrypt compare must succeed on valid password');
const isWrong = await bcrypt.compare('WrongPassword123', hashed);
assert.equal(isWrong, false, 'Bcrypt compare must fail on invalid password');

console.log('✓ All Phase 11 Authentication & Authorization Security tests passed successfully!');
