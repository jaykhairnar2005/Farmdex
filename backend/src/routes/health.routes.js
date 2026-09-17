import { Router } from 'express';
import { checkDatabaseConnection } from '../config/db.js';

const router = Router();

/**
 * @route   GET /api/health
 * @desc    Minimal API health check endpoint
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'FarmDex API is running',
  });
});

/**
 * @route   GET /api/health/db
 * @desc    Independent database connection health check endpoint
 * @access  Public
 */
router.get('/health/db', async (req, res) => {
  const dbStatus = await checkDatabaseConnection();
  if (dbStatus.connected) {
    return res.status(200).json({
      success: true,
      message: dbStatus.message,
      timestamp: dbStatus.timestamp,
    });
  } else {
    return res.status(503).json({
      success: false,
      message: dbStatus.message,
    });
  }
});

export default router;
