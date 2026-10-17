import { Router } from 'express';
import { getCategoriesController } from '../controllers/category.controller.js';

const router = Router();

/**
 * @route   GET /api/categories
 * @desc    Fetch all active marketplace categories
 * @access  Public
 */
router.get('/', getCategoriesController);

export default router;
