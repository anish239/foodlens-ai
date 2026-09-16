import mongoose from 'mongoose';
import User from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { formatSafeUser } from './authService.js';
import { findMemoryUserById, updateMemoryUser } from './userStore.js';

const SUPPORTED_DIETS = ['vegetarian', 'vegan', 'non-vegetarian', 'pescatarian', 'eggetarian', 'other', null];
const SUPPORTED_GOALS = ['high-protein', 'low-sugar', 'low-sodium', 'high-fiber', 'weight-management', 'weight-gain', 'muscle-building', 'balanced-diet'];
const SUPPORTED_ALLERGIES = ['nuts', 'peanuts', 'milk', 'lactose', 'soy', 'egg', 'gluten', 'wheat', 'fish', 'shellfish', 'sesame', 'other'];
const SUPPORTED_RESTRICTIONS = ['gluten-free', 'lactose-free', 'dairy-free', 'nut-free', 'peanut-free', 'soy-free', 'egg-free'];

export const getUserProfile = async (userId) => {
  if (mongoose.connection.readyState === 1) {
    try {
      const user = await User.findById(userId);
      if (user) {
        return formatSafeUser(user);
      }
    } catch {
      // fallback to memory
    }
  }

  const memUser = findMemoryUserById(userId);
  if (memUser) {
    return formatSafeUser(memUser);
  }

  throw new ApiError(404, 'User not found');
};

export const updateUserProfile = async (userId, updateData) => {
  const allowedUpdates = {};
  if (updateData.name) allowedUpdates.name = updateData.name.trim();
  if (updateData.profileImage !== undefined) allowedUpdates.profileImage = updateData.profileImage;

  if (mongoose.connection.readyState === 1) {
    try {
      const user = await User.findByIdAndUpdate(userId, allowedUpdates, {
        new: true,
        runValidators: true,
      });
      if (user) {
        updateMemoryUser(userId, allowedUpdates);
        return formatSafeUser(user);
      }
    } catch {
      // fallback to memory
    }
  }

  const memUser = updateMemoryUser(userId, allowedUpdates);
  if (memUser) {
    return formatSafeUser(memUser);
  }

  throw new ApiError(404, 'User not found');
};

export const updateUserPreferences = async (userId, preferencesData) => {
  const { diet, healthGoals, allergies, restrictions } = preferencesData;

  const validatedPreferences = {
    diet: null,
    healthGoals: [],
    allergies: [],
    restrictions: [],
  };

  if (diet !== undefined) {
    if (diet !== null && !SUPPORTED_DIETS.includes(diet)) {
      throw new ApiError(400, `Invalid diet option: ${diet}`);
    }
    validatedPreferences.diet = diet;
  }

  if (healthGoals !== undefined) {
    if (!Array.isArray(healthGoals)) {
      throw new ApiError(400, 'Health goals must be an array');
    }
    for (const goal of healthGoals) {
      if (!SUPPORTED_GOALS.includes(goal)) {
        throw new ApiError(400, `Invalid health goal: ${goal}`);
      }
    }
    validatedPreferences.healthGoals = [...new Set(healthGoals)];
  }

  if (allergies !== undefined) {
    if (!Array.isArray(allergies)) {
      throw new ApiError(400, 'Allergies must be an array');
    }
    for (const allergy of allergies) {
      if (!SUPPORTED_ALLERGIES.includes(allergy)) {
        throw new ApiError(400, `Invalid allergy: ${allergy}`);
      }
    }
    validatedPreferences.allergies = [...new Set(allergies)];
  }

  if (restrictions !== undefined) {
    if (!Array.isArray(restrictions)) {
      throw new ApiError(400, 'Restrictions must be an array');
    }
    for (const restriction of restrictions) {
      if (!SUPPORTED_RESTRICTIONS.includes(restriction)) {
        throw new ApiError(400, `Invalid restriction: ${restriction}`);
      }
    }
    validatedPreferences.restrictions = [...new Set(restrictions)];
  }

  if (mongoose.connection.readyState === 1) {
    try {
      const user = await User.findById(userId);
      if (user) {
        user.preferences = {
          diet: diet !== undefined ? validatedPreferences.diet : user.preferences?.diet,
          healthGoals: healthGoals !== undefined ? validatedPreferences.healthGoals : user.preferences?.healthGoals || [],
          allergies: allergies !== undefined ? validatedPreferences.allergies : user.preferences?.allergies || [],
          restrictions: restrictions !== undefined ? validatedPreferences.restrictions : user.preferences?.restrictions || [],
        };
        await user.save();
        updateMemoryUser(userId, { preferences: user.preferences });
        return formatSafeUser(user);
      }
    } catch {
      // fallback to memory
    }
  }

  const memUser = findMemoryUserById(userId);
  if (memUser) {
    const updatedPreferences = {
      diet: diet !== undefined ? validatedPreferences.diet : memUser.preferences?.diet,
      healthGoals: healthGoals !== undefined ? validatedPreferences.healthGoals : memUser.preferences?.healthGoals || [],
      allergies: allergies !== undefined ? validatedPreferences.allergies : memUser.preferences?.allergies || [],
      restrictions: restrictions !== undefined ? validatedPreferences.restrictions : memUser.preferences?.restrictions || [],
    };
    const updated = updateMemoryUser(userId, { preferences: updatedPreferences });
    return formatSafeUser(updated);
  }

  throw new ApiError(404, 'User not found');
};

