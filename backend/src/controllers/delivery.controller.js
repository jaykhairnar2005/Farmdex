import { dispatchOrderSchema, updateDeliveryStatusSchema } from '../validators/delivery.validator.js';
import {
  dispatchOrderService,
  updateDeliveryStatusService,
  getDeliveryByOrderIdService,
} from '../services/delivery.service.js';

/**
 * @route   POST /api/deliveries/:orderId/dispatch
 * @desc    Farmer dispatches a paid order and assigns tracking number
 * @access  Private (FARMER / ADMIN)
 */
export async function dispatchOrderController(req, res, next) {
  try {
    const parseResult = dispatchOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Invalid dispatch payload',
      });
    }

    const result = await dispatchOrderService(
      req.user.id,
      req.user.role,
      req.params.orderId,
      parseResult.data
    );

    return res.status(200).json({
      success: true,
      message: 'Order dispatched successfully',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   PATCH /api/deliveries/:orderId/status
 * @desc    Farmer updates delivery status through lifecycle (PREPARING, DISPATCHED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED)
 * @access  Private (FARMER / ADMIN)
 */
export async function updateDeliveryStatusController(req, res, next) {
  try {
    const parseResult = updateDeliveryStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Invalid delivery status update',
      });
    }

    const result = await updateDeliveryStatusService(
      req.user.id,
      req.user.role,
      req.params.orderId,
      parseResult.data
    );

    return res.status(200).json({
      success: true,
      message: `Delivery status updated to ${parseResult.data.status} successfully`,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/deliveries/:orderId
 * @desc    Get delivery tracking information and status timeline
 * @access  Private (BUYER / FARMER / ADMIN)
 */
export async function getDeliveryByOrderIdController(req, res, next) {
  try {
    const result = await getDeliveryByOrderIdService(req.user.id, req.user.role, req.params.orderId);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Delivery record not found or access denied',
      });
    }

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
}
