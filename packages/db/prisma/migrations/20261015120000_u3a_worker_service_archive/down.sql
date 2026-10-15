-- Reverse of 20261015120000_u3a_worker_service_archive. Set-aside registrations are lost.
ALTER TABLE "worker_service_archive" DROP CONSTRAINT "worker_service_archive_workerProfileId_fkey";
DROP TABLE "worker_service_archive";
