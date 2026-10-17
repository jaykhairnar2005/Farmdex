import crypto from 'crypto';
import prisma from '../config/db.js';
import { createNotificationService } from './notification.service.js';

class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Valid state transitions for the delivery lifecycle
 */
const VALID_DELIVERY_TRANSITIONS = {
  PENDING: ['PREPARING', 'DISPATCHED'],
  PREPARING: ['DISPATCHED'],
  DISPATCHED: ['IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'],
  IN_TRANSIT: ['OUT_FOR_DELIVERY', 'DELIVERED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  DELIVERED: [], // Terminal completed state
  CANCELLED: [],
};

/**
 * Format and synthesize a structured timeline for UI display
 */
function buildDeliveryTimeline(order, delivery, historyRecords = []) {
  const allSteps = [
    {
      key: 'ORDER_PLACED',
      title: 'Order Confirmed & Paid',
      description: 'Trade agreement locked and payment verified on server',
      timestamp: order.payment?.paidAt || order.createdAt,
    },
    {
      key: 'PREPARING',
      title: 'Preparing & Packing',
      description: 'Crop batch sorted, graded, and packed at farm warehouse',
      timestamp:
        historyRecords.find((h) => h.status === 'PREPARING')?.created_at ||
        (delivery?.status === 'PREPARING' ? delivery.updatedAt : null),
    },
    {
      key: 'DISPATCHED',
      title: 'Dispatched from Farm',
      description: `Carrier assigned. Consignment dispatched with tracking #${delivery?.trackingNumber || 'Pending'}`,
      timestamp:
        delivery?.shippedAt ||
        historyRecords.find((h) => h.status === 'DISPATCHED')?.created_at ||
        null,
    },
    {
      key: 'IN_TRANSIT',
      title: 'In Transit',
      description: 'Consignment en route through agricultural logistics corridor',
      timestamp:
        historyRecords.find((h) => h.status === 'IN_TRANSIT')?.created_at ||
        (delivery?.status === 'IN_TRANSIT' ? delivery.updatedAt : null),
    },
    {
      key: 'OUT_FOR_DELIVERY',
      title: 'Out for Delivery',
      description: 'Consignment loaded on local delivery transport to registered destination',
      timestamp:
        historyRecords.find((h) => h.status === 'OUT_FOR_DELIVERY')?.created_at ||
        (delivery?.status === 'OUT_FOR_DELIVERY' ? delivery.updatedAt : null),
    },
    {
      key: 'DELIVERED',
      title: 'Delivered & Received',
      description: 'Produce successfully delivered and handover confirmed by buyer',
      timestamp:
        delivery?.deliveredAt ||
        historyRecords.find((h) => h.status === 'DELIVERED')?.created_at ||
        null,
    },
  ];

  // Map active step index
  const statusStepMap = {
    PENDING: 0,
    PREPARING: 1,
    DISPATCHED: 2,
    IN_TRANSIT: 3,
    OUT_FOR_DELIVERY: 4,
    DELIVERED: 5,
  };

  const currentStepIndex = delivery?.status ? statusStepMap[delivery.status] ?? 0 : 0;

  return {
    currentStepIndex,
    isCompleted: delivery?.status === 'DELIVERED',
    steps: allSteps.map((step, idx) => ({
      ...step,
      isCompleted: idx <= currentStepIndex,
      isCurrent: idx === currentStepIndex,
    })),
  };
}

/**
 * Dispatch a paid order and assign tracking number (Farmer for own order / Admin)
 */
export async function dispatchOrderService(userId, userRole, orderId, data) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payment: true,
      delivery: true,
      buyer: { select: { id: true, name: true, phone: true } },
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // 1. Role permission: BUYER has read-only access
  if (userRole === 'BUYER') {
    throw new AppError('Access denied: Buyers have read-only access and cannot dispatch orders', 403);
  }

  // 2. Ownership check: FARMER can only dispatch their own orders
  if (userRole !== 'ADMIN' && order.farmerId !== userId) {
    throw new AppError('Access denied: Farmers can only dispatch their own orders', 403);
  }

  // 3. Payment verification: order must be paid before dispatch
  if (!order.payment || order.payment.status !== 'SUCCESS') {
    throw new AppError(
      'Cannot dispatch unpaid order. Payment must be confirmed via Razorpay before dispatching.',
      400
    );
  }

  // 4. Status check: cannot dispatch cancelled or already delivered order (unless admin correcting)
  if (order.status === 'CANCELLED' && userRole !== 'ADMIN') {
    throw new AppError('Cannot dispatch a cancelled order', 400);
  }
  if (order.delivery?.status === 'DELIVERED' && userRole !== 'ADMIN') {
    throw new AppError('Cannot dispatch an order that has already been delivered', 400);
  }

  // Generate deterministic/standard tracking number if not provided
  const trackingNumber =
    data.trackingNumber?.trim() ||
    `FDX-TRK-${order.id.slice(0, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;

  const estimatedDelivery = data.estimatedDelivery
    ? new Date(data.estimatedDelivery)
    : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // Default 3 days

  const shippedAt = new Date();

  // Perform atomic delivery creation/update
  const delivery = await prisma.$transaction(async (tx) => {
    const del = await tx.delivery.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        status: 'DISPATCHED',
        trackingNumber,
        estimatedDelivery,
        shippedAt,
      },
      update: {
        status: 'DISPATCHED',
        trackingNumber,
        estimatedDelivery,
        shippedAt,
      },
    });

    await tx.order.update({
      where: { id: order.id },
      data: { status: 'SHIPPED' },
    });

    return del;
  });

  // Record history log
  const historyId = crypto.randomUUID();
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO delivery_status_history (id, delivery_id, order_id, status, location, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      historyId,
      delivery.id,
      order.id,
      'DISPATCHED',
      data.location || 'Farm Dispatch Center',
      data.note || `Order dispatched via logistics tracking #${trackingNumber}`
    );
  } catch (err) {
    console.warn('[DeliveryService] Warning: Failed to record delivery_status_history log:', err.message);
  }

  // Real-time dispatch notification to buyer
  if (order.buyerId) {
    createNotificationService({
      userId: order.buyerId,
      type: 'ORDER_SHIPPED',
      title: 'Order Dispatched',
      message: `Your order #${order.id.slice(-6).toUpperCase()} has been dispatched! Tracking #${trackingNumber}.`,
    }).catch((err) => console.warn('[DeliveryNotification] Error:', err.message));
  }

  return {
    ...delivery,
    timeline: buildDeliveryTimeline(order, delivery),
  };
}

/**
 * Update delivery status through lifecycle:
 * - FARMER: Can update PREPARING and DISPATCHED only for their own orders.
 * - ADMIN: Can update or correct delivery statuses.
 * - BUYER: Read-only access to delivery tracking.
 */
export async function updateDeliveryStatusService(userId, userRole, orderId, data) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payment: true,
      delivery: true,
    },
  });

  if (!order) {
    throw new AppError('Order not found', 404);
  }

  // 1. Role permission: BUYER has read-only access
  if (userRole === 'BUYER') {
    throw new AppError('Access denied: Buyers have read-only access to delivery tracking', 403);
  }

  // 2. Ownership check: FARMER can only update their own orders
  if (userRole === 'FARMER' && order.farmerId !== userId) {
    throw new AppError('Access denied: Farmers can only update delivery status for their own orders', 403);
  }

  const targetStatus = data.status;

  // 3. Status restriction: FARMER can update PREPARING and DISPATCHED only
  if (userRole === 'FARMER' && !['PREPARING', 'DISPATCHED'].includes(targetStatus)) {
    throw new AppError(
      `Access denied: Farmers are only permitted to update status to PREPARING or DISPATCHED for their own orders. Status '${targetStatus}' must be updated by ADMIN.`,
      403
    );
  }

  // 4. Precondition: order must be paid
  if (!order.payment || order.payment.status !== 'SUCCESS') {
    throw new AppError('Cannot update delivery for an unpaid order. Payment must be confirmed first.', 400);
  }

  // 5. Precondition: cannot transition cancelled orders (unless ADMIN is correcting)
  if (order.status === 'CANCELLED' && userRole !== 'ADMIN') {
    throw new AppError('Cannot update delivery status of a cancelled order', 400);
  }

  const currentStatus = order.delivery?.status || 'PENDING';

  // Idempotent handling: if already at target status, return existing delivery
  if (currentStatus === targetStatus) {
    const historyRecords = await prisma
      .$queryRawUnsafe(
        'SELECT * FROM delivery_status_history WHERE order_id = $1 ORDER BY created_at ASC',
        order.id
      )
      .catch(() => []);

    return {
      ...order.delivery,
      timeline: buildDeliveryTimeline(order, order.delivery, historyRecords),
    };
  }

  // 6. Validate state transitions:
  // For FARMER:
  // - PENDING -> PREPARING, DISPATCHED
  // - PREPARING -> DISPATCHED
  // Backward transitions (e.g. DISPATCHED -> PREPARING) or transitions out of terminal states return HTTP 400.
  if (userRole === 'FARMER') {
    const allowedNextStatuses = VALID_DELIVERY_TRANSITIONS[currentStatus] || [];
    if (!allowedNextStatuses.includes(targetStatus)) {
      throw new AppError(
        `Invalid delivery status transition from '${currentStatus}' to '${targetStatus}'. Allowed transitions: ${
          allowedNextStatuses.length > 0 ? allowedNextStatuses.join(', ') : 'None'
        }`,
        400
      );
    }
  }

  // For ADMIN:
  // ADMIN can update or correct delivery statuses across all valid DeliveryStatus values:
  // PREPARING, DISPATCHED, IN_TRANSIT, OUT_FOR_DELIVERY, DELIVERED.
  const validAllStatuses = ['PREPARING', 'DISPATCHED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'];
  if (!validAllStatuses.includes(targetStatus)) {
    throw new AppError(`Invalid delivery status: '${targetStatus}'`, 400);
  }

  // Determine timestamps
  const updates = {
    status: targetStatus,
  };

  if (targetStatus === 'DISPATCHED' && !order.delivery?.shippedAt) {
    updates.shippedAt = new Date();
  }
  if (targetStatus === 'DELIVERED') {
    updates.deliveredAt = new Date();
  } else if (order.delivery?.deliveredAt && targetStatus !== 'DELIVERED') {
    // If ADMIN is correcting away from DELIVERED, clear deliveredAt timestamp
    updates.deliveredAt = null;
  }

  if (data.trackingNumber) {
    updates.trackingNumber = data.trackingNumber.trim();
  }
  if (data.estimatedDelivery) {
    updates.estimatedDelivery = new Date(data.estimatedDelivery);
  }

  // Determine matching order status
  let mappedOrderStatus = 'CONFIRMED';
  if (targetStatus === 'PREPARING') mappedOrderStatus = 'PREPARING';
  else if (targetStatus === 'DISPATCHED') mappedOrderStatus = 'SHIPPED';
  else if (targetStatus === 'IN_TRANSIT') mappedOrderStatus = 'IN_TRANSIT';
  else if (targetStatus === 'OUT_FOR_DELIVERY') mappedOrderStatus = 'OUT_FOR_DELIVERY';
  else if (targetStatus === 'DELIVERED') mappedOrderStatus = 'DELIVERED';

  // Perform atomic update
  const updatedDelivery = await prisma.$transaction(async (tx) => {
    const del = await tx.delivery.upsert({
      where: { orderId: order.id },
      create: {
        orderId: order.id,
        trackingNumber: data.trackingNumber || `FDX-TRK-${order.id.slice(0, 8).toUpperCase()}`,
        ...updates,
      },
      update: updates,
    });

    await tx.order.update({
      where: { id: order.id },
      data: { status: mappedOrderStatus },
    });

    return del;
  });

  // Record history log
  const historyId = crypto.randomUUID();
  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO delivery_status_history (id, delivery_id, order_id, status, location, note, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      historyId,
      updatedDelivery.id,
      order.id,
      targetStatus,
      data.location || null,
      data.note || `Delivery status transitioned to ${targetStatus}`
    );
  } catch (err) {
    console.warn('[DeliveryService] Warning: Failed to insert status history:', err.message);
  }

  const historyRecords = await prisma
    .$queryRawUnsafe(
      'SELECT * FROM delivery_status_history WHERE order_id = $1 ORDER BY created_at ASC',
      order.id
    )
    .catch(() => []);

  // Notifications for DISPATCHED and DELIVERED status changes
  if (targetStatus === 'DISPATCHED' && order.buyerId) {
    createNotificationService({
      userId: order.buyerId,
      type: 'ORDER_SHIPPED',
      title: 'Order Dispatched',
      message: `Your order #${order.id.slice(-6).toUpperCase()} has been dispatched! Tracking #${updatedDelivery.trackingNumber || 'Available'}.`,
    }).catch((err) => console.warn('[DeliveryNotification] Error:', err.message));
  } else if (targetStatus === 'DELIVERED') {
    if (order.buyerId) {
      createNotificationService({
        userId: order.buyerId,
        type: 'ORDER_DELIVERED',
        title: 'Order Delivered',
        message: `Your order #${order.id.slice(-6).toUpperCase()} has been successfully delivered.`,
      }).catch((err) => console.warn('[DeliveryNotification] Error:', err.message));
    }
    if (order.farmerId) {
      createNotificationService({
        userId: order.farmerId,
        type: 'ORDER_DELIVERED',
        title: 'Order Delivered',
        message: `Order #${order.id.slice(-6).toUpperCase()} was delivered to the buyer.`,
      }).catch((err) => console.warn('[DeliveryNotification] Error:', err.message));
    }
  }

  return {
    ...updatedDelivery,
    timeline: buildDeliveryTimeline(order, updatedDelivery, historyRecords),
    history: historyRecords,
  };
}

/**
 * Get delivery details and tracking timeline for an order
 * Enforces strict tenant isolation (buyer, seller farmer, admin)
 */
export async function getDeliveryByOrderIdService(userId, userRole, orderId) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      delivery: true,
      payment: true,
      buyer: {
        select: { id: true, name: true, email: true, phone: true },
      },
      farmer: {
        select: { id: true, name: true, email: true, phone: true },
      },
      orderItems: {
        include: {
          listing: {
            select: {
              id: true,
              cropName: true,
              unit: true,
              productImages: { take: 1, orderBy: { sortOrder: 'asc' } },
            },
          },
        },
      },
    },
  });

  if (!order) {
    return null;
  }

  // Strict tenant isolation: buyer can only view own order, farmer can only view sold order
  if (userRole !== 'ADMIN' && order.buyerId !== userId && order.farmerId !== userId) {
    return null;
  }

  // Fetch status history records
  const historyRecords = await prisma
    .$queryRawUnsafe(
      'SELECT * FROM delivery_status_history WHERE order_id = $1 ORDER BY created_at ASC',
      order.id
    )
    .catch(() => []);

  const timeline = buildDeliveryTimeline(order, order.delivery, historyRecords);

  return {
    orderId: order.id,
    orderStatus: order.status,
    totalAmount: order.totalAmount,
    shippingAddress: order.shippingAddress,
    buyer: order.buyer,
    farmer: order.farmer,
    payment: order.payment,
    delivery: order.delivery || {
      status: 'PENDING',
      trackingNumber: null,
      estimatedDelivery: null,
      shippedAt: null,
      deliveredAt: null,
    },
    timeline,
    history: historyRecords,
  };
}
