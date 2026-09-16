import { registerUser, loginUser } from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { getUserProfile } from '../services/userService.js';

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const result = await registerUser({ name, email, password });

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: result,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const result = await loginUser({ email, password });

  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: result,
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
    data: null,
  });
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await getUserProfile(req.user.id);
  res.status(200).json({
    success: true,
    message: 'Current user retrieved successfully',
    data: { user },
  });
});
