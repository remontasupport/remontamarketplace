-- Postgres cannot drop an enum value: rebuild the type without it. Rows set to MATCHING since go back to PENDING.
BEGIN;
UPDATE "service_requests" SET "status" = 'PENDING' WHERE "status" = 'MATCHING';
ALTER TYPE "ServiceRequestStatus" RENAME TO "ServiceRequestStatus_old";
CREATE TYPE "ServiceRequestStatus" AS ENUM ('PENDING', 'MATCHED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED');
ALTER TABLE "service_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "service_requests" ALTER COLUMN "status" TYPE "ServiceRequestStatus" USING ("status"::text::"ServiceRequestStatus");
ALTER TABLE "service_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING';
DROP TYPE "ServiceRequestStatus_old";
COMMIT;
