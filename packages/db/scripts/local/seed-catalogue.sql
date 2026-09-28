-- Local test data ONLY: the service catalogue the sign-up's services step reads
-- (Category / Subcategory). Generated from categories.json, the catalogue the
-- database was loaded from (in git history at 428d725: the file was later removed
-- from the tree). Same ids and names as production; documents are not seeded.
-- Idempotent: re-running changes nothing. Refuses a non-local server.
--
--   docker exec -i remonta-s1-pg psql -U postgres -d s1test < packages/db/scripts/local/seed-catalogue.sql
DO $$ BEGIN
  IF inet_server_addr() IS NOT NULL AND host(inet_server_addr()) NOT IN ('127.0.0.1', '::1') AND current_setting('cluster_name', true) NOT LIKE '%local%' THEN
    RAISE EXCEPTION 'seed-catalogue.sql is for the local test database only (server %)', inet_server_addr();
  END IF;
END $$;

INSERT INTO "Category" (id, name, "requiresQualification", "updatedAt") VALUES
  ('support-worker', 'Support Worker', false, now()),
  ('support-worker-high-intensity', 'Support Worker (High Intensity)', true, now()),
  ('therapeutic-supports', 'Therapeutic Supports', true, now()),
  ('cleaning-services', 'Cleaning Services', false, now()),
  ('home-yard-maintenance', 'Home and Yard Maintenance', false, now()),
  ('nursing-services', 'Nursing Services', true, now()),
  ('personal-trainer', 'Personal Trainer', true, now())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, "requiresQualification" = EXCLUDED."requiresQualification", "updatedAt" = now();

INSERT INTO "Subcategory" (id, "categoryId", name, "requiresRegistration", "updatedAt") VALUES
  ('personal-care', 'support-worker', 'Personal care (showering, toileting, grooming, dressing)', false, now()),
  ('meal-preparation-feeding', 'support-worker', 'Meal preparation and feeding assistance', false, now()),
  ('domestic-tasks', 'support-worker', 'Domestic tasks (cleaning, laundry, home organisation)', false, now()),
  ('community-access-transport', 'support-worker', 'Community access and transport', false, now()),
  ('administering-medications', 'support-worker-high-intensity', 'Administering medications', false, now()),
  ('complex-bowel-care', 'support-worker-high-intensity', 'Complex bowel care', false, now()),
  ('high-risk-behaviours', 'support-worker-high-intensity', 'Working with participants with high-risk behaviours', false, now()),
  ('hoists-transfer-equipment', 'support-worker-high-intensity', 'Operating hoists and complex transfer equipment', false, now()),
  ('seizure-management', 'support-worker-high-intensity', 'Seizure management', false, now()),
  ('art-therapist', 'therapeutic-supports', 'Art Therapist', false, now()),
  ('audiologist', 'therapeutic-supports', 'Audiologist', false, now()),
  ('counsellor', 'therapeutic-supports', 'Counsellor', false, now()),
  ('dietitian', 'therapeutic-supports', 'Dietitian', false, now()),
  ('exercise-physiologist', 'therapeutic-supports', 'Exercise Physiologist', false, now()),
  ('music-therapist', 'therapeutic-supports', 'Music Therapist', false, now()),
  ('occupational-therapist', 'therapeutic-supports', 'Occupational Therapist', true, now()),
  ('orthoptist', 'therapeutic-supports', 'Orthoptist', false, now()),
  ('physiotherapist', 'therapeutic-supports', 'Physiotherapist', true, now()),
  ('podiatrist', 'therapeutic-supports', 'Podiatrist', true, now()),
  ('psychologist', 'therapeutic-supports', 'Psychologist', true, now()),
  ('social-worker-therapeutic', 'therapeutic-supports', 'Social Worker (only when delivering therapeutic interventions)', false, now()),
  ('speech-pathologist', 'therapeutic-supports', 'Speech Pathologist', false, now())
ON CONFLICT (id) DO UPDATE SET "categoryId" = EXCLUDED."categoryId", name = EXCLUDED.name, "requiresRegistration" = EXCLUDED."requiresRegistration", "updatedAt" = now();
