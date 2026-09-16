import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { getJwtSecret } from '../config/envValidator.js';
import {
  findMemoryUserByEmail,
  findMemoryUserById,
  saveMemoryUser,
} from './userStore.js';

export const generateToken = (userId) => {
  const secret = getJwtSecret();
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  return jwt.sign({ userId: String(userId) }, secret, { expiresIn });
};

export const formatSafeUser = (user) => {
  return {
    _id: String(user._id),
    name: user.name,
    email: user.email,
    profileImage: user.profileImage || null,
    preferences: user.preferences || {
      diet: null,
      healthGoals: [],
      allergies: [],
      restrictions: [],
    },
    createdAt: user.createdAt || new Date(),
    updatedAt: user.updatedAt || new Date(),
  };
};

export const registerUser = async ({ name, email, password }) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const trimmedName = (name || '').trim();

  if (!trimmedName || !normalizedEmail || !password) {
    throw new ApiError(400, 'Please provide name, email, and password');
  }

  // Check MongoDB if connected
  if (mongoose.connection.readyState === 1) {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    const user = await User.create({
      name: trimmedName,
      email: normalizedEmail,
      password,
    });

    const safeUser = formatSafeUser(user);
    saveMemoryUser({
      ...safeUser,
      password: user.password,
    });

    const token = generateToken(user._id);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUTH REGISTER] email: ${normalizedEmail} | db: mongodb | id: ${user._id}`);
    }

    return {
      user: safeUser,
      token,
    };
  }

  // Resilient fallback storage if MongoDB connection is pending or in transition
  const existingMemUser = findMemoryUserByEmail(normalizedEmail);
  if (existingMemUser) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);
  const newId = new mongoose.Types.ObjectId().toString();

  const memUser = {
    _id: newId,
    name: trimmedName,
    email: normalizedEmail,
    password: hashedPassword,
    profileImage: null,
    preferences: {
      diet: null,
      healthGoals: [],
      allergies: [],
      restrictions: [],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  saveMemoryUser(memUser);

  const token = generateToken(newId);

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[AUTH REGISTER] email: ${normalizedEmail} | db: persistent-store | id: ${newId}`);
  }

  return {
    user: formatSafeUser(memUser),
    token,
  };
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new ApiError(400, 'Please provide email and password');
  }

  // 1. If MongoDB is connected, search MongoDB
  if (mongoose.connection.readyState === 1) {
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (user) {
      const isPasswordValid = await user.comparePassword(password);
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[AUTH LOGIN] email normalized: ${normalizedEmail} | user found: true (mongodb) | password field available: ${Boolean(user.password)} | bcrypt comparison: ${isPasswordValid}`);
      }

      if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid email or password');
      }

      const safeUser = formatSafeUser(user);
      saveMemoryUser({
        ...safeUser,
        password: user.password,
      });

      const token = generateToken(user._id);

      return {
        user: safeUser,
        token,
      };
    }
  }

  // 2. Check fallback store
  const memUser = findMemoryUserByEmail(normalizedEmail);
  if (memUser) {
    const isPasswordValid = await bcrypt.compare(password, memUser.password);
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[AUTH LOGIN] email normalized: ${normalizedEmail} | user found: true (persistent-store) | password field available: ${Boolean(memUser.password)} | bcrypt comparison: ${isPasswordValid}`);
    }

    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (mongoose.connection.readyState === 1) {
      try {
        let objectId;
        try {
          objectId = new mongoose.Types.ObjectId(String(memUser._id));
        } catch {
          objectId = new mongoose.Types.ObjectId();
        }
        await mongoose.connection.db.collection('users').insertOne({
          _id: objectId,
          name: memUser.name,
          email: normalizedEmail,
          password: memUser.password,
          profileImage: memUser.profileImage || null,
          preferences: memUser.preferences || {
            diet: null,
            healthGoals: [],
            allergies: [],
            restrictions: [],
          },
          createdAt: memUser.createdAt ? new Date(memUser.createdAt) : new Date(),
          updatedAt: memUser.updatedAt ? new Date(memUser.updatedAt) : new Date(),
        });
      } catch {
        // Ignore duplicate key or already-synced error
      }
    }

    const token = generateToken(memUser._id);

    return {
      user: formatSafeUser(memUser),
      token,
    };
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[AUTH LOGIN] email normalized: ${normalizedEmail} | user found: false`);
  }

  throw new ApiError(401, 'Invalid email or password');
};

