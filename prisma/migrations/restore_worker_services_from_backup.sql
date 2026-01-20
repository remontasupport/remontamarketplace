-- Restore Script: Rollback worker_services from backup
-- Run this ONLY if the migration failed and you need to restore the original data

-- Step 1: Check if backup table exists
SELECT
    EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'worker_services_backup_20260108'
    ) as backup_exists;

-- If backup_exists = false, STOP! The backup table doesn't exist.

-- Step 2: Show current state before restoration
SELECT
    COUNT(*) as current_records,
    COUNT(DISTINCT "workerProfileId") as current_workers
FROM worker_services;

-- Step 3: Show backup state
SELECT
    COUNT(*) as backup_records,
    COUNT(DISTINCT "workerProfileId") as backup_workers
FROM worker_services_backup_20260108;

-- Step 4: Delete current data
DELETE FROM worker_services;

-- Step 5: Restore from backup
INSERT INTO worker_services (
    id,
    "workerProfileId",
    "categoryId",
    "categoryName",
    "subcategoryId",
    "subcategoryName",
    metadata,
    "createdAt",
    "updatedAt"
)
SELECT
    id,
    "workerProfileId",
    "categoryId",
    "categoryName",
    "subcategoryId",
    "subcategoryName",
    metadata,
    "createdAt",
    "updatedAt"
FROM worker_services_backup_20260108;

-- Step 6: Verify restoration
SELECT
    COUNT(*) as restored_records,
    COUNT(DISTINCT "workerProfileId") as restored_workers,
    COUNT(*) FILTER (WHERE "subcategoryId" IS NOT NULL) as restored_with_subcategories,
    CASE
        WHEN COUNT(*) = (SELECT COUNT(*) FROM worker_services_backup_20260108)
        THEN '✓ Restoration successful - counts match'
        ELSE '✗ WARNING - counts do not match!'
    END as status
FROM worker_services;

-- Step 7: Compare sample data
SELECT 'RESTORED DATA:' as source, "workerProfileId", "categoryId", "subcategoryName"
FROM worker_services
LIMIT 5
UNION ALL
SELECT 'BACKUP DATA:' as source, "workerProfileId", "categoryId", "subcategoryName"
FROM worker_services_backup_20260108
LIMIT 5;

-- Restoration complete!
-- After verifying everything works correctly, you can drop the backup:
-- DROP TABLE worker_services_backup_20260108;
