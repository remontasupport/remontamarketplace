SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname IN ('public', 'pgboss')
ORDER BY schemaname, tablename;
