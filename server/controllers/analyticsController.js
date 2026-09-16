import { calculateUserAnalytics } from '../services/analyticsService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getAnalyticsSummary = asyncHandler(async (req, res) => {
  const { period = 'all' } = req.query;
  const userId = req.user.id;

  const analytics = await calculateUserAnalytics({ userId, period });

  res.status(200).json({
    success: true,
    message: 'Analytics summary retrieved successfully',
    data: analytics,
  });
});
