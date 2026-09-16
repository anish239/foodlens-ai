import mongoose from 'mongoose';
import ScanHistory from '../models/ScanHistory.js';
import { getUserProfile } from './userService.js';
import { fetchProductByBarcode, validateBarcode, normalizeBarcode } from './productService.js';
import { calculateFoodLensScore } from './scoreService.js';
import { calculateCompatibility } from './compatibilityService.js';
import { ApiError } from '../utils/ApiError.js';

const checkDbReady = () => {
  if (mongoose.connection.readyState !== 1) {
    throw new ApiError(503, 'Database connection is not available. Please provide a valid MongoDB Atlas MONGODB_URI in the backend environment.');
  }
};

export const extractProductSnapshot = (product) => {
  if (!product) return null;
  return {
    barcode: String(product.barcode || ''),
    name: String(product.name || 'Unknown Product').slice(0, 200),
    brand: String(product.brand || 'Unknown Brand').slice(0, 100),
    image: product.image ? String(product.image).slice(0, 500) : null,
    quantity: product.quantity ? String(product.quantity).slice(0, 50) : null,
    servingSize: product.servingSize ? String(product.servingSize).slice(0, 50) : null,
    nutrition: {
      energyKcal: typeof product.nutrition?.energyKcal === 'number' ? product.nutrition.energyKcal : null,
      sugars: typeof product.nutrition?.sugars === 'number' ? product.nutrition.sugars : null,
      proteins: typeof product.nutrition?.proteins === 'number' ? product.nutrition.proteins : null,
      fiber: typeof product.nutrition?.fiber === 'number' ? product.nutrition.fiber : null,
      fat: typeof product.nutrition?.fat === 'number' ? product.nutrition.fat : null,
      saturatedFat: typeof product.nutrition?.saturatedFat === 'number' ? product.nutrition.saturatedFat : null,
      salt: typeof product.nutrition?.salt === 'number' ? product.nutrition.salt : null,
      sodium: typeof product.nutrition?.sodium === 'number' ? product.nutrition.sodium : null,
    },
    nutriscore: product.nutriscore ? String(product.nutriscore).slice(0, 5) : null,
    novaGroup: typeof product.novaGroup === 'number' ? product.novaGroup : null,
    allergens: Array.isArray(product.allergens) ? product.allergens.slice(0, 20) : [],
    traces: Array.isArray(product.traces) ? product.traces.slice(0, 20) : [],
  };
};

export const extractScoreSnapshot = (score) => {
  if (!score) {
    return {
      score: 100,
      grade: 'Excellent',
      label: 'Excellent',
      version: '1.0',
      positives: [],
      concerns: [],
    };
  }
  return {
    score: typeof score.score === 'number' ? score.score : 100,
    grade: score.grade || 'Moderate',
    label: score.label || 'Moderate',
    version: score.version || '1.0',
    positives: Array.isArray(score.positives) ? score.positives.slice(0, 10) : [],
    concerns: Array.isArray(score.concerns) ? score.concerns.slice(0, 10) : [],
  };
};

export const extractCompatibilitySnapshot = (compat) => {
  if (!compat) {
    return {
      status: 'compatible',
      summary: 'No dietary restrictions configured.',
      reasons: [],
      conflicts: [],
      traceWarnings: [],
      positiveAlignments: [],
      missingDataWarnings: [],
    };
  }
  return {
    status: compat.status || 'compatible',
    summary: compat.summary || '',
    reasons: Array.isArray(compat.reasons) ? compat.reasons.slice(0, 10) : [],
    conflicts: Array.isArray(compat.conflicts) ? compat.conflicts.slice(0, 10) : [],
    traceWarnings: Array.isArray(compat.traceWarnings) ? compat.traceWarnings.slice(0, 10) : [],
    positiveAlignments: Array.isArray(compat.positiveAlignments) ? compat.positiveAlignments.slice(0, 10) : [],
    missingDataWarnings: Array.isArray(compat.missingDataWarnings) ? compat.missingDataWarnings.slice(0, 10) : [],
  };
};

/**
 * Records a barcode scan event in user's history with server-calculated score and compatibility.
 */
export const recordScanEvent = async ({ userId, barcode }) => {
  checkDbReady();
  if (!userId) {
    throw new ApiError(401, 'Authentication required to record scan history');
  }

  const normalized = normalizeBarcode(barcode);
  if (!normalized || !validateBarcode(normalized)) {
    throw new ApiError(400, 'Invalid barcode format');
  }

  // 1. Fetch user for preferences
  const user = await getUserProfile(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // 2. Fetch canonical product
  const product = await fetchProductByBarcode(normalized);
  if (!product) {
    throw new ApiError(404, 'Product not found for the provided barcode');
  }

  // 3. Compute deterministic score & compatibility server-side
  const scoreResult = calculateFoodLensScore(product);
  const compatResult = calculateCompatibility(product, user.preferences || {});

  // 4. Create bounded history snapshot
  const productSnapshot = extractProductSnapshot(product);
  const scoreSnapshot = extractScoreSnapshot(scoreResult);
  const compatSnapshot = extractCompatibilitySnapshot(compatResult);

  if (mongoose.connection.readyState === 1) {
    const historyEntry = await ScanHistory.create({
      user: userId,
      barcode: normalized,
      product: productSnapshot,
      score: scoreSnapshot,
      compatibility: compatSnapshot,
      scannedAt: new Date(),
    });
    return historyEntry;
  }

  return {
    _id: 'local-' + Date.now(),
    user: userId,
    barcode: normalized,
    product: productSnapshot,
    score: scoreSnapshot,
    compatibility: compatSnapshot,
    scannedAt: new Date(),
  };
};

/**
 * Retrieves paginated scan history for the authenticated user, newest first.
 */
export const getUserScanHistory = async ({ userId, page = 1, pageSize = 20 }) => {
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const p = Math.max(1, parseInt(page, 10) || 1);
  const ps = Math.max(1, Math.min(50, parseInt(pageSize, 10) || 20));

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
    ScanHistory.find({ user: userId })
      .sort({ scannedAt: -1 })
      .skip(skip)
      .limit(ps)
      .lean(),
    ScanHistory.countDocuments({ user: userId }),
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
 * Deletes a specific history record owned by the authenticated user.
 */
export const deleteUserScanHistoryItem = async ({ userId, historyId }) => {
  checkDbReady();
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  if (!historyId) {
    throw new ApiError(400, 'History ID is required');
  }

  const item = await ScanHistory.findOneAndDelete({
    _id: historyId,
    user: userId,
  });

  if (!item) {
    throw new ApiError(404, 'Scan history record not found or unauthorized');
  }

  return {
    deletedId: historyId,
    success: true,
  };
};

/**
 * Clears all scan history for the authenticated user.
 */
export const clearUserScanHistory = async ({ userId }) => {
  checkDbReady();
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const result = await ScanHistory.deleteMany({ user: userId });

  return {
    deletedCount: result.deletedCount || 0,
    success: true,
  };
};
