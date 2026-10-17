import { z } from 'zod';

const allowedUnits = ['kg', 'quintal', 'ton', 'crate', 'bag', 'box', 'bunch', 'piece', 'liter', 'dozen'];

/**
 * Validator for creating a new crop listing
 */
export const createCropListingSchema = z
  .object({
    cropName: z
      .string()
      .min(2, 'Crop name must be at least 2 characters')
      .max(100, 'Crop name cannot exceed 100 characters')
      .trim(),
    description: z
      .string()
      .max(2000, 'Description cannot exceed 2000 characters')
      .optional()
      .nullable(),
    quantity: z
      .number({ invalid_type_error: 'Quantity must be a positive number' })
      .positive('Quantity must be greater than zero'),
    unit: z
      .string()
      .min(1, 'Unit of measurement is required')
      .max(20, 'Unit cannot exceed 20 characters')
      .toLowerCase()
      .refine((val) => allowedUnits.includes(val) || val.length >= 1, {
        message: 'Invalid unit of measurement',
      }),
    quality: z
      .string()
      .max(50, 'Quality grade cannot exceed 50 characters')
      .optional()
      .nullable(),
    pricePerUnit: z
      .number({ invalid_type_error: 'Price per unit must be a positive number' })
      .positive('Price per unit must be greater than zero'),
    harvestDate: z
      .string()
      .datetime({ offset: true, message: 'Harvest date must be a valid ISO datetime' })
      .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Harvest date must be YYYY-MM-DD format'))
      .optional()
      .nullable(),
    location: z
      .string()
      .max(150, 'Location cannot exceed 150 characters')
      .optional()
      .nullable(),
    isOrganic: z.boolean().default(false),
    categoryId: z.string().uuid('Valid category ID is required'),
    farmId: z.string().uuid('Farm ID must be a valid UUID').optional().nullable(),
    imageUrls: z.array(z.string().url('Invalid image URL format')).max(5, 'Maximum 5 initial images').optional(),
  })
  .strict();

/**
 * Validator for updating an existing crop listing
 */
export const updateCropListingSchema = createCropListingSchema
  .partial()
  .omit({ imageUrls: true })
  .strict();

/**
 * Validator for status transitions
 */
export const updateListingStatusSchema = z
  .object({
    status: z.enum(['ACTIVE', 'INACTIVE', 'SOLD_OUT', 'ARCHIVED'], {
      errorMap: () => ({ message: 'Status must be one of: ACTIVE, INACTIVE, SOLD_OUT, ARCHIVED' }),
    }),
  })
  .strict();

/**
 * Query parameter validator for public marketplace catalog
 */
export const marketplaceQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
  search: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  isOrganic: z
    .enum(['true', 'false', '1', '0'])
    .transform((val) => val === 'true' || val === '1')
    .optional(),
  location: z.string().optional(),
  sort: z.enum(['latest', 'price_asc', 'price_desc', 'quantity_desc']).default('latest'),
});

/**
 * Query parameter validator for farmer's own listings dashboard
 */
export const farmerListingsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SOLD_OUT', 'SUSPENDED', 'ARCHIVED']).optional(),
  search: z.string().optional(),
});
