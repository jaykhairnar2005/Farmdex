import prisma from '../config/db.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';

/**
 * Helper to retrieve FarmerProfile for an authenticated user ID
 */
export async function getFarmerProfileByUserId(userId) {
  const farmerProfile = await prisma.farmerProfile.findUnique({
    where: { userId },
  });

  if (!farmerProfile) {
    const error = new Error('Farmer profile not found for authenticated account');
    error.statusCode = 403;
    throw error;
  }

  return farmerProfile;
}

/**
 * Create a new crop listing for the authenticated farmer
 */
export async function createCropListingService(userId, listingData) {
  const farmerProfile = await getFarmerProfileByUserId(userId);

  // 1. Verify category exists and is active
  const category = await prisma.category.findUnique({
    where: { id: listingData.categoryId },
  });

  if (!category || !category.isActive) {
    const error = new Error('Selected crop category does not exist or is inactive');
    error.statusCode = 400;
    throw error;
  }

  // 2. Verify farm ownership if farmId is provided
  if (listingData.farmId) {
    const farm = await prisma.farm.findFirst({
      where: {
        id: listingData.farmId,
        farmerProfileId: farmerProfile.id,
      },
    });

    if (!farm) {
      const error = new Error('Selected farm does not belong to your account');
      error.statusCode = 400;
      throw error;
    }
  }

  // 3. Atomically create listing and optional initial images
  const { imageUrls, ...coreData } = listingData;

  const listing = await prisma.cropListing.create({
    data: {
      farmerProfileId: farmerProfile.id,
      categoryId: coreData.categoryId,
      farmId: coreData.farmId || null,
      cropName: coreData.cropName,
      description: coreData.description || null,
      quantity: coreData.quantity,
      unit: coreData.unit,
      quality: coreData.quality || null,
      pricePerUnit: coreData.pricePerUnit,
      harvestDate: coreData.harvestDate ? new Date(coreData.harvestDate) : null,
      location: coreData.location || null,
      isOrganic: Boolean(coreData.isOrganic),
      status: 'ACTIVE',
      ...(imageUrls && imageUrls.length > 0 && {
        productImages: {
          create: imageUrls.map((url, idx) => ({
            imageUrl: url,
            sortOrder: idx,
          })),
        },
      }),
    },
    include: {
      category: { select: { id: true, name: true } },
      farm: { select: { id: true, name: true, district: true, state: true } },
      productImages: { orderBy: { sortOrder: 'asc' } },
    },
  });

  return listing;
}

/**
 * Public marketplace catalog retrieval with search, filters, pagination and sorting.
 * Strictly filters by status: 'ACTIVE'.
 */
export async function getPublicListingsService(filters) {
  const {
    page = 1,
    limit = 12,
    search,
    categoryId,
    minPrice,
    maxPrice,
    isOrganic,
    location,
    sort = 'latest',
  } = filters;

  const where = {
    status: 'ACTIVE',
  };

  if (categoryId) {
    where.categoryId = categoryId;
  }

  if (typeof isOrganic === 'boolean') {
    where.isOrganic = isOrganic;
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    where.pricePerUnit = {};
    if (minPrice !== undefined) where.pricePerUnit.gte = minPrice;
    if (maxPrice !== undefined) where.pricePerUnit.lte = maxPrice;
  }

  if (location) {
    where.location = { contains: location, mode: 'insensitive' };
  }

  if (search) {
    where.OR = [
      { cropName: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Deterministic sorting
  let orderBy = [{ createdAt: 'desc' }, { id: 'desc' }];
  if (sort === 'price_asc') {
    orderBy = [{ pricePerUnit: 'asc' }, { id: 'desc' }];
  } else if (sort === 'price_desc') {
    orderBy = [{ pricePerUnit: 'desc' }, { id: 'desc' }];
  } else if (sort === 'quantity_desc') {
    orderBy = [{ quantity: 'desc' }, { id: 'desc' }];
  }

  const skip = (page - 1) * limit;

  const [total, data] = await Promise.all([
    prisma.cropListing.count({ where }),
    prisma.cropListing.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        category: { select: { id: true, name: true } },
        farm: { select: { id: true, name: true, district: true, state: true } },
        farmerProfile: {
          select: {
            id: true,
            farmName: true,
            district: true,
            state: true,
            verificationStatus: true,
            user: { select: { id: true, name: true } },
          },
        },
        productImages: {
          orderBy: { sortOrder: 'asc' },
          take: 4,
        },
      },
    }),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
    data,
  };
}

/**
 * Get single crop listing by ID.
 * Returns null if non-active and requested by unauthorized non-owner.
 */
export async function getListingByIdService(listingId, currentUserId = null) {
  const listing = await prisma.cropListing.findUnique({
    where: { id: listingId },
    include: {
      category: { select: { id: true, name: true, description: true } },
      farm: {
        select: {
          id: true,
          name: true,
          address: true,
          district: true,
          state: true,
          pincode: true,
          latitude: true,
          longitude: true,
        },
      },
      farmerProfile: {
        select: {
          id: true,
          userId: true,
          farmName: true,
          district: true,
          state: true,
          verificationStatus: true,
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              createdAt: true,
            },
          },
        },
      },
      productImages: {
        orderBy: { sortOrder: 'asc' },
      },
    },
  });

  if (!listing) return null;

  // Visibility check: non-active listings can only be viewed by their owner
  if (listing.status !== 'ACTIVE') {
    if (!currentUserId || listing.farmerProfile.userId !== currentUserId) {
      return null;
    }
  }

  return listing;
}

/**
 * Fetch all listings belonging to the authenticated farmer
 */
export async function getFarmerListingsService(userId, filters) {
  const farmerProfile = await getFarmerProfileByUserId(userId);
  const { page = 1, limit = 20, status, search } = filters;

  const where = {
    farmerProfileId: farmerProfile.id,
  };

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { cropName: { contains: search, mode: 'insensitive' } },
      { location: { contains: search, mode: 'insensitive' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [total, data] = await Promise.all([
    prisma.cropListing.count({ where }),
    prisma.cropListing.findMany({
      where,
      skip,
      take: limit,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      include: {
        category: { select: { id: true, name: true } },
        farm: { select: { id: true, name: true } },
        productImages: { orderBy: { sortOrder: 'asc' } },
        _count: {
          select: {
            offers: true,
            orderItems: true,
          },
        },
      },
    }),
  ]);

  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 1,
    data,
  };
}

/**
 * Update crop listing details enforcing strict owner isolation
 */
export async function updateCropListingService(listingId, userId, updateData) {
  const farmerProfile = await getFarmerProfileByUserId(userId);

  // 1. Verify existence and ownership
  const existing = await prisma.cropListing.findFirst({
    where: {
      id: listingId,
      farmerProfileId: farmerProfile.id,
    },
  });

  if (!existing) return null;

  // 2. If farmId is updated, verify new farm belongs to farmer
  if (updateData.farmId !== undefined && updateData.farmId !== existing.farmId) {
    if (updateData.farmId !== null) {
      const farm = await prisma.farm.findFirst({
        where: {
          id: updateData.farmId,
          farmerProfileId: farmerProfile.id,
        },
      });
      if (!farm) {
        const error = new Error('Selected farm does not belong to your account');
        error.statusCode = 400;
        throw error;
      }
    }
  }

  // 3. If categoryId is updated, verify category exists
  if (updateData.categoryId && updateData.categoryId !== existing.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: updateData.categoryId },
    });
    if (!category || !category.isActive) {
      const error = new Error('Selected category does not exist or is inactive');
      error.statusCode = 400;
      throw error;
    }
  }

  // 4. Clean update data
  const dataToUpdate = { ...updateData };
  if (dataToUpdate.harvestDate) {
    dataToUpdate.harvestDate = new Date(dataToUpdate.harvestDate);
  }

  return prisma.cropListing.update({
    where: { id: listingId },
    data: dataToUpdate,
    include: {
      category: { select: { id: true, name: true } },
      farm: { select: { id: true, name: true } },
      productImages: { orderBy: { sortOrder: 'asc' } },
    },
  });
}

/**
 * Change crop listing status enforcing valid transitions and business safeguards
 */
export async function updateListingStatusService(listingId, userId, newStatus) {
  const farmerProfile = await getFarmerProfileByUserId(userId);

  const existing = await prisma.cropListing.findFirst({
    where: {
      id: listingId,
      farmerProfileId: farmerProfile.id,
    },
  });

  if (!existing) return null;

  // Safeguard: Farmer cannot set administrative statuses like SUSPENDED
  if (newStatus === 'SUSPENDED') {
    const error = new Error('Listing suspension is reserved for administrative actions');
    error.statusCode = 403;
    throw error;
  }

  // Safeguard: Check if attempting to deactivate/archive with active offers or auctions
  if (newStatus === 'ARCHIVED' || newStatus === 'INACTIVE') {
    const activeOffersCount = await prisma.offer.count({
      where: {
        listingId,
        status: 'PENDING',
      },
    });

    if (activeOffersCount > 0 && newStatus === 'ARCHIVED') {
      const error = new Error(`Cannot archive listing with ${activeOffersCount} pending buyer offers. Please resolve offers first.`);
      error.statusCode = 400;
      throw error;
    }
  }

  return prisma.cropListing.update({
    where: { id: listingId },
    data: { status: newStatus },
    include: {
      category: { select: { id: true, name: true } },
      productImages: { orderBy: { sortOrder: 'asc' } },
    },
  });
}

/**
 * Upload and attach an image to an existing farmer-owned listing
 */
export async function addListingImageService(listingId, userId, fileBuffer) {
  const farmerProfile = await getFarmerProfileByUserId(userId);

  // 1. Verify listing ownership
  const listing = await prisma.cropListing.findFirst({
    where: {
      id: listingId,
      farmerProfileId: farmerProfile.id,
    },
  });

  if (!listing) return null;

  // 2. Upload to Cloudinary
  const uploadResult = await uploadToCloudinary(fileBuffer, `farmdex/crop-listings/${listingId}`);

  try {
    // 3. Compute next sortOrder
    const lastImage = await prisma.productImage.findFirst({
      where: { listingId },
      orderBy: { sortOrder: 'desc' },
    });
    const nextSortOrder = (lastImage?.sortOrder ?? -1) + 1;

    // 4. Save to Database
    const productImage = await prisma.productImage.create({
      data: {
        listingId,
        imageUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        sortOrder: nextSortOrder,
      },
    });

    return productImage;
  } catch (dbErr) {
    // Compensating cleanup to avoid orphaned Cloudinary assets
    await deleteFromCloudinary(uploadResult.public_id);
    throw dbErr;
  }
}

/**
 * Delete a product image from an existing farmer-owned listing
 */
export async function deleteListingImageService(listingId, imageId, userId) {
  const farmerProfile = await getFarmerProfileByUserId(userId);

  // 1. Verify listing ownership
  const listing = await prisma.cropListing.findFirst({
    where: {
      id: listingId,
      farmerProfileId: farmerProfile.id,
    },
  });

  if (!listing) return null;

  // 2. Verify image belongs to this listing
  const image = await prisma.productImage.findFirst({
    where: {
      id: imageId,
      listingId,
    },
  });

  if (!image) return null;

  // 3. Delete from DB
  await prisma.productImage.delete({
    where: { id: imageId },
  });

  // 4. Asynchronously purge from Cloudinary if publicId exists
  if (image.publicId) {
    deleteFromCloudinary(image.publicId).catch((err) => {
      console.warn('Failed to delete asset from Cloudinary:', err.message);
    });
  }

  return image;
}

/**
 * Delete a crop listing enforcing farmer ownership and safeguards
 */
export async function deleteCropListingService(listingId, userId) {
  const farmerProfile = await getFarmerProfileByUserId(userId);

  // 1. Verify listing exists and belongs to authenticated farmer
  const listing = await prisma.cropListing.findFirst({
    where: {
      id: listingId,
      farmerProfileId: farmerProfile.id,
    },
    include: {
      productImages: true,
    },
  });

  if (!listing) return null;

  // 2. Safeguards: Cannot delete if associated with offers or orders
  const activeOffersCount = await prisma.offer.count({
    where: { listingId },
  });

  if (activeOffersCount > 0) {
    const error = new Error(`Cannot delete listing with ${activeOffersCount} existing buyer offer(s). Please archive the listing instead.`);
    error.statusCode = 400;
    throw error;
  }

  const orderItemsCount = await prisma.orderItem.count({
    where: { listingId },
  });

  if (orderItemsCount > 0) {
    const error = new Error('Cannot delete listing associated with existing order records. Please change status to ARCHIVED instead.');
    error.statusCode = 400;
    throw error;
  }

  // 3. Delete from DB (productImages cascade delete in Prisma)
  await prisma.cropListing.delete({
    where: { id: listingId },
  });

  // 4. Asynchronously purge any associated remote Cloudinary assets
  if (listing.productImages && listing.productImages.length > 0) {
    for (const img of listing.productImages) {
      if (img.publicId) {
        deleteFromCloudinary(img.publicId).catch((err) => {
          console.warn(`[Cloudinary] Failed to purge remote asset ${img.publicId}:`, err.message);
        });
      }
    }
  }

  return listing;
}

