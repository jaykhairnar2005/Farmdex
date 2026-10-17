import jwt from 'jsonwebtoken';

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Fatal configuration error: JWT_SECRET environment variable is missing');
  }
  return secret;
}

/**
 * Generate Access Token with minimal payload { sub, role, email }
 * @param {object} user - User object containing id, role, email
 * @returns {string} Signed JWT token string
 */
export function generateAccessToken(user) {
  const secret = getJwtSecret();
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
  const secret = getJwtSecret();
  return jwt.verify(token, secret);
}
