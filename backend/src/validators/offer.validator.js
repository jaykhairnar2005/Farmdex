import { z } from 'zod';

export const createOfferSchema = z
  .object({
    listingId: z.string().uuid('Valid listing ID is required'),
    quantity: z
      .number({ invalid_type_error: 'Quantity must be a positive number' })
      .positive('Quantity must be greater than zero'),
    offeredPrice: z
      .number({ invalid_type_error: 'Offered price must be a positive number' })
      .positive('Offered price must be greater than zero'),
    message: z
      .string()
      .max(1000, 'Message cannot exceed 1000 characters')
      .optional()
      .nullable(),
    expiresAt: z
      .string()
      .datetime({ offset: true, message: 'Expiry date must be a valid ISO datetime' })
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expiry date must be YYYY-MM-DD format'))
      .optional()
      .nullable(),
  })
  .strict();

export const counterOfferSchema = z
  .object({
    counterPrice: z
      .number({ invalid_type_error: 'Counter price must be a positive number' })
      .positive('Counter price must be greater than zero'),
    counterQuantity: z
      .number({ invalid_type_error: 'Counter quantity must be a positive number' })
      .positive('Counter quantity must be greater than zero')
      .optional()
      .nullable(),
    message: z
      .string()
      .max(1000, 'Message cannot exceed 1000 characters')
      .optional()
      .nullable(),
  })
  .strict();

export const rejectOfferSchema = z
  .object({
    reason: z
      .string()
      .max(500, 'Reason cannot exceed 500 characters')
      .optional()
      .nullable(),
  })
  .strict();

export const queryOffersSchema = z.object({
  status: z
    .enum(['PENDING', 'ACCEPTED', 'REJECTED', 'COUNTERED', 'EXPIRED', 'CANCELLED'])
    .optional(),
  listingId: z.string().uuid().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
