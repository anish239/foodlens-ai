import express from 'express';
import { getAnalyticsSummary } from '../controllers/analyticsController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/summary', getAnalyticsSummary);

export default router;
