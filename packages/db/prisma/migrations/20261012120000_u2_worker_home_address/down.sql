-- Reverses 20261012120000_u2_worker_home_address: the home address columns go with their
-- index and foreign key. Any stored home addresses are lost (they exist only once the U2
-- entries ship); nothing else reads these columns.
DROP INDEX IF EXISTS "worker_profiles_homeLocalityId_idx";
ALTER TABLE "worker_profiles" DROP CONSTRAINT IF EXISTS "worker_profiles_homeLocalityId_fkey";
ALTER TABLE "worker_profiles"
  DROP COLUMN IF EXISTS "homeLocalityId",
  DROP COLUMN IF EXISTS "homeStreetLine";
