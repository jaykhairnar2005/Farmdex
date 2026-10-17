import { Router } from 'express';
import {
  createPaymentOrderController,
  verifyPaymentController,
  razorpayWebhookController,
  getPaymentByOrderIdController,
  generateTestModeSignatureController,
} from '../controllers/payment.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

/**
 * @route   POST /api/payments/create-order
 * @desc    Initiate Razorpay checkout order for a verified purchase order
 * @access  Private (BUYER role)
 */
router.post('/create-order', authenticateToken, authorizeRoles('BUYER', 'ADMIN'), createPaymentOrderController);

/**
 * @route   POST /api/payments/verify
 * @desc    Verify Razorpay payment signature cryptographically on the server
 * @access  Private (BUYER role)
 */
router.post('/verify', authenticateToken, authorizeRoles('BUYER', 'ADMIN'), verifyPaymentController);

/**
 * @route   POST /api/payments/test-mode-signature
 * @desc    Generate test mode signature for frontend simulator (development/test mode only)
 * @access  Private (BUYER role)
 */
router.post('/test-mode-signature', authenticateToken, authorizeRoles('BUYER', 'ADMIN'), generateTestModeSignatureController);

/**
 * @route   POST /api/payments/webhook
 * @desc    Razorpay webhook listener with HMAC signature verification
 * @access  Public (Signature authenticated)
 */
router.post('/webhook', razorpayWebhookController);

/**
 * @route   GET /api/payments/order/:orderId
 * @desc    Get payment record for an order
 * @access  Private
 */
router.get('/order/:orderId', authenticateToken, getPaymentByOrderIdController);

export default router;
