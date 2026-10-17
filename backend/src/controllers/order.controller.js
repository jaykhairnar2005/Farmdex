import { createOrderSchema, queryOrdersSchema } from '../validators/order.validator.js';
import {
  createOrderService,
  getBuyerOrdersService,
  getFarmerOrdersService,
  getOrderByIdService,
} from '../services/order.service.js';

/**
 * @route   POST /api/orders
 * @desc    Create an order from an ACCEPTED offer
 * @access  Private (BUYER role)
 */
export async function createOrderController(req, res, next) {
  try {
    const parseResult = createOrderSchema.safeParse(req.body);
    if (!parseResult.success) {
      const formattedErrors = parseResult.error.issues.map((i) => ({
        field: i.path.join('.'),
        message: i.message,
      }));
      return res.status(400).json({
        success: false,
        message: formattedErrors[0]?.message || 'Validation error',
        errors: formattedErrors,
      });
    }

    const order = await createOrderService(req.user.id, parseResult.data);
    return res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/orders/my
 * @desc    Get order history for authenticated buyer
 * @access  Private (BUYER role)
 */
export async function getBuyerOrdersController(req, res, next) {
  try {
    const parseResult = queryOrdersSchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Invalid query parameters',
      });
    }

    const result = await getBuyerOrdersService(req.user.id, parseResult.data);
    return res.status(200).json({
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/orders/farmer
 * @desc    Get incoming orders for authenticated farmer
 * @access  Private (FARMER role)
 */
export async function getFarmerOrdersController(req, res, next) {
  try {
    const parseResult = queryOrdersSchema.safeParse(req.query);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        message: parseResult.error.issues[0]?.message || 'Invalid query parameters',
      });
    }

    const result = await getFarmerOrdersService(req.user.id, parseResult.data);
    return res.status(200).json({
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * @route   GET /api/orders/:id
 * @desc    Get order details by ID (Tenant isolated to buyer or farmer)
 * @access  Private
 */
export async function getOrderByIdController(req, res, next) {
  try {
    const order = await getOrderByIdService(req.params.id, req.user.id, req.user.role);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
}
