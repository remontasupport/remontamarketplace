-- Restores the four columns. It does NOT restore their contents.
--
-- Running this gives you four empty Json columns with their original defaults.
-- Nothing reads them, so an empty column changes no behaviour — but do not
-- mistake this for undoing the drop.
--
-- To recover the data, after running this:
--
--   UPDATE worker_additional_info w
--      SET "jobHistory"   = a."jobHistory",
--          "education"    = a."education",
--          "availability" = a."availability",
--          "experience"   = a."experience"
--     FROM archive.w1_json_cutover a
--    WHERE a."workerProfileId" = w."workerProfileId";
--
-- That restores the values as they stood at the P5 cutover, NOT as they stand
-- now. Everything a worker changed after the cutover lives only in the typed
-- tables, so treat this as historical recovery rather than a rollback.

ALTER TABLE "worker_additional_info" ADD COLUMN "jobHistory"   JSONB DEFAULT '[]';
ALTER TABLE "worker_additional_info" ADD COLUMN "education"    JSONB DEFAULT '[]';
ALTER TABLE "worker_additional_info" ADD COLUMN "availability" JSONB DEFAULT '{}';
ALTER TABLE "worker_additional_info" ADD COLUMN "experience"   JSONB DEFAULT '{}';
