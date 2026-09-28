-- Reverses this index. The reconciler keeps working, only slower.
DROP INDEX CONCURRENTLY IF EXISTS "users_lastLoginAt_idx";
