-- worker-activation U1: the admin-set activation flag. False for every existing worker (the reset the user asked for,
-- 2026-10-23) and for every new profile; only PUT /v1/admin/workers/:workerId/activation sets it. Expand-only: a
-- constant default is stored in the catalogue, so Postgres adds the column without rewriting the table; no index
-- (1,765 rows; the lists already filter on users.status). The previous api image ignores it.
-- Rollback: down.sql (drops it; activations made since are lost).
ALTER TABLE "worker_profiles" ADD COLUMN "isActivated" BOOLEAN NOT NULL DEFAULT false;
