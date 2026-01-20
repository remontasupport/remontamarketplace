-- Backup Script: Create a complete backup of worker_services table
-- Run this BEFORE running the migration script

-- Step 1: Show current data statistics
SELECT
    COUNT(*) as total_records,
    COUNT(DISTINCT "workerProfileId") as unique_workers,
    COUNT(DISTINCT "categoryId") as unique_categories,
    COUNT(*) FILTER (WHERE "subcategoryId" IS NOT NULL) as records_with_subcategories,
    COUNT(*) FILTER (WHERE "subcategoryId" IS NULL) as records_without_subcategories,
    MIN("createdAt") as earliest_record,
    MAX("createdAt") as latest_record
FROM worker_services;

-- Step 2: Create backup table with timestamp
CREATE TABLE worker_services_backup_20260108 AS
SELECT * FROM worker_services;

-- Step 3: Verify backup was created successfully
SELECT
    COUNT(*) as backup_record_count,
    COUNT(DISTINCT "workerProfileId") as backup_unique_workers,
    COUNT(DISTINCT "categoryId") as backup_unique_categories,
    COUNT(*) FILTER (WHERE "subcategoryId" IS NOT NULL) as backup_with_subcategories
FROM worker_services_backup_20260108;

-- Step 4: Compare original and backup
SELECT
    (SELECT COUNT(*) FROM worker_services) as original_count,
    (SELECT COUNT(*) FROM worker_services_backup_20260108) as backup_count,
    CASE
        WHEN (SELECT COUNT(*) FROM worker_services) = (SELECT COUNT(*) FROM worker_services_backup_20260108)
        THEN '✓ Backup successful - counts match'
        ELSE '✗ WARNING - counts do not match!'
    END as status;

-- Step 5: Show sample of backed up data
SELECT
    "workerProfileId",
    "categoryId",
    "categoryName",
    "subcategoryId",
    "subcategoryName",
    "createdAt"
FROM worker_services_backup_20260108
ORDER BY "createdAt" DESC
LIMIT 10;

-- Backup complete!
-- The backup table is: worker_services_backup_20260108
-- You can now safely run: migrate_worker_services_to_arrays.sql

-- ==========================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ==========================================
-- If something goes wrong and you need to restore from backup:
--
-- 1. Delete the current data:
--    DELETE FROM worker_services;
--
-- 2. Restore from backup:
--    INSERT INTO worker_services
--    SELECT * FROM worker_services_backup_20260108;
--
-- 3. Verify restoration:
--    SELECT COUNT(*) FROM worker_services;
--
-- 4. Drop the backup table (only after confirming everything works):
--    DROP TABLE worker_services_backup_20260108;
