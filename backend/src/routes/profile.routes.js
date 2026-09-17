import { Router } from 'express';
import {
  getMeProfileController,
  updateFarmerProfileController,
  updateBuyerProfileController,
} from '../controllers/profile.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   GET /api/profiles/me
 * @desc    Get authenticated user's full profile
 */
router.get('/me', authenticateToken, getMeProfileController);

/**
 * @route   PUT /api/profiles/farmer
 * @desc    Update farmer profile fields (Partial update)
 */
router.put('/farmer', authenticateToken, authorizeRoles('FARMER'), updateFarmerProfileController);

/**
 * @route   PUT /api/profiles/buyer
 * @desc    Update buyer profile fields (Partial update)
 */
router.put('/buyer', authenticateToken, authorizeRoles('BUYER'), updateBuyerProfileController);

export default router;
