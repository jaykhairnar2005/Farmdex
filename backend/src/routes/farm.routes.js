import { Router } from 'express';
import {
  createFarmController,
  getFarmerFarmsController,
  getFarmByIdController,
  updateFarmController,
  deleteFarmController,
} from '../controllers/farm.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

// All farm management endpoints require authenticated FARMER role
router.use(authenticateToken, authorizeRoles('FARMER'));

/**
 * @route   POST /api/farms
 * @desc    Create a new Farm record
 */
router.post('/', createFarmController);

/**
 * @route   GET /api/farms
 * @desc    List all farms owned by current farmer
 */
router.get('/', getFarmerFarmsController);

/**
 * @route   GET /api/farms/:id
 * @desc    Get single farm details (Enforces owner isolation)
 */
router.get('/:id', getFarmByIdController);

/**
 * @route   PUT /api/farms/:id
 * @desc    Update farm details (Enforces owner isolation)
 */
router.put('/:id', updateFarmController);

/**
 * @route   DELETE /api/farms/:id
 * @desc    Delete farm record (Enforces owner isolation & active listing safeguards)
 */
router.delete('/:id', deleteFarmController);

export default router;
