-- S1: the onboarding marker -- worker_onboarding (current stage, one row per
-- worker) and worker_onboarding_transitions (append-only history).
--
-- Additive. Nothing existing reads either table. The stage is derived by
-- deriveStage() in apps/api; no trigger writes it (NFR-ARCH-03).
--
-- Hand-written, beyond what Prisma generates: the CHECK constraints.

-- CreateEnum
CREATE TYPE "OnboardingStage" AS ENUM ('SIGNED_UP', 'DOCUMENTS_IN_PROGRESS', 'DOCUMENTS_SUBMITTED', 'ACTION_REQUIRED', 'VERIFIED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "OnboardingTransitionSource" AS ENUM ('API', 'RECONCILER', 'BACKFILL');

-- CreateTable
CREATE TABLE "worker_onboarding" (
    "workerProfileId" TEXT NOT NULL,
    "stage" "OnboardingStage" NOT NULL,
    "stageEnteredAt" TIMESTAMP(3) NOT NULL,
    "signedUpAt" TIMESTAMP(3) NOT NULL,
    "firstSignInAt" TIMESTAMP(3),
    "firstDocumentAt" TIMESTAMP(3),
    "documentsSubmittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3) NOT NULL,
    "mandatoryTotal" INTEGER NOT NULL DEFAULT 0,
    "mandatoryUploaded" INTEGER NOT NULL DEFAULT 0,
    "mandatoryApproved" INTEGER NOT NULL DEFAULT 0,
    "catalogueVersion" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_onboarding_pkey" PRIMARY KEY ("workerProfileId"),
    CONSTRAINT "worker_onboarding_counts_check" CHECK (
        "mandatoryTotal" >= 0
        AND "mandatoryUploaded" BETWEEN 0 AND "mandatoryTotal"
        AND "mandatoryApproved" BETWEEN 0 AND "mandatoryTotal"
    )
);

-- CreateTable
CREATE TABLE "worker_onboarding_transitions" (
    "id" BIGSERIAL NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "fromStage" "OnboardingStage",
    "toStage" "OnboardingStage" NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cause" TEXT NOT NULL,
    "actorId" TEXT,
    "source" "OnboardingTransitionSource" NOT NULL,

    CONSTRAINT "worker_onboarding_transitions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "worker_onboarding_transitions_changed_check"
        CHECK ("fromStage" IS DISTINCT FROM "toStage")
);

-- CreateTable
-- Scheduled jobs (the reconciler, photo purge): which instance holds the lease,
-- when each last ran, and the reconciler's watermark. One row per job.
CREATE TABLE "scheduled_jobs" (
    "name" TEXT NOT NULL,
    "lockedUntil" TIMESTAMP(3),
    "lastStartedAt" TIMESTAMP(3),
    "lastFinishedAt" TIMESTAMP(3),
    "lastResult" JSONB,
    "watermark" TIMESTAMP(3),

    CONSTRAINT "scheduled_jobs_pkey" PRIMARY KEY ("name")
);

-- CreateIndex
CREATE INDEX "worker_onboarding_stage_stageEnteredAt_idx" ON "worker_onboarding"("stage", "stageEnteredAt");

-- CreateIndex
CREATE INDEX "worker_onboarding_stage_lastActivityAt_idx" ON "worker_onboarding"("stage", "lastActivityAt");

-- CreateIndex
CREATE INDEX "worker_onboarding_transitions_workerProfileId_at_idx" ON "worker_onboarding_transitions"("workerProfileId", "at");

-- CreateIndex
CREATE INDEX "worker_onboarding_transitions_toStage_at_idx" ON "worker_onboarding_transitions"("toStage", "at");

-- AddForeignKey
ALTER TABLE "worker_onboarding" ADD CONSTRAINT "worker_onboarding_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_onboarding_transitions" ADD CONSTRAINT "worker_onboarding_transitions_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
