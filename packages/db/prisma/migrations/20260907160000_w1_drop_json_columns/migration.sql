-- Drop the four Json columns W1 replaced.
--
-- Preconditions, all of which held when this was written:
--   - nothing writes them: the services save straight to the typed tables
--   - nothing reads them: all six read sites moved in P5
--   - scripts/w1/reconcile.ts and scripts/w1/backfill.js, the only things that
--     rebuilt tables FROM these columns, both refuse to run
--   - archive.w1_json_cutover holds every value, verified row for row
--
-- This is the one irreversible step in the programme. down.sql restores the
-- columns but NOT their contents — recovery of the data means reading
-- archive.w1_json_cutover, or a Neon point-in-time restore.

ALTER TABLE "worker_additional_info" DROP COLUMN "jobHistory";
ALTER TABLE "worker_additional_info" DROP COLUMN "education";
ALTER TABLE "worker_additional_info" DROP COLUMN "availability";
ALTER TABLE "worker_additional_info" DROP COLUMN "experience";
