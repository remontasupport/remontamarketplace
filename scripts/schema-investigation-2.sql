-- ============================================================================
-- Schema Restructure — Follow-up Investigation (round 2)
-- ============================================================================
-- Chases the three surprises from round 1:
--   A. verification_requirements.reviewedBy is 100% dangling (1711/1711)
--   B. 5 ids are simultaneously a valid User.id AND a valid WorkerProfile.id
--   C. DATABASE_URL and AUTH_DATABASE_URL are DIFFERENT Neon endpoints
--
-- READ-ONLY. Every statement is a SELECT. No values that could identify a
-- person are returned — only patterns, lengths and counts.
--
-- Sections 1-3 run against AUTH_DATABASE_URL.
-- Section 4 runs against DATABASE_URL  (use --url-var DATABASE_URL).
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. What does reviewedBy actually contain?  (100% fails to match User.id)
-- ----------------------------------------------------------------------------
-- Pattern classes only. No raw values.
SELECT CASE
         WHEN "reviewedBy" ~ '^c[a-z0-9]{24}$'        THEN 'cuid-shaped'
         WHEN "reviewedBy" ~ '^[0-9a-f-]{36}$'        THEN 'uuid-shaped'
         WHEN "reviewedBy" ~ '@'                      THEN 'email-shaped'
         WHEN "reviewedBy" ~ '^\d+$'                  THEN 'numeric'
         WHEN "reviewedBy" ~ '^[A-Za-z ]+$'           THEN 'name-shaped'
         ELSE 'other'
       END                                            AS shape,
       length("reviewedBy")                           AS len,
       count(*)                                       AS rows,
       count(DISTINCT "reviewedBy")                   AS distinct_values
FROM verification_requirements
WHERE "reviewedBy" IS NOT NULL
GROUP BY 1, 2
ORDER BY 3 DESC;

-- 1b. How many distinct reviewers are there in total?
SELECT count(DISTINCT "reviewedBy") AS distinct_reviewers,
       count(*)                     AS reviewed_rows,
       count(*) FILTER (WHERE status = 'APPROVED') AS approved,
       count(*) FILTER (WHERE status = 'REJECTED') AS rejected
FROM verification_requirements
WHERE "reviewedBy" IS NOT NULL;

-- 1c. Does it match a WorkerProfile.id instead? Or an admin email?
SELECT count(*) FILTER (WHERE "reviewedBy" IN (SELECT id FROM worker_profiles)) AS matches_worker_profile_id,
       count(*) FILTER (WHERE "reviewedBy" IN (SELECT email FROM users))        AS matches_user_email,
       count(*) FILTER (WHERE "reviewedBy" IN (SELECT id FROM users))           AS matches_user_id
FROM verification_requirements
WHERE "reviewedBy" IS NOT NULL;


-- ----------------------------------------------------------------------------
-- 2. THE ID COLLISION — is WorkerProfile.id ever equal to a User.id?
-- ----------------------------------------------------------------------------
-- Round 1 found 5 assignedWorker ids resolving as BOTH. If worker_profiles.id
-- was ever set to the owning user's id, "which key is this?" becomes
-- undecidable for those rows.
SELECT count(*)                                                    AS worker_profiles,
       count(*) FILTER (WHERE wp.id = wp."userId")                 AS ID_EQUALS_OWN_USERID,
       count(*) FILTER (WHERE wp.id IN (SELECT id FROM users))     AS ID_COLLIDES_WITH_ANY_USER,
       count(*) FILTER (WHERE wp.id ~ '^c[a-z0-9]{24}$')           AS cuid_shaped,
       count(*) FILTER (WHERE wp.id !~ '^c[a-z0-9]{24}$')          AS other_shape
FROM worker_profiles wp;

-- 2b. Same question for the demand-side profiles (they use gen_random_uuid)
SELECT 'client_profiles' AS t,
       count(*)                                                 AS rows,
       count(*) FILTER (WHERE id = "userId")                    AS id_equals_userid,
       count(*) FILTER (WHERE id IN (SELECT id FROM users))     AS collides_with_user
FROM client_profiles
UNION ALL
SELECT 'coordinator_profiles',
       count(*),
       count(*) FILTER (WHERE id = "userId"),
       count(*) FILTER (WHERE id IN (SELECT id FROM users))
FROM coordinator_profiles;


-- ----------------------------------------------------------------------------
-- 3. Remaining SR-R1 detail — do the dangling FK rows point anywhere?
-- ----------------------------------------------------------------------------
-- Round 1: 1 dangling in service_requests.requesterId, 1 in job_applications.workerId
SELECT 'service_requests.requesterId' AS link,
       count(*) FILTER (WHERE "requesterId" NOT IN (SELECT id FROM users))                AS dangling,
       count(*) FILTER (WHERE "requesterId" NOT IN (SELECT id FROM users)
                          AND "requesterId" IN (SELECT id FROM worker_profiles))          AS is_a_profile_id
FROM service_requests
UNION ALL
SELECT 'job_applications.workerId',
       count(*) FILTER (WHERE "workerId" NOT IN (SELECT id FROM users)),
       count(*) FILTER (WHERE "workerId" NOT IN (SELECT id FROM users)
                          AND "workerId" IN (SELECT id FROM worker_profiles))
FROM job_applications;

-- 3b. Publication reality check — 1 published of 1679. Confirm against documents.
SELECT count(*)                                                          AS worker_profiles,
       count(*) FILTER (WHERE "isPublished")                             AS published,
       count(*) FILTER (WHERE "profileCompleted")                        AS profile_completed,
       count(*) FILTER (WHERE "profileCompleted" AND NOT "isPublished")  AS complete_but_unpublished
FROM worker_profiles;

-- 3c. Verification requirement status spread (9250 rows)
SELECT status, count(*), count(DISTINCT "workerProfileId") AS workers
FROM verification_requirements GROUP BY 1 ORDER BY 2 DESC;

-- 3d. Are any documents past their expiry? (EXPIRED is never written)
SELECT count(*)                                                     AS with_expiry,
       count(*) FILTER (WHERE "expiresAt" < now())                  AS PAST_EXPIRY,
       count(*) FILTER (WHERE "expiresAt" < now() AND status = 'APPROVED') AS past_expiry_still_approved
FROM verification_requirements WHERE "expiresAt" IS NOT NULL;



-- ============================================================================
-- END — no writes performed
-- ============================================================================
