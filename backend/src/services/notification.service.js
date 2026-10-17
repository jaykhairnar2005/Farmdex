import prisma from '../config/db.js';
import { emitToUser } from '../socket/index.js';

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Create a new notification and emit real-time event to recipient
 */
export async function createNotificationService({ userId, type, title, message }) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        isRead: false,
      },
    });

    const unreadCount = await prisma.notification.count({
      where: { userId, isRead: false },
    });

    // Real-time Socket.IO emission to user's private room
    emitToUser(userId, 'notification:new', notification);
    emitToUser(userId, 'notification:unread_count', { unreadCount });

    return notification;
  } catch (err) {
    console.error('[NotificationService] Error creating notification:', err.message);
    return null;
  }
}

/**
 * Get paginated notifications for the authenticated user
 */
export async function getUserNotificationsService(userId, { page = 1, limit = 20, unreadOnly = false } = {}) {
  const skip = (page - 1) * limit;
  const where = {
    userId,
    ...(unreadOnly ? { isRead: false } : {}),
  };

  const [totalCount, unreadCount, notifications] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.notification.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
      totalCount,
      unreadCount,
    },
  };
}

/**
 * Mark a single notification as read (with ownership authorization)
 */
export async function markNotificationAsReadService(userId, notificationId) {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  // Authorization check: User can only mark their own notification
  if (notification.userId !== userId) {
    throw new AppError('Access denied: You cannot modify another user\'s notification', 403);
  }

  const updated = await prisma.notification.update({
    where: { id: notificationId },
    data: { isRead: true },
  });

  const unreadCount = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  emitToUser(userId, 'notification:unread_count', { unreadCount });

  return updated;
}

/**
 * Mark all notifications as read for the authenticated user
 */
export async function markAllNotificationsAsReadService(userId) {
  await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  emitToUser(userId, 'notification:unread_count', { unreadCount: 0 });

  return { success: true, message: 'All notifications marked as read', data: { unreadCount: 0 } };
}
