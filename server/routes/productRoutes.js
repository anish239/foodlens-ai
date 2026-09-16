import express from 'express';
import {
  searchProducts,
  compareProducts,
  lookupProductByBarcode,
  getProductScoreByBarcode,
  getProductCompatibilityByBarcode,
  getProductInsight,
  submitManualProduct,
} from '../controllers/productController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { aiLimiter } from '../middleware/rateLimitMiddleware.js';

const router = express.Router();

router.use(authenticate);

// Product Search & Comparison
router.get('/search', searchProducts);
router.get('/compare', compareProducts);

// Manual Product Evaluation & Fallback
router.post('/manual', submitManualProduct);

// Barcode Product Endpoints
router.get('/barcode/:barcode', lookupProductByBarcode);
router.get('/barcode/:barcode/score', getProductScoreByBarcode);
router.get('/barcode/:barcode/compatibility', getProductCompatibilityByBarcode);
router.get('/barcode/:barcode/insight', aiLimiter, getProductInsight);

export default router;

