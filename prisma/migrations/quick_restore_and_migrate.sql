-- Quick Restore and Migrate Script
-- This restores from backup and immediately migrates to array format

-- Step 1: Check if backup exists
SELECT
    EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'worker_services_backup_20260108'
    ) as backup_exists;

-- If backup_exists = false, STOP! Contact support.

-- Step 2: Verify backup data
SELECT
    COUNT(*) as backup_records,
    COUNT(DISTINCT "workerProfileId") as backup_workers,
    COUNT(*) FILTER (WHERE "subcategoryId" IS NOT NULL) as backup_with_subcategories
FROM worker_services_backup_20260108;

-- Step 3: Drop the old table completely (if it exists)
DROP TABLE IF EXISTS worker_services CASCADE;

-- Step 4: Create the new table with array structure
CREATE TABLE worker_services (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    "workerProfileId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "subcategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subcategoryNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT NOW(),
    CONSTRAINT worker_services_unique UNIQUE ("workerProfileId", "categoryId")
);

-- Step 5: Add foreign key constraint
ALTER TABLE worker_services
ADD CONSTRAINT worker_services_workerProfileId_fkey
FOREIGN KEY ("workerProfileId")
REFERENCES worker_profiles(id)
ON DELETE CASCADE;

-- Step 6: Create indexes
DROP INDEX IF EXISTS worker_services_workerProfileId_idx;
DROP INDEX IF EXISTS worker_services_categoryId_idx;
DROP INDEX IF EXISTS worker_services_categoryName_idx;
DROP INDEX IF EXISTS worker_services_workerProfileId_categoryName_idx;

CREATE INDEX worker_services_workerProfileId_idx ON worker_services("workerProfileId");
CREATE INDEX worker_services_categoryId_idx ON worker_services("categoryId");
CREATE INDEX worker_services_categoryName_idx ON worker_services("categoryName");
CREATE INDEX worker_services_workerProfileId_categoryName_idx ON worker_services("workerProfileId", "categoryName");

-- Step 7: Migrate data from backup with aggregation
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
    (ARRAY_AGG(metadata ORDER BY "updatedAt" DESC) FILTER (WHERE metadata IS NOT NULL))[1] as metadata,
    MIN("createdAt") as "createdAt",
    MAX("updatedAt") as "updatedAt"
FROM worker_services_backup_20260108
GROUP BY "workerProfileId", "categoryId";

-- Step 8: Verify migration
SELECT
    COUNT(*) as new_record_count,
    COUNT(*) FILTER (WHERE array_length("subcategoryIds", 1) > 0) as records_with_subcategories,
    COUNT(*) FILTER (WHERE array_length("subcategoryIds", 1) IS NULL OR array_length("subcategoryIds", 1) = 0) as records_without_subcategories,
    SUM(COALESCE(array_length("subcategoryIds", 1), 0)) as total_subcategories
FROM worker_services;

-- Step 9: Compare counts
SELECT
    (SELECT COUNT(*) FROM worker_services_backup_20260108) as original_count,
    (SELECT COUNT(*) FROM worker_services) as new_count,
    (SELECT COUNT(DISTINCT CONCAT("workerProfileId", ':', "categoryId")) FROM worker_services_backup_20260108) as expected_new_count,
    CASE
        WHEN (SELECT COUNT(*) FROM worker_services) =
             (SELECT COUNT(DISTINCT CONCAT("workerProfileId", ':', "categoryId")) FROM worker_services_backup_20260108)
        THEN '✓ Migration successful - grouped records match expected count'
        ELSE '✗ WARNING - counts do not match expected!'
    END as status;

-- Step 10: Show sample of migrated data
SELECT
    "workerProfileId",
    "categoryId",
    "categoryName",
    "subcategoryIds",
    "subcategoryNames",
    array_length("subcategoryIds", 1) as subcategory_count
FROM worker_services
ORDER BY "createdAt" DESC
LIMIT 10;

-- Migration complete!
-- You can now run: npx prisma generate --schema=./prisma/auth-schema.prisma
-- After confirming everything works, drop the backup:
-- DROP TABLE worker_services_backup_20260108;
