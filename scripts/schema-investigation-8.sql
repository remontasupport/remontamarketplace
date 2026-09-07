-- ============================================================================
-- Design Critique — Verification (round 8)
-- ============================================================================
-- Tests the two claims in the user's review that need data rather than code:
--   P1  can VerificationRequirement.requirementName be backfilled to Document.id?
--   #10 are Document.category and the DocumentCategory enum the same concept?
-- Plus the availability and NDIS claims.
--
-- READ-ONLY.
-- ============================================================================

-- 1. #10 — Document.category values vs the DocumentCategory enum
SELECT category, count(*) AS documents
FROM "Document" GROUP BY 1 ORDER BY 2 DESC;

-- 1b. What DocumentCategory actually holds on submissions
SELECT "documentCategory", count(*) AS rows
FROM verification_requirements GROUP BY 1 ORDER BY 2 DESC;

-- 2. P1 — is a documentId backfill from requirementName feasible?
SELECT count(*)                                                         AS requirements,
       count(DISTINCT "requirementName")                                AS distinct_names,
       count(*) FILTER (WHERE "requirementName" IN (SELECT name FROM "Document"))
                                                                        AS EXACT_NAME_MATCH,
       count(*) FILTER (WHERE "requirementName" NOT IN (SELECT name FROM "Document"))
                                                                        AS NO_MATCH
FROM verification_requirements;

-- 2b. The names that do NOT resolve — how many distinct, and how common
SELECT "requirementName", count(*) AS rows
FROM verification_requirements
WHERE "requirementName" NOT IN (SELECT name FROM "Document")
GROUP BY 1 ORDER BY 2 DESC LIMIT 25;

-- 2c. requirementType — the other half of the composite key
SELECT "requirementType", count(*) AS rows, count(DISTINCT "requirementName") AS distinct_names
FROM verification_requirements GROUP BY 1 ORDER BY 2 DESC;

-- 3. P2 — do the eligibility signals actually disagree?
SELECT count(*)                                                             AS workers,
       count(*) FILTER (WHERE "isPublished")                                AS published,
       count(*) FILTER (WHERE "isPublished"
                          AND EXISTS (SELECT 1 FROM verification_requirements vr
                                      WHERE vr."workerProfileId" = wp.id
                                        AND vr.status <> 'APPROVED'))       AS PUBLISHED_WITH_UNAPPROVED_DOCS,
       count(*) FILTER (WHERE "isPublished"
                          AND EXISTS (SELECT 1 FROM verification_requirements vr
                                      WHERE vr."workerProfileId" = wp.id
                                        AND vr."expiresAt" < now()))        AS PUBLISHED_WITH_EXPIRED_DOCS
FROM worker_profiles wp;

-- 4. Overnight shifts and duplicate slots (the HH:MM string claim)
WITH slots AS (
  SELECT wai."workerProfileId",
         d.key                              AS day,
         jsonb_typeof(d.value)              AS shape,
         CASE WHEN jsonb_typeof(d.value)='object'
              THEN d.value ->> 'startTime' END AS start_t,
         CASE WHEN jsonb_typeof(d.value)='object'
              THEN d.value ->> 'endTime'   END AS end_t
  FROM worker_additional_info wai,
       jsonb_each(wai.availability::jsonb) d
  WHERE jsonb_typeof(wai.availability::jsonb) = 'object'
)
SELECT count(*)                                              AS object_slots,
       count(*) FILTER (WHERE start_t IS NOT NULL
                          AND end_t IS NOT NULL
                          AND start_t > end_t)               AS OVERNIGHT_SPANS,
       count(*) FILTER (WHERE start_t !~ '^\d{2}:\d{2}$')    AS non_hhmm_start
FROM slots;

-- 5. NDIS plan renewal — is fundingType actually NDIS for most participants?
SELECT "fundingType", count(*) AS participants
FROM participants GROUP BY 1 ORDER BY 2 DESC;

-- ============================================================================
-- END — no writes performed
-- ============================================================================
