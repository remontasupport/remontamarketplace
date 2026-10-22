-- worker-tools U1 (E2): the tools a worker brings for a service that has a tool list (Cleaning Services, Home and
-- Yard Maintenance): the ticked ids of packages/schemas' serviceTools, and up to five of the worker's own. On the
-- service's own row, so removing the service removes them. Expand-only: two columns with an empty default (no table
-- rewrite), no data change, no index (the admin filter probes the unique ("workerProfileId", "categoryId"); BR-12);
-- the previous api image ignores them. Rollback: down.sql (drops them and the tools saved).
ALTER TABLE "worker_services" ADD COLUMN "toolIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "worker_services" ADD COLUMN "otherTools" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
