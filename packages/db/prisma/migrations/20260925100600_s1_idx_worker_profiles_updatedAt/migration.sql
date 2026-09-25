-- S1 step 9b: the onboarding reconciler finds changes since its watermark by
-- worker_profiles."updatedAt" (61 ms -> 1.6 ms at 100 k workers with all six indexes).
-- CONCURRENTLY (no write lock on worker_profiles), so the only statement here.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "worker_profiles_updatedAt_idx" ON "worker_profiles" ("updatedAt");
