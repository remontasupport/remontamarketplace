-- ============================================================================
-- Schema Restructure — Legacy Database Inventory (round 3)
-- ============================================================================
-- DATABASE_URL and AUTH_DATABASE_URL point at DIFFERENT Neon endpoints:
--   AUTH_DATABASE_URL -> ep-delicate-recipe-a7mbt4ef  (the live schema)
--   DATABASE_URL      -> ep-polished-thunder-a7ovazge (the legacy schema)
--
-- This corrects the prior assumption that both Prisma clients addressed one
-- database. It means ContractorProfile, ContractorsbyArea and the legacy Job
-- model may exist over there, and that the "duplicated" Document/Category/
-- Subcategory models are NOT two views of one table.
--
-- RUN AGAINST DATABASE_URL:
--   node scripts/run-schema-investigation.js \
--        --sql-file schema-investigation-3.sql --url-var DATABASE_URL
--
-- READ-ONLY. Every statement is a SELECT.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Every table in the legacy database, with row counts
-- ----------------------------------------------------------------------------
SELECT table_schema,
       table_name,
       (xpath('/row/c/text()',
              query_to_xml(format('SELECT count(*) AS c FROM %I.%I',
                                  table_schema, table_name),
                           false, true, '')))[1]::text::bigint AS row_count
FROM information_schema.tables
WHERE table_schema NOT IN ('pg_catalog','information_schema')
  AND table_type = 'BASE TABLE'
ORDER BY row_count DESC NULLS LAST, table_name;


-- ----------------------------------------------------------------------------
-- 2. Is the shared taxonomy duplicated across both databases?
-- ----------------------------------------------------------------------------
-- If these hold rows here AND in the auth database, the two are independent
-- copies that can drift — not one table seen through two clients.
SELECT 'Category'            AS t, count(*) FROM "Category"
UNION ALL SELECT 'Subcategory',         count(*) FROM "Subcategory"
UNION ALL SELECT 'Document',            count(*) FROM "Document"
UNION ALL SELECT 'CategoryDocument',    count(*) FROM "CategoryDocument"
UNION ALL SELECT 'SubcategoryDocument', count(*) FROM "SubcategoryDocument"
ORDER BY 1;


-- ----------------------------------------------------------------------------
-- 3. Q-D4 — the legacy Job model and the contractor directory
-- ----------------------------------------------------------------------------
SELECT 'Job'                AS t, count(*) FROM "Job"
UNION ALL SELECT 'ContractorProfile',  count(*) FROM "ContractorProfile"
UNION ALL SELECT 'ContractorsbyArea',  count(*) FROM "ContractorsbyArea"
ORDER BY 1;

-- 3b. If Job has rows, are the health/cultural fields actually populated?
--     This decides whether Q-D4 is "retire" or "keep and merge".
SELECT count(*)                                          AS rows,
       count(disabilities)                               AS has_disabilities,
       count("behaviouralConcerns")                      AS has_behavioural,
       count("culturalConsiderations")                   AS has_cultural,
       count(religion)                                   AS has_religion,
       count(*) FILTER (WHERE active)                    AS active,
       max("lastSyncedAt")::date                         AS last_synced
FROM "Job";

-- 3c. Contractor directory freshness — is anything still writing it?
SELECT count(*)                                   AS rows,
       count(*) FILTER (WHERE "deletedAt" IS NULL) AS live,
       max("lastSyncedAt")::date                  AS last_synced,
       max("updatedAt")::date                     AS last_updated
FROM "ContractorProfile";

-- ============================================================================
-- END — no writes performed
-- ============================================================================
