import express from 'express';
import { getProfile, updateProfile, updatePreferences } from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateProfileUpdate, validatePreferencesUpdate } from '../middleware/requestValidationMiddleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/profile', getProfile);
router.patch('/profile', validateProfileUpdate, updateProfile);
router.patch('/preferences', validatePreferencesUpdate, updatePreferences);

export default router;
