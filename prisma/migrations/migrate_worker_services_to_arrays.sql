-- Migration: Convert worker_services from individual subcategory records to array format
-- Run this BEFORE doing: npx prisma db push --schema=./prisma/auth-schema.prisma --accept-data-loss

-- Step 1: Verify current data
SELECT
    COUNT(*) as total_records,
    COUNT(DISTINCT CONCAT("workerProfileId", ':', "categoryId")) as unique_services,
    COUNT(*) FILTER (WHERE "subcategoryId" IS NOT NULL) as records_with_subcategories,
    COUNT(*) FILTER (WHERE "subcategoryId" IS NULL) as records_without_subcategories
FROM worker_services;

-- Step 2: Create temporary table with new structure
CREATE TEMP TABLE worker_services_new (
    id TEXT PRIMARY KEY,
    "workerProfileId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "subcategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subcategoryNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Step 3: Group existing records and aggregate subcategories into arrays
INSERT INTO worker_services_new (
    id,
    "workerProfileId",
    "categoryId",
    "categoryName",
    "subcategoryIds",
    "subcategoryNames",
    metadata,
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid() as id,
    "workerProfileId",
    "categoryId",
    MAX("categoryName") as "categoryName",
    ARRAY_AGG("subcategoryId" ORDER BY "createdAt") FILTER (WHERE "subcategoryId" IS NOT NULL) as "subcategoryIds",
    ARRAY_AGG("subcategoryName" ORDER BY "createdAt") FILTER (WHERE "subcategoryName" IS NOT NULL) as "subcategoryNames",
    -- Take the most recent metadata (in case multiple records have different metadata)
    (ARRAY_AGG(metadata ORDER BY "updatedAt" DESC) FILTER (WHERE metadata IS NOT NULL))[1] as metadata,
    MIN("createdAt") as "createdAt",
    MAX("updatedAt") as "updatedAt"
FROM worker_services
GROUP BY "workerProfileId", "categoryId";

-- Step 4: Verify the grouped data
SELECT
    COUNT(*) as new_record_count,
    COUNT(*) FILTER (WHERE array_length("subcategoryIds", 1) > 0) as records_with_subcategories,
    COUNT(*) FILTER (WHERE array_length("subcategoryIds", 1) IS NULL OR array_length("subcategoryIds", 1) = 0) as records_without_subcategories,
    SUM(array_length("subcategoryIds", 1)) FILTER (WHERE array_length("subcategoryIds", 1) > 0) as total_subcategories
FROM worker_services_new;

-- Step 5: Delete all existing records from worker_services
DELETE FROM worker_services;

-- Step 6: Insert the new grouped records
INSERT INTO worker_services (
    id,
    "workerProfileId",
    "categoryId",
    "categoryName",
    "subcategoryIds",
    "subcategoryNames",
    metadata,
    "createdAt",
    "updatedAt"
)
SELECT
    id,
    "workerProfileId",
    "categoryId",
    "categoryName",
    COALESCE("subcategoryIds", ARRAY[]::TEXT[]),
    COALESCE("subcategoryNames", ARRAY[]::TEXT[]),
    metadata,
    "createdAt",
    "updatedAt"
FROM worker_services_new;

-- Step 7: Verify final result
SELECT
    COUNT(*) as final_record_count,
    COUNT(*) FILTER (WHERE array_length("subcategoryIds", 1) > 0) as with_subcategories,
    COUNT(*) FILTER (WHERE array_length("subcategoryIds", 1) IS NULL OR array_length("subcategoryIds", 1) = 0) as without_subcategories
FROM worker_services;

-- Migration complete!
-- Now you can safely run: npx prisma db push --schema=./prisma/auth-schema.prisma --accept-data-loss
