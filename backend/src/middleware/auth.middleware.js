import { verifyAccessToken } from '../utils/token.util.js';
import prisma from '../config/db.js';
import { userPublicSelect } from '../utils/userDto.util.js';

/**
 * Authentication Middleware
 * Verifies JWT access token and performs real-time PostgreSQL check to ensure user exists and isActive === true.
 */
export async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token is missing or malformed',
      });
    }

    const token = authHeader.split(' ')[1];
    let decoded;

    try {
      decoded = verifyAccessToken(token);
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: err.name === 'TokenExpiredError' ? 'Authentication token has expired' : 'Invalid authentication token',
      });
    }

    // Real-time PostgreSQL lookup to verify active user status
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: userPublicSelect,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User account no longer exists',
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User account has been deactivated',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication Middleware Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication',
    });
  }
}

/**
 * Role-Based Access Control (RBAC) Authorization Middleware
 * @param {...string} allowedRoles - Allowed UserRole values (e.g. 'FARMER', 'ADMIN')
 */
export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'User is not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied: Role '${req.user.role}' is not authorized to access this resource`,
      });
    }

    next();
  };
}
