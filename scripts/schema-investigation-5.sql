-- ============================================================================
-- Schema Restructure — JSON Key Inventory (round 5)
-- ============================================================================
-- AD-14: five JSON columns are structurally uniform but their KEYS have not
-- been inspected. Designing relations for them without that would be guesswork.
--
-- Returns KEY NAMES and counts only — never values. No personal data.
-- bankAccount is deliberately NOT inspected: it holds financial data and the
-- decision (encrypt vs remove) does not depend on its keys.
--
-- Run against AUTH_DATABASE_URL.
-- ============================================================================

-- 1. WorkerAdditionalInfo.jobHistory — array of what?
SELECT k AS key, count(*) AS occurrences
FROM worker_additional_info, jsonb_array_elements("jobHistory"::jsonb) e, jsonb_object_keys(e) k
WHERE jsonb_typeof("jobHistory"::jsonb) = 'array'
GROUP BY 1 ORDER BY 2 DESC;

-- 1b. how many entries per worker?
SELECT jsonb_array_length("jobHistory"::jsonb) AS entries, count(*) AS workers
FROM worker_additional_info
WHERE jsonb_typeof("jobHistory"::jsonb) = 'array'
GROUP BY 1 ORDER BY 1;

-- 2. WorkerAdditionalInfo.education
SELECT k AS key, count(*) AS occurrences
FROM worker_additional_info, jsonb_array_elements(education::jsonb) e, jsonb_object_keys(e) k
WHERE jsonb_typeof(education::jsonb) = 'array'
GROUP BY 1 ORDER BY 2 DESC;

-- 2b. entries per worker
SELECT jsonb_array_length(education::jsonb) AS entries, count(*) AS workers
FROM worker_additional_info
WHERE jsonb_typeof(education::jsonb) = 'array'
GROUP BY 1 ORDER BY 1;

-- 3. WorkerAdditionalInfo.availability — object of what?
SELECT k AS key, count(*) AS occurrences
FROM worker_additional_info, jsonb_object_keys(availability::jsonb) k
WHERE jsonb_typeof(availability::jsonb) = 'object'
GROUP BY 1 ORDER BY 2 DESC;

-- 4. WorkerAdditionalInfo.experience
SELECT k AS key, count(*) AS occurrences
FROM worker_additional_info, jsonb_object_keys(experience::jsonb) k
WHERE jsonb_typeof(experience::jsonb) = 'object'
GROUP BY 1 ORDER BY 2 DESC;

-- 5. WorkerProfile.abn — confirms the EngagementType design in AD-13
SELECT k AS key, count(*) AS occurrences
FROM worker_profiles, jsonb_object_keys(abn::jsonb) k
WHERE jsonb_typeof(abn::jsonb) = 'object'
GROUP BY 1 ORDER BY 2 DESC;

-- 6. ServiceRequest.services — array or object?
SELECT jsonb_typeof(services::jsonb) AS shape, count(*) FROM service_requests GROUP BY 1;

-- 6b. its keys
SELECT k AS key, count(*) AS occurrences
FROM service_requests, jsonb_array_elements(services::jsonb) e, jsonb_object_keys(e) k
WHERE jsonb_typeof(services::jsonb) = 'array'
GROUP BY 1 ORDER BY 2 DESC;

-- 7. ServiceRequest.schedulingPrefs — the one AD-8 key left as Json
SELECT k AS key, count(*) AS occurrences
FROM service_requests, jsonb_object_keys((details::jsonb -> 'schedulingPrefs')) k
WHERE jsonb_typeof(details::jsonb -> 'schedulingPrefs') = 'object'
GROUP BY 1 ORDER BY 2 DESC;

-- ============================================================================
-- END — no writes performed
-- ============================================================================
