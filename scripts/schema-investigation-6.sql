-- ============================================================================
-- Schema Restructure — JSON Value Shapes (round 6)
-- ============================================================================
-- Round 5 gave the KEYS. Three columns still need their VALUE shape before a
-- relation can be designed, and two need their categorical vocabulary.
--
-- Returns type names, distinct categorical values and counts only.
-- Categorical values here are vocabulary (e.g. "weekly", "morning"), not
-- personal data. No free text is returned.
--
-- Run against AUTH_DATABASE_URL.
-- ============================================================================

-- 1. availability: keys are weekdays. What sits UNDER a day?
SELECT jsonb_typeof(availability::jsonb -> 'MONDAY') AS monday_value_type, count(*)
FROM worker_additional_info
WHERE jsonb_typeof(availability::jsonb) = 'object'
  AND availability::jsonb ? 'MONDAY'
GROUP BY 1;

-- 1b. if it is an object, its keys; if an array, its element type
SELECT k AS key, count(*) AS occurrences
FROM worker_additional_info, jsonb_object_keys(availability::jsonb -> 'MONDAY') k
WHERE jsonb_typeof(availability::jsonb -> 'MONDAY') = 'object'
GROUP BY 1 ORDER BY 2 DESC;

-- 1c. array case
SELECT jsonb_typeof(e) AS element_type, count(*)
FROM worker_additional_info, jsonb_array_elements(availability::jsonb -> 'MONDAY') e
WHERE jsonb_typeof(availability::jsonb -> 'MONDAY') = 'array'
GROUP BY 1;


-- 2. experience: keys are care domains. What sits UNDER a domain?
SELECT jsonb_typeof(experience::jsonb -> 'disability') AS value_type, count(*)
FROM worker_additional_info
WHERE jsonb_typeof(experience::jsonb) = 'object'
  AND experience::jsonb ? 'disability'
GROUP BY 1;

-- 2b. the distinct vocabulary of that value (categorical, e.g. years or level)
SELECT experience::jsonb ->> 'disability' AS value, count(*)
FROM worker_additional_info
WHERE jsonb_typeof(experience::jsonb) = 'object'
  AND jsonb_typeof(experience::jsonb -> 'disability') IN ('string','number','boolean')
GROUP BY 1 ORDER BY 2 DESC;

-- 2c. object case - its keys
SELECT k AS key, count(*) AS occurrences
FROM worker_additional_info, jsonb_object_keys(experience::jsonb -> 'disability') k
WHERE jsonb_typeof(experience::jsonb -> 'disability') = 'object'
GROUP BY 1 ORDER BY 2 DESC;


-- 3. ServiceRequest.services is an OBJECT, not an array. Its keys?
SELECT k AS key, count(*) AS occurrences
FROM service_requests, jsonb_object_keys(services::jsonb) k
WHERE jsonb_typeof(services::jsonb) = 'object'
GROUP BY 1 ORDER BY 2 DESC;

-- 3b. and the value type under each key
SELECT k AS key, jsonb_typeof(services::jsonb -> k) AS value_type, count(*)
FROM service_requests, jsonb_object_keys(services::jsonb) k
WHERE jsonb_typeof(services::jsonb) = 'object'
GROUP BY 1, 2 ORDER BY 3 DESC;


-- 4. schedulingPrefs: the categorical vocabulary, to decide enum vs string
SELECT 'frequency'       AS field, details::jsonb #>> '{schedulingPrefs,frequency}'       AS value, count(*)
FROM service_requests WHERE details::jsonb #> '{schedulingPrefs,frequency}' IS NOT NULL GROUP BY 2
UNION ALL
SELECT 'scheduling',      details::jsonb #>> '{schedulingPrefs,scheduling}',      count(*)
FROM service_requests WHERE details::jsonb #> '{schedulingPrefs,scheduling}' IS NOT NULL GROUP BY 2
UNION ALL
SELECT 'startPreference', details::jsonb #>> '{schedulingPrefs,startPreference}', count(*)
FROM service_requests WHERE details::jsonb #> '{schedulingPrefs,startPreference}' IS NOT NULL GROUP BY 2
ORDER BY 1, 3 DESC;

-- 4b. numeric fields - confirm they are numbers
SELECT jsonb_typeof(details::jsonb #> '{schedulingPrefs,hoursPerPeriod}')   AS hours_type,
       jsonb_typeof(details::jsonb #> '{schedulingPrefs,sessionsPerPeriod}') AS sessions_type,
       jsonb_typeof(details::jsonb #> '{schedulingPrefs,preferredDays}')     AS preferreddays_type,
       count(*)
FROM service_requests
WHERE details::jsonb ? 'schedulingPrefs'
GROUP BY 1,2,3;

-- ============================================================================
-- END — no writes performed
-- ============================================================================
