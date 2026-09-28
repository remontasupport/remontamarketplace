-- Reverses this index. The reconciler keeps working, only slower.
DROP INDEX CONCURRENTLY IF EXISTS "worker_profiles_updatedAt_idx";
