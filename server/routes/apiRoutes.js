import express from 'express';
import { getApiStatus } from '../controllers/healthController.js';
import healthRoutes from './healthRoutes.js';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import productRoutes from './productRoutes.js';
import historyRoutes from './historyRoutes.js';
import favoriteRoutes from './favoriteRoutes.js';
import analyticsRoutes from './analyticsRoutes.js';

const router = express.Router();

router.get('/', getApiStatus);
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);
router.use('/history', historyRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/analytics', analyticsRoutes);

export default router;

