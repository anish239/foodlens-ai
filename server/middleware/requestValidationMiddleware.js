import { ApiError } from '../utils/ApiError.js';

export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password || typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    return next(new ApiError(400, 'Please provide name, email, and password'));
  }
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();
  if (trimmedName.length < 2) {
    return next(new ApiError(400, 'Name must be at least 2 characters long'));
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    return next(new ApiError(400, 'Please provide a valid email address'));
  }
  if (password.length < 8) {
    return next(new ApiError(400, 'Password must be at least 8 characters long'));
  }
  req.body.name = trimmedName;
  req.body.email = trimmedEmail;
  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body || {};
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return next(new ApiError(400, 'Please provide email and password'));
  }
  const trimmedEmail = email.trim().toLowerCase();
  if (!trimmedEmail || !password) {
    return next(new ApiError(400, 'Please provide email and password'));
  }
  req.body.email = trimmedEmail;
  next();
};

export const validateProfileUpdate = (req, res, next) => {
  const { name, profileImage } = req.body || {};
  if (name !== undefined && name.trim().length < 2) {
    return next(new ApiError(400, 'Name must be at least 2 characters long'));
  }
  next();
};

export const validatePreferencesUpdate = (req, res, next) => {
  const { diet, healthGoals, allergies, restrictions } = req.body || {};
  if (diet !== undefined && diet !== null && typeof diet !== 'string') {
    return next(new ApiError(400, 'Invalid diet format'));
  }
  if (healthGoals !== undefined && !Array.isArray(healthGoals)) {
    return next(new ApiError(400, 'Health goals must be an array'));
  }
  if (allergies !== undefined && !Array.isArray(allergies)) {
    return next(new ApiError(400, 'Allergies must be an array'));
  }
  if (restrictions !== undefined && !Array.isArray(restrictions)) {
    return next(new ApiError(400, 'Restrictions must be an array'));
  }
  next();
};

export const validateRequest = (validatorFn) => {
  return validatorFn;
};
