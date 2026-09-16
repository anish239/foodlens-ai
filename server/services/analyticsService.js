import mongoose from 'mongoose';
import ScanHistory from '../models/ScanHistory.js';
import Favorite from '../models/Favorite.js';
import { ApiError } from '../utils/ApiError.js';

/**
 * Calculates deterministic analytics for the authenticated user across time period.
 */
export const calculateUserAnalytics = async ({ userId, period = 'all' }) => {
  if (!userId) {
    throw new ApiError(401, 'Authentication required');
  }

  const allowedPeriods = ['all', '7d', '30d', '90d'];
  const validPeriod = allowedPeriods.includes(period) ? period : 'all';

  const emptyAnalytics = {
    period: validPeriod,
    totalScans: 0,
    uniqueProducts: 0,
    favoriteCount: 0,
    averageScore: null,
    highestScore: null,
    lowestScore: null,
    scoreDistribution: {
      excellent: 0,
      good: 0,
      moderate: 0,
      poor: 0,
      avoid: 0,
    },
    compatibility: {
      compatible: 0,
      caution: 0,
      notCompatible: 0,
    },
    recentScans: [],
    recentFavorites: [],
  };

  if (mongoose.connection.readyState !== 1) {
    return emptyAnalytics;
  }

  const query = { user: userId };

  if (validPeriod !== 'all') {
    const now = new Date();
    const days = validPeriod === '7d' ? 7 : validPeriod === '30d' ? 30 : 90;
    const sinceDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    query.scannedAt = { $gte: sinceDate };
  }

  // Fetch scans for analytics calculation and recent scans
  const [scans, favoriteCount, recentFavorites] = await Promise.all([
    ScanHistory.find(query).sort({ scannedAt: -1 }).lean(),
    Favorite.countDocuments({ user: userId }),
    Favorite.find({ user: userId }).sort({ createdAt: -1 }).limit(4).lean(),
  ]);

  const totalScans = scans.length;
  const uniqueBarcodes = new Set(scans.map((s) => s.barcode));
  const uniqueProducts = uniqueBarcodes.size;

  if (totalScans === 0) {
    return {
      ...emptyAnalytics,
      favoriteCount,
      recentFavorites: recentFavorites.map((f) => ({
        barcode: f.barcode,
        name: f.product?.name || 'Unknown Product',
        brand: f.product?.brand || 'Unknown Brand',
        image: f.product?.image || null,
        nutriscore: f.product?.nutriscore || null,
        score: f.score?.score ?? null,
        favoritedAt: f.createdAt,
      })),
    };
  }

  // Calculate score statistics
  const scores = scans
    .map((s) => s.score?.score)
    .filter((score) => typeof score === 'number' && !isNaN(score));

  let averageScore = null;
  let highestScore = null;
  let lowestScore = null;

  if (scores.length > 0) {
    const sum = scores.reduce((acc, val) => acc + val, 0);
    averageScore = Math.round((sum / scores.length) * 10) / 10;
    highestScore = Math.max(...scores);
    lowestScore = Math.min(...scores);
  }

  // Calculate score distribution
  const scoreDistribution = {
    excellent: 0, // 85-100
    good: 0,      // 70-84
    moderate: 0,  // 50-69
    poor: 0,      // 30-49
    avoid: 0,     // 0-29
  };

  for (const s of scores) {
    if (s >= 85) scoreDistribution.excellent += 1;
    else if (s >= 70) scoreDistribution.good += 1;
    else if (s >= 50) scoreDistribution.moderate += 1;
    else if (s >= 30) scoreDistribution.poor += 1;
    else scoreDistribution.avoid += 1;
  }

  // Calculate compatibility breakdown
  const compatibility = {
    compatible: 0,
    caution: 0,
    notCompatible: 0,
  };

  for (const scan of scans) {
    const status = scan.compatibility?.status;
    if (status === 'compatible') compatibility.compatible += 1;
    else if (status === 'caution') compatibility.caution += 1;
    else if (status === 'not_compatible') compatibility.notCompatible += 1;
  }

  const recentScans = scans.slice(0, 5).map((s) => ({
    id: s._id,
    barcode: s.barcode,
    name: s.product?.name || 'Unknown Product',
    brand: s.product?.brand || 'Unknown Brand',
    image: s.product?.image || null,
    nutriscore: s.product?.nutriscore || null,
    score: s.score?.score ?? null,
    scoreGrade: s.score?.grade || null,
    compatibilityStatus: s.compatibility?.status || 'compatible',
    scannedAt: s.scannedAt,
  }));

  const formattedRecentFavorites = recentFavorites.map((f) => ({
    id: f._id,
    barcode: f.barcode,
    name: f.product?.name || 'Unknown Product',
    brand: f.product?.brand || 'Unknown Brand',
    image: f.product?.image || null,
    nutriscore: f.product?.nutriscore || null,
    score: f.score?.score ?? null,
    favoritedAt: f.createdAt,
  }));

  return {
    period: validPeriod,
    totalScans,
    uniqueProducts,
    favoriteCount,
    averageScore,
    highestScore,
    lowestScore,
    scoreDistribution,
    compatibility,
    recentScans,
    recentFavorites: formattedRecentFavorites,
  };
};

