import { z } from 'zod';
import { normalizePhone, isValidPhone } from '../utils/phone.util.js';

/**
 * Zod password validation rule:
 * Must be 8-100 characters long and contain at least one uppercase letter, one lowercase letter, and one number.
 */
const passwordRule = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long' })
  .max(100, { message: 'Password cannot exceed 100 characters' })
  .refine((val) => /[a-z]/.test(val), { message: 'Password must contain at least one lowercase letter' })
  .refine((val) => /[A-Z]/.test(val), { message: 'Password must contain at least one uppercase letter' })
  .refine((val) => /\d/.test(val), { message: 'Password must contain at least one number' });

/**
 * Registration Validation Schema
 */
export const registerSchema = z
  .object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters long' }).max(100),
    email: z.string().email({ message: 'Invalid email address format' }).toLowerCase(),
    password: passwordRule,
    phone: z
      .string()
      .optional()
      .nullable()
      .transform((val) => (val ? normalizePhone(val) : null))
      .refine((val) => val === null || isValidPhone(val), { message: 'Invalid phone number format (must be 10-15 digits)' }),
    role: z.enum(['FARMER', 'BUYER'], {
      errorMap: (issue, _ctx) => {
        if (issue.code === 'invalid_enum_value') {
          return { message: 'Public registration is restricted to FARMER or BUYER roles' };
        }
        return { message: 'Role must be either FARMER or BUYER' };
      },
    }),
    // Optional profile metadata provided during registration
    farmName: z.string().max(100).optional().nullable(),
    farmSize: z.number().positive().optional().nullable(),
    businessName: z.string().max(100).optional().nullable(),
    businessType: z.enum(['RETAILER', 'WHOLESALER', 'RESTAURANT', 'CONSUMER']).optional().nullable(),
    address: z.string().max(255).optional().nullable(),
    district: z.string().max(100).optional().nullable(),
    state: z.string().max(100).optional().nullable(),
    pincode: z.string().max(10).optional().nullable(),
  });

/**
 * Login Validation Schema
 */
export const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address format' }).toLowerCase(),
  password: z.string().min(1, { message: 'Password is required' }),
});
