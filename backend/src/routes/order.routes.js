import { Router } from 'express';
import {
  createOrderController,
  getBuyerOrdersController,
  getFarmerOrdersController,
  getOrderByIdController,
} from '../controllers/order.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   POST /api/orders
 * @desc    Create an order from an ACCEPTED offer
 * @access  Private (BUYER role)
 */
router.post('/', authenticateToken, authorizeRoles('BUYER', 'ADMIN'), createOrderController);

/**
 * @route   GET /api/orders/my
 * @desc    Get order history for authenticated buyer
 * @access  Private (BUYER role)
 */
router.get('/my', authenticateToken, authorizeRoles('BUYER', 'ADMIN'), getBuyerOrdersController);

/**
 * @route   GET /api/orders/farmer
 * @desc    Get incoming orders for authenticated farmer
 * @access  Private (FARMER role)
 */
router.get('/farmer', authenticateToken, authorizeRoles('FARMER', 'ADMIN'), getFarmerOrdersController);

/**
 * @route   GET /api/orders/:id
 * @desc    Get order details by ID
 * @access  Private (Buyer, Farmer, or Admin)
 */
router.get('/:id', authenticateToken, getOrderByIdController);

export default router;
