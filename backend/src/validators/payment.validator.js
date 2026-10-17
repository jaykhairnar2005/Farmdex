import { z } from 'zod';

export const createPaymentOrderSchema = z
  .object({
    orderId: z.string().uuid('Valid order ID is required'),
  })
  .strict();

export const verifyPaymentSchema = z
  .object({
    orderId: z.string().uuid('Valid order ID is required'),
    razorpayOrderId: z.string().min(5, 'Valid Razorpay order ID is required'),
    razorpayPaymentId: z.string().min(5, 'Valid Razorpay payment ID is required'),
    razorpaySignature: z.string().min(10, 'Valid Razorpay signature is required'),
  })
  .strict();
