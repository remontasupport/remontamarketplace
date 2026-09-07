-- W1 — snapshot the four Json columns before they are dropped.
--
-- These columns were the source of truth until the P5 cutover. They are the
-- only record of what this data looked like before W1 rewrote it into typed
-- tables, and unlike the AD-17 columns they were never archived.
--
-- Lives in the `archive` schema, NOT `public`, so Prisma neither manages it nor
-- proposes to drop it — the same reason archive.worker_ad17 lives there.
--
-- Read-only against the source. Purely additive. Re-runnable.

-- 1. Archive schema (already exists from the AD-17 archive; harmless if so)
CREATE SCHEMA IF NOT EXISTS archive;

-- 2. Snapshot table
CREATE TABLE IF NOT EXISTS archive.w1_json_cutover (
  "workerProfileId" text PRIMARY KEY,
  "jobHistory"      jsonb,
  "education"       jsonb,
  "availability"    jsonb,
  "experience"      jsonb,
  captured_at       timestamptz NOT NULL DEFAULT now()
);

-- 2b. Table comment
COMMENT ON TABLE archive.w1_json_cutover IS
  'W1: the four Json columns as they stood when the typed tables took over, 2026-09-07. The only pre-migration record of this data. Do not drop without sign-off.';

-- 3. Capture every worker that has any of the four, so a row that was already
--    empty does not masquerade as data loss later.
INSERT INTO archive.w1_json_cutover (
  "workerProfileId", "jobHistory", "education", "availability", "experience", captured_at
)
SELECT
  w."workerProfileId",
  (w."jobHistory")::jsonb,
  (w."education")::jsonb,
  (w."availability")::jsonb,
  (w."experience")::jsonb,
  now()
FROM worker_additional_info w
ON CONFLICT ("workerProfileId") DO UPDATE SET
  "jobHistory"   = EXCLUDED."jobHistory",
  "education"    = EXCLUDED."education",
  "availability" = EXCLUDED."availability",
  "experience"   = EXCLUDED."experience",
  captured_at    = EXCLUDED.captured_at;

-- 4. Verification — the archive must account for every source row, and for
--    every non-empty value in each of the four columns.
SELECT
  (SELECT count(*) FROM archive.w1_json_cutover)                                       AS archived_rows,
  (SELECT count(*) FROM worker_additional_info)                                        AS source_rows,
  (SELECT count(*) FROM archive.w1_json_cutover
     WHERE jsonb_typeof("jobHistory") = 'array'
       AND jsonb_array_length("jobHistory") > 0)                                       AS a_job_history,
  (SELECT count(*) FROM worker_additional_info
     WHERE jsonb_typeof(("jobHistory")::jsonb) = 'array'
       AND jsonb_array_length(("jobHistory")::jsonb) > 0)                              AS s_job_history,
  (SELECT count(*) FROM archive.w1_json_cutover
     WHERE jsonb_typeof("education") = 'array'
       AND jsonb_array_length("education") > 0)                                        AS a_education,
  (SELECT count(*) FROM worker_additional_info
     WHERE jsonb_typeof(("education")::jsonb) = 'array'
       AND jsonb_array_length(("education")::jsonb) > 0)                               AS s_education,
  (SELECT count(*) FROM archive.w1_json_cutover
     WHERE "availability" IS NOT NULL AND "availability" <> '{}'::jsonb)               AS a_availability,
  (SELECT count(*) FROM worker_additional_info
     WHERE ("availability")::jsonb IS NOT NULL
       AND ("availability")::jsonb <> '{}'::jsonb)                                     AS s_availability,
  (SELECT count(*) FROM archive.w1_json_cutover
     WHERE "experience" IS NOT NULL AND "experience" <> '{}'::jsonb)                   AS a_experience,
  (SELECT count(*) FROM worker_additional_info
     WHERE ("experience")::jsonb IS NOT NULL
       AND ("experience")::jsonb <> '{}'::jsonb)                                       AS s_experience;
