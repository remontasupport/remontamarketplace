-- Worker-slice parity checks.
--
-- READ ONLY. Aggregate counts, checksums and shape tallies only — no personal
-- data leaves the database.
--
-- W1 is complete: the four Json columns are gone and the typed tables are the
-- source of truth. The checks that compared derived rows against those Json
-- columns have been removed, because there is nothing left to compare against.
-- What remains is integrity of the tables themselves, plus the checks that
-- served the wider worker slice all along.
--
-- The removed checks are worth remembering rather than mourning. Check 91,
-- comparing derived VALUES against source values, is the one that caught month
-- columns that were 100% NULL while every row count matched perfectly. If a
-- future slice promotes another Json column, write its equivalent FIRST.

-- 1. Row counts — the worker slice
SELECT
  (SELECT count(*) FROM users WHERE role = 'WORKER')  AS worker_users,
  (SELECT count(*) FROM worker_profiles)              AS worker_profiles,
  (SELECT count(*) FROM worker_additional_info)       AS worker_additional_info,
  (SELECT count(*) FROM worker_services)              AS worker_services,
  (SELECT count(*) FROM verification_requirements)    AS verification_requirements;

-- 2. Constraint W-1 — worker identity fingerprint
-- The fingerprint changes if any worker id, or its user mapping, ever moves.
-- id_equals_userid re-measures the 296 ambiguous ids independently.
SELECT
  count(*)                                                AS profiles,
  md5(string_agg(id || ':' || "userId", ',' ORDER BY id)) AS id_user_fingerprint,
  count(*) FILTER (WHERE id = "userId")                   AS id_equals_userid
FROM worker_profiles;

-- 3. Orphans — children with no parent, and profiles with no user
-- Every W1 table now keys on workerProfileId, so they are checked the same way.
SELECT
  (SELECT count(*) FROM worker_additional_info w
     WHERE NOT EXISTS (SELECT 1 FROM worker_profiles p WHERE p.id = w."workerProfileId")) AS orphan_additional_info,
  (SELECT count(*) FROM worker_services w
     WHERE NOT EXISTS (SELECT 1 FROM worker_profiles p WHERE p.id = w."workerProfileId")) AS orphan_services,
  (SELECT count(*) FROM verification_requirements v
     WHERE NOT EXISTS (SELECT 1 FROM worker_profiles p WHERE p.id = v."workerProfileId")) AS orphan_requirements,
  (SELECT count(*) FROM worker_profiles p
     WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p."userId"))                    AS orphan_profiles;

-- 3b. The reverse orphan — WORKER users holding no profile
SELECT count(*) AS worker_users_without_profile
FROM users u
WHERE u.role = 'WORKER'
  AND NOT EXISTS (SELECT 1 FROM worker_profiles p WHERE p."userId" = u.id);

-- 3c. Orphans in the W1 tables
-- Foreign keys make these impossible, so a non-zero result means a constraint
-- was dropped somewhere. Cheap insurance on the tables that now hold the data.
SELECT
  (SELECT count(*) FROM worker_job_history c
     WHERE NOT EXISTS (SELECT 1 FROM worker_profiles p WHERE p.id = c."workerProfileId"))  AS orphan_job_history,
  (SELECT count(*) FROM worker_education c
     WHERE NOT EXISTS (SELECT 1 FROM worker_profiles p WHERE p.id = c."workerProfileId"))  AS orphan_education,
  (SELECT count(*) FROM worker_availability c
     WHERE NOT EXISTS (SELECT 1 FROM worker_profiles p WHERE p.id = c."workerProfileId"))  AS orphan_availability,
  (SELECT count(*) FROM worker_experience c
     WHERE NOT EXISTS (SELECT 1 FROM worker_profiles p WHERE p.id = c."workerProfileId"))  AS orphan_experience;

-- 3d. The W1 tables — shape of what they hold
-- Months were once 100% NULL because the column was typed Int against month
-- NAMES. These null counts are the standing guard against that recurring.
SELECT
  (SELECT count(*) FROM worker_job_history)                                   AS job_history_rows,
  (SELECT count(*) FROM worker_job_history WHERE "startMonth" IS NULL)        AS jh_start_month_null,
  (SELECT count(*) FROM worker_job_history WHERE "startYear" IS NULL)         AS jh_start_year_null,
  (SELECT count(*) FROM worker_education)                                     AS education_rows,
  (SELECT count(*) FROM worker_education WHERE "startMonth" IS NULL)          AS ed_start_month_null,
  (SELECT count(*) FROM worker_availability)                                  AS availability_rows,
  (SELECT count(*) FROM worker_availability WHERE "endMinute" <= "startMinute") AS overnight_slots,
  (SELECT count(*) FROM worker_experience)                                    AS experience_rows,
  (SELECT coalesce(sum(coalesce(array_length("otherAreas", 1), 0)), 0) FROM worker_experience)    AS ex_other_areas_elements,
  (SELECT coalesce(sum(coalesce(array_length("specificAreas", 1), 0)), 0) FROM worker_experience) AS ex_specific_areas_elements;

-- 4. AD-17 archive targets on worker_profiles
-- These columns are still present and still scheduled for removal in W4.
-- archive.worker_ad17 must be re-run immediately before they are dropped.
SELECT
  count(*) FILTER (WHERE "uniqueService" IS NOT NULL AND "uniqueService" <> '') AS wp_unique_service,
  count(*) FILTER (WHERE "funFact"       IS NOT NULL AND "funFact"       <> '') AS wp_fun_fact,
  count(*) FILTER (WHERE hobbies         IS NOT NULL AND hobbies         <> '') AS wp_hobbies,
  count(*) FILTER (WHERE qualifications  IS NOT NULL AND qualifications  <> '') AS wp_qualifications
FROM worker_profiles;

-- 4b. AD-17 archive targets on worker_additional_info
SELECT
  count(*) FILTER (WHERE "funFact" IS NOT NULL AND "funFact" <> '')         AS wai_fun_fact,
  count(*) FILTER (WHERE coalesce(array_length("uniqueService", 1), 0) > 0) AS wai_unique_service
FROM worker_additional_info;

-- 5e. bankAccount — still Json, deliberately. Deferred pending an encryption
-- decision; copying it into a second unencrypted table would spread the
-- exposure rather than reduce it.
SELECT
  count(*)                                   AS rows_with_bank_account,
  md5(string_agg(j::text, ',' ORDER BY wid)) AS checksum
FROM (
  SELECT "workerProfileId" AS wid, ("bankAccount")::jsonb AS j
  FROM worker_additional_info WHERE "bankAccount" IS NOT NULL
) t;

-- 5f. photos — expected worker_photos rows, for W2
SELECT
  count(*) FILTER (WHERE photos IS NOT NULL AND photos <> '')                        AS expected_primary_rows,
  count(*) FILTER (WHERE "additionalPhotos" IS NOT NULL AND "additionalPhotos" <> '') AS rows_with_additional
FROM worker_profiles;

-- 5g. worker_services — expected category and subcategory rows, for W3
-- parallel_array_mismatch must be 0: the two arrays are related only by
-- position, so a length difference means the pairing is already broken.
SELECT
  count(*)                                                                  AS expected_category_rows,
  coalesce(sum(coalesce(array_length("subcategoryIds", 1), 0)), 0)          AS expected_subcategory_rows,
  count(*) FILTER (WHERE coalesce(array_length("subcategoryIds", 1), 0)
                      <> coalesce(array_length("subcategoryNames", 1), 0))  AS parallel_array_mismatch
FROM worker_services;

-- 6. verificationStatus and setup state — the funnel, re-measured each run
-- 'Verified' appears here: a value outside the intended five, held by the only
-- published worker, which is why APPROVED reads as never used.
SELECT
  "verificationStatus",
  count(*)                                   AS workers,
  count(*) FILTER (WHERE "isPublished")      AS published,
  count(*) FILTER (WHERE "profileCompleted") AS completed
FROM worker_profiles
GROUP BY "verificationStatus"
ORDER BY workers DESC;
