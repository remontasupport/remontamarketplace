-- Local test data ONLY: the service catalogue the sign-up's services step reads
-- (Category / Subcategory), taken from apps/app's SERVICE_OPTIONS constants so
-- the page shows the same list as production. Ids may differ from production's
-- rows; nothing else in the schema depends on them. Idempotent.
--
--   docker exec -i remonta-s1-pg psql -U postgres -d s1test < packages/db/scripts/local/seed-catalogue.sql
--
-- Refuses to run anywhere but a local database.
DO $$ BEGIN
  IF inet_server_addr() IS NOT NULL AND host(inet_server_addr()) NOT IN ('127.0.0.1', '::1') AND current_setting('cluster_name', true) NOT LIKE '%local%' THEN
    RAISE EXCEPTION 'seed-catalogue.sql is for the local test database only (server %)', inet_server_addr();
  END IF;
END $$;

INSERT INTO "Category" (id, name, "requiresQualification", "updatedAt") VALUES
  ('support-worker',         'Support Worker',              false, now()),
  ('therapeutic-supports',   'Therapeutic Supports',        true,  now()),
  ('home-modifications',     'Home Modifications',          false, now()),
  ('fitness-rehabilitation', 'Fitness and Rehabilitation',  false, now()),
  ('cleaning-services',      'Cleaning Services',           false, now()),
  ('nursing-services',       'Nursing Services',            true,  now()),
  ('home-yard-maintenance',  'Home and Yard Maintenance',   false, now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO "Subcategory" (id, "categoryId", name, "requiresRegistration", "updatedAt") VALUES
  ('daily-living',            'support-worker', 'Daily Living Assistance',          false, now()),
  ('household-tasks',         'support-worker', 'Household Tasks',                  false, now()),
  ('community-participation', 'support-worker', 'Community Participation',          false, now()),
  ('capacity-building',       'support-worker', 'Capacity Building & Independence', false, now()),
  ('health-wellbeing',        'support-worker', 'Health & Wellbeing',               false, now()),
  ('emotional-social',        'support-worker', 'Emotional & Social Support',       false, now()),
  ('high-intensity',          'support-worker', 'High Intensity Supports',          false, now()),
  ('children-youth',          'support-worker', 'Children & Youth',                 false, now())
ON CONFLICT (id) DO NOTHING;
