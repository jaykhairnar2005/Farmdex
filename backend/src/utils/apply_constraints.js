import prisma from '../config/db.js';

async function applyCheckConstraints() {
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "reviews" DROP CONSTRAINT IF EXISTS "check_review_rating_range";
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "reviews" ADD CONSTRAINT "check_review_rating_range" CHECK (rating >= 1 AND rating <= 5);
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "complaints" DROP CONSTRAINT IF EXISTS "check_complaint_target_not_null";
    `);
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "complaints" ADD CONSTRAINT "check_complaint_target_not_null" CHECK ("listingId" IS NOT NULL OR "orderId" IS NOT NULL);
    `);

    console.log('✅ PostgreSQL CHECK constraints applied cleanly to farmdex_db!');
    await prisma.$disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Error applying check constraints:', err);
    process.exit(1);
  }
}

applyCheckConstraints();
