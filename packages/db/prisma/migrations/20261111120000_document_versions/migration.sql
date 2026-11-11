-- document-history U1 (2026-11-11): admins keep and retrieve past worker documents. A re-upload, a worker's delete and a
-- removed service each write the old verification_requirements row here, in the same transaction, and the file is kept.
-- Expand-only: a new table, a new enum and one new audit action; nothing existing changes. The previous api image never
-- reads or writes them. The table is empty at creation, so a plain CREATE INDEX takes no time.
-- Rollback: down.sql (drops the table: the history written meanwhile goes, the files stay in the bucket).
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'DOCUMENT_VERSION_DELETE';

CREATE TYPE "DocumentVersionReason" AS ENUM ('REPLACED', 'DELETED_BY_WORKER', 'SERVICE_REMOVED');

CREATE TABLE "document_versions" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "requirementId" TEXT NOT NULL,
    "requirementType" TEXT NOT NULL,
    "requirementName" TEXT NOT NULL,
    "documentCategory" "DocumentCategory",
    "status" "RequirementStatus" NOT NULL,
    "documentUrl" TEXT,
    "metadata" JSONB,
    "uploadedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "expiresAt" TIMESTAMP(3),
    "reason" "DocumentVersionReason" NOT NULL,
    "supersededAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_versions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "document_versions_workerProfileId_supersededAt_idx" ON "document_versions"("workerProfileId", "supersededAt");

CREATE INDEX "document_versions_supersededAt_idx" ON "document_versions"("supersededAt");

-- O3 (user 2026-11-11): a worker profile's history goes with the profile.
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
