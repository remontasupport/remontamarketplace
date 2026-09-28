-- S1 step 9b: the onboarding reconciler finds changes since its watermark by
-- users."lastLoginAt" (61 ms -> 1.6 ms at 100 k workers with all six indexes).
-- CONCURRENTLY (no write lock on users), so the only statement here.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "users_lastLoginAt_idx" ON "users" ("lastLoginAt");
