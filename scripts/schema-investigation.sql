-- ============================================================================
-- Schema Restructure — Pre-Migration Investigation
-- ============================================================================
-- Generated for AIDLC INCEPTION / Requirements Analysis, 2026-09-04
-- Answers Q-D2 and Q-D4, and gathers the data-integrity facts that
-- SR-R2, SR-R3, SR-R4, SR-R5, SR-T1 and SR-T3 need BEFORE any constraint
-- can be added.
--
-- READ-ONLY. Every statement is a SELECT. Nothing is created, altered,
-- updated or deleted. Safe to run against production.
--
-- Run against AUTH_DATABASE_URL (the live schema).
-- Section 12 targets DATABASE_URL (the legacy schema) — same database if
-- both URLs point at one instance.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. SCALE — how big is this migration?  (Q-D1 follow-up)
-- ----------------------------------------------------------------------------
SELECT 'users'                     AS table_name, count(*) FROM users
UNION ALL SELECT 'worker_profiles',            count(*) FROM worker_profiles
UNION ALL SELECT 'worker_additional_info',     count(*) FROM worker_additional_info
UNION ALL SELECT 'worker_services',            count(*) FROM worker_services
UNION ALL SELECT 'verification_requirements',  count(*) FROM verification_requirements
UNION ALL SELECT 'client_profiles',            count(*) FROM client_profiles
UNION ALL SELECT 'coordinator_profiles',       count(*) FROM coordinator_profiles
UNION ALL SELECT 'participants',               count(*) FROM participants
UNION ALL SELECT 'service_requests',           count(*) FROM service_requests
UNION ALL SELECT 'jobs',                       count(*) FROM jobs
UNION ALL SELECT 'job_applications',           count(*) FROM job_applications
UNION ALL SELECT 'audit_logs',                 count(*) FROM audit_logs
ORDER BY 1;


-- ----------------------------------------------------------------------------
-- 2. Q-D2 — verificationStatus: what values actually exist?
-- ----------------------------------------------------------------------------
-- Valid enum values: NOT_STARTED, IN_PROGRESS, PENDING_REVIEW, APPROVED, REJECTED
-- The publish route writes 'Verified', which is NOT one of them.
SELECT "verificationStatus",
       count(*)                                        AS rows,
       count(*) FILTER (WHERE "isPublished")           AS published,
       min("createdAt")::date                          AS first_seen,
       max("updatedAt")::date                          AS last_seen,
       CASE WHEN "verificationStatus" IN
            ('NOT_STARTED','IN_PROGRESS','PENDING_REVIEW','APPROVED','REJECTED')
            THEN 'valid' ELSE 'OUT OF ENUM' END        AS enum_status
FROM worker_profiles
GROUP BY 1
ORDER BY 2 DESC;


-- ----------------------------------------------------------------------------
-- 3. Q-D4 — does the legacy "Job" table exist, and does it hold rows?
-- ----------------------------------------------------------------------------
SELECT table_name,
       (xpath('/row/c/text()',
              query_to_xml(format('SELECT count(*) AS c FROM %I.%I',
                                  table_schema, table_name),
                           false, true, '')))[1]::text::bigint AS row_count
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog','information_schema')
  AND table_name IN ('Job','jobs','ContractorProfile','ContractorsbyArea',
                     'Document','Category','Subcategory',
                     'CategoryDocument','SubcategoryDocument',
                     'worker_services_backup_20260108')
ORDER BY table_name;


-- ----------------------------------------------------------------------------
-- 4. SR-R3 — role / profile integrity violations
-- ----------------------------------------------------------------------------
-- The schema permits a WORKER with a ClientProfile, a user with all three
-- profiles, or a CLIENT with none. Find every violation before constraining.
SELECT u.role,
       count(*)                                                    AS users,
       count(wp.id)                                                AS has_worker_profile,
       count(cp.id)                                                AS has_client_profile,
       count(kp.id)                                                AS has_coordinator_profile,
       count(*) FILTER (
         WHERE (wp.id IS NOT NULL)::int
             + (cp.id IS NOT NULL)::int
             + (kp.id IS NOT NULL)::int > 1)                       AS MULTIPLE_PROFILES,
       count(*) FILTER (
         WHERE u.role = 'WORKER'      AND wp.id IS NULL)           AS worker_missing_profile,
       count(*) FILTER (
         WHERE u.role = 'CLIENT'      AND cp.id IS NULL)           AS client_missing_profile,
       count(*) FILTER (
         WHERE u.role = 'COORDINATOR' AND kp.id IS NULL)           AS coord_missing_profile,
       count(*) FILTER (
         WHERE u.role = 'WORKER'      AND (cp.id IS NOT NULL OR kp.id IS NOT NULL))
                                                                   AS WORKER_WITH_DEMAND_PROFILE
FROM users u
LEFT JOIN worker_profiles      wp ON wp."userId" = u.id
LEFT JOIN client_profiles      cp ON cp."userId" = u.id
LEFT JOIN coordinator_profiles kp ON kp."userId" = u.id
GROUP BY u.role
ORDER BY u.role;


-- ----------------------------------------------------------------------------
-- 5. SR-R4 — orphaned participants (health data owned by nobody)
-- ----------------------------------------------------------------------------
SELECT count(*)                                                  AS total_participants,
       count(*) FILTER (WHERE "userId" IS NULL)                  AS ORPHANED,
       count(*) FILTER (WHERE "userId" IS NULL
                          AND array_length(conditions,1) > 0)    AS orphaned_with_health_data,
       count(*) FILTER (WHERE "userId" IS NOT NULL
                          AND "userId" NOT IN (SELECT id FROM users))
                                                                 AS dangling_user_ref
FROM participants;


-- ----------------------------------------------------------------------------
-- 6. SR-R2 — links with no foreign key: do they resolve?
-- ----------------------------------------------------------------------------
-- 6a. ServiceRequest.requesterId -> User.id
SELECT 'service_requests.requesterId' AS link,
       count(*)                                                        AS total,
       count(*) FILTER (WHERE "requesterId" NOT IN (SELECT id FROM users)) AS DANGLING
FROM service_requests
UNION ALL
-- 6b. JobApplication.workerId -> User.id
SELECT 'job_applications.workerId',
       count(*),
       count(*) FILTER (WHERE "workerId" NOT IN (SELECT id FROM users))
FROM job_applications
UNION ALL
-- 6c. VerificationRequirement.reviewedBy -> User.id
SELECT 'verification_requirements.reviewedBy',
       count(*) FILTER (WHERE "reviewedBy" IS NOT NULL),
       count(*) FILTER (WHERE "reviewedBy" IS NOT NULL
                          AND "reviewedBy" NOT IN (SELECT id FROM users))
FROM verification_requirements;


-- 6d. SR-R1 — which identity do assignedWorker / selectedWorkers actually hold?
--     Code says User.id. Verify against both candidate keys before migrating.
WITH assigned AS (
  SELECT sr.id AS request_id, jsonb_array_elements_text(sr."assignedWorker"::jsonb) AS wid
  FROM service_requests sr
  WHERE jsonb_typeof(sr."assignedWorker"::jsonb) = 'array'
)
SELECT 'assignedWorker' AS column_name,
       count(*)                                                            AS ids,
       count(*) FILTER (WHERE wid IN (SELECT id FROM users))               AS resolves_as_user_id,
       count(*) FILTER (WHERE wid IN (SELECT id FROM worker_profiles))     AS resolves_as_profile_id,
       count(*) FILTER (WHERE wid NOT IN (SELECT id FROM users)
                          AND wid NOT IN (SELECT id FROM worker_profiles)) AS RESOLVES_TO_NEITHER
FROM assigned
UNION ALL
SELECT 'selectedWorkers',
       count(*),
       count(*) FILTER (WHERE wid IN (SELECT id FROM users)),
       count(*) FILTER (WHERE wid IN (SELECT id FROM worker_profiles)),
       count(*) FILTER (WHERE wid NOT IN (SELECT id FROM users)
                          AND wid NOT IN (SELECT id FROM worker_profiles))
FROM (SELECT unnest("selectedWorkers") AS wid FROM service_requests) s;


-- ----------------------------------------------------------------------------
-- 7. SR-R5 — worker_services: parallel array integrity
-- ----------------------------------------------------------------------------
SELECT count(*)                                                          AS total_rows,
       count(*) FILTER (
         WHERE coalesce(array_length("subcategoryIds",1),0)
            <> coalesce(array_length("subcategoryNames",1),0))           AS ARRAY_LENGTH_MISMATCH,
       count(*) FILTER (
         WHERE "categoryId" NOT IN (SELECT id FROM "Category"))          AS dangling_category,
       count(*) FILTER (WHERE "categoryName" IS DISTINCT FROM c.name)    AS STALE_CATEGORY_NAME
FROM worker_services ws
LEFT JOIN "Category" c ON c.id = ws."categoryId";

-- 7b. subcategory ids that do not resolve
SELECT count(*)                                                          AS subcategory_refs,
       count(*) FILTER (WHERE sid NOT IN (SELECT id FROM "Subcategory")) AS DANGLING
FROM (SELECT unnest("subcategoryIds") AS sid FROM worker_services) s;


-- ----------------------------------------------------------------------------
-- 8. SR-T1 — mistyped columns: what shapes does the data actually take?
-- ----------------------------------------------------------------------------
-- 8a. dateOfBirth is String? on worker_profiles, DateTime? on participants
SELECT 'worker_profiles.dateOfBirth' AS col,
       count(*)                                                            AS total,
       count("dateOfBirth")                                                AS non_null,
       count(*) FILTER (WHERE "dateOfBirth" ~ '^\d{4}-\d{2}-\d{2}$')       AS iso_yyyy_mm_dd,
       count(*) FILTER (WHERE "dateOfBirth" ~ '^\d{2}/\d{2}/\d{4}$')       AS slash_dd_mm_yyyy,
       count(*) FILTER (WHERE "dateOfBirth" IS NOT NULL
                          AND "dateOfBirth" !~ '^\d{4}-\d{2}-\d{2}$'
                          AND "dateOfBirth" !~ '^\d{2}/\d{2}/\d{4}$')      AS UNPARSEABLE
FROM worker_profiles;

-- 8b. age vs dateOfBirth — has the derived column drifted?
SELECT count(*)                                                            AS both_present,
       count(*) FILTER (
         WHERE age <> extract(year FROM age(("dateOfBirth")::date)))       AS AGE_DISAGREES
FROM worker_profiles
WHERE age IS NOT NULL
  AND "dateOfBirth" ~ '^\d{4}-\d{2}-\d{2}$';

-- 8c. hasVehicle is String? — what values?
SELECT 'hasVehicle' AS col, "hasVehicle" AS value, count(*) FROM worker_profiles GROUP BY 2
UNION ALL
SELECT 'wp.gender',  gender,  count(*) FROM worker_profiles GROUP BY 2
UNION ALL
SELECT 'p.gender',   gender,  count(*) FROM participants     GROUP BY 2
UNION ALL
SELECT 'relationshipToClient', "relationshipToClient", count(*) FROM participants GROUP BY 2
ORDER BY 1, 3 DESC;


-- ----------------------------------------------------------------------------
-- 9. SR-T3 — the duplicated worker fields: which table holds the truth?
-- ----------------------------------------------------------------------------
SELECT count(*)                                                             AS pairs,
       count(*) FILTER (WHERE wp.languages IS DISTINCT FROM wai.languages)  AS LANGUAGES_DISAGREE,
       count(*) FILTER (WHERE wp."funFact" IS DISTINCT FROM wai."funFact")  AS FUNFACT_DISAGREE,
       count(*) FILTER (WHERE wp."uniqueService" IS NOT NULL
                          AND array_length(wai."uniqueService",1) > 0)      AS uniqueservice_both_populated,
       count(*) FILTER (WHERE wp.experience IS NOT NULL
                          AND wai.experience::text NOT IN ('{}','null'))    AS experience_both_populated
FROM worker_profiles wp
JOIN worker_additional_info wai ON wai."workerProfileId" = wp.id;


-- ----------------------------------------------------------------------------
-- 10. Q-D6 / SR-T2 — is the NDIS number hiding in ServiceRequest.details?
-- ----------------------------------------------------------------------------
SELECT count(*)                                                             AS total_requests,
       count(*) FILTER (WHERE details::jsonb ? 'ndisNumber')                AS has_ndisNumber_key,
       count(*) FILTER (WHERE details::jsonb ? 'planManager')               AS has_planManager,
       count(*) FILTER (WHERE details::jsonb ? 'invoiceEmail')              AS has_invoiceEmail
FROM service_requests
WHERE jsonb_typeof(details::jsonb) = 'object';

-- 10b. every distinct key used in details — the de facto schema
SELECT k AS details_key, count(*) AS occurrences
FROM service_requests, jsonb_object_keys(details::jsonb) k
WHERE jsonb_typeof(details::jsonb) = 'object'
GROUP BY 1 ORDER BY 2 DESC;


-- ----------------------------------------------------------------------------
-- 11. SR-T2 — shapes of the other JSON columns
-- ----------------------------------------------------------------------------
SELECT 'wp.abn'            AS col, jsonb_typeof(abn::jsonb)             AS shape, count(*)
FROM worker_profiles WHERE abn IS NOT NULL GROUP BY 2
UNION ALL
SELECT 'wp.setupProgress',  jsonb_typeof("setupProgress"::jsonb), count(*)
FROM worker_profiles WHERE "setupProgress" IS NOT NULL GROUP BY 2
UNION ALL
SELECT 'wai.jobHistory',    jsonb_typeof("jobHistory"::jsonb),   count(*)
FROM worker_additional_info WHERE "jobHistory" IS NOT NULL GROUP BY 2
UNION ALL
SELECT 'wai.education',     jsonb_typeof(education::jsonb),      count(*)
FROM worker_additional_info WHERE education IS NOT NULL GROUP BY 2
UNION ALL
SELECT 'wai.availability',  jsonb_typeof(availability::jsonb),   count(*)
FROM worker_additional_info WHERE availability IS NOT NULL GROUP BY 2
UNION ALL
SELECT 'wai.bankAccount',   jsonb_typeof("bankAccount"::jsonb),  count(*)
FROM worker_additional_info WHERE "bankAccount" IS NOT NULL GROUP BY 2
ORDER BY 1, 3 DESC;


-- ----------------------------------------------------------------------------
-- 12. SR-R4 / SR-F3 — isSelfManaged duplication, and residue
-- ----------------------------------------------------------------------------
SELECT count(*)                                                             AS client_participant_pairs,
       count(*) FILTER (WHERE p."isSelfManaged" IS DISTINCT FROM cp."isSelfManaged")
                                                                            AS ISSELFMANAGED_DISAGREES
FROM participants p
JOIN client_profiles cp ON cp."userId" = p."userId";

-- 12b. Sessions and accounts should be empty (JWT strategy)
SELECT 'sessions' AS t, count(*) FROM sessions
UNION ALL SELECT 'accounts', count(*) FROM accounts;

-- ============================================================================
-- END — no writes performed
-- ============================================================================
