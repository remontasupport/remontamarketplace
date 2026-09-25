-- Reverses s1_idx_users_lower_email. Sign-in keeps working, only slower.
DROP INDEX CONCURRENTLY IF EXISTS "users_lower_email_idx";
