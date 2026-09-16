import mongoose from 'mongoose';
import Favorite from '../models/Favorite.js';
import { fetchProductByBarcode, validateBarcode, normalizeBarcode } from './productService.js';
import { calculateFoodLensScore } from './scoreService.js';
import { extractProductSnapshot } from './historyService.js';
import { ApiError } from '../utils/ApiError.js';

const checkDbReady = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, 'Database connection is not available. Please provide a valid MongoDB Atlas MONGODB_URI in the backend environment.');
  }
};

/**
 * Retrieves favorites for the authenticated user, newest first.
 */
export const getUserFavorites = async ({ userId, page = 1, pageSize = 50 }) => {
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.max(1, Math.min(100, parseInt(pageSize, 10) || 50));

  if (mongoose.connection.readyState !== 1) {
    return {
      items: [],
      pagination: {
        page: p,
        pageSize: ps,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
      },
    };
  }

  const skip = (p - 1) * ps;

  const [items, total] = await Promise.all([
    Favorite.find({ user: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(ps)
      .lean(),
    Favorite.countDocuments({ user: userId }),
  ]);

  const totalPages = Math.ceil(total / ps);

  return {
    items,
    pagination: {
      page: p,
      pageSize: ps,
      total,
      totalPages,
      hasNextPage: p < totalPages,
    },
  };
};

/**
 * Checks if a specific barcode is in user's favorites.
 */
export const checkUserFavorite = async ({ userId, barcode }) => {
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const normalized = normalizeBarcode(barcode);
  if (!normalized || mongoose.connection.readyState !== 1) {
    return { isFavorite: false };
  }

  const existing = await Favorite.findOne({ user: userId, barcode: normalized }).lean();
  return {
    isFavorite: !!existing,
    favoriteId: existing?._id || null,
  };
};


/**
 * Adds a product to user's favorites (idempotent).
 */
export const addUserFavorite = async ({ userId, barcode }) => {
  checkDbReady();
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const normalized = normalizeBarcode(barcode);
  if (!normalized || !validateBarcode(normalized)) {
    throw new ApiError(400, 'Invalid barcode format');
  }

  // Check if already favorited (idempotent)
  const existing = await Favorite.findOne({ user: userId, barcode: normalized });
  if (existing) {
    return {
      favorite: existing,
      isNew: false,
    };
  }

  // Fetch canonical product server-side
  const product = await fetchProductByBarcode(normalized);
  if (!product) {
    throw new ApiError(404, 'Product not found for the provided barcode');
  }

  // Calculate FoodLens score for snapshot
  const scoreResult = calculateFoodLensScore(product);

  const productSnapshot = extractProductSnapshot(product);

  const favorite = await Favorite.create({
    user: userId,
    barcode: normalized,
    product: productSnapshot,
    score: {
      score: scoreResult.score,
      grade: scoreResult.grade,
      label: scoreResult.label,
    },
  });

  return {
    favorite,
    isNew: true,
  };
};

/**
 * Removes a product from user's favorites by barcode.
 */
export const removeUserFavorite = async ({ userId, barcode }) => {
  checkDbReady();
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const normalized = normalizeBarcode(barcode);
  if (!normalized) {
    throw new ApiError(400, 'Invalid barcode');
  }

  const result = await Favorite.findOneAndDelete({
    user: userId,
    barcode: normalized,
  });

  return {
    deleted: !!result,
    barcode: normalized,
  };
};
