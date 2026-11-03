-- AlterEnum
ALTER TYPE "DeliveryStatus" ADD VALUE 'PREPARING';
ALTER TYPE "DeliveryStatus" ADD VALUE 'DISPATCHED';
ALTER TYPE "DeliveryStatus" ADD VALUE 'OUT_FOR_DELIVERY';

-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'PREPARING';
ALTER TYPE "OrderStatus" ADD VALUE 'DISPATCHED';
ALTER TYPE "OrderStatus" ADD VALUE 'OUT_FOR_DELIVERY';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN "offerId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "orders_offerId_key" ON "orders"("offerId");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "offers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

