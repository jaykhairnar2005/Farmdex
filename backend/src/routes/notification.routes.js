import { Router } from 'express';
import {
  getUserNotificationsController,
  markNotificationAsReadController,
  markAllNotificationsAsReadController,
} from '../controllers/notification.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all notification routes with JWT Authentication
router.use(authenticateToken);

/**
 * @route   GET /api/notifications
 * @desc    Get user notifications and unread count
 * @access  Private
 */
router.get('/', getUserNotificationsController);

/**
 * @route   PATCH /api/notifications/read-all
 * @desc    Mark all unread notifications as read
 * @access  Private
 */
router.patch('/read-all', markAllNotificationsAsReadController);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a single notification as read
 * @access  Private
 */
router.patch('/:id/read', markNotificationAsReadController);

export default router;
