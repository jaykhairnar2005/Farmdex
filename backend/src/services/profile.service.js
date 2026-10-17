import prisma from '../config/db.js';
import { formatUserDto, userPublicSelect } from '../utils/userDto.util.js';

/**
 * Get authenticated user's full profile including role-specific profile and farms
 */
export async function getMeProfileService(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      ...userPublicSelect,
      farmerProfile: {
        include: {
          farms: {
            orderBy: { createdAt: 'desc' },
          },
        },
      },
      buyerProfile: true,
    },
  });

  if (!user) {
    const error = new Error('User profile not found');
    error.statusCode = 404;
    throw error;
  }

  return formatUserDto(user);
}

/**
 * Update FarmerProfile for authenticated user
 * Strips verificationStatus so farmers cannot modify their verification status
 */
export async function updateFarmerProfileService(userId, updateData) {
  // Guarantee verificationStatus is never updated by farmer
  const { verificationStatus, ...safeData } = updateData;

  const farmerProfile = await prisma.farmerProfile.upsert({
    where: { userId },
    update: safeData,
    create: {
      userId,
      ...safeData,
    },
  });

  return farmerProfile;
}

/**
 * Update BuyerProfile for authenticated user
 */
export async function updateBuyerProfileService(userId, updateData) {
  const buyerProfile = await prisma.buyerProfile.upsert({
    where: { userId },
    update: updateData,
    create: {
      userId,
      ...updateData,
    },
  });

  return buyerProfile;
}
