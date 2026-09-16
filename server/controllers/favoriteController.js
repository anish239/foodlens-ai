import {
  getUserFavorites,
  addUserFavorite,
  removeUserFavorite,
  checkUserFavorite,
} from '../services/favoriteService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getFavorites = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 50 } = req.query;
  const userId = req.user.id;

  const result = await getUserFavorites({ userId, page, pageSize });

  res.status(200).json({
    success: true,
    message: 'Favorites retrieved successfully',
    data: result,
  });
});

export const checkFavorite = asyncHandler(async (req, res) => {
  const { barcode } = req.params;
  const userId = req.user.id;

  const result = await checkUserFavorite({ userId, barcode });

  res.status(200).json({
    success: true,
    data: result,
  });
});

export const addFavorite = asyncHandler(async (req, res) => {
  const { barcode } = req.body;
  const userId = req.user.id;

  const result = await addUserFavorite({ userId, barcode });

  res.status(200).json({
    success: true,
    message: result.isNew ? 'Added to favorites' : 'Product is already in favorites',
    data: result,
  });
});

export const removeFavorite = asyncHandler(async (req, res) => {
  const { barcode } = req.params;
  const userId = req.user.id;

  const result = await removeUserFavorite({ userId, barcode });

  res.status(200).json({
    success: true,
    message: result.deleted ? 'Removed from favorites' : 'Product was not in favorites',
    data: result,
  });
});
