import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Independently test connection to PostgreSQL database using Prisma
 * @returns {Promise<{ connected: boolean, message: string, timestamp?: Date }>}
 */
export async function checkDatabaseConnection() {
  try {
    // Run a lightweight raw query or count query to verify DB responsiveness
    const result = await prisma.$queryRaw`SELECT 1 as connected, NOW() as current_time`;
    if (result && result.length > 0) {
      return {
        connected: true,
        message: 'PostgreSQL connection verified via Prisma',
        timestamp: result[0].current_time,
      };
    }
    return {
      connected: false,
      message: 'Unexpected empty response from database query',
    };
  } catch (error) {
    return {
      connected: false,
      message: `Database connection error: ${error.message}`,
    };
  }
}

export default prisma;
