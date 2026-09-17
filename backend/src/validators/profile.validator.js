import { z } from 'zod';

/**
 * Pincode validation rule: exactly 6 numeric digits for Indian postal codes
 */
const pincodeRule = z
  .string()
  .regex(/^\d{6}$/, { message: 'Pincode must be exactly 6 numeric digits' })
  .optional()
  .nullable();

/**
 * Coordinate validation rules
 */
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
 * Partial Farmer Profile Update Schema
 * Strips verificationStatus so farmers cannot self-verify
 */
export const updateFarmerProfileSchema = z
  .object({
    farmName: z.string().max(100, 'Farm name cannot exceed 100 characters').optional().nullable(),
    farmSize: z.number().positive('Farm size must be a positive number').optional().nullable(),
    address: z.string().max(255, 'Address cannot exceed 255 characters').optional().nullable(),
    district: z.string().max(100, 'District cannot exceed 100 characters').optional().nullable(),
    state: z.string().max(100, 'State cannot exceed 100 characters').optional().nullable(),
    pincode: pincodeRule,
    latitude: latitudeRule,
    longitude: longitudeRule,
  })
  .passthrough();

/**
 * Partial Buyer Profile Update Schema
 */
export const updateBuyerProfileSchema = z
  .object({
    businessName: z.string().max(100, 'Business name cannot exceed 100 characters').optional().nullable(),
    businessType: z.enum(['RETAILER', 'WHOLESALER', 'RESTAURANT', 'CONSUMER']).optional().nullable(),
    address: z.string().max(255, 'Address cannot exceed 255 characters').optional().nullable(),
    district: z.string().max(100, 'District cannot exceed 100 characters').optional().nullable(),
    state: z.string().max(100, 'State cannot exceed 100 characters').optional().nullable(),
    pincode: pincodeRule,
  })
  .passthrough();
