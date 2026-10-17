import {
  getAdminStatsService,
  getAdminUsersService,
  updateUserStatusService,
  updateUserVerificationService,
  getAdminListingsService,
  moderateListingService,
  getAdminOrdersService,
  getAdminPaymentsService,
  getAdminDeliveriesService,
  getAdminComplaintsService,
  updateComplaintService,
  createComplaintService,
  getAdminAuditLogsService,
} from '../services/admin.service.js';
import {
  updateUserStatusSchema,
  updateUserVerificationSchema,
  moderateListingSchema,
  updateComplaintSchema,
  createComplaintSchema,
} from '../validators/admin.validator.js';

/**
 * GET /api/admin/stats
 */
export async function getAdminStatsController(req, res, next) {
  try {
    const stats = await getAdminStatsService();
    return res.status(200).json({
      success: true,
      message: 'Admin metrics retrieved successfully',
      data: stats,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/users
 */
export async function getAdminUsersController(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { search, role, isActive, isVerified } = req.query;

    const result = await getAdminUsersService({
      page,
      limit,
      search,
      role,
      isActive,
      isVerified,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/users/:id/status
 */
export async function updateUserStatusController(req, res, next) {
  try {
    const parsed = updateUserStatusSchema.parse(req.body);
    const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';

    const updatedUser = await updateUserStatusService({
      targetUserId: req.params.id,
      isActive: parsed.isActive,
      reason: parsed.reason,
      adminUser: req.user,
      ipAddress,
    });

    return res.status(200).json({
      success: true,
      message: `User account has been ${parsed.isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user: updatedUser },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Invalid user status payload',
        errors: error.errors,
      });
    }
    next(error);
  }
}

/**
 * PATCH /api/admin/users/:id/verification
 */
export async function updateUserVerificationController(req, res, next) {
  try {
    const parsed = updateUserVerificationSchema.parse(req.body);
    const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';

    const updatedUser = await updateUserVerificationService({
      targetUserId: req.params.id,
      isVerified: parsed.isVerified,
      adminUser: req.user,
      ipAddress,
    });

    return res.status(200).json({
      success: true,
      message: `User verification status updated to ${parsed.isVerified ? 'VERIFIED' : 'UNVERIFIED'}`,
      data: { user: updatedUser },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Invalid verification payload',
        errors: error.errors,
      });
    }
    next(error);
  }
}

/**
 * GET /api/admin/listings
 */
export async function getAdminListingsController(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { search, status, categoryId } = req.query;

    const result = await getAdminListingsService({
      page,
      limit,
      search,
      status,
      categoryId,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/listings/:id/moderate
 */
export async function moderateListingController(req, res, next) {
  try {
    const parsed = moderateListingSchema.parse(req.body);
    const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';

    const updatedListing = await moderateListingService({
      listingId: req.params.id,
      status: parsed.status,
      reason: parsed.reason,
      adminUser: req.user,
      ipAddress,
    });

    return res.status(200).json({
      success: true,
      message: `Produce listing status successfully changed to ${parsed.status}`,
      data: { listing: updatedListing },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Invalid moderation payload',
        errors: error.errors,
      });
    }
    next(error);
  }
}

/**
 * GET /api/admin/orders
 */
export async function getAdminOrdersController(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { status, search } = req.query;

    const result = await getAdminOrdersService({ page, limit, status, search });
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/payments
 */
export async function getAdminPaymentsController(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { status } = req.query;

    const result = await getAdminPaymentsService({ page, limit, status });
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/deliveries
 */
export async function getAdminDeliveriesController(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { status } = req.query;

    const result = await getAdminDeliveriesService({ page, limit, status });
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/admin/complaints
 */
export async function getAdminComplaintsController(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const { status } = req.query;

    const result = await getAdminComplaintsService({ page, limit, status });
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/admin/complaints/:id
 */
export async function updateComplaintController(req, res, next) {
  try {
    const parsed = updateComplaintSchema.parse(req.body);
    const ipAddress = req.ip || req.connection?.remoteAddress || '127.0.0.1';

    const updatedComplaint = await updateComplaintService({
      complaintId: req.params.id,
      status: parsed.status,
      adminResponse: parsed.adminResponse,
      adminUser: req.user,
      ipAddress,
    });

    return res.status(200).json({
      success: true,
      message: `Complaint status updated to ${parsed.status}`,
      data: { complaint: updatedComplaint },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Invalid complaint update payload',
        errors: error.errors,
      });
    }
    next(error);
  }
}

/**
 * POST /api/admin/complaints (or general complaint submission)
 */
export async function createComplaintController(req, res, next) {
  try {
    const parsed = createComplaintSchema.parse(req.body);

    const complaint = await createComplaintService({
      reportedById: req.user.id,
      listingId: parsed.listingId,
      orderId: parsed.orderId,
      reason: parsed.reason,
      description: parsed.description,
    });

    return res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      data: { complaint },
    });
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        message: error.errors[0]?.message || 'Invalid complaint submission',
        errors: error.errors,
      });
    }
    next(error);
  }
}

/**
 * GET /api/admin/audit-logs
 */
export async function getAdminAuditLogsController(req, res, next) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { action, targetType } = req.query;

    const result = await getAdminAuditLogsService({
      page,
      limit,
      action,
      targetType,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
