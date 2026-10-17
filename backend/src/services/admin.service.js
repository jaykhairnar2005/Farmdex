import crypto from 'crypto';
import prisma from '../config/db.js';

/**
 * Record an entry into admin_audit_logs
 */
export async function recordAuditLog({
  adminId,
  adminEmail,
  action,
  targetType,
  targetId = null,
  details = {},
  ipAddress = '127.0.0.1',
}) {
  try {
    const id = crypto.randomUUID();
    const detailsJson = JSON.stringify(details).replace(/'/g, "''");
    await prisma.$executeRawUnsafe(`
      INSERT INTO admin_audit_logs (id, admin_id, admin_email, action, target_type, target_id, details, ip_address, created_at)
      VALUES (
        '${id}',
        '${adminId}',
        '${adminEmail}',
        '${action}',
        '${targetType}',
        ${targetId ? `'${targetId}'` : 'NULL'},
        '${detailsJson}'::jsonb,
        '${ipAddress}',
        NOW()
      )
    `);
  } catch (err) {
    console.error('Audit Log Recording Warning:', err.message);
  }
}

/**
 * Real-time Database Statistics & Metrics
 */
export async function getAdminStatsService() {
  const [
    totalUsers,
    farmerUsers,
    buyerUsers,
    adminUsers,
    activeUsers,
    verifiedUsers,
    totalListings,
    activeListings,
    suspendedListings,
    soldOutListings,
    inactiveListings,
    totalOrders,
    pendingOrders,
    confirmedOrders,
    shippedOrders,
    deliveredOrders,
    cancelledOrders,
    totalPayments,
    successfulPayments,
    failedPayments,
    pendingPayments,
    totalDeliveries,
    deliveredDeliveries,
    inTransitDeliveries,
    totalComplaints,
    openComplaints,
    underReviewComplaints,
    resolvedComplaints,
    dismissedComplaints,
    revenueAgg,
    recentOrders,
    recentListings,
    recentUsers,
    recentComplaints,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'FARMER' } }),
    prisma.user.count({ where: { role: 'BUYER' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isVerified: true } }),

    prisma.cropListing.count(),
    prisma.cropListing.count({ where: { status: 'ACTIVE' } }),
    prisma.cropListing.count({ where: { status: 'SUSPENDED' } }),
    prisma.cropListing.count({ where: { status: 'SOLD_OUT' } }),
    prisma.cropListing.count({ where: { status: 'INACTIVE' } }),

    prisma.order.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.count({ where: { status: 'CONFIRMED' } }),
    prisma.order.count({ where: { status: 'SHIPPED' } }),
    prisma.order.count({ where: { status: 'DELIVERED' } }),
    prisma.order.count({ where: { status: 'CANCELLED' } }),

    prisma.payment.count(),
    prisma.payment.count({ where: { status: 'SUCCESS' } }),
    prisma.payment.count({ where: { status: 'FAILED' } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),

    prisma.delivery.count(),
    prisma.delivery.count({ where: { status: 'DELIVERED' } }),
    prisma.delivery.count({
      where: {
        status: { in: ['SHIPPED', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DISPATCHED'] },
      },
    }),

    prisma.complaint.count(),
    prisma.complaint.count({ where: { status: 'OPEN' } }),
    prisma.complaint.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.complaint.count({ where: { status: 'RESOLVED' } }),
    prisma.complaint.count({ where: { status: 'DISMISSED' } }),

    prisma.payment.aggregate({
      where: { status: 'SUCCESS' },
      _sum: { amount: true },
    }),

    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        farmer: { select: { id: true, name: true, email: true } },
        payment: { select: { status: true, amount: true } },
        delivery: { select: { status: true, trackingNumber: true } },
      },
    }),

    prisma.cropListing.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        farmerProfile: {
          include: { user: { select: { id: true, name: true, email: true } } },
        },
      },
    }),

    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
      },
    }),

    prisma.complaint.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        reportedBy: { select: { id: true, name: true, email: true } },
      },
    }),
  ]);

  const totalRevenue = revenueAgg._sum.amount ? Number(revenueAgg._sum.amount) : 0;

  return {
    users: {
      total: totalUsers,
      farmers: farmerUsers,
      buyers: buyerUsers,
      admins: adminUsers,
      active: activeUsers,
      inactive: totalUsers - activeUsers,
      verified: verifiedUsers,
      unverified: totalUsers - verifiedUsers,
    },
    listings: {
      total: totalListings,
      active: activeListings,
      suspended: suspendedListings,
      soldOut: soldOutListings,
      inactive: inactiveListings,
    },
    orders: {
      total: totalOrders,
      pending: pendingOrders,
      confirmed: confirmedOrders,
      shipped: shippedOrders,
      delivered: deliveredOrders,
      cancelled: cancelledOrders,
    },
    payments: {
      total: totalPayments,
      success: successfulPayments,
      failed: failedPayments,
      pending: pendingPayments,
      totalSettledRevenue: totalRevenue,
    },
    deliveries: {
      total: totalDeliveries,
      delivered: deliveredDeliveries,
      inTransit: inTransitDeliveries,
    },
    complaints: {
      total: totalComplaints,
      open: openComplaints,
      underReview: underReviewComplaints,
      resolved: resolvedComplaints,
      dismissed: dismissedComplaints,
    },
    recent: {
      orders: recentOrders,
      listings: recentListings,
      users: recentUsers,
      complaints: recentComplaints,
    },
  };
}

/**
 * Get Paginated Users List with Filters
 */
export async function getAdminUsersService({
  page = 1,
  limit = 10,
  search = '',
  role = 'ALL',
  isActive = 'ALL',
  isVerified = 'ALL',
}) {
  const skip = (page - 1) * limit;
  const where = {};

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { name: { contains: s, mode: 'insensitive' } },
      { email: { contains: s, mode: 'insensitive' } },
      { phone: { contains: s, mode: 'insensitive' } },
    ];
  }

  if (role && role !== 'ALL') {
    where.role = role;
  }

  if (isActive !== 'ALL') {
    where.isActive = isActive === 'true' || isActive === true;
  }

  if (isVerified !== 'ALL') {
    where.isVerified = isVerified === 'true' || isVerified === true;
  }

  const [totalCount, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        farmerProfile: {
          select: {
            id: true,
            farmName: true,
            district: true,
            state: true,
            verificationStatus: true,
            _count: { select: { cropListings: true, farms: true } },
          },
        },
        buyerProfile: {
          select: {
            id: true,
            businessName: true,
            businessType: true,
            district: true,
            state: true,
          },
        },
        _count: {
          select: {
            buyerOrders: true,
            farmerOrders: true,
            offers: true,
          },
        },
      },
    }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
      totalCount,
    },
  };
}

/**
 * Toggle User Active Status (Deactivate / Activate)
 * Protects against self-lockout/self-deactivation.
 */
export async function updateUserStatusService({
  targetUserId,
  isActive,
  reason = '',
  adminUser,
  ipAddress,
}) {
  // Prevent admin from deactivating themselves
  if (targetUserId === adminUser.id && !isActive) {
    const error = new Error('Security Violation: Administrators cannot deactivate their own account');
    error.statusCode = 400;
    throw error;
  }

  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
  });

  if (!user) {
    const error = new Error('Target user not found');
    error.statusCode = 404;
    throw error;
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: { isActive },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      isVerified: true,
      updatedAt: true,
    },
  });

  await recordAuditLog({
    adminId: adminUser.id,
    adminEmail: adminUser.email,
    action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
    targetType: 'USER',
    targetId: targetUserId,
    details: {
      targetEmail: user.email,
      targetRole: user.role,
      previousActive: user.isActive,
      newActive: isActive,
      reason,
    },
    ipAddress,
  });

  return updatedUser;
}

/**
 * Update User Verification Status
 */
export async function updateUserVerificationService({
  targetUserId,
  isVerified,
  adminUser,
  ipAddress,
}) {
  const user = await prisma.user.findUnique({
    where: { id: targetUserId },
    include: { farmerProfile: true },
  });

  if (!user) {
    const error = new Error('Target user not found');
    error.statusCode = 404;
    throw error;
  }

  const updatedUser = await prisma.user.update({
    where: { id: targetUserId },
    data: {
      isVerified,
      ...(user.farmerProfile && {
        farmerProfile: {
          update: {
            verificationStatus: isVerified ? 'VERIFIED' : 'PENDING',
          },
        },
      }),
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isVerified: true,
      isActive: true,
    },
  });

  await recordAuditLog({
    adminId: adminUser.id,
    adminEmail: adminUser.email,
    action: isVerified ? 'USER_VERIFIED' : 'USER_UNVERIFIED',
    targetType: 'USER',
    targetId: targetUserId,
    details: {
      targetEmail: user.email,
      targetRole: user.role,
      isVerified,
    },
    ipAddress,
  });

  return updatedUser;
}

/**
 * Get Paginated Crop Listings with Moderation Status
 */
export async function getAdminListingsService({
  page = 1,
  limit = 10,
  search = '',
  status = 'ALL',
  categoryId = 'ALL',
}) {
  const skip = (page - 1) * limit;
  const where = {};

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { cropName: { contains: s, mode: 'insensitive' } },
      { location: { contains: s, mode: 'insensitive' } },
      { description: { contains: s, mode: 'insensitive' } },
    ];
  }

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (categoryId && categoryId !== 'ALL') {
    where.categoryId = categoryId;
  }

  const [totalCount, listings] = await Promise.all([
    prisma.cropListing.count({ where }),
    prisma.cropListing.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        farmerProfile: {
          include: {
            user: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
        farm: { select: { id: true, name: true, district: true, state: true } },
        productImages: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { offers: true, orderItems: true, complaints: true } },
      },
    }),
  ]);

  return {
    listings,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
      totalCount,
    },
  };
}

/**
 * Moderate Produce Listing (SUSPEND, REINSTATE, ARCHIVE)
 */
export async function moderateListingService({
  listingId,
  status,
  reason = '',
  adminUser,
  ipAddress,
}) {
  const listing = await prisma.cropListing.findUnique({
    where: { id: listingId },
    include: { farmerProfile: { include: { user: true } } },
  });

  if (!listing) {
    const error = new Error('Produce listing not found');
    error.statusCode = 404;
    throw error;
  }

  const updatedListing = await prisma.cropListing.update({
    where: { id: listingId },
    data: { status },
    include: {
      category: true,
      farmerProfile: { include: { user: { select: { name: true, email: true } } } },
    },
  });

  await recordAuditLog({
    adminId: adminUser.id,
    adminEmail: adminUser.email,
    action: `LISTING_${status}`,
    targetType: 'CROP_LISTING',
    targetId: listingId,
    details: {
      cropName: listing.cropName,
      farmerEmail: listing.farmerProfile?.user?.email,
      previousStatus: listing.status,
      newStatus: status,
      reason,
    },
    ipAddress,
  });

  return updatedListing;
}

/**
 * Get Orders for Admin Monitoring
 */
export async function getAdminOrdersService({
  page = 1,
  limit = 10,
  status = 'ALL',
  search = '',
}) {
  const skip = (page - 1) * limit;
  const where = {};

  if (status && status !== 'ALL') {
    where.status = status;
  }

  if (search && search.trim()) {
    const s = search.trim();
    where.OR = [
      { id: { contains: s, mode: 'insensitive' } },
      { buyer: { name: { contains: s, mode: 'insensitive' } } },
      { buyer: { email: { contains: s, mode: 'insensitive' } } },
      { farmer: { name: { contains: s, mode: 'insensitive' } } },
      { farmer: { email: { contains: s, mode: 'insensitive' } } },
    ];
  }

  const [totalCount, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: { select: { id: true, name: true, email: true, phone: true } },
        farmer: { select: { id: true, name: true, email: true, phone: true } },
        payment: true,
        delivery: true,
        orderItems: {
          include: {
            listing: {
              select: {
                id: true,
                cropName: true,
                unit: true,
                productImages: { take: 1 },
              },
            },
          },
        },
      },
    }),
  ]);

  return {
    orders,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
      totalCount,
    },
  };
}

/**
 * Get Payments for Admin Monitoring
 */
export async function getAdminPaymentsService({
  page = 1,
  limit = 10,
  status = 'ALL',
}) {
  const skip = (page - 1) * limit;
  const where = {};

  if (status && status !== 'ALL') {
    where.status = status;
  }

  const [totalCount, payments] = await Promise.all([
    prisma.payment.count({ where }),
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            buyer: { select: { id: true, name: true, email: true } },
            farmer: { select: { id: true, name: true, email: true } },
          },
        },
      },
    }),
  ]);

  return {
    payments,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
      totalCount,
    },
  };
}

/**
 * Get Deliveries for Admin Monitoring
 */
export async function getAdminDeliveriesService({
  page = 1,
  limit = 10,
  status = 'ALL',
}) {
  const skip = (page - 1) * limit;
  const where = {};

  if (status && status !== 'ALL') {
    where.status = status;
  }

  const [totalCount, deliveries] = await Promise.all([
    prisma.delivery.count({ where }),
    prisma.delivery.findMany({
      where,
      skip,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      include: {
        order: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            shippingAddress: true,
            buyer: { select: { id: true, name: true, email: true, phone: true } },
            farmer: { select: { id: true, name: true, email: true, phone: true } },
          },
        },
      },
    }),
  ]);

  return {
    deliveries,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
      totalCount,
    },
  };
}

/**
 * Get Complaints for Admin Resolution
 */
export async function getAdminComplaintsService({
  page = 1,
  limit = 10,
  status = 'ALL',
}) {
  const skip = (page - 1) * limit;
  const where = {};

  if (status && status !== 'ALL') {
    where.status = status;
  }

  const [totalCount, complaints] = await Promise.all([
    prisma.complaint.count({ where }),
    prisma.complaint.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        reportedBy: { select: { id: true, name: true, email: true, phone: true, role: true } },
        listing: {
          select: {
            id: true,
            cropName: true,
            pricePerUnit: true,
            unit: true,
            farmerProfile: {
              include: { user: { select: { name: true, email: true } } },
            },
          },
        },
        order: {
          select: {
            id: true,
            totalAmount: true,
            status: true,
            buyer: { select: { name: true, email: true } },
            farmer: { select: { name: true, email: true } },
          },
        },
      },
    }),
  ]);

  return {
    complaints,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
      totalCount,
    },
  };
}

/**
 * Update Complaint Status & Admin Response
 */
export async function updateComplaintService({
  complaintId,
  status,
  adminResponse,
  adminUser,
  ipAddress,
}) {
  const complaint = await prisma.complaint.findUnique({
    where: { id: complaintId },
  });

  if (!complaint) {
    const error = new Error('Complaint not found');
    error.statusCode = 404;
    throw error;
  }

  const isTerminal = status === 'RESOLVED' || status === 'DISMISSED';

  const updatedComplaint = await prisma.complaint.update({
    where: { id: complaintId },
    data: {
      status,
      adminResponse,
      resolvedAt: isTerminal ? new Date() : null,
    },
    include: {
      reportedBy: { select: { id: true, name: true, email: true } },
    },
  });

  await recordAuditLog({
    adminId: adminUser.id,
    adminEmail: adminUser.email,
    action: `COMPLAINT_${status}`,
    targetType: 'COMPLAINT',
    targetId: complaintId,
    details: {
      previousStatus: complaint.status,
      newStatus: status,
      adminResponse,
    },
    ipAddress,
  });

  return updatedComplaint;
}

/**
 * Create Complaint (User Facing or Admin Direct)
 */
export async function createComplaintService({
  reportedById,
  listingId,
  orderId,
  reason,
  description,
}) {
  // Validate target existence
  if (listingId) {
    const listing = await prisma.cropListing.findUnique({ where: { id: listingId } });
    if (!listing) {
      const error = new Error('Associated produce listing not found');
      error.statusCode = 404;
      throw error;
    }
  }

  if (orderId) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      const error = new Error('Associated order not found');
      error.statusCode = 404;
      throw error;
    }
  }

  const complaint = await prisma.complaint.create({
    data: {
      reportedById,
      listingId: listingId || null,
      orderId: orderId || null,
      reason,
      description,
      status: 'OPEN',
    },
    include: {
      reportedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return complaint;
}

/**
 * Query Audit Logs
 */
export async function getAdminAuditLogsService({
  page = 1,
  limit = 20,
  action = 'ALL',
  targetType = 'ALL',
}) {
  const offset = (page - 1) * limit;
  let whereClauses = [];

  if (action && action !== 'ALL') {
    whereClauses.push(`action = '${action}'`);
  }

  if (targetType && targetType !== 'ALL') {
    whereClauses.push(`target_type = '${targetType}'`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const [countResult, logs] = await Promise.all([
    prisma.$queryRawUnsafe(`SELECT COUNT(*)::int as count FROM admin_audit_logs ${whereSql}`),
    prisma.$queryRawUnsafe(`
      SELECT 
        id, 
        admin_id as "adminId", 
        admin_email as "adminEmail", 
        action, 
        target_type as "targetType", 
        target_id as "targetId", 
        details, 
        ip_address as "ipAddress", 
        created_at as "createdAt"
      FROM admin_audit_logs
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `),
  ]);

  const totalCount = countResult[0]?.count || 0;

  return {
    logs,
    pagination: {
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
      totalCount,
    },
  };
}
