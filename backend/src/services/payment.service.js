import crypto from 'crypto';
import prisma from '../config/db.js';
import {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../config/razorpay.js';
import { createNotificationService } from './notification.service.js';

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Initialize a Razorpay checkout order for a verified FarmDex order
 */
export async function createPaymentOrderService(userId, { orderId }) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payment: true,
      buyer: { select: { id: true, name: true, email: true, phone: true } },
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // 1. Role and ownership check
  if (order.buyerId !== userId) {
    throw new AppError('Access denied: You can only pay for your own orders', 403);
  }

  // 2. Status verification
  if (order.status === 'CANCELLED') {
    throw new AppError('Cannot initiate payment for a cancelled order', 400);
  }

  // 3. Duplicate payment protection
  if (order.payment?.status === 'SUCCESS') {
    throw new AppError('This order has already been paid and settled', 400);
  }

  // Convert decimal total to paise (integer)
  const amountInPaise = Math.round(Number(order.totalAmount) * 100);

  // Generate Razorpay Order
  const razorpayOrder = await createRazorpayOrder({
    orderId: order.id,
    amountInPaise,
    currency: 'INR',
    notes: {
      orderId: order.id,
      buyerId: userId,
      buyerEmail: order.buyer.email,
    },
  });

  // Upsert Payment record to PENDING state
  await prisma.payment.upsert({
    where: { orderId: order.id },
    create: {
      orderId: order.id,
      amount: order.totalAmount,
      provider: 'RAZORPAY',
      status: 'PENDING',
      transactionId: razorpayOrder.id,
    },
    update: {
      amount: order.totalAmount,
      provider: 'RAZORPAY',
      status: 'PENDING',
      transactionId: razorpayOrder.id,
    },
  });

  return {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency || 'INR',
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_farmdexMockKey123',
    orderId: order.id,
    buyer: {
      name: order.buyer.name,
      email: order.buyer.email,
      phone: order.buyer.phone,
    },
  };
}

/**
 * Verify Razorpay payment signature cryptographically on the server
 * Never marks an order PAID without valid HMAC SHA-256 signature verification
 */
export async function verifyPaymentSignatureService(
  userId,
  { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // 1. Role and ownership check
  if (order.buyerId !== userId) {
    throw new AppError('Access denied: You can only verify payments for your own orders', 403);
  }

  // 2. Idempotent check: if already paid, return existing success
  if (order.payment?.status === 'SUCCESS') {
    return {
      alreadyProcessed: true,
      order,
    };
  }

  // 3. Cryptographic Signature Verification
  const isValidSignature = verifyPaymentSignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  });

  if (!isValidSignature) {
    // Record failed payment attempt
    if (order.payment) {
      await prisma.payment.update({
        where: { id: order.payment.id },
        data: { status: 'FAILED' },
      });
    }
    throw new AppError('Invalid payment signature. Verification failed.', 400);
  }

  // 4. Atomic settlement update in transaction
  const updatedOrder = await prisma.$transaction(async (tx) => {
    await tx.payment.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        amount: order.totalAmount,
        provider: 'RAZORPAY',
        status: 'SUCCESS',
        transactionId: razorpayPaymentId,
        paidAt: new Date(),
      },
      update: {
        status: 'SUCCESS',
        transactionId: razorpayPaymentId,
        paidAt: new Date(),
      },
    });

    return tx.order.update({
      where: { id: order.id },
      data: { status: 'CONFIRMED' },
      include: {
        payment: true,
        orderItems: {
          include: { listing: true },
        },
        farmer: { select: { id: true, name: true, phone: true } },
        buyer: { select: { id: true, name: true, phone: true } },
      },
    });
  });

  // Emit payment success notifications
  if (updatedOrder.buyerId) {
    createNotificationService({
      userId: updatedOrder.buyerId,
      type: 'PAYMENT_SUCCESS',
      title: 'Payment Successful',
      message: `Your payment of ₹${updatedOrder.totalAmount} for order #${updatedOrder.id.slice(-6).toUpperCase()} was successful!`,
    }).catch((err) => console.warn('[PaymentNotification] Error:', err.message));
  }

  if (updatedOrder.farmerId) {
    createNotificationService({
      userId: updatedOrder.farmerId,
      type: 'PAYMENT_SUCCESS',
      title: 'Payment Received',
      message: `Payment of ₹${updatedOrder.totalAmount} received for order #${updatedOrder.id.slice(-6).toUpperCase()}.`,
    }).catch((err) => console.warn('[PaymentNotification] Error:', err.message));
  }

  return {
    alreadyProcessed: false,
    order: updatedOrder,
  };
}

/**
 * Handle incoming Razorpay Webhook with HMAC signature validation and idempotent processing
 */
export async function processRazorpayWebhookService(rawBody, signature, eventData) {
  // 1. Verify webhook HMAC signature
  const isValid = verifyWebhookSignature({ rawBody, signature });
  if (!isValid) {
    throw new AppError('Invalid webhook signature', 400);
  }

  const event = eventData.event;
  const payload = eventData.payload;

  if (event === 'payment.captured' || event === 'order.paid') {
    const paymentEntity = payload.payment?.entity;
    const razorpayPaymentId = paymentEntity?.id;
    const razorpayOrderId = paymentEntity?.order_id;
    const targetOrderId = paymentEntity?.notes?.orderId;

    // Find the associated order
    const order = await prisma.order.findFirst({
      where: {
        OR: [
          ...(targetOrderId ? [{ id: targetOrderId }] : []),
          ...(razorpayOrderId ? [{ payment: { transactionId: razorpayOrderId } }] : []),
        ],
      },
      include: { payment: true },
    });

    if (order) {
      // Idempotent processing: if already marked SUCCESS, do not re-process
      if (order.payment?.status === 'SUCCESS') {
        return { success: true, idempotent: true, message: 'Order payment already processed' };
      }

      await prisma.$transaction(async (tx) => {
        await tx.payment.upsert({
          where: { orderId: order.id },
          create: {
            orderId: order.id,
            amount: order.totalAmount,
            provider: 'RAZORPAY',
            status: 'SUCCESS',
            transactionId: razorpayPaymentId || razorpayOrderId,
            paidAt: new Date(),
          },
          update: {
            status: 'SUCCESS',
            transactionId: razorpayPaymentId || razorpayOrderId,
            paidAt: new Date(),
          },
        });

        await tx.order.update({
          where: { id: order.id },
          data: { status: 'CONFIRMED' },
        });
      });

      if (order.buyerId) {
        createNotificationService({
          userId: order.buyerId,
          type: 'PAYMENT_SUCCESS',
          title: 'Payment Successful',
          message: `Your payment of ₹${order.totalAmount} for order #${order.id.slice(-6).toUpperCase()} was successful!`,
        }).catch((err) => console.warn('[PaymentNotification] Error:', err.message));
      }

      if (order.farmerId) {
        createNotificationService({
          userId: order.farmerId,
          type: 'PAYMENT_SUCCESS',
          title: 'Payment Received',
          message: `Payment of ₹${order.totalAmount} received for order #${order.id.slice(-6).toUpperCase()}.`,
        }).catch((err) => console.warn('[PaymentNotification] Error:', err.message));
      }
    }
  } else if (event === 'payment.failed') {
    const paymentEntity = payload.payment?.entity;
    const targetOrderId = paymentEntity?.notes?.orderId;

    if (targetOrderId) {
      await prisma.payment.updateMany({
        where: { orderId: targetOrderId },
        data: { status: 'FAILED' },
      });
    }
  }

  return { success: true, processed: true };
}

/**
 * Get payment record by Order ID with tenant isolation
 */
export async function getPaymentByOrderIdService(orderId, userId, userRole) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });

  if (!order) return null;

  // Tenant isolation
  if (userRole !== 'ADMIN' && order.buyerId !== userId && order.farmerId !== userId) {
    return null;
  }

  return order.payment;
}

/**
 * Test Mode Signature Generator
 * Available in development/test mode or with test API keys
 * Generates test payment ID and server HMAC-SHA256 signature for test-mode simulated checkout
 */
export async function generateTestModeSignatureService(userId, { orderId, razorpayOrderId }) {
  if (process.env.NODE_ENV === 'production' && !process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_')) {
    throw new AppError('Test mode signatures are disabled in live production', 403);
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { payment: true },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  if (order.buyerId !== userId) {
    throw new AppError('Access denied: You can only test payments for your own orders', 403);
  }

  const mockPaymentId = `pay_test_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    throw new AppError('Razorpay secret not configured on server', 500);
  }

  const payload = `${razorpayOrderId}|${mockPaymentId}`;
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');

  return {
    orderId,
    razorpayOrderId,
    razorpayPaymentId: mockPaymentId,
    razorpaySignature: signature,
  };
}
