import { Router } from 'express';
import {
  getAdminStatsController,
  getAdminUsersController,
  updateUserStatusController,
  updateUserVerificationController,
  getAdminListingsController,
  moderateListingController,
  getAdminOrdersController,
  getAdminPaymentsController,
  getAdminDeliveriesController,
  getAdminComplaintsController,
  updateComplaintController,
  createComplaintController,
  getAdminAuditLogsController,
} from '../controllers/admin.controller.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.middleware.js';

const router = Router();

// Protect all admin endpoints: requires valid JWT and role === 'ADMIN'
router.use(authenticateToken);
router.use(authorizeRoles('ADMIN'));

/**
 * @route   GET /api/admin/stats
 * @desc    Get complete real-time database KPIs and platform analytics
 * @access  Private (ADMIN)
 */
router.get('/stats', getAdminStatsController);

/**
 * @route   GET /api/admin/users
 * @desc    Get paginated users with filtering and search
 * @access  Private (ADMIN)
 */
router.get('/users', getAdminUsersController);

/**
 * @route   PATCH /api/admin/users/:id/status
 * @desc    Deactivate or activate a user account (with audit logging)
 * @access  Private (ADMIN)
 */
router.patch('/users/:id/status', updateUserStatusController);

/**
 * @route   PATCH /api/admin/users/:id/verification
 * @desc    Verify or unverify user profile (with audit logging)
 * @access  Private (ADMIN)
 */
router.patch('/users/:id/verification', updateUserVerificationController);

/**
 * @route   GET /api/admin/listings
 * @desc    Get paginated produce listings for moderation
 * @access  Private (ADMIN)
 */
router.get('/listings', getAdminListingsController);

/**
 * @route   PATCH /api/admin/listings/:id/moderate
 * @desc    Moderate produce listing (SUSPEND, REINSTATE, ARCHIVE)
 * @access  Private (ADMIN)
 */
router.patch('/listings/:id/moderate', moderateListingController);

/**
 * @route   GET /api/admin/orders
 * @desc    Monitor orders, items, payment status, and delivery milestones
 * @access  Private (ADMIN)
 */
router.get('/orders', getAdminOrdersController);

/**
 * @route   GET /api/admin/payments
 * @desc    Monitor payment transactions and settlement audit logs
 * @access  Private (ADMIN)
 */
router.get('/payments', getAdminPaymentsController);

/**
 * @route   GET /api/admin/deliveries
 * @desc    Monitor consignment shipments and delivery progress
 * @access  Private (ADMIN)
 */
router.get('/deliveries', getAdminDeliveriesController);

/**
 * @route   GET /api/admin/complaints
 * @desc    Get user complaints list with resolution status
 * @access  Private (ADMIN)
 */
router.get('/complaints', getAdminComplaintsController);

/**
 * @route   PATCH /api/admin/complaints/:id
 * @desc    Update complaint status and provide official admin resolution response
 * @access  Private (ADMIN)
 */
router.patch('/complaints/:id', updateComplaintController);

/**
 * @route   POST /api/admin/complaints
 * @desc    Create complaint (admin testing or manual registration)
 * @access  Private (ADMIN)
 */
router.post('/complaints', createComplaintController);

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Query immutable administrative audit logs
 * @access  Private (ADMIN)
 */
router.get('/audit-logs', getAdminAuditLogsController);

export default router;
