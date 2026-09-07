-- Round 9 — the VALUE types inside the four W1 Json columns.
--
-- Round 5 measured key NAMES. Round 6 measured value types for availability and
-- experience only. Nobody ever measured the value types inside jobHistory and
-- education, and I filled that gap with assumptions: months are numbers,
-- otherAreas is a string. Both were wrong, and the derived tables carry the
-- damage — every month is NULL because Number('March') is NaN.
--
-- This round measures what is actually there, for every field, so the column
-- types can be chosen from evidence rather than inference.
--
-- READ ONLY. Types, counts and short categorical values only.

-- 1. jobHistory — the JSON type of every field, across every entry
SELECT kv.key, jsonb_typeof(kv.value) AS value_type, count(*) AS occurrences
FROM worker_additional_info w,
     LATERAL jsonb_array_elements((w."jobHistory")::jsonb) e,
     LATERAL jsonb_each(e) kv
WHERE w."jobHistory" IS NOT NULL
  AND jsonb_typeof((w."jobHistory")::jsonb) = 'array'
GROUP BY kv.key, jsonb_typeof(kv.value)
ORDER BY kv.key, occurrences DESC;

-- 2. jobHistory — the actual startMonth vocabulary
-- If these are month names, an Int column cannot hold them.
SELECT e ->> 'startMonth' AS start_month, count(*) AS entries
FROM worker_additional_info w,
     LATERAL jsonb_array_elements((w."jobHistory")::jsonb) e
WHERE w."jobHistory" IS NOT NULL
  AND jsonb_typeof((w."jobHistory")::jsonb) = 'array'
GROUP BY 1
ORDER BY entries DESC;

-- 2b. jobHistory — endMonth vocabulary
SELECT e ->> 'endMonth' AS end_month, count(*) AS entries
FROM worker_additional_info w,
     LATERAL jsonb_array_elements((w."jobHistory")::jsonb) e
WHERE w."jobHistory" IS NOT NULL
  AND jsonb_typeof((w."jobHistory")::jsonb) = 'array'
GROUP BY 1
ORDER BY entries DESC;

-- 2c. jobHistory — do the year fields hold four digits, or something else?
SELECT
  count(*)                                                              AS entries,
  count(*) FILTER (WHERE e ->> 'startYear' ~ '^[0-9]{4}$')              AS start_year_4digit,
  count(*) FILTER (WHERE e ->> 'startYear' IS NOT NULL
                     AND e ->> 'startYear' !~ '^[0-9]{4}$')             AS start_year_other,
  count(*) FILTER (WHERE e ->> 'endYear' ~ '^[0-9]{4}$')                AS end_year_4digit,
  count(*) FILTER (WHERE e ->> 'endYear' IS NOT NULL
                     AND e ->> 'endYear' !~ '^[0-9]{4}$')               AS end_year_other
FROM worker_additional_info w,
     LATERAL jsonb_array_elements((w."jobHistory")::jsonb) e
WHERE w."jobHistory" IS NOT NULL
  AND jsonb_typeof((w."jobHistory")::jsonb) = 'array';

-- 3. education — the JSON type of every field
SELECT kv.key, jsonb_typeof(kv.value) AS value_type, count(*) AS occurrences
FROM worker_additional_info w,
     LATERAL jsonb_array_elements((w."education")::jsonb) e,
     LATERAL jsonb_each(e) kv
WHERE w."education" IS NOT NULL
  AND jsonb_typeof((w."education")::jsonb) = 'array'
GROUP BY kv.key, jsonb_typeof(kv.value)
ORDER BY kv.key, occurrences DESC;

-- 3b. education — startMonth vocabulary
SELECT e ->> 'startMonth' AS start_month, count(*) AS entries
FROM worker_additional_info w,
     LATERAL jsonb_array_elements((w."education")::jsonb) e
WHERE w."education" IS NOT NULL
  AND jsonb_typeof((w."education")::jsonb) = 'array'
GROUP BY 1
ORDER BY entries DESC;

-- 4. experience — the JSON type of every field under each care domain
SELECT kv.key, jsonb_typeof(kv.value) AS value_type, count(*) AS occurrences
FROM worker_additional_info w,
     LATERAL jsonb_each((w."experience")::jsonb) d,
     LATERAL jsonb_each(d.value) kv
WHERE w."experience" IS NOT NULL
  AND jsonb_typeof((w."experience")::jsonb) = 'object'
  AND jsonb_typeof(d.value) = 'object'
GROUP BY kv.key, jsonb_typeof(kv.value)
ORDER BY kv.key, occurrences DESC;

-- 4b. experience — otherAreas: if it is an array, how long, and what element type?
SELECT
  jsonb_typeof(d.value -> 'otherAreas')                                  AS other_areas_type,
  count(*)                                                               AS domains,
  coalesce(sum(CASE WHEN jsonb_typeof(d.value -> 'otherAreas') = 'array'
                    THEN jsonb_array_length(d.value -> 'otherAreas') ELSE 0 END), 0) AS total_elements
FROM worker_additional_info w,
     LATERAL jsonb_each((w."experience")::jsonb) d
WHERE w."experience" IS NOT NULL
  AND jsonb_typeof((w."experience")::jsonb) = 'object'
  AND jsonb_typeof(d.value) = 'object'
GROUP BY 1
ORDER BY domains DESC;

-- 5. availability — the JSON type of every field inside a slot
SELECT kv.key, jsonb_typeof(kv.value) AS value_type, count(*) AS occurrences
FROM worker_additional_info w,
     LATERAL jsonb_each((w."availability")::jsonb) d,
     LATERAL jsonb_array_elements(
       CASE WHEN jsonb_typeof(d.value) = 'array'
            THEN d.value ELSE jsonb_build_array(d.value) END) slot,
     LATERAL jsonb_each(slot) kv
WHERE w."availability" IS NOT NULL
  AND jsonb_typeof((w."availability")::jsonb) = 'object'
GROUP BY kv.key, jsonb_typeof(kv.value)
ORDER BY kv.key, occurrences DESC;

-- 6. What the derived tables currently hold — the damage, quantified
SELECT
  (SELECT count(*) FROM worker_job_history)                                    AS job_history_rows,
  (SELECT count(*) FROM worker_job_history WHERE "startMonth" IS NULL)         AS jh_start_month_null,
  (SELECT count(*) FROM worker_job_history WHERE "startYear" IS NULL)          AS jh_start_year_null,
  (SELECT count(*) FROM worker_education)                                      AS education_rows,
  (SELECT count(*) FROM worker_education WHERE "startMonth" IS NULL)           AS ed_start_month_null,
  (SELECT count(*) FROM worker_experience)                                     AS experience_rows,
  (SELECT count(*) FROM worker_experience WHERE "otherAreas" IS NOT NULL)      AS ex_other_areas_set;
