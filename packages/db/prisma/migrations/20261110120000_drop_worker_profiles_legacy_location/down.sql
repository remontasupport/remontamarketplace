-- Reverse of 20261110120000_drop_worker_profiles_legacy_location: the six columns and five indexes come back, EMPTY.
-- The values are restored only from the Neon branch of production taken before the forward migration:
--   UPDATE worker_profiles p SET location = b.location, city = b.city, state = b.state, "postalCode" = b."postalCode",
--          latitude = b.latitude, longitude = b.longitude
--     FROM <branch copy of worker_profiles> b WHERE b.id = p.id;
-- No running code needs them (U5/U6), so restoring the structure alone is enough for a rollback of the code.
ALTER TABLE "worker_profiles"
  ADD COLUMN IF NOT EXISTS "location" TEXT,
  ADD COLUMN IF NOT EXISTS "city" TEXT,
  ADD COLUMN IF NOT EXISTS "state" TEXT,
  ADD COLUMN IF NOT EXISTS "postalCode" TEXT,
  ADD COLUMN IF NOT EXISTS "latitude" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "longitude" DOUBLE PRECISION;

CREATE INDEX IF NOT EXISTS "worker_profiles_city_idx" ON "worker_profiles"("city");
CREATE INDEX IF NOT EXISTS "worker_profiles_state_idx" ON "worker_profiles"("state");
CREATE INDEX IF NOT EXISTS "worker_profiles_postalCode_idx" ON "worker_profiles"("postalCode");
CREATE INDEX IF NOT EXISTS "worker_profiles_latitude_longitude_idx" ON "worker_profiles"("latitude", "longitude");
CREATE INDEX IF NOT EXISTS "worker_profiles_isPublished_city_idx" ON "worker_profiles"("isPublished", "city");
