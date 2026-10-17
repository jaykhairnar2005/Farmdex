import { getActiveCategoriesService } from '../services/category.service.js';

/**
 * @route   GET /api/categories
 * @desc    Fetch all active marketplace categories (Public)
 * @access  Public
 */
export async function getCategoriesController(req, res, next) {
  try {
    const categories = await getActiveCategoriesService();
    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
}
