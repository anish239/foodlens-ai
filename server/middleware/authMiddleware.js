import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getJwtSecret } from '../config/envValidator.js';
import { findMemoryUserById } from '../services/userStore.js';

export const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new ApiError(401, 'Authentication token missing or malformed');
  }

  const token = authHeader.split(' ')[1];

  let decoded;
  try {
    const secret = getJwtSecret();
    decoded = jwt.verify(token, secret);
  } catch (jwtError) {
    if (jwtError.name === 'TokenExpiredError') {
      throw new ApiError(401, 'Authentication token expired');
    }
    throw new ApiError(401, 'Invalid authentication token');
  }

  let user = null;

  // 1. Try MongoDB if connected
  if (mongoose.connection.readyState === 1) {
    try {
      user = await User.findById(decoded.userId).lean();
    } catch {
      // ignore query cast error
    }
  }

  // 2. Fallback to memory store if not found in MongoDB
  if (!user) {
    user = findMemoryUserById(decoded.userId);
  }

  if (!user) {
    throw new ApiError(401, 'User belonging to this token no longer exists');
  }

  req.user = {
    id: String(user._id),
    email: user.email,
    name: user.name,
  };

  next();
});

