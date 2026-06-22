-- AlterTable
ALTER TABLE "disputes" ADD COLUMN     "seller_response" TEXT;

-- Recreate DisputeStatus enum to support 'pending' and 'resolved'
ALTER TYPE "DisputeStatus" RENAME TO "DisputeStatus_old";
CREATE TYPE "DisputeStatus" AS ENUM ('pending', 'resolved');
ALTER TABLE "disputes" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "disputes" ALTER COLUMN "status" TYPE "DisputeStatus" USING (
  CASE 
    WHEN "status"::text = 'resolved_buyer' OR "status"::text = 'resolved_seller' THEN 'resolved'::"DisputeStatus"
    ELSE 'pending'::"DisputeStatus"
  END
);
ALTER TABLE "disputes" ALTER COLUMN "status" SET DEFAULT 'pending';
DROP TYPE "DisputeStatus_old";
