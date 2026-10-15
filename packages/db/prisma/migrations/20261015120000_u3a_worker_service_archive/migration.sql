-- api-review U3a (D2, user 2026-10-15): a removed service's registration is kept, hidden, and returns when the
-- service is chosen again. worker_services rows are read by the search, the admin pages and the lists, so a removed
-- service cannot stay as a flagged row; its metadata (the nursing / therapeutic registration) is set aside here and
-- the row deleted, as today. Expand-only: one new table, no data change, nothing else reads it. Written only by the
-- api (PUT /v1/worker/services). Rollback: down.sql (drops the table; set-aside registrations are lost with it).
CREATE TABLE "worker_service_archive" (
    "workerProfileId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "archivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_service_archive_pkey" PRIMARY KEY ("workerProfileId","categoryId")
);

ALTER TABLE "worker_service_archive" ADD CONSTRAINT "worker_service_archive_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
