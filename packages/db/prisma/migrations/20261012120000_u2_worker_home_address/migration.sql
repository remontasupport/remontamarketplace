-- worker-profile-api U2 (D8, FR-PI-04): the worker's private home address -- a street line
-- and a suburb of ours -- on worker_profiles. Expand-only: two nullable columns, a foreign
-- key that refuses the deletion of a suburb still named by a home (the suburb list is never
-- deleted from anyway: retired rows stay), and the FK's lookup index. No data change. The
-- legacy location columns (location/city/state/postalCode/latitude/longitude) are untouched:
-- they keep carrying the service area. Rollback: down.sql (drops the three; nothing reads
-- them before the U2 api entries ship).
ALTER TABLE "worker_profiles"
  ADD COLUMN "homeStreetLine" TEXT,
  ADD COLUMN "homeLocalityId" INTEGER;

ALTER TABLE "worker_profiles"
  ADD CONSTRAINT "worker_profiles_homeLocalityId_fkey"
  FOREIGN KEY ("homeLocalityId") REFERENCES "au_localities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- worker_profiles holds under 2,000 rows: a plain CREATE INDEX is instant and may run in the
-- migration's transaction (the README's CONCURRENTLY rule is for the large tables).
CREATE INDEX "worker_profiles_homeLocalityId_idx" ON "worker_profiles"("homeLocalityId");
