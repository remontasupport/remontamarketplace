-- Reverses this index. The reconciler keeps working, only slower.
DROP INDEX CONCURRENTLY IF EXISTS "verification_requirements_submittedAt_idx";
