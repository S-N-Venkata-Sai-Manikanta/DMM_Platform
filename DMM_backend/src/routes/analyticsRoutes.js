import express from 'express';
import {
  getAnalytics,
  getPlatformHistory,
  recordAnalytics,
} from '../controllers/analyticsController.js';
import { protect, authorize } from '../middleware/auth.js';
import { ROLES } from '../config/constants.js';

const router = express.Router();
router.use(protect);

router.get('/', getAnalytics);
router.get('/:platform/history', getPlatformHistory);
router.post('/', authorize(ROLES.ADMIN, ROLES.CEO), recordAnalytics);

export default router;
