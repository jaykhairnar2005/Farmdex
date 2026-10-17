import { z } from 'zod';

export const deliveryStatusEnum = z.enum([
  'PREPARING',
  'DISPATCHED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
]);

/**
 * Validator for dispatching an order
 */
export const dispatchOrderSchema = z.object({
  trackingNumber: z
    .string()
    .trim()
    .min(3, 'Tracking number must be at least 3 characters long')
    .max(100, 'Tracking number cannot exceed 100 characters')
    .optional(),
  estimatedDelivery: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format'))
    .optional()
    .nullable(),
  location: z.string().trim().max(200, 'Location cannot exceed 200 characters').optional(),
  note: z.string().trim().max(500, 'Note cannot exceed 500 characters').optional(),
});

/**
 * Validator for updating delivery status
 */
export const updateDeliveryStatusSchema = z.object({
  status: deliveryStatusEnum,
  location: z.string().trim().max(200, 'Location cannot exceed 200 characters').optional(),
  note: z.string().trim().max(500, 'Note cannot exceed 500 characters').optional(),
  trackingNumber: z
    .string()
    .trim()
    .min(3, 'Tracking number must be at least 3 characters long')
    .max(100, 'Tracking number cannot exceed 100 characters')
    .optional(),
  estimatedDelivery: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Invalid date format'))
    .optional()
    .nullable(),
});
