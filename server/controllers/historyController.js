import {
  recordScanEvent,
  getUserScanHistory,
  deleteUserScanHistoryItem,
  clearUserScanHistory,
} from '../services/historyService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createHistory = asyncHandler(async (req, res) => {
  const { barcode } = req.body;
  const userId = req.user.id;

  const entry = await recordScanEvent({ userId, barcode });

  res.status(201).json({
    success: true,
    message: 'Scan history recorded successfully',
    data: {
      history: entry,
    },
  });
});

export const getHistory = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;
  const userId = req.user.id;

  const result = await getUserScanHistory({ userId, page, pageSize });

  res.status(200).json({
    success: true,
    message: 'Scan history retrieved successfully',
    data: result,
  });
});

export const deleteHistory = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  const result = await deleteUserScanHistoryItem({ userId, historyId: id });

  res.status(200).json({
    success: true,
    message: 'Scan history record deleted',
    data: result,
  });
});

export const clearHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await clearUserScanHistory({ userId });

  res.status(200).json({
    success: true,
    message: 'Scan history cleared successfully',
    data: result,
  });
});
