import crypto from 'crypto';

/**
 * Request Correlation ID Middleware
 * 
 * Attaches a unique request ID (X-Request-Id) to each incoming HTTP request.
 * Useful for tracking errors and logs without exposing sensitive parameters.
 */
export const requestIdMiddleware = (req, res, next) => {
  const incomingId = req.headers['x-request-id'];
  const requestId = (typeof incomingId === 'string' && incomingId.trim().length > 0 && incomingId.length <= 64)
    ? incomingId.trim()
    : crypto.randomUUID();

  req.id = requestId;
  res.setHeader('X-Request-Id', requestId);
  next();
};
