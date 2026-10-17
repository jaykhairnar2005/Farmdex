import { Router } from 'express';
import { createComplaintController } from '../controllers/admin.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   POST /api/complaints
 * @desc    Submit a complaint on a crop listing or order
 * @access  Private (BUYER / FARMER / ADMIN)
 */
router.post('/', authenticateToken, createComplaintController);

export default router;
