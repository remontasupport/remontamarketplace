\timing off
INSERT INTO users (id, email, "passwordHash", role, status, "updatedAt", "createdAt", "lastLoginAt")
SELECT 'u' || g, 'worker' || g || '@bench.example', '$2b$12$abcdefghijklmnopqrstuv', 'WORKER', 'ACTIVE',
       now() - (g % 1000) * interval '1 hour', now() - (g % 900) * interval '1 day',
       CASE WHEN g % 3 = 0 THEN NULL ELSE now() - (g % 500) * interval '1 hour' END
FROM generate_series(1, 100000) g;
INSERT INTO worker_profiles (id, "userId", "firstName", "lastName", mobile, location, city, state, "postalCode", "isPublished", "updatedAt", "createdAt")
SELECT 'p' || g, 'u' || g, 'First' || g, 'Last' || g, '+614' || lpad((g % 100000000)::text, 8, '0'), 'Parramatta, NSW 2150', 'Parramatta', 'NSW', '2150',
       g % 4 = 0, now() - (g % 1000) * interval '1 hour', now() - (g % 900) * interval '1 day'
FROM generate_series(1, 100000) g;
INSERT INTO verification_requirements (id, "workerProfileId", "requirementType", "requirementName", "isRequired", status, "updatedAt", "submittedAt", "reviewedAt", "expiresAt")
SELECT 'r' || g || '-' || t, 'p' || g, 'type-' || t, 'Type ' || t, true,
       (ARRAY['PENDING','SUBMITTED','APPROVED','REJECTED','APPROVED']::"RequirementStatus"[])[1 + (g + t) % 5],
       now() - ((g * t) % 2000) * interval '1 hour', now() - ((g * t) % 2000) * interval '1 hour', NULL,
       now() + ((g + t) % 700 - 100) * interval '1 day'
FROM generate_series(1, 100000) g, generate_series(1, 5) t;
INSERT INTO worker_onboarding ("workerProfileId", stage, "stageEnteredAt", "signedUpAt", "lastActivityAt", "updatedAt")
SELECT 'p' || g, (ARRAY['SIGNED_UP','DOCUMENTS_IN_PROGRESS','DOCUMENTS_SUBMITTED','ACTION_REQUIRED','VERIFIED','PUBLISHED']::"OnboardingStage"[])[1 + g % 6],
       now() - (g % 60) * interval '1 day', now() - (g % 900) * interval '1 day', now() - (g % 30) * interval '1 day', now()
FROM generate_series(1, 100000) g;
ANALYZE;
SELECT (SELECT count(*) FROM users) users, (SELECT count(*) FROM worker_profiles) profiles, (SELECT count(*) FROM verification_requirements) requirements, (SELECT count(*) FROM worker_onboarding) markers;
