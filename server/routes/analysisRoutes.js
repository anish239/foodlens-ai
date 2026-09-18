import { Router } from 'express';
import { analyzeImageHandler } from '../controllers/analysisController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimitMiddleware.js';

const router = Router();

// Rate-limited and authenticated food image analysis endpoint
router.post('/image', aiLimiter, authenticate, analyzeImageHandler);

// Specialized route for nutrition label analysis
router.post('/label', aiLimiter, authenticate, (req, res, next) => {
  req.body.type = 'label';
  analyzeImageHandler(req, res, next);
});

export default router;
