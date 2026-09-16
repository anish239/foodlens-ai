import express from 'express';
import {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite,
} from '../controllers/favoriteController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getFavorites);
router.get('/check/:barcode', checkFavorite);
router.post('/', addFavorite);
router.delete('/:barcode', removeFavorite);

export default router;
