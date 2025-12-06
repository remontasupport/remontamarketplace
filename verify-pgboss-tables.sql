-- Check if pgboss schema and tables exist
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'pgboss'
ORDER BY tablename;
