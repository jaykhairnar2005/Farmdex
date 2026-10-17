import prisma from '../config/db.js';
import { createNotificationService } from './notification.service.js';

/**
 * Retrieve FarmerProfile for a user ID
 */
async function getFarmerProfileByUserId(userId) {
  return prisma.farmerProfile.findUnique({
    where: { userId },
  });
}

/**
 * Create a new offer on an active crop listing (Buyer only)
 */
export async function createOfferService(buyerId, userRole, offerData) {
  // 1. Role verification
  if (userRole !== 'BUYER' && userRole !== 'ADMIN') {
    const error = new Error('Only registered buyers can place offers on produce listings.');
    error.statusCode = 403;
    throw error;
  }

  // 2. Fetch target listing
  const listing = await prisma.cropListing.findUnique({
    where: { id: offerData.listingId },
    include: {
      farmerProfile: {
        select: { id: true, userId: true },
      },
    },
  });

  if (!listing) {
    const error = new Error('Produce listing not found');
    error.statusCode = 404;
    throw error;
  }

  // 3. Listing must be ACTIVE
  if (listing.status !== 'ACTIVE') {
    const error = new Error(`Cannot place offers on a ${listing.status.toLowerCase()} listing. Only ACTIVE produce listings accept offers.`);
    error.statusCode = 400;
    throw error;
  }

  // 4. Prevention of self-offers
  if (listing.farmerProfile?.userId === buyerId) {
    const error = new Error('You cannot place an offer on your own produce listing.');
    error.statusCode = 400;
    throw error;
  }

  // 5. Quantity validation against listing inventory
  if (Number(offerData.quantity) > Number(listing.quantity)) {
    const error = new Error(
      `Offered quantity (${offerData.quantity} ${listing.unit}) exceeds available produce stock (${Number(listing.quantity)} ${listing.unit}).`
    );
    error.statusCode = 400;
    throw error;
  }

  // 6. Check for duplicate pending/countered offers from the same buyer
  const existingOffer = await prisma.offer.findFirst({
    where: {
      listingId: offerData.listingId,
      buyerId,
      status: { in: ['PENDING', 'COUNTERED'] },
    },
  });

  if (existingOffer) {
    const error = new Error(
      'You already have an active negotiation pending on this produce listing. Please manage or resolve your existing offer.'
    );
    error.statusCode = 400;
    throw error;
  }

  // 7. Create offer
  const offer = await prisma.offer.create({
    data: {
      listingId: offerData.listingId,
      buyerId,
      quantity: offerData.quantity,
      offeredPrice: offerData.offeredPrice,
      message: offerData.message?.trim() || null,
      status: 'PENDING',
      expiresAt: offerData.expiresAt ? new Date(offerData.expiresAt) : null,
    },
    include: {
      listing: {
        select: {
          id: true,
          cropName: true,
          pricePerUnit: true,
          quantity: true,
          unit: true,
          location: true,
          isOrganic: true,
          status: true,
          category: { select: { id: true, name: true } },
          productImages: { select: { id: true, imageUrl: true }, orderBy: { sortOrder: 'asc' } },
          farmerProfile: {
            select: {
              id: true,
              farmName: true,
              district: true,
              state: true,
              user: { select: { id: true, name: true, phone: true } },
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
          buyerProfile: { select: { businessName: true, businessType: true } },
        },
      },
    },
  });

  const farmerUserId = listing.farmerProfile?.user?.id || listing.farmerProfile?.userId;
  if (farmerUserId) {
    createNotificationService({
      userId: farmerUserId,
      type: 'NEW_OFFER',
      title: 'New Offer Received',
      message: `${offer.buyer?.name || 'A buyer'} offered ₹${offer.offeredPrice}/${listing.unit} for ${offer.quantity} ${listing.unit} of ${listing.cropName}.`,
    }).catch((err) => console.warn('[OfferNotification] Error:', err.message));
  }

  return offer;
}

/**
 * Retrieve offers placed by authenticated buyer
 */
export async function getBuyerOffersService(buyerId, filters = {}) {
  const { status, listingId, page = 1, limit = 20 } = filters;

  const where = { buyerId };
  if (status) where.status = status;
  if (listingId) where.listingId = listingId;

  const skip = (page - 1) * limit;

  const [total, data] = await Promise.all([
    prisma.offer.count({ where }),
    prisma.offer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          select: {
            id: true,
            cropName: true,
            pricePerUnit: true,
            quantity: true,
            unit: true,
            location: true,
            isOrganic: true,
            status: true,
            category: { select: { id: true, name: true } },
            productImages: { select: { id: true, imageUrl: true }, orderBy: { sortOrder: 'asc' } },
            farmerProfile: {
              select: {
                id: true,
                farmName: true,
                district: true,
                state: true,
                user: { select: { id: true, name: true, phone: true } },
              },
            },
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Retrieve incoming offers on produce listings owned by authenticated farmer
 */
export async function getFarmerOffersService(userId, filters = {}) {
  const farmerProfile = await getFarmerProfileByUserId(userId);
  if (!farmerProfile) {
    const error = new Error('Farmer profile not found for authenticated account');
    error.statusCode = 403;
    throw error;
  }

  const { status, listingId, page = 1, limit = 20 } = filters;

  const where = {
    listing: {
      farmerProfileId: farmerProfile.id,
    },
  };
  if (status) where.status = status;
  if (listingId) where.listingId = listingId;

  const skip = (page - 1) * limit;

  const [total, data] = await Promise.all([
    prisma.offer.count({ where }),
    prisma.offer.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          select: {
            id: true,
            cropName: true,
            pricePerUnit: true,
            quantity: true,
            unit: true,
            location: true,
            isOrganic: true,
            status: true,
            category: { select: { id: true, name: true } },
            productImages: { select: { id: true, imageUrl: true }, orderBy: { sortOrder: 'asc' } },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            buyerProfile: { select: { businessName: true, businessType: true } },
          },
        },
        order: {
          select: {
            id: true,
            status: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    }),
  ]);

  return {
    data,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

/**
 * Retrieve offers for a specific listing with role-based access isolation
 */
export async function getListingOffersService(listingId, userId, userRole) {
  const listing = await prisma.cropListing.findUnique({
    where: { id: listingId },
    include: { farmerProfile: true },
  });

  if (!listing) return null;

  const isListingOwner = listing.farmerProfile?.userId === userId;

  if (isListingOwner || userRole === 'ADMIN') {
    // Farmer sees all offers on their listing
    return prisma.offer.findMany({
      where: { listingId },
      orderBy: { createdAt: 'desc' },
      include: {
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            buyerProfile: { select: { businessName: true, businessType: true } },
          },
        },
      },
    });
  }

  // Buyer sees only their own offer(s) on this listing
  return prisma.offer.findMany({
    where: {
      listingId,
      buyerId: userId,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Retrieve single offer with ownership isolation
 */
export async function getOfferByIdService(offerId, userId) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      listing: {
        select: {
          id: true,
          cropName: true,
          pricePerUnit: true,
          quantity: true,
          unit: true,
          status: true,
          category: { select: { id: true, name: true } },
          productImages: { select: { id: true, imageUrl: true }, orderBy: { sortOrder: 'asc' } },
          farmerProfile: {
            select: {
              id: true,
              userId: true,
              farmName: true,
              user: { select: { id: true, name: true, phone: true } },
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
          buyerProfile: { select: { businessName: true, businessType: true } },
        },
      },
      order: {
        select: {
          id: true,
          status: true,
          totalAmount: true,
          createdAt: true,
        },
      },
    },
  });

  if (!offer) return null;

  const isBuyer = offer.buyerId === userId;
  const isFarmer = offer.listing?.farmerProfile?.userId === userId;

  if (!isBuyer && !isFarmer) {
    return null; // Enforces strict tenant isolation
  }

  return offer;
}

/**
 * Accept offer (Farmer accepts PENDING; Buyer accepts COUNTERED)
 */
export async function acceptOfferService(offerId, userId) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      listing: {
        include: { farmerProfile: true },
      },
      buyer: true,
    },
  });

  if (!offer) return null;

  const isBuyer = offer.buyerId === userId;
  const isFarmer = offer.listing?.farmerProfile?.userId === userId;

  if (!isBuyer && !isFarmer) return null;

  // Validate state
  if (offer.status !== 'PENDING' && offer.status !== 'COUNTERED') {
    const error = new Error(`Cannot accept offer with status ${offer.status}. Only PENDING or COUNTERED offers can be accepted.`);
    error.statusCode = 400;
    throw error;
  }

  // Validate actor based on negotiation state
  if (offer.status === 'PENDING' && !isFarmer) {
    const error = new Error('Only the produce listing owner can accept a pending buyer offer.');
    error.statusCode = 403;
    throw error;
  }

  if (offer.status === 'COUNTERED' && !isBuyer) {
    const error = new Error("Only the buyer can accept the farmer's counteroffer.");
    error.statusCode = 403;
    throw error;
  }

  // Verify listing is still active
  if (offer.listing.status !== 'ACTIVE') {
    const error = new Error(`Produce listing is no longer active (Current status: ${offer.listing.status}).`);
    error.statusCode = 400;
    throw error;
  }

  const updatedOffer = await prisma.offer.update({
    where: { id: offerId },
    data: {
      status: 'ACCEPTED',
    },
    include: {
      listing: {
        select: { id: true, cropName: true, unit: true, pricePerUnit: true },
      },
      buyer: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const recipientUserId = isFarmer ? offer.buyerId : offer.listing?.farmerProfile?.userId;
  if (recipientUserId) {
    const title = isFarmer ? 'Offer Accepted!' : 'Counteroffer Accepted!';
    const message = isFarmer
      ? `Your offer of ₹${updatedOffer.offeredPrice}/${updatedOffer.listing?.unit || 'unit'} for ${updatedOffer.listing?.cropName} was accepted!`
      : `Buyer accepted your counteroffer for ${updatedOffer.listing?.cropName}.`;

    createNotificationService({
      userId: recipientUserId,
      type: 'OFFER_ACCEPTED',
      title,
      message,
    }).catch((err) => console.warn('[OfferNotification] Error:', err.message));
  }

  return updatedOffer;
}

/**
 * Reject offer (Farmer rejects PENDING; Buyer rejects COUNTERED)
 */
export async function rejectOfferService(offerId, userId, reason = '') {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      listing: {
        include: { farmerProfile: true },
      },
    },
  });

  if (!offer) return null;

  const isBuyer = offer.buyerId === userId;
  const isFarmer = offer.listing?.farmerProfile?.userId === userId;

  if (!isBuyer && !isFarmer) return null;

  if (offer.status !== 'PENDING' && offer.status !== 'COUNTERED') {
    const error = new Error(`Cannot reject offer with status ${offer.status}.`);
    error.statusCode = 400;
    throw error;
  }

  const rolePrefix = isFarmer ? '[Farmer Declined]' : '[Buyer Declined]';
  const reasonText = reason?.trim() ? ` ${rolePrefix} ${reason.trim()}` : ` ${rolePrefix}`;
  const updatedMessage = offer.message ? `${offer.message} ${reasonText}`.trim() : reasonText.trim();

  const updatedOffer = await prisma.offer.update({
    where: { id: offerId },
    data: {
      status: 'REJECTED',
      message: updatedMessage.slice(0, 1000),
    },
    include: {
      listing: { select: { id: true, cropName: true, unit: true } },
    },
  });

  const recipientUserId = isFarmer ? offer.buyerId : offer.listing?.farmerProfile?.userId;
  if (recipientUserId) {
    const title = isFarmer ? 'Offer Declined' : 'Counteroffer Declined';
    const message = isFarmer
      ? `Your offer for ${updatedOffer.listing?.cropName} was declined.`
      : `Buyer declined your counteroffer for ${updatedOffer.listing?.cropName}.`;

    createNotificationService({
      userId: recipientUserId,
      type: 'OFFER_REJECTED',
      title,
      message,
    }).catch((err) => console.warn('[OfferNotification] Error:', err.message));
  }

  return updatedOffer;
}

/**
 * Counter an offer (Farmer counters PENDING -> COUNTERED; Buyer re-counters COUNTERED -> PENDING)
 */
export async function counterOfferService(offerId, userId, counterData) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      listing: {
        include: { farmerProfile: true },
      },
    },
  });

  if (!offer) return null;

  const isBuyer = offer.buyerId === userId;
  const isFarmer = offer.listing?.farmerProfile?.userId === userId;

  if (!isBuyer && !isFarmer) return null;

  if (offer.status !== 'PENDING' && offer.status !== 'COUNTERED') {
    const error = new Error(`Cannot counter offer with status ${offer.status}. Only PENDING or COUNTERED offers can be negotiated.`);
    error.statusCode = 400;
    throw error;
  }

  let nextStatus;
  let counterNotePrefix;

  if (offer.status === 'PENDING') {
    if (!isFarmer) {
      const error = new Error('Only the produce listing owner can submit a counteroffer on a pending buyer offer.');
      error.statusCode = 403;
      throw error;
    }
    nextStatus = 'COUNTERED';
    counterNotePrefix = `[Farmer Counter: ₹${counterData.counterPrice}/${offer.listing.unit}]`;
  } else if (offer.status === 'COUNTERED') {
    if (!isBuyer) {
      const error = new Error("Only the buyer can re-counter a farmer's counteroffer.");
      error.statusCode = 403;
      throw error;
    }
    nextStatus = 'PENDING';
    counterNotePrefix = `[Buyer Re-Counter: ₹${counterData.counterPrice}/${offer.listing.unit}]`;
  }

  // Validate counter quantity if supplied
  const effectiveQuantity = counterData.counterQuantity ? Number(counterData.counterQuantity) : Number(offer.quantity);
  if (effectiveQuantity > Number(offer.listing.quantity)) {
    const error = new Error(`Countered quantity (${effectiveQuantity}) exceeds available stock (${offer.listing.quantity}).`);
    error.statusCode = 400;
    throw error;
  }

  const userCustomNote = counterData.message?.trim() ? ` ${counterData.message.trim()}` : '';
  const fullNote = `${counterNotePrefix}${userCustomNote}`;
  const finalMessage = offer.message ? `${offer.message} | ${fullNote}`.slice(0, 1000) : fullNote.slice(0, 1000);

  const updatedOffer = await prisma.offer.update({
    where: { id: offerId },
    data: {
      offeredPrice: counterData.counterPrice,
      ...(counterData.counterQuantity && { quantity: counterData.counterQuantity }),
      status: nextStatus,
      message: finalMessage,
    },
    include: {
      listing: {
        select: { id: true, cropName: true, unit: true, pricePerUnit: true },
      },
      buyer: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  const recipientUserId = isFarmer ? offer.buyerId : offer.listing?.farmerProfile?.userId;
  if (recipientUserId) {
    const title = 'Counteroffer Received';
    const message = isFarmer
      ? `Farmer countered with ₹${counterData.counterPrice}/${offer.listing?.unit || 'unit'} for ${offer.listing?.cropName}.`
      : `Buyer countered with ₹${counterData.counterPrice}/${offer.listing?.unit || 'unit'} for ${offer.listing?.cropName}.`;

    createNotificationService({
      userId: recipientUserId,
      type: 'COUNTER_OFFER',
      title,
      message,
    }).catch((err) => console.warn('[OfferNotification] Error:', err.message));
  }

  return updatedOffer;
}

/**
 * Cancel an offer (Buyer only, while PENDING or COUNTERED)
 */
export async function cancelOfferService(offerId, userId) {
  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
  });

  if (!offer) return null;

  if (offer.buyerId !== userId) {
    const error = new Error('Only the buyer who created this offer can cancel it.');
    error.statusCode = 403;
    throw error;
  }

  if (offer.status !== 'PENDING' && offer.status !== 'COUNTERED') {
    const error = new Error(`Cannot cancel offer with status ${offer.status}.`);
    error.statusCode = 400;
    throw error;
  }

  return prisma.offer.update({
    where: { id: offerId },
    data: {
      status: 'CANCELLED',
    },
  });
}
