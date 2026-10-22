-- Rollback of 20261022120000_worker_services_tools: drops the two columns and every tool saved.
ALTER TABLE "worker_services" DROP COLUMN IF EXISTS "otherTools";
ALTER TABLE "worker_services" DROP COLUMN IF EXISTS "toolIds";
