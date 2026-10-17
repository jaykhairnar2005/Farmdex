import { createPaymentOrderSchema, verifyPaymentSchema } from '../validators/payment.validator.js';
import {
  createPaymentOrderService,
  verifyPaymentSignatureService,
  processRazorpayWebhookService,
  getPaymentByOrderIdService,
  generateTestModeSignatureService,
} from '../services/payment.service.js';

/**
 * @route   POST /api/payments/create-order
 * @desc    Initiate Razorpay checkout order for a verified purchase order
 * @access  Private (BUYER role)
 */
export async function createPaymentOrderController(req, res, next) {
  try {
    const parseResult = createPaymentOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Invalid payment order request',
      });
    }

    const paymentOrder = await createPaymentOrderService(req.user.id, parseResult.data);
    return res.status(200).json({
      success: true,
      message: 'Payment order created successfully',
      data: paymentOrder,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/payments/verify
 * @desc    Verify Razorpay payment signature cryptographically on the server
 * @access  Private (BUYER role)
 */
export async function verifyPaymentController(req, res, next) {
  try {
    const parseResult = verifyPaymentSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Invalid payment verification payload',
      });
    }

    const result = await verifyPaymentSignatureService(req.user.id, parseResult.data);
    return res.status(200).json({
      success: true,
      message: result.alreadyProcessed
        ? 'Payment already verified and settled'
        : 'Payment signature verified and order confirmed successfully',
      data: result.order,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/payments/webhook
 * @desc    Razorpay asynchronous webhook listener with signature verification
 * @access  Public (Verified via HMAC signature)
 */
export async function razorpayWebhookController(req, res, next) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing x-razorpay-signature header',
      });
    }

    const rawBody = req.rawBody || JSON.stringify(req.body);
    const result = await processRazorpayWebhookService(rawBody, signature, req.body);

    return res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      ...result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/payments/order/:orderId
 * @desc    Get payment record for an order
 * @access  Private
 */
export async function getPaymentByOrderIdController(req, res, next) {
  try {
    const payment = await getPaymentByOrderIdService(req.params.orderId, req.user.id, req.user.role);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment record not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   POST /api/payments/test-mode-signature
 * @desc    Generate test mode signature for frontend simulator (development/test mode only)
 * @access  Private (BUYER role)
 */
export async function generateTestModeSignatureController(req, res, next) {
  try {
    const { orderId, razorpayOrderId } = req.body;
    if (!orderId || !razorpayOrderId) {
      return res.status(400).json({
        success: false,
        message: 'orderId and razorpayOrderId are required',
      });
    }

    const result = await generateTestModeSignatureService(req.user.id, { orderId, razorpayOrderId });
    return res.status(200).json({
      success: true,
      message: 'Test mode signature generated successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

