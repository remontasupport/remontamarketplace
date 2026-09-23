-- Reverse of the re-key: back onto workerAdditionalInfoId.
--
-- Same expand-backfill-enforce-contract shape, so no row is ever without a key
-- on the way back either. The backfill direction relies on
-- worker_additional_info having exactly one row per workerProfileId, which its
-- unique constraint guarantees.

ALTER TABLE "worker_job_history" ADD COLUMN "workerAdditionalInfoId" TEXT;
ALTER TABLE "worker_education"   ADD COLUMN "workerAdditionalInfoId" TEXT;

UPDATE "worker_job_history" jh
   SET "workerAdditionalInfoId" = wai."id"
  FROM "worker_additional_info" wai
 WHERE wai."workerProfileId" = jh."workerProfileId";

UPDATE "worker_education" ed
   SET "workerAdditionalInfoId" = wai."id"
  FROM "worker_additional_info" wai
 WHERE wai."workerProfileId" = ed."workerProfileId";

-- A worker with promoted children but no worker_additional_info row cannot be
-- represented in the old shape. That cannot happen while the Json columns on
-- worker_additional_info remain the source of truth, so this failing means
-- something is wrong and rolling back is the right outcome.
ALTER TABLE "worker_job_history" ALTER COLUMN "workerAdditionalInfoId" SET NOT NULL;
ALTER TABLE "worker_education"   ALTER COLUMN "workerAdditionalInfoId" SET NOT NULL;

ALTER TABLE "worker_job_history" DROP COLUMN "workerProfileId";
ALTER TABLE "worker_education"   DROP COLUMN "workerProfileId";

CREATE INDEX "worker_job_history_workerAdditionalInfoId_idx" ON "worker_job_history"("workerAdditionalInfoId");
CREATE INDEX "worker_education_workerAdditionalInfoId_idx"   ON "worker_education"("workerAdditionalInfoId");

ALTER TABLE "worker_job_history"
  ADD CONSTRAINT "worker_job_history_workerAdditionalInfoId_fkey"
  FOREIGN KEY ("workerAdditionalInfoId") REFERENCES "worker_additional_info"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "worker_education"
  ADD CONSTRAINT "worker_education_workerAdditionalInfoId_fkey"
  FOREIGN KEY ("workerAdditionalInfoId") REFERENCES "worker_additional_info"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
