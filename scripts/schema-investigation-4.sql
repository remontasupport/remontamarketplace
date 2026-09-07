-- ============================================================================
-- Schema Restructure — SR-T3 Migration Sizing (round 4)
-- ============================================================================
-- The partition rule is now decided:
--   WorkerProfile        = identity + contact + address (registration-time)
--   WorkerAdditionalInfo = everything else
--
-- Moving a field from WorkerProfile to WorkerAdditionalInfo is only safe if we
-- know, per field, which side actually holds the data. Round 2 told us the two
-- sides DISAGREE in 71-76% of pairs — but "disagree" lumps together
-- "one side is empty" with "both populated and different". Only the second
-- needs a human decision.
--
-- Critical context: 1,679 worker_profiles but only 374 worker_additional_info
-- rows. ~1,305 workers have NO additional-info row at all, so a naive
-- "WorkerAdditionalInfo wins" would DELETE their data.
--
-- READ-ONLY. Every statement is a SELECT.
-- Run against AUTH_DATABASE_URL.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. COVERAGE — how many workers even have an additional-info row?
-- ----------------------------------------------------------------------------
SELECT count(*)                                            AS worker_profiles,
       count(wai.id)                                       AS has_additional_info,
       count(*) - count(wai.id)                            AS NO_ADDITIONAL_INFO_ROW
FROM worker_profiles wp
LEFT JOIN worker_additional_info wai ON wai."workerProfileId" = wp.id;


-- ----------------------------------------------------------------------------
-- 2. Workers with NO additional-info row — do they hold data that must move?
-- ----------------------------------------------------------------------------
-- If these are non-zero, the migration MUST create the row and copy across,
-- not assume WorkerAdditionalInfo is authoritative.
SELECT count(*)                                                        AS orphan_profiles,
       count(*) FILTER (WHERE array_length(wp.languages,1) > 0)        AS has_languages,
       count(*) FILTER (WHERE wp."funFact"       IS NOT NULL)          AS has_funfact,
       count(*) FILTER (WHERE wp."uniqueService" IS NOT NULL)          AS has_uniqueservice,
       count(*) FILTER (WHERE wp.experience      IS NOT NULL)          AS has_experience,
       count(*) FILTER (WHERE wp.introduction    IS NOT NULL)          AS has_introduction,
       count(*) FILTER (WHERE wp.qualifications  IS NOT NULL)          AS has_qualifications,
       count(*) FILTER (WHERE wp.hobbies         IS NOT NULL)          AS has_hobbies,
       count(*) FILTER (WHERE wp."hasVehicle"    IS NOT NULL)          AS has_hasvehicle
FROM worker_profiles wp
LEFT JOIN worker_additional_info wai ON wai."workerProfileId" = wp.id
WHERE wai.id IS NULL;


-- ----------------------------------------------------------------------------
-- 3. THE REAL CONFLICT — per field, for the 374 pairs
-- ----------------------------------------------------------------------------
-- Only "both_populated_and_differ" needs a decision. Everything else is a
-- mechanical coalesce.
SELECT 'languages' AS field,
       count(*) FILTER (WHERE array_length(wp.languages,1) > 0
                          AND coalesce(array_length(wai.languages,1),0) = 0)   AS wp_only,
       count(*) FILTER (WHERE coalesce(array_length(wp.languages,1),0) = 0
                          AND array_length(wai.languages,1) > 0)               AS wai_only,
       count(*) FILTER (WHERE array_length(wp.languages,1) > 0
                          AND array_length(wai.languages,1) > 0
                          AND wp.languages = wai.languages)                    AS both_same,
       count(*) FILTER (WHERE array_length(wp.languages,1) > 0
                          AND array_length(wai.languages,1) > 0
                          AND wp.languages IS DISTINCT FROM wai.languages)     AS BOTH_DIFFER,
       count(*) FILTER (WHERE coalesce(array_length(wp.languages,1),0) = 0
                          AND coalesce(array_length(wai.languages,1),0) = 0)   AS neither
FROM worker_profiles wp JOIN worker_additional_info wai ON wai."workerProfileId" = wp.id

UNION ALL
SELECT 'funFact',
       count(*) FILTER (WHERE wp."funFact" IS NOT NULL AND wai."funFact" IS NULL),
       count(*) FILTER (WHERE wp."funFact" IS NULL     AND wai."funFact" IS NOT NULL),
       count(*) FILTER (WHERE wp."funFact" IS NOT NULL AND wai."funFact" IS NOT NULL
                          AND wp."funFact" = wai."funFact"),
       count(*) FILTER (WHERE wp."funFact" IS NOT NULL AND wai."funFact" IS NOT NULL
                          AND wp."funFact" IS DISTINCT FROM wai."funFact"),
       count(*) FILTER (WHERE wp."funFact" IS NULL     AND wai."funFact" IS NULL)
FROM worker_profiles wp JOIN worker_additional_info wai ON wai."workerProfileId" = wp.id

UNION ALL
SELECT 'uniqueService',
       count(*) FILTER (WHERE wp."uniqueService" IS NOT NULL
                          AND coalesce(array_length(wai."uniqueService",1),0) = 0),
       count(*) FILTER (WHERE wp."uniqueService" IS NULL
                          AND array_length(wai."uniqueService",1) > 0),
       0,
       count(*) FILTER (WHERE wp."uniqueService" IS NOT NULL
                          AND array_length(wai."uniqueService",1) > 0),
       count(*) FILTER (WHERE wp."uniqueService" IS NULL
                          AND coalesce(array_length(wai."uniqueService",1),0) = 0)
FROM worker_profiles wp JOIN worker_additional_info wai ON wai."workerProfileId" = wp.id

UNION ALL
SELECT 'experience',
       count(*) FILTER (WHERE wp.experience IS NOT NULL
                          AND (wai.experience IS NULL OR wai.experience::text IN ('{}','null'))),
       count(*) FILTER (WHERE wp.experience IS NULL
                          AND wai.experience IS NOT NULL AND wai.experience::text NOT IN ('{}','null')),
       0,
       count(*) FILTER (WHERE wp.experience IS NOT NULL
                          AND wai.experience IS NOT NULL AND wai.experience::text NOT IN ('{}','null')),
       count(*) FILTER (WHERE wp.experience IS NULL
                          AND (wai.experience IS NULL OR wai.experience::text IN ('{}','null')))
FROM worker_profiles wp JOIN worker_additional_info wai ON wai."workerProfileId" = wp.id
ORDER BY 1;


-- ----------------------------------------------------------------------------
-- 4. Fields that would move but are used by SEARCH and ADMIN FILTERS
-- ----------------------------------------------------------------------------
-- gender / dateOfBirth / age are NOT written at registration, so the partition
-- rule sends them to WorkerAdditionalInfo — but search and the admin console
-- filter on them (worker_profiles has indexes on all three). Sizing the
-- population tells us whether the extra join matters.
SELECT count(*)                                              AS worker_profiles,
       count(gender)                                         AS has_gender,
       count("dateOfBirth")                                  AS has_dob,
       count(introduction)                                   AS has_introduction,
       count(photos)                                         AS has_photo,
       count("additionalPhotos")                             AS has_additional_photos,
       count(abn)                                            AS has_abn,
       count(qualifications)                                 AS has_qualifications
FROM worker_profiles;


-- ----------------------------------------------------------------------------
-- 5. Onboarding reality — where do workers actually stop?
-- ----------------------------------------------------------------------------
-- The stated goal is a smoother onboarding. This shows the current drop-off:
-- how far past registration the average worker gets.
SELECT count(*)                                                          AS workers,
       count(*) FILTER (WHERE "setupProgress" IS NOT NULL)               AS started_setup,
       count(*) FILTER (WHERE introduction IS NOT NULL)                  AS wrote_bio,
       count(*) FILTER (WHERE abn IS NOT NULL)                           AS did_abn_step,
       count(*) FILTER (WHERE EXISTS (SELECT 1 FROM worker_services ws
                                      WHERE ws."workerProfileId" = wp.id)) AS declared_services,
       count(*) FILTER (WHERE EXISTS (SELECT 1 FROM verification_requirements vr
                                      WHERE vr."workerProfileId" = wp.id)) AS uploaded_documents,
       count(*) FILTER (WHERE "profileCompleted")                        AS completed
FROM worker_profiles wp;

-- ============================================================================
-- END — no writes performed
-- ============================================================================
