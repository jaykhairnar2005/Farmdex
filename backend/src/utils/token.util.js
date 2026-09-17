import jwt from 'jsonwebtoken';

/**
 * Generate Access Token with minimal payload { sub, role, email }
 * @param {object} user - User object containing id, role, email
 * @returns {string} Signed JWT token string
 */
export function generateAccessToken(user) {
  const secret = process.env.JWT_SECRET || 'farmdex_dev_jwt_secret_change_in_production';
  const payload = {
    sub: user.id,
    role: user.role,
    email: user.email,
  };

  return jwt.sign(payload, secret, { expiresIn: '7d' });
}

/**
 * Extensible placeholder signature for future Refresh Token rotation support.
 * (Not active in Milestone 2B)
 */
export function generateRefreshToken(_user) {
  throw new Error('Refresh tokens not implemented in Milestone 2B');
}

/**
 * Verify JWT Access Token
 * @param {string} token - JWT token string
 * @returns {object} Decoded JWT payload
 */
export function verifyAccessToken(token) {
  const secret = process.env.JWT_SECRET || 'farmdex_dev_jwt_secret_change_in_production';
  return jwt.verify(token, secret);
}
