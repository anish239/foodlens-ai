import express from 'express';
import {
  createHistory,
  getHistory,
  deleteHistory,
  clearHistory,
} from '../controllers/historyController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getHistory);
router.post('/', createHistory);
router.delete('/:id', deleteHistory);
router.delete('/', clearHistory);

export default router;
