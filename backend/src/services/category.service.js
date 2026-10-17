import prisma from '../config/db.js';

/**
 * Fetch all active marketplace categories ordered deterministically by name
 * Includes count of active listings per category
 */
export async function getActiveCategoriesService() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      description: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          cropListings: {
            where: { status: 'ACTIVE' },
          },
        },
      },
    },
  });
}

/**
 * Fetch a single category by ID
 * @param {string} id 
 */
export async function getCategoryByIdService(id) {
  return prisma.category.findUnique({
    where: { id },
  });
}
