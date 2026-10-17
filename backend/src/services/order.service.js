import prisma from '../config/db.js';
import { createNotificationService } from './notification.service.js';

/**
 * Custom application error with HTTP status code
 */
class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

/**
 * Create Order from an ACCEPTED Offer
 * Enforces:
 * - Offer exists and belongs to the authenticated buyer
 * - Offer status must be 'ACCEPTED'
 * - Prevents duplicate order creation via DB transaction and unique offerId constraint
 * - Atomic stock check and reduction with row-level lock (FOR UPDATE) to prevent overselling
 * - Updates listing status to SOLD_OUT when stock reaches 0
 */
export async function createOrderService(buyerId, { offerId, shippingAddress }) {
  const order = await prisma.$transaction(async (tx) => {
    // 1. Check for existing order linked to this offer (Duplicate prevention)
    const existingOrder = await tx.order.findUnique({
      where: { offerId },
    });
    if (existingOrder) {
      throw new AppError('An order has already been created for this offer', 409);
    }

    // 2. Fetch Offer with listing and farmer details
    const offer = await tx.offer.findUnique({
      where: { id: offerId },
      include: {
        listing: {
          include: {
            farmerProfile: true,
          },
        },
      },
    });

    if (!offer) {
      throw new AppError('Offer not found', 404);
    }

    // 3. Ownership verification: buyer can only checkout their own offers
    if (offer.buyerId !== buyerId) {
      throw new AppError('Access denied: You can only create orders from your own offers', 403);
    }

    // 4. Offer status verification: must be ACCEPTED
    if (offer.status !== 'ACCEPTED') {
      throw new AppError(
        `Orders can only be created from ACCEPTED offers. Current offer status is '${offer.status}'`,
        400
      );
    }

    // 5. Atomic row-level lock on the crop listing to prevent concurrent overselling
    const listingId = offer.listingId;
    const lockedRows = await tx.$queryRaw`
      SELECT id, quantity, status FROM crop_listings WHERE id = ${listingId} FOR UPDATE
    `;

    if (!lockedRows || lockedRows.length === 0) {
      throw new AppError('Associated crop listing no longer exists', 404);
    }

    const lockedListing = lockedRows[0];

    if (lockedListing.status !== 'ACTIVE') {
      throw new AppError(
        `Crop listing is no longer active (current status: ${lockedListing.status})`,
        400
      );
    }

    const currentStock = Number(lockedListing.quantity);
    const orderQuantity = Number(offer.quantity);

    if (currentStock < orderQuantity) {
      throw new AppError(
        `Insufficient crop stock. Available: ${currentStock}, Requested: ${orderQuantity}`,
        400
      );
    }

    // 6. Safe stock reduction & status transition
    const remainingStock = Math.max(0, currentStock - orderQuantity);
    const newStatus = remainingStock <= 0 ? 'SOLD_OUT' : 'ACTIVE';

    await tx.cropListing.update({
      where: { id: listingId },
      data: {
        quantity: remainingStock,
        status: newStatus,
      },
    });

    // 7. Calculate total order amount
    const pricePerUnit = Number(offer.offeredPrice);
    const totalAmount = Number((orderQuantity * pricePerUnit).toFixed(2));
    const farmerUserId = offer.listing.farmerProfile.userId;

    // 8. Create Order and OrderItem in the same atomic transaction
    const order = await tx.order.create({
      data: {
        offerId: offer.id,
        buyerId,
        farmerId: farmerUserId,
        totalAmount,
        status: 'CONFIRMED',
        shippingAddress: shippingAddress.trim(),
        orderItems: {
          create: {
            listingId: offer.listingId,
            quantity: offer.quantity,
            pricePerUnit: offer.offeredPrice,
            subtotal: totalAmount,
          },
        },
      },
      include: {
        orderItems: {
          include: {
            listing: {
              select: {
                id: true,
                cropName: true,
                unit: true,
                quality: true,
                productImages: {
                  take: 1,
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        offer: {
          select: {
            id: true,
            status: true,
            quantity: true,
            offeredPrice: true,
          },
        },
      },
    });

    return order;
  });

  // Emit real-time notification to buyer and farmer
  if (order.buyerId) {
    createNotificationService({
      userId: order.buyerId,
      type: 'ORDER_CONFIRMED',
      title: 'Order Confirmed',
      message: `Your order #${order.id.slice(-6).toUpperCase()} has been confirmed! Total amount: ₹${order.totalAmount}.`,
    }).catch((err) => console.warn('[OrderNotification] Error:', err.message));
  }

  if (order.farmerId) {
    createNotificationService({
      userId: order.farmerId,
      type: 'ORDER_CONFIRMED',
      title: 'New Order Received',
      message: `New order #${order.id.slice(-6).toUpperCase()} placed by ${order.buyer?.name || 'buyer'} for ₹${order.totalAmount}.`,
    }).catch((err) => console.warn('[OrderNotification] Error:', err.message));
  }

  return order;
}

/**
 * Retrieve authenticated buyer's order history with pagination
 */
export async function getBuyerOrdersService(buyerId, { page = 1, limit = 20, status }) {
  const skip = (page - 1) * limit;
  const where = {
    buyerId,
    ...(status && { status }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          include: {
            listing: {
              select: {
                id: true,
                cropName: true,
                unit: true,
                quality: true,
                productImages: {
                  take: 1,
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
        farmer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        offer: {
          select: {
            id: true,
            status: true,
            quantity: true,
            offeredPrice: true,
          },
        },
        payment: true,
        delivery: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    data: orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Retrieve authenticated farmer's incoming orders with pagination
 */
export async function getFarmerOrdersService(farmerId, { page = 1, limit = 20, status }) {
  const skip = (page - 1) * limit;
  const where = {
    farmerId,
    ...(status && { status }),
  };

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        orderItems: {
          include: {
            listing: {
              select: {
                id: true,
                cropName: true,
                unit: true,
                quality: true,
                productImages: {
                  take: 1,
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        offer: {
          select: {
            id: true,
            status: true,
            quantity: true,
            offeredPrice: true,
          },
        },
        payment: true,
        delivery: true,
      },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    data: orders,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Retrieve single order by ID with tenant isolation
 */
export async function getOrderByIdService(orderId, userId, userRole) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        include: {
          listing: {
            select: {
              id: true,
              cropName: true,
              unit: true,
              quality: true,
              location: true,
              productImages: true,
            },
          },
        },
      },
      farmer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      buyer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      offer: {
        select: {
          id: true,
          status: true,
          quantity: true,
          offeredPrice: true,
          message: true,
        },
      },
      payment: true,
      delivery: true,
    },
  });

  if (!order) return null;

  // Strict tenant isolation: only the buyer, farmer, or admin can access
  if (userRole !== 'ADMIN' && order.buyerId !== userId && order.farmerId !== userId) {
    return null;
  }

  return order;
}
