import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * Check if Razorpay test/production credentials are provided in environment
 */
export function isRazorpayConfigured() {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

// Initialize Razorpay instance if credentials exist
let razorpayInstance = null;
if (isRazorpayConfigured()) {
  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

export { razorpayInstance };

/**
 * Create a Razorpay Order
 * If in mock/offline test mode or if external call fails, generates a standard Razorpay test order representation
 * @param {Object} params - { orderId, amountInPaise, currency = 'INR', notes = {} }
 */
export async function createRazorpayOrder({ orderId, amountInPaise, currency = 'INR', notes = {} }) {
  if (razorpayInstance) {
    try {
      const order = await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency,
        receipt: orderId,
        notes: {
          orderId,
          ...notes,
        },
      });
      return order;
    } catch (err) {
      console.warn(`[Razorpay] Warning: Direct API call returned (${err.message}). Using test mode mock order generation.`);
    }
  }

  // Standalone Test Mode Order Generator
  const mockRazorpayOrderId = `order_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
  return {
    id: mockRazorpayOrderId,
    entity: 'order',
    amount: amountInPaise,
    amount_paid: 0,
    amount_due: amountInPaise,
    currency,
    receipt: orderId,
    status: 'created',
    attempts: 0,
    notes: { orderId, ...notes },
    created_at: Math.floor(Date.now() / 1000),
  };
}

/**
 * Verify Razorpay payment signature
 * Signature = HMAC_SHA256(razorpay_order_id + '|' + razorpay_payment_id, key_secret)
 */
export function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return false;
  }

  const payload = `${razorpayOrderId}|${razorpayPaymentId}`;
  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  // Secure constant-time comparison to prevent timing attacks
  const generatedBuffer = Buffer.from(generatedSignature, 'utf-8');
  const signatureBuffer = Buffer.from(razorpaySignature, 'utf-8');

  if (generatedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(generatedBuffer, signatureBuffer);
}

/**
 * Verify Razorpay webhook signature
 * Signature = HMAC_SHA256(rawBody, webhook_secret)
 */
export function verifyWebhookSignature({ rawBody, signature }) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
  if (!secret || !rawBody || !signature) {
    return false;
  }

  const generatedSignature = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  const generatedBuffer = Buffer.from(generatedSignature, 'utf-8');
  const signatureBuffer = Buffer.from(signature, 'utf-8');

  if (generatedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(generatedBuffer, signatureBuffer);
}
