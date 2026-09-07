-- AD-17 archive — preserve the six columns before any slice drops them.
--
-- ~1,400 values workers wrote about themselves: uniqueService (574),
-- funFact (435), hobbies (>=280) and qualifications (123). Once the columns
-- are dropped there is no way back except a database restore.
--
-- Lives in the `archive` schema, NOT `public`, so Prisma neither manages it
-- nor proposes to drop it. Re-runnable: rows refresh to the latest values.

-- 1. Archive schema
CREATE SCHEMA IF NOT EXISTS archive;

dadaddasd

-- 2. Archive table
CREATE TABLE IF NOT EXISTS archive.worker_ad17 (
  "workerProfileId"    text PRIMARY KEY,
  "userId"             text,
  wp_qualifications    text,
  wp_fun_fact          text,
  wp_hobbies           text,
  wp_unique_service    text,
  wai_fun_fact         text,
  wai_unique_service   text[],
  captured_at          timestamptz NOT NULL DEFAULT now()
);

-- 2b. Table comment
COMMENT ON TABLE archive.worker_ad17 IS
  'AD-17: worker-authored fields removed from the schema on user decision, 2026-09-05. Retained until the product decision is settled. Do not drop without sign-off.';

-- 3. Capture — only workers who actually hold a value in at least one column
-- Driven from worker_profiles. If orphan_additional_info is non-zero in the
-- parity snapshot, those rows have no parent profile and would be missed here;
-- check that figure is 0 before running.
INSERT INTO archive.worker_ad17 (
  "workerProfileId", "userId",
  wp_qualifications, wp_fun_fact, wp_hobbies, wp_unique_service,
  wai_fun_fact, wai_unique_service, captured_at
)
SELECT
  p.id,
  p."userId",
  nullif(p.qualifications, ''),
  nullif(p."funFact", ''),
  nullif(p.hobbies, ''),
  nullif(p."uniqueService", ''),
  nullif(w."funFact", ''),
  w."uniqueService",
  now()
FROM worker_profiles p
LEFT JOIN worker_additional_info w ON w."workerProfileId" = p.id
WHERE coalesce(nullif(p.qualifications, ''), '') <> ''
   OR coalesce(nullif(p."funFact", ''), '') <> ''
   OR coalesce(nullif(p.hobbies, ''), '') <> ''
   OR coalesce(nullif(p."uniqueService", ''), '') <> ''
   OR coalesce(nullif(w."funFact", ''), '') <> ''
   OR coalesce(array_length(w."uniqueService", 1), 0) > 0
ON CONFLICT ("workerProfileId") DO UPDATE SET
  "userId"           = EXCLUDED."userId",
  wp_qualifications  = EXCLUDED.wp_qualifications,
  wp_fun_fact        = EXCLUDED.wp_fun_fact,
  wp_hobbies         = EXCLUDED.wp_hobbies,
  wp_unique_service  = EXCLUDED.wp_unique_service,
  wai_fun_fact       = EXCLUDED.wai_fun_fact,
  wai_unique_service = EXCLUDED.wai_unique_service,
  captured_at        = EXCLUDED.captured_at;

-- 4. Verification — archived counts must match the source counts exactly
SELECT
  (SELECT count(*) FROM archive.worker_ad17)                                     AS archived_workers,
  (SELECT count(*) FROM archive.worker_ad17 WHERE wp_unique_service IS NOT NULL) AS a_wp_unique_service,
  (SELECT count(*) FROM worker_profiles
     WHERE "uniqueService" IS NOT NULL AND "uniqueService" <> '')                AS s_wp_unique_service,
  (SELECT count(*) FROM archive.worker_ad17 WHERE wp_fun_fact IS NOT NULL)       AS a_wp_fun_fact,
  (SELECT count(*) FROM worker_profiles
     WHERE "funFact" IS NOT NULL AND "funFact" <> '')                            AS s_wp_fun_fact,
  (SELECT count(*) FROM archive.worker_ad17 WHERE wp_hobbies IS NOT NULL)        AS a_wp_hobbies,
  (SELECT count(*) FROM worker_profiles
     WHERE hobbies IS NOT NULL AND hobbies <> '')                                AS s_wp_hobbies,
  (SELECT count(*) FROM archive.worker_ad17 WHERE wp_qualifications IS NOT NULL) AS a_wp_qualifications,
  (SELECT count(*) FROM worker_profiles
     WHERE qualifications IS NOT NULL AND qualifications <> '')                  AS s_wp_qualifications,
  (SELECT count(*) FROM archive.worker_ad17 WHERE wai_fun_fact IS NOT NULL)      AS a_wai_fun_fact,
  (SELECT count(*) FROM worker_additional_info
     WHERE "funFact" IS NOT NULL AND "funFact" <> '')                            AS s_wai_fun_fact,
  (SELECT count(*) FROM archive.worker_ad17
     WHERE coalesce(array_length(wai_unique_service, 1), 0) > 0)                 AS a_wai_unique_service,
  (SELECT count(*) FROM worker_additional_info
     WHERE coalesce(array_length("uniqueService", 1), 0) > 0)                    AS s_wai_unique_service;
