import prisma from '../config/db.js';

/**
 * Helper to retrieve farmerProfileId for an authenticated user
 */
async function getFarmerProfileIdOrThrow(userId) {
  const farmerProfile = await prisma.farmerProfile.findUnique({
    where: { userId },
  });

  if (!farmerProfile) {
    const error = new Error('Farmer profile not found for current user');
    error.statusCode = 400;
    throw error;
  }

  return farmerProfile.id;
}

/**
 * Create a new Farm for authenticated farmer
 */
export async function createFarmService(userId, farmData) {
  let farmerProfile = await prisma.farmerProfile.findUnique({
    where: { userId },
  });

  // Ensure farmer profile exists
  if (!farmerProfile) {
    farmerProfile = await prisma.farmerProfile.create({
      data: { userId },
    });
  }

  const farm = await prisma.farm.create({
    data: {
      farmerProfileId: farmerProfile.id,
      ...farmData,
    },
  });

  return farm;
}

/**
 * Get all farms owned by authenticated farmer
 */
export async function getFarmerFarmsService(userId) {
  const farmerProfileId = await getFarmerProfileIdOrThrow(userId);
  return prisma.farm.findMany({
    where: { farmerProfileId },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Get single farm by ID enforcing farmer ownership
 * Returns null if non-owned or non-existent (triggering 404 Not Found)
 */
export async function getFarmByIdAndOwnerService(farmId, userId) {
  const farmerProfile = await prisma.farmerProfile.findUnique({
    where: { userId },
  });

  if (!farmerProfile) return null;

  return prisma.farm.findFirst({
    where: {
      id: farmId,
      farmerProfileId: farmerProfile.id,
    },
  });
}

/**
 * Update farm enforcing farmer ownership
 * Returns null if non-owned or non-existent (triggering 404 Not Found)
 */
export async function updateFarmService(farmId, userId, updateData) {
  const existingFarm = await getFarmByIdAndOwnerService(farmId, userId);
  if (!existingFarm) return null;

  return prisma.farm.update({
    where: { id: farmId },
    data: updateData,
  });
}

/**
 * Delete farm enforcing farmer ownership and active crop listing safeguards
 * Returns null if non-owned or non-existent (triggering 404 Not Found)
 * Throws 400 Error if active listings are linked to the farm
 */
export async function deleteFarmService(farmId, userId) {
  const existingFarm = await getFarmByIdAndOwnerService(farmId, userId);
  if (!existingFarm) return null;

  // Safeguard: Check if farm is referenced by any ACTIVE crop listing
  const activeListingsCount = await prisma.cropListing.count({
    where: {
      farmId,
      status: 'ACTIVE',
    },
  });

  if (activeListingsCount > 0) {
    const error = new Error('Cannot delete farm with active crop listings. Please archive or deactivate active listings first.');
    error.statusCode = 400;
    throw error;
  }

  // Deletion proceeds: Prisma automatically sets farmId = NULL on remaining non-active listings via onDelete: SetNull
  return prisma.farm.delete({
    where: { id: farmId },
  });
}
