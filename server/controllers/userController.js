import { getUserProfile, updateUserProfile, updateUserPreferences } from '../services/userService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await getUserProfile(req.user.id);
  res.status(200).json({
    success: true,
    message: 'User profile retrieved successfully',
    data: { user },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, profileImage } = req.body;
  const user = await updateUserProfile(req.user.id, { name, profileImage });
  res.status(200).json({
    success: true,
    message: 'User profile updated successfully',
    data: { user },
  });
});

export const updatePreferences = asyncHandler(async (req, res) => {
  const { diet, healthGoals, allergies, restrictions } = req.body;
  const user = await updateUserPreferences(req.user.id, { diet, healthGoals, allergies, restrictions });
  res.status(200).json({
    success: true,
    message: 'User preferences updated successfully',
    data: { user },
  });
});
