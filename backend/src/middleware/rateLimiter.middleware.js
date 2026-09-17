import rateLimit from 'express-rate-limit';

/**
 * Dedicated Rate Limiter for Authentication Endpoints (/api/auth/login, /api/auth/register)
 * Limits requests to 10 per 15-minute window per IP to prevent brute-force credential attacks.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
});
