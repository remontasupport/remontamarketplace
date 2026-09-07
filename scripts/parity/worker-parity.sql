-- Worker-slice parity checks.
--
-- READ ONLY. Aggregate counts, checksums and shape tallies only — no personal
-- data leaves the database.
--
-- Run before a slice to capture the "before" state, and after each phase to
-- prove nothing was lost. Section 5 computes what each backfill SHOULD produce,
-- from the source, so the backfill has a number to be judged against rather
-- than being trusted.

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
SELECT
  (SELECT count(*) FROM worker_additional_info w
     WHERE NOT EXISTS (SELECT 1 FROM worker_profiles p WHERE p.id = w."workerProfileId"))  AS orphan_additional_info,
  (SELECT count(*) FROM worker_services w
     WHERE NOT EXISTS (SELECT 1 FROM worker_profiles p WHERE p.id = w."workerProfileId"))  AS orphan_services,
  (SELECT count(*) FROM verification_requirements v
     WHERE NOT EXISTS (SELECT 1 FROM worker_profiles p WHERE p.id = v."workerProfileId"))  AS orphan_requirements,
  (SELECT count(*) FROM worker_profiles p
     WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p."userId"))                     AS orphan_profiles;

-- 3b. The reverse orphan — WORKER users holding no profile
-- Section 3 only checked children against parents. The first run showed 1,687
-- worker users against 1,684 profiles, so this direction needed its own check.
-- Registration creates both in one transaction, so a gap means a partial or
-- externally created account.
SELECT count(*) AS worker_users_without_profile
FROM users u
WHERE u.role = 'WORKER'
  AND NOT EXISTS (SELECT 1 FROM worker_profiles p WHERE p."userId" = u.id);

-- 4. AD-17 archive targets on worker_profiles
-- The archive in Phase 0.6 must capture at least these counts.
SELECT
  count(*) FILTER (WHERE "uniqueService" IS NOT NULL AND "uniqueService" <> '') AS wp_unique_service,
  count(*) FILTER (WHERE "funFact"       IS NOT NULL AND "funFact"       <> '') AS wp_fun_fact,
  count(*) FILTER (WHERE hobbies         IS NOT NULL AND hobbies         <> '') AS wp_hobbies,
  count(*) FILTER (WHERE qualifications  IS NOT NULL AND qualifications  <> '') AS wp_qualifications
FROM worker_profiles;

-- 4b. AD-17 archive targets on worker_additional_info
SELECT
  count(*) FILTER (WHERE "funFact" IS NOT NULL AND "funFact" <> '')     AS wai_fun_fact,
  count(*) FILTER (WHERE coalesce(array_length("uniqueService", 1), 0) > 0) AS wai_unique_service
FROM worker_additional_info;

-- 5. jobHistory — expected worker_job_history rows
SELECT
  count(*)                                          AS rows_with_column,
  count(*) FILTER (WHERE jsonb_typeof(j) = 'array') AS shape_array,
  count(*) FILTER (WHERE jsonb_typeof(j) <> 'array') AS shape_other,
  coalesce(sum(CASE WHEN jsonb_typeof(j) = 'array' THEN jsonb_array_length(j) ELSE 0 END), 0) AS expected_rows,
  md5(string_agg(j::text, ',' ORDER BY wid))        AS checksum
FROM (
  SELECT "workerProfileId" AS wid, ("jobHistory")::jsonb AS j
  FROM worker_additional_info WHERE "jobHistory" IS NOT NULL
) t;

-- 5b. education — expected worker_education rows
SELECT
  count(*)                                          AS rows_with_column,
  count(*) FILTER (WHERE jsonb_typeof(j) = 'array') AS shape_array,
  count(*) FILTER (WHERE jsonb_typeof(j) <> 'array') AS shape_other,
  coalesce(sum(CASE WHEN jsonb_typeof(j) = 'array' THEN jsonb_array_length(j) ELSE 0 END), 0) AS expected_rows,
  md5(string_agg(j::text, ',' ORDER BY wid))        AS checksum
FROM (
  SELECT "workerProfileId" AS wid, ("education")::jsonb AS j
  FROM worker_additional_info WHERE "education" IS NOT NULL
) t;

-- 5c. availability — expected worker_availability rows (shape varies: object and array both occur)
SELECT
  count(*)                                           AS rows_with_column,
  count(*) FILTER (WHERE jsonb_typeof(j) = 'object') AS shape_object,
  count(*) FILTER (WHERE jsonb_typeof(j) = 'array')  AS shape_array,
  coalesce(sum(CASE WHEN jsonb_typeof(j) = 'object'
                    THEN (SELECT count(*) FROM jsonb_object_keys(j)) ELSE 0 END), 0) AS object_keys,
  coalesce(sum(CASE WHEN jsonb_typeof(j) = 'array'
                    THEN jsonb_array_length(j) ELSE 0 END), 0)                       AS array_items,
  md5(string_agg(j::text, ',' ORDER BY wid))         AS checksum
FROM (
  SELECT "workerProfileId" AS wid, ("availability")::jsonb AS j
  FROM worker_additional_info WHERE "availability" IS NOT NULL
) t;

-- 5c2. availability — the TRUE expected row count
-- 5c counts day KEYS, which undercounts: a day holds either one {startTime,endTime}
-- object or an ARRAY of them. This descends one level and counts actual slots.
-- This is the number worker_availability must contain after the W1 backfill.
SELECT
  count(DISTINCT wid)                                        AS workers,
  count(*)                                                   AS day_entries,
  count(*) FILTER (WHERE jsonb_typeof(day_value) = 'object') AS days_holding_one,
  count(*) FILTER (WHERE jsonb_typeof(day_value) = 'array')  AS days_holding_array,
  coalesce(sum(CASE WHEN jsonb_typeof(day_value) = 'array'
                    THEN jsonb_array_length(day_value) ELSE 1 END), 0) AS expected_rows
FROM (
  SELECT w."workerProfileId" AS wid, e.key AS day, e.value AS day_value
  FROM worker_additional_info w,
       LATERAL jsonb_each((w."availability")::jsonb) e
  WHERE w."availability" IS NOT NULL
    AND jsonb_typeof((w."availability")::jsonb) = 'object'
) t;

-- 5c3. availability — any day key outside the seven weekdays?
-- The backfill maps these onto the DayOfWeek enum, so a stray key would fail.
-- Must return no rows.
SELECT e.key AS unexpected_day_key, count(*) AS occurrences
FROM worker_additional_info w,
     LATERAL jsonb_each((w."availability")::jsonb) e
WHERE w."availability" IS NOT NULL
  AND jsonb_typeof((w."availability")::jsonb) = 'object'
  AND e.key NOT IN ('MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY')
GROUP BY e.key
ORDER BY occurrences DESC;

-- 5c4. availability — slots the unique index will reject
-- worker_availability is unique on (worker, day, startMinute, endMinute), so
-- only an EXACT repeat is rejected. The first rehearsal keyed on start alone and
-- would have discarded two real shifts — Saturday 00:00-07:00 sitting beside
-- 00:00-23:00 — which is why this reports the end time, not just the start.
--
-- Expected worker_availability rows = 5c2.expected_rows minus slots_rejected here.
SELECT
  day,
  start_time,
  end_time,
  count(*)   AS affected_worker_days,
  sum(extra) AS slots_rejected
FROM (
  SELECT wid, day, start_time, end_time,
         count(*) - 1 AS extra
  FROM (
    SELECT w."workerProfileId" AS wid,
           e.key               AS day,
           slot ->> 'startTime' AS start_time,
           slot ->> 'endTime'   AS end_time
    FROM worker_additional_info w,
         LATERAL jsonb_each((w."availability")::jsonb) e,
         LATERAL jsonb_array_elements(
           CASE WHEN jsonb_typeof(e.value) = 'array'
                THEN e.value ELSE jsonb_build_array(e.value) END) slot
    WHERE w."availability" IS NOT NULL
      AND jsonb_typeof((w."availability")::jsonb) = 'object'
  ) s
  GROUP BY wid, day, start_time, end_time
  HAVING count(*) > 1
) d
GROUP BY day, start_time, end_time
ORDER BY slots_rejected DESC;

-- 5d. experience — expected worker_experience rows (object keyed by care domain)
SELECT
  count(*)                                           AS rows_with_column,
  count(*) FILTER (WHERE jsonb_typeof(j) = 'object') AS shape_object,
  count(*) FILTER (WHERE jsonb_typeof(j) <> 'object') AS shape_other,
  coalesce(sum(CASE WHEN jsonb_typeof(j) = 'object'
                    THEN (SELECT count(*) FROM jsonb_object_keys(j)) ELSE 0 END), 0) AS expected_rows,
  md5(string_agg(j::text, ',' ORDER BY wid))         AS checksum
FROM (
  SELECT "workerProfileId" AS wid, ("experience")::jsonb AS j
  FROM worker_additional_info WHERE "experience" IS NOT NULL
) t;

-- 5d2. experience — any domain key outside the five care domains?
-- Maps onto the CareDomain enum in the W1 backfill. Must return no rows.
SELECT e.key AS unexpected_domain_key, count(*) AS occurrences
FROM worker_additional_info w,
     LATERAL jsonb_each((w."experience")::jsonb) e
WHERE w."experience" IS NOT NULL
  AND jsonb_typeof((w."experience")::jsonb) = 'object'
  AND e.key NOT IN ('disability','aged-care','working-with-children','mental-health','chronic-medical')
GROUP BY e.key
ORDER BY occurrences DESC;

-- 5e. bankAccount — expected worker_bank_accounts rows (one per worker)
SELECT
  count(*)                                   AS expected_rows,
  md5(string_agg(j::text, ',' ORDER BY wid)) AS checksum
FROM (
  SELECT "workerProfileId" AS wid, ("bankAccount")::jsonb AS j
  FROM worker_additional_info WHERE "bankAccount" IS NOT NULL
) t;

-- 5f. photos — expected worker_photos rows
-- additionalPhotos is a JSON array stored in a String column, so its item count
-- is not reliably parseable here; the backfill reports the parsed figure.
SELECT
  count(*) FILTER (WHERE photos IS NOT NULL AND photos <> '')                        AS expected_primary_rows,
  count(*) FILTER (WHERE "additionalPhotos" IS NOT NULL AND "additionalPhotos" <> '') AS rows_with_additional
FROM worker_profiles;

-- 5g. worker_services — expected category and subcategory rows
-- parallel_array_mismatch must be 0: the two arrays are related only by position,
-- so a length difference means the pairing is already broken.
SELECT
  count(*)                                                                  AS expected_category_rows,
  coalesce(sum(coalesce(array_length("subcategoryIds", 1), 0)), 0)          AS expected_subcategory_rows,
  count(*) FILTER (WHERE coalesce(array_length("subcategoryIds", 1), 0)
                      <> coalesce(array_length("subcategoryNames", 1), 0))  AS parallel_array_mismatch
FROM worker_services;

-- 91. Derived VALUES against source values
--
-- This exists because row counts cannot see an empty column. Every count in
-- this file matched perfectly across four reconcile runs and a production
-- deploy while 100% of the month fields were NULL and 3,168 array elements had
-- been flattened into strings. Counting rows proves a row exists; it says
-- nothing about whether the row carries the data.
--
-- Every row below must show derived_populated = source_populated.
-- A zero on the left with a number on the right is the exact signature of a
-- field whose type is wrong.
SELECT 'job_history.startMonth' AS field,
       (SELECT count(*) FROM worker_job_history WHERE "startMonth" IS NOT NULL) AS derived_populated,
       (SELECT count(*) FROM worker_additional_info w,
               LATERAL jsonb_array_elements((w."jobHistory")::jsonb) e
          WHERE w."jobHistory" IS NOT NULL
            AND jsonb_typeof((w."jobHistory")::jsonb) = 'array'
            AND coalesce(e ->> 'startMonth', '') <> '') AS source_populated
UNION ALL
SELECT 'job_history.endMonth',
       (SELECT count(*) FROM worker_job_history WHERE "endMonth" IS NOT NULL),
       (SELECT count(*) FROM worker_additional_info w,
               LATERAL jsonb_array_elements((w."jobHistory")::jsonb) e
          WHERE w."jobHistory" IS NOT NULL
            AND jsonb_typeof((w."jobHistory")::jsonb) = 'array'
            AND coalesce(e ->> 'endMonth', '') <> '')
UNION ALL
SELECT 'job_history.startYear',
       (SELECT count(*) FROM worker_job_history WHERE "startYear" IS NOT NULL),
       (SELECT count(*) FROM worker_additional_info w,
               LATERAL jsonb_array_elements((w."jobHistory")::jsonb) e
          WHERE w."jobHistory" IS NOT NULL
            AND jsonb_typeof((w."jobHistory")::jsonb) = 'array'
            AND coalesce(e ->> 'startYear', '') <> '')
UNION ALL
SELECT 'education.startMonth',
       (SELECT count(*) FROM worker_education WHERE "startMonth" IS NOT NULL),
       (SELECT count(*) FROM worker_additional_info w,
               LATERAL jsonb_array_elements((w."education")::jsonb) e
          WHERE w."education" IS NOT NULL
            AND jsonb_typeof((w."education")::jsonb) = 'array'
            AND coalesce(e ->> 'startMonth', '') <> '')
UNION ALL
SELECT 'education.endMonth',
       (SELECT count(*) FROM worker_education WHERE "endMonth" IS NOT NULL),
       (SELECT count(*) FROM worker_additional_info w,
               LATERAL jsonb_array_elements((w."education")::jsonb) e
          WHERE w."education" IS NOT NULL
            AND jsonb_typeof((w."education")::jsonb) = 'array'
            AND coalesce(e ->> 'endMonth', '') <> '')
UNION ALL
SELECT 'experience.description',
       (SELECT count(*) FROM worker_experience WHERE "description" IS NOT NULL AND "description" <> ''),
       (SELECT count(*) FROM worker_additional_info w,
               LATERAL jsonb_each((w."experience")::jsonb) d
          WHERE w."experience" IS NOT NULL
            AND jsonb_typeof((w."experience")::jsonb) = 'object'
            AND jsonb_typeof(d.value) = 'object'
            AND coalesce(d.value ->> 'description', '') <> '')
UNION ALL
-- Arrays compare total ELEMENTS, not rows: a row can exist with an empty array.
SELECT 'experience.otherAreas (elements)',
       (SELECT coalesce(sum(coalesce(array_length("otherAreas", 1), 0)), 0) FROM worker_experience),
       (SELECT coalesce(sum(jsonb_array_length(d.value -> 'otherAreas')), 0)
          FROM worker_additional_info w,
               LATERAL jsonb_each((w."experience")::jsonb) d
          WHERE w."experience" IS NOT NULL
            AND jsonb_typeof((w."experience")::jsonb) = 'object'
            AND jsonb_typeof(d.value) = 'object'
            AND jsonb_typeof(d.value -> 'otherAreas') = 'array')
UNION ALL
SELECT 'experience.specificAreas (elements)',
       (SELECT coalesce(sum(coalesce(array_length("specificAreas", 1), 0)), 0) FROM worker_experience),
       (SELECT coalesce(sum(jsonb_array_length(d.value -> 'specificAreas')), 0)
          FROM worker_additional_info w,
               LATERAL jsonb_each((w."experience")::jsonb) d
          WHERE w."experience" IS NOT NULL
            AND jsonb_typeof((w."experience")::jsonb) = 'object'
            AND jsonb_typeof(d.value) = 'object'
            AND jsonb_typeof(d.value -> 'specificAreas') = 'array');

-- 6. verificationStatus and setup state — the funnel, re-measured each run
SELECT
  "verificationStatus",
  count(*)                                  AS workers,
  count(*) FILTER (WHERE "isPublished")     AS published,
  count(*) FILTER (WHERE "profileCompleted") AS completed
FROM worker_profiles
GROUP BY "verificationStatus"
ORDER BY workers DESC;
