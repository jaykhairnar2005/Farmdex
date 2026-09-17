-- DropForeignKey
ALTER TABLE "messages" DROP CONSTRAINT "messages_conversationId_fkey";

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Check Constraints for Review and Complaint Domains
ALTER TABLE "reviews" ADD CONSTRAINT "check_review_rating_range" CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE "complaints" ADD CONSTRAINT "check_complaint_target_not_null" CHECK ("listingId" IS NOT NULL OR "orderId" IS NOT NULL);
