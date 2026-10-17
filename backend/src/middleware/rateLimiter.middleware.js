import rateLimit from 'express-rate-limit';

/**
 * Dedicated Rate Limiter for Authentication Endpoints (/api/auth/login, /api/auth/register)
 * - Production: Strict 10 requests per 15-minute window per IP to prevent brute-force attacks.
 * - Test: 10 requests per 15-minute window per IP to validate security rate-limiting behavior.
 * - Development: 100 requests per 15-minute window per IP to accommodate local developer testing.
 */
export const getAuthRateLimitMax = () => {
  if (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') {
    return Number(process.env.AUTH_RATE_LIMIT_MAX) || 10;
  }
  return Number(process.env.AUTH_RATE_LIMIT_DEV_MAX) || 100;
};

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req, res) => getAuthRateLimitMax(),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  },
});

