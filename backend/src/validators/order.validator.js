import { z } from 'zod';

export const createOrderSchema = z
  .object({
    offerId: z.string().uuid('Valid offer ID is required'),
    shippingAddress: z
      .string({ required_error: 'Shipping address is required' })
      .trim()
      .min(5, 'Shipping address must be at least 5 characters')
      .max(500, 'Shipping address cannot exceed 500 characters'),
  })
  .strict();

export const queryOrdersSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  status: z
    .enum(['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED'])
    .optional(),
});
