-- ============================================
-- DATABASE INDEX VERIFICATION AND CREATION
-- Run this script to ensure all critical indexes exist
-- ============================================

-- This script is SAFE to run multiple times (IF NOT EXISTS)

-- 1. CRITICAL: Index on users.email (for login performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_lower
ON users (LOWER(email));

-- 2. Index on users.email (standard index)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email
ON users (email);

-- 3. Index on worker_profiles.userId (for dashboard performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_worker_profiles_userid
ON worker_profiles ("userId");

-- 4. Compound index for login flow optimization
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email_status_locked
ON users (email, status, "accountLockedUntil");

-- 5. Index on verification_requirements for completion checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_verification_requirements_worker_profile
ON verification_requirements ("workerProfileId");

-- 6. Index on worker_services for completion checks
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_worker_services_worker_profile
ON worker_services ("workerProfileId");

-- ============================================
-- ANALYZE TABLES for query planner optimization
-- ============================================
ANALYZE users;
ANALYZE worker_profiles;
ANALYZE verification_requirements;
ANALYZE worker_services;

-- ============================================
-- VERIFY INDEXES CREATED
-- ============================================
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    schemaname = 'public'
    AND tablename IN ('users', 'worker_profiles', 'verification_requirements', 'worker_services')
ORDER BY
    tablename,
    indexname;
