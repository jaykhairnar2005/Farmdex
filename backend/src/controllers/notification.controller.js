import {
  getUserNotificationsService,
  markNotificationAsReadService,
  markAllNotificationsAsReadService,
} from '../services/notification.service.js';

export async function getUserNotificationsController(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const result = await getUserNotificationsService(req.user.id, {
      page,
      limit,
      unreadOnly,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function markNotificationAsReadController(req, res, next) {
  try {
    const updated = await markNotificationAsReadService(
      req.user.id,
      req.params.id
    );

    return res.status(200).json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function markAllNotificationsAsReadController(req, res, next) {
  try {
    const result = await markAllNotificationsAsReadService(req.user.id);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}
