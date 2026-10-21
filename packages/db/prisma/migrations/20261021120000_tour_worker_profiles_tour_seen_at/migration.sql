-- onboarding-tour U1 (E1): when the worker first ended the dashboard tour or chose "Not now". The tour is offered
-- once per worker on any device while it is null, so every existing worker sees it once. Expand-only: one
-- nullable column, no data change, no index (read by the profile's unique "userId"); the previous api image ignores it.
-- Rollback: down.sql (drops it; a worker would then be offered the tour again).
ALTER TABLE "worker_profiles" ADD COLUMN "tourSeenAt" TIMESTAMP(3);
