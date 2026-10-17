import { Router } from 'express';
import {
  dispatchOrderController,
  updateDeliveryStatusController,
  getDeliveryByOrderIdController,
} from '../controllers/delivery.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   POST /api/deliveries/:orderId/dispatch
 * @desc    Farmer dispatches a paid order and assigns tracking number
 * @access  Private (FARMER / ADMIN)
 */
router.post(
  '/:orderId/dispatch',
  authenticateToken,
  authorizeRoles('FARMER', 'ADMIN'),
  dispatchOrderController
);

/**
 * @route   PATCH /api/deliveries/:orderId/status
 * @desc    Farmer updates delivery status through lifecycle (PREPARING, DISPATCHED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED)
 * @access  Private (FARMER / ADMIN)
 */
router.patch(
  '/:orderId/status',
  authenticateToken,
  authorizeRoles('FARMER', 'ADMIN'),
  updateDeliveryStatusController
);

/**
 * @route   GET /api/deliveries/:orderId
 * @desc    Get delivery tracking information and status timeline
 * @access  Private (BUYER / FARMER / ADMIN)
 */
router.get('/:orderId', authenticateToken, getDeliveryByOrderIdController);

export default router;
