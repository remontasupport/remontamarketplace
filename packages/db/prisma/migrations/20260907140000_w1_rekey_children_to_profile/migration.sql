-- Re-key worker_job_history and worker_education onto workerProfileId.
--
-- They were keyed on workerAdditionalInfoId while worker_availability and
-- worker_experience keyed on workerProfileId — four sibling tables, two
-- different keys, for no benefit. workerProfileId is what worker_services and
-- verification_requirements already use, and it removes a pointless hop through
-- worker_additional_info on every read.
--
-- Written by hand rather than taken from `migrate diff`, which produced
-- `ADD COLUMN "workerProfileId" TEXT NOT NULL` — that fails against 582
-- existing rows. Truncating instead would leave every worker's job history and
-- education EMPTY until the reconcile ran, and reads now come from these
-- tables, so that gap would be visible to users.
--
-- Expand, backfill, enforce, contract. No row is ever without a key.

-- 1. Expand: nullable to begin with, so existing rows remain valid
ALTER TABLE "worker_job_history" ADD COLUMN "workerProfileId" TEXT;
ALTER TABLE "worker_education"   ADD COLUMN "workerProfileId" TEXT;

-- 2. Backfill from the parent. The old foreign key guaranteed a parent exists
--    for every row, so this leaves no nulls behind.
UPDATE "worker_job_history" jh
   SET "workerProfileId" = wai."workerProfileId"
  FROM "worker_additional_info" wai
 WHERE wai."id" = jh."workerAdditionalInfoId";

UPDATE "worker_education" ed
   SET "workerProfileId" = wai."workerProfileId"
  FROM "worker_additional_info" wai
 WHERE wai."id" = ed."workerAdditionalInfoId";

-- 3. Enforce. This statement is the check: if the backfill missed anything,
--    it fails here and the whole migration rolls back rather than leaving a
--    half-keyed table.
ALTER TABLE "worker_job_history" ALTER COLUMN "workerProfileId" SET NOT NULL;
ALTER TABLE "worker_education"   ALTER COLUMN "workerProfileId" SET NOT NULL;

-- 4. Contract. Dropping the column takes its index and foreign key with it.
ALTER TABLE "worker_job_history" DROP COLUMN "workerAdditionalInfoId";
ALTER TABLE "worker_education"   DROP COLUMN "workerAdditionalInfoId";

-- 5. Index and constrain the new key
CREATE INDEX "worker_job_history_workerProfileId_idx" ON "worker_job_history"("workerProfileId");
CREATE INDEX "worker_education_workerProfileId_idx"   ON "worker_education"("workerProfileId");

ALTER TABLE "worker_job_history"
  ADD CONSTRAINT "worker_job_history_workerProfileId_fkey"
  FOREIGN KEY ("workerProfileId") REFERENCES "worker_profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "worker_education"
  ADD CONSTRAINT "worker_education_workerProfileId_fkey"
  FOREIGN KEY ("workerProfileId") REFERENCES "worker_profiles"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
