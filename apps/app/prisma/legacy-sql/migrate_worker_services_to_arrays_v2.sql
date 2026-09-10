-- Migration V2: Convert worker_services from individual subcategory records to array format
-- This version works with the existing schema

-- Step 1: Verify current data
SELECT
    COUNT(*) as total_records,
    COUNT(DISTINCT CONCAT("workerProfileId", ':', "categoryId")) as unique_services,
    COUNT(*) FILTER (WHERE "subcategoryId" IS NOT NULL) as records_with_subcategories,
    COUNT(*) FILTER (WHERE "subcategoryId" IS NULL) as records_without_subcategories
FROM worker_services;

-- Step 2: Create new table with array structure
CREATE TABLE worker_services_migrated (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workerProfileId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "subcategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subcategoryNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT worker_services_migrated_pkey PRIMARY KEY (id),
    CONSTRAINT worker_services_migrated_unique UNIQUE ("workerProfileId", "categoryId")
);

-- Step 3: Add foreign key constraint
ALTER TABLE worker_services_migrated
ADD CONSTRAINT worker_services_migrated_workerProfileId_fkey
FOREIGN KEY ("workerProfileId")
REFERENCES worker_profiles(id)
ON DELETE CASCADE;

-- Step 4: Create indexes
CREATE INDEX worker_services_migrated_workerProfileId_idx ON worker_services_migrated("workerProfileId");
CREATE INDEX worker_services_migrated_categoryId_idx ON worker_services_migrated("categoryId");
CREATE INDEX worker_services_migrated_categoryName_idx ON worker_services_migrated("categoryName");
CREATE INDEX worker_services_migrated_workerProfileId_categoryName_idx ON worker_services_migrated("workerProfileId", "categoryName");

-- Step 5: Migrate data - Group existing records and aggregate subcategories into arrays
INSERT INTO worker_services_migrated (
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
    gen_random_uuid()::TEXT as id,
    "workerProfileId",
    "categoryId",
    MAX("categoryName") as "categoryName",
    COALESCE(
        ARRAY_AGG("subcategoryId" ORDER BY "createdAt") FILTER (WHERE "subcategoryId" IS NOT NULL),
        ARRAY[]::TEXT[]
    ) as "subcategoryIds",
    COALESCE(
        ARRAY_AGG("subcategoryName" ORDER BY "createdAt") FILTER (WHERE "subcategoryName" IS NOT NULL),
        ARRAY[]::TEXT[]
    ) as "subcategoryNames",
    -- Take the most recent metadata (in case multiple records have different metadata)
    (ARRAY_AGG(metadata ORDER BY "updatedAt" DESC) FILTER (WHERE metadata IS NOT NULL))[1] as metadata,
    MIN("createdAt") as "createdAt",
    MAX("updatedAt") as "updatedAt"
FROM worker_services
GROUP BY "workerProfileId", "categoryId";

-- Step 6: Verify the migrated data
SELECT
    COUNT(*) as migrated_record_count,
    COUNT(*) FILTER (WHERE array_length("subcategoryIds", 1) > 0) as records_with_subcategories,
    COUNT(*) FILTER (WHERE array_length("subcategoryIds", 1) IS NULL OR array_length("subcategoryIds", 1) = 0) as records_without_subcategories,
    SUM(COALESCE(array_length("subcategoryIds", 1), 0)) as total_subcategories
FROM worker_services_migrated;

-- Step 7: Show sample comparison
SELECT 'OLD STRUCTURE (worker_services):' as info;
SELECT "workerProfileId", "categoryId", "categoryName", "subcategoryId", "subcategoryName"
FROM worker_services
ORDER BY "workerProfileId", "categoryId", "createdAt"
LIMIT 10;

SELECT 'NEW STRUCTURE (worker_services_migrated):' as info;
SELECT "workerProfileId", "categoryId", "categoryName", "subcategoryIds", "subcategoryNames"
FROM worker_services_migrated
ORDER BY "workerProfileId", "categoryId"
LIMIT 10;

-- Step 8: Drop old table and rename new one
DROP TABLE worker_services;
ALTER TABLE worker_services_migrated RENAME TO worker_services;

-- Step 9: Verify final result
SELECT
    COUNT(*) as final_record_count,
    COUNT(*) FILTER (WHERE array_length("subcategoryIds", 1) > 0) as with_subcategories,
    COUNT(*) FILTER (WHERE array_length("subcategoryIds", 1) IS NULL OR array_length("subcategoryIds", 1) = 0) as without_subcategories
FROM worker_services;

-- Migration complete!
-- Now you can safely run: npx prisma db push --schema=./prisma/auth-schema.prisma --accept-data-loss
-- (This will just sync any remaining schema differences like constraint names)
