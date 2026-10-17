import { z } from 'zod';

export const updateUserStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive flag is required' }),
  reason: z.string().max(255).optional(),
});

export const updateUserVerificationSchema = z.object({
  isVerified: z.boolean({ required_error: 'isVerified flag is required' }),
});

export const moderateListingSchema = z.object({
  status: z.enum(['ACTIVE', 'SUSPENDED', 'ARCHIVED'], {
    required_error: 'Moderation status is required',
    invalid_type_error: 'Status must be ACTIVE, SUSPENDED, or ARCHIVED',
  }),
  reason: z.string().max(500).optional(),
});

export const updateComplaintSchema = z.object({
  status: z.enum(['OPEN', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED'], {
    required_error: 'Complaint status is required',
    invalid_type_error: 'Status must be OPEN, UNDER_REVIEW, RESOLVED, or DISMISSED',
  }),
  adminResponse: z
    .string({ required_error: 'Admin response is required' })
    .min(3, 'Admin response must be at least 3 characters long')
    .max(2000, 'Admin response cannot exceed 2000 characters'),
});

export const createComplaintSchema = z
  .object({
    listingId: z.string().uuid().optional().nullable(),
    orderId: z.string().uuid().optional().nullable(),
    reason: z.string().min(3, 'Reason must be at least 3 characters long').max(150),
    description: z.string().min(5, 'Description must be at least 5 characters long').max(2000),
  })
  .refine((data) => data.listingId || data.orderId, {
    message: 'Complaint must target either a produce listing or an order',
    path: ['target'],
  });
