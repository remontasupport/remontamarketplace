-- search-locations U7 (drop-legacy-location-columns, 2026-11-10): the six legacy location columns of worker_profiles
-- and their five indexes leave the database. The CONTRACT step of an expand/contract change: the HOME
-- worker_locations row (+ au_localities) has been the only record of where a worker is since U5; no code reads or
-- writes these columns (apps/api guard test locations/legacy-columns, apps/app workerPlace test), and no running
-- image's Prisma client knows them since U6 (2026-10-29: api 6551489+, app 2f8dcf1+). Checked before writing it: the
-- only database objects depending on them are the five indexes (no view, function, rule, publication).
--
-- One statement, so it is all or nothing; Postgres drops an index when a column it covers is dropped, and the
-- explicit DROP INDEX lines before it only make the list reviewable. DROP COLUMN is a catalogue change (no table
-- rewrite). lock_timeout: if a long transaction holds worker_profiles, fail fast instead of queueing every request
-- behind the ACCESS EXCLUSIVE lock; the deploy then fails and is simply re-run.
--
-- IRREVERSIBLE for the data. Before production: a Neon branch of production (the only way back for the values).
-- down.sql restores the columns and indexes empty; the values come back only from that branch.
SET lock_timeout = '5s';

DROP INDEX IF EXISTS "worker_profiles_city_idx";
DROP INDEX IF EXISTS "worker_profiles_state_idx";
DROP INDEX IF EXISTS "worker_profiles_postalCode_idx";
DROP INDEX IF EXISTS "worker_profiles_latitude_longitude_idx";
DROP INDEX IF EXISTS "worker_profiles_isPublished_city_idx";

ALTER TABLE "worker_profiles"
  DROP COLUMN IF EXISTS "location",
  DROP COLUMN IF EXISTS "city",
  DROP COLUMN IF EXISTS "state",
  DROP COLUMN IF EXISTS "postalCode",
  DROP COLUMN IF EXISTS "latitude",
  DROP COLUMN IF EXISTS "longitude";
