import { z } from 'zod';

const pincodeRule = z
  .string()
  .regex(/^\d{6}$/, { message: 'Pincode must be exactly 6 numeric digits' })
  .optional()
  .nullable();

const latitudeRule = z
  .number()
  .min(-90, { message: 'Latitude must be between -90 and 90 degrees' })
  .max(90, { message: 'Latitude must be between -90 and 90 degrees' })
  .optional()
  .nullable();

const longitudeRule = z
  .number()
  .min(-180, { message: 'Longitude must be between -180 and 180 degrees' })
  .max(180, { message: 'Longitude must be between -180 and 180 degrees' })
  .optional()
  .nullable();

/**
 * Farm Creation Schema
 */
export const createFarmSchema = z
  .object({
    name: z.string().min(2, 'Farm name must be at least 2 characters').max(100, 'Farm name cannot exceed 100 characters'),
    size: z.number().positive('Farm size must be a positive number').optional().nullable(),
    address: z.string().max(255, 'Address cannot exceed 255 characters').optional().nullable(),
    district: z.string().max(100, 'District cannot exceed 100 characters').optional().nullable(),
    state: z.string().max(100, 'State cannot exceed 100 characters').optional().nullable(),
    pincode: pincodeRule,
    latitude: latitudeRule,
    longitude: longitudeRule,
  })
  .strict();

/**
 * Farm Update Schema (Partial)
 */
export const updateFarmSchema = createFarmSchema.partial().strict();
