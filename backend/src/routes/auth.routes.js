import { Router } from 'express';
import { registerController, loginController, getMeController } from '../controllers/auth.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Public registration for FARMER or BUYER
 */
router.post('/register', authRateLimiter, registerController);

/**
 * @route   POST /api/auth/login
 * @desc    Public authentication login
 */
router.post('/login', authRateLimiter, loginController);

/**
 * @route   GET /api/auth/me
 * @desc    Fetch authenticated user profile (Protected)
 */
router.get('/me', authenticateToken, getMeController);

/**
 * Temporary test-only RBAC endpoint for verifying BUYER -> farmer-only 403 authorization requirement
 * Active only when NODE_ENV === 'test' or ENABLE_RBAC_TEST === 'true'
 */
if (process.env.NODE_ENV === 'test' || process.env.ENABLE_RBAC_TEST === 'true') {
  router.get('/test-farmer-only', authenticateToken, authorizeRoles('FARMER'), (req, res) => {
    res.status(200).json({
      success: true,
      message: 'Farmer-only protected resource accessed successfully',
    });
  });
}

export default router;
