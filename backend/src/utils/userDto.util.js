/**
 * User DTO Sanitizer
 * Strips passwordHash and returns safe public user representation
 * @param {object} user - Prisma User object
 * @returns {object} Public User DTO
 */
export function formatUserDto(user) {
  if (!user) return null;

  // Destructure passwordHash out to guarantee it is omitted
  const { passwordHash, ...safeUser } = user;
  return safeUser;
}

/**
 * Standard Prisma select object ensuring passwordHash is excluded at database query level
 */
export const userPublicSelect = {
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
      farmSize: true,
      address: true,
      district: true,
      state: true,
      pincode: true,
      latitude: true,
      longitude: true,
      verificationStatus: true,
      createdAt: true,
    },
  },
  buyerProfile: {
    select: {
      id: true,
      businessName: true,
      businessType: true,
      address: true,
      district: true,
      state: true,
      pincode: true,
      createdAt: true,
    },
  },
};
