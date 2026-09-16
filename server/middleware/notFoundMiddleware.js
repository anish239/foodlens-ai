import { ApiError } from '../utils/ApiError.js';

export const notFoundMiddleware = (req, res, next) => {
  // Only trigger 404 ApiError if the request is an API call
  if (req.originalUrl.startsWith('/api')) {
    return next(new ApiError(404, `API route not found - ${req.originalUrl}`));
  }
  next();
};
