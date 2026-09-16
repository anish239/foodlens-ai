import rateLimit, { ipKeyGenerator } from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next, options) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again after 15 minutes.',
    });
  },
});

export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Stricter limit for AI endpoints
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    // Rate limit by authenticated user ID if present, otherwise by IPv6-safe IP
    return req.user?.id || ipKeyGenerator(req.ip) || 'anonymous';
  },
  handler: (req, res, next, options) => {
    res.status(429).json({
      success: false,
      message: 'AI request limit reached. Please wait a few minutes before generating more AI insights.',
    });
  },
});
