-- S1: registration support -- consent and lead columns on worker_profiles, the
-- outbox, staged sign-up photos, rate-limit counters, and the ACCOUNT_REGISTERED
-- audit action.
--
-- Additive. The three worker_profiles columns are nullable with no default, so
-- adding them is a catalog change only: no rewrite, no long lock on the 1,680-row
-- table. Legacy registrations leave them NULL; nothing is backfilled.

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'ACCOUNT_REGISTERED';

-- AlterTable
ALTER TABLE "worker_profiles" ADD COLUMN     "consentProfileShareAt" TIMESTAMP(3),
ADD COLUMN     "consentWordingVersion" TEXT,
ADD COLUMN     "zohoLeadId" TEXT;

-- CreateEnum
CREATE TYPE "OutboxStatus" AS ENUM ('PENDING', 'PROCESSING', 'DONE', 'DEAD');

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "OutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedUntil" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "outbox_events_attempts_check" CHECK ("attempts" >= 0)
);

-- CreateTable
CREATE TABLE "registration_photo_uploads" (
    "id" UUID NOT NULL,
    "blobKey" TEXT NOT NULL,
    -- The public URL the store returned; copied to worker_profiles.photos on claim.
    "url" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "ipHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "claimedAt" TIMESTAMP(3),
    "claimedByWorkerProfileId" TEXT,

    CONSTRAINT "registration_photo_uploads_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "registration_photo_uploads_size_check" CHECK ("sizeBytes" > 0)
);

-- CreateTable
CREATE TABLE "rate_limit_buckets" (
    "key" TEXT NOT NULL,
    "windowStart" TIMESTAMP(3) NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_buckets_pkey" PRIMARY KEY ("key","windowStart")
);

-- CreateIndex
CREATE INDEX "outbox_events_status_nextAttemptAt_idx" ON "outbox_events"("status", "nextAttemptAt");

-- CreateIndex (the existing-account notice dedupe looks up recent events of a type)
CREATE INDEX "outbox_events_type_createdAt_idx" ON "outbox_events"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "registration_photo_uploads_blobKey_key" ON "registration_photo_uploads"("blobKey");

-- CreateIndex
CREATE INDEX "registration_photo_uploads_claimedAt_createdAt_idx" ON "registration_photo_uploads"("claimedAt", "createdAt");

-- CreateIndex
CREATE INDEX "rate_limit_buckets_expiresAt_idx" ON "rate_limit_buckets"("expiresAt");

-- AddForeignKey
ALTER TABLE "registration_photo_uploads" ADD CONSTRAINT "registration_photo_uploads_claimedByWorkerProfileId_fkey" FOREIGN KEY ("claimedByWorkerProfileId") REFERENCES "worker_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
