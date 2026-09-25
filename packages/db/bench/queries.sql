\pset format unaligned
\pset tuples_only on
CREATE OR REPLACE FUNCTION bench(label text, q text) RETURNS text AS $$
DECLARE best float := 1e9; t float; plan json; i int; node text;
BEGIN
  FOR i IN 1..5 LOOP
    EXECUTE 'EXPLAIN (ANALYZE, FORMAT JSON) ' || q INTO plan;
    t := (plan->0->>'Execution Time')::float;
    IF t < best THEN best := t; END IF;
  END LOOP;
  node := plan->0->'Plan'->>'Node Type';
  RETURN rpad(label, 58) || lpad(to_char(best, 'FM9990.000'), 10) || ' ms   ' || node;
END $$ LANGUAGE plpgsql;
SELECT bench('sign-in today (email ILIKE, apps/app)', $q$SELECT id, "passwordHash" FROM users WHERE email ILIKE 'worker73519@bench.example'$q$);
SELECT bench('sign-in by exact lower-case email (unique index)', $q$SELECT id, "passwordHash" FROM users WHERE email = 'worker73519@bench.example'$q$);
SELECT bench('dashboard: profile by userId', $q$SELECT * FROM worker_profiles WHERE "userId" = 'u73519'$q$);
SELECT bench('dashboard: documents of one worker', $q$SELECT * FROM verification_requirements WHERE "workerProfileId" = 'p73519'$q$);
SELECT bench('admin backlog: 50 oldest DOCUMENTS_SUBMITTED', $q$SELECT "workerProfileId" FROM worker_onboarding WHERE stage = 'DOCUMENTS_SUBMITTED' ORDER BY "stageEnteredAt" LIMIT 50$q$);
SELECT bench('admin: count stuck in SIGNED_UP > 7 days', $q$SELECT count(*) FROM worker_onboarding WHERE stage = 'SIGNED_UP' AND "stageEnteredAt" < now() - interval '7 days'$q$);
SELECT bench('admin: workers per stage', $q$SELECT stage, count(*) FROM worker_onboarding GROUP BY stage$q$);
SELECT bench('reconciler: changes in the last 5 minutes', $q$
WITH changes AS (
  SELECT id AS pid, "updatedAt" AS t FROM worker_profiles WHERE "updatedAt" > now() - interval '5 minutes'
  UNION ALL SELECT "workerProfileId", GREATEST("updatedAt", COALESCE("submittedAt","updatedAt"), COALESCE("reviewedAt","updatedAt")) FROM verification_requirements WHERE "updatedAt" > now() - interval '5 minutes' OR "submittedAt" > now() - interval '5 minutes' OR "reviewedAt" > now() - interval '5 minutes'
  UNION ALL SELECT "workerProfileId", "expiresAt" FROM verification_requirements WHERE "expiresAt" > now() - interval '5 minutes' AND "expiresAt" <= now()
  UNION ALL SELECT p.id, u."lastLoginAt" FROM users u JOIN worker_profiles p ON p."userId" = u.id WHERE u."lastLoginAt" > now() - interval '5 minutes')
SELECT pid, MAX(t) FROM changes GROUP BY pid ORDER BY MAX(t) LIMIT 500$q$);
SELECT bench('reconciler: workers without a marker', $q$SELECT p.id FROM worker_profiles p LEFT JOIN worker_onboarding o ON o."workerProfileId" = p.id WHERE o."workerProfileId" IS NULL ORDER BY p."createdAt" LIMIT 500$q$);
