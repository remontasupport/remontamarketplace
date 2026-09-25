-- S1 step 9b: the onboarding reconciler finds changes since its watermark by
-- verification_requirements."updatedAt" (61 ms -> 1.6 ms at 100 k workers with all six indexes).
-- CONCURRENTLY (no write lock on verification_requirements), so the only statement here.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "verification_requirements_updatedAt_idx" ON "verification_requirements" ("updatedAt");
