-- Drops worker_locations and its data.
--
-- What is lost: HOME rows written by apps/api registrations and the backfill.
-- The location columns on worker_profiles are dual-written and remain what
-- apps/app reads, so no screen changes. The rows can be rebuilt by re-running the
-- backfill (scripts/backfill-worker-locations.ts) after re-applying.
DROP TABLE "worker_locations";
DROP TYPE "LocationSource";
DROP TYPE "LocationPrecision";
DROP TYPE "LocationKind";
