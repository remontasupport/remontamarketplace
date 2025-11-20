-- ================================================================
-- Migration Script: Production Branch → Authentication Branch
-- From: ContractorProfile (production branch)
-- To: worker_profiles (authentication branch)
-- ================================================================
-- IMPORTANT: Review this script carefully before running
-- BACKUP YOUR DATA before executing
-- ================================================================

-- ================================================================
-- STEP-BY-STEP EXECUTION GUIDE
-- ================================================================
-- Since Neon branches are isolated and cannot directly query each other,
-- you need to follow these steps:
--
-- STEP 1: Export data from PRODUCTION branch
--   1. Switch to "production" branch in Neon
--   2. Go to SQL Editor
--   3. Run the export query below (Section A)
--   4. Download results as CSV
--
-- STEP 2: Create temporary table in AUTHENTICATION branch
--   1. Switch to "authentication" branch in Neon
--   2. Go to SQL Editor
--   3. Run the temporary table creation script (Section B)
--
-- STEP 3: Import CSV into temporary table
--   1. In authentication branch, use Neon's import feature
--   2. Or manually insert the exported data
--
-- STEP 4: Run migration script
--   1. Run the migration INSERT script (Section C)
--   2. Verify results (Section D)
--   3. Drop temporary table (Section E)
-- ================================================================


-- ================================================================
-- SECTION A: EXPORT DATA FROM PRODUCTION BRANCH
-- ================================================================
-- Run this query in PRODUCTION branch SQL Editor
-- Then download the results as CSV
-- ================================================================

SELECT
  id,
  "firstName",
  "lastName",
  phone,
  gender,
  "yearsOfExperience",
  "aboutYou",
  "qualificationsAndCertifications",
  "funFact",
  "hobbiesAndInterests",
  "whatMakesBusinessUnique",
  "additionalInformation",
  city,
  "postalZipCode",
  state,
  latitude,
  longitude,
  "languageSpoken",
  "titleRole",
  "profilePicture",
  "hasVehicleAccess"
FROM "ContractorProfile"
WHERE id IS NOT NULL
ORDER BY id;


-- ================================================================
-- SECTION B: CREATE TEMPORARY TABLE IN AUTHENTICATION BRANCH
-- ================================================================
-- Run this in AUTHENTICATION branch SQL Editor
-- This creates a temporary staging table for the imported data
-- ================================================================

-- Drop the table if it already exists from a previous run
DROP TABLE IF EXISTS temp_contractor_import;

CREATE TABLE temp_contractor_import (
  id TEXT,
  firstName TEXT,
  lastName TEXT,
  phone TEXT,
  gender TEXT,
  yearsOfExperience TEXT,
  aboutYou TEXT,
  qualificationsAndCertifications TEXT,
  funFact TEXT,
  hobbiesAndInterests TEXT,
  whatMakesBusinessUnique TEXT,
  additionalInformation TEXT,
  city TEXT,
  postalZipCode TEXT,
  state TEXT,
  latitude TEXT,
  longitude TEXT,
  languageSpoken TEXT,
  titleRole TEXT,
  profilePicture TEXT,
  hasVehicleAccess TEXT
);

-- After creating this table, import your CSV data into it
-- Use Neon's import feature or COPY command


-- ================================================================
-- SECTION C: MIGRATION INSERT SCRIPT
-- ================================================================
-- Run this in AUTHENTICATION branch after importing data
-- This transforms and inserts data into worker_profiles
-- ================================================================

INSERT INTO public.worker_profiles (
  id,
  "firstName",
  "lastName",
  mobile,
  gender,
  experience,
  introduction,
  qualifications,
  "funFact",
  hobbies,
  "uniqueService",
  "additionalInfo",
  city,
  "postalCode",
  state,
  latitude,
  longitude,
  languages,        -- text → text[] (array of strings)
  services,         -- text → text[] (array of strings)
  photos,           -- text → jsonb (array format)
  "hasVehicle",     -- boolean → "Yes"/"No" (text)
  location          -- combination of city, state, postalCode
)
SELECT
  -- Direct mappings (same or compatible data types)
  tmp.id,
  tmp.firstName,
  tmp.lastName,
  tmp.phone AS mobile,
  tmp.gender,
  CAST(tmp.yearsOfExperience AS INTEGER) AS experience,
  tmp.aboutYou AS introduction,
  tmp.qualificationsAndCertifications AS qualifications,
  tmp.funFact,
  tmp.hobbiesAndInterests AS hobbies,
  tmp.whatMakesBusinessUnique AS uniqueService,
  tmp.additionalInformation AS additionalInfo,
  tmp.city,
  tmp.postalZipCode AS postalCode,
  tmp.state,
  CAST(tmp.latitude AS NUMERIC) AS latitude,
  CAST(tmp.longitude AS NUMERIC) AS longitude,

  -- ============================================================
  -- DATA TYPE TRANSFORMATIONS
  -- ============================================================

  -- 1. languageSpoken (text) → languages (text[])
  --    Convert single text value to array of strings
  CASE
    WHEN tmp.languageSpoken IS NOT NULL AND TRIM(tmp.languageSpoken) != ''
    THEN ARRAY[TRIM(tmp.languageSpoken)]::text[]
    ELSE ARRAY[]::text[]
  END AS languages,

  -- 2. titleRole (text) → services (text[])
  --    Convert single text value to array of strings
  CASE
    WHEN tmp.titleRole IS NOT NULL AND TRIM(tmp.titleRole) != ''
    THEN ARRAY[TRIM(tmp.titleRole)]::text[]
    ELSE ARRAY[]::text[]
  END AS services,

  -- 3. profilePicture (text) → photos (jsonb)
  --    Convert URL string to jsonb array format
  --    Format: [{"url": "...", "isPrimary": true}]
  CASE
    WHEN tmp.profilePicture IS NOT NULL AND TRIM(tmp.profilePicture) != ''
    THEN jsonb_build_array(
      jsonb_build_object(
        'url', TRIM(tmp.profilePicture),
        'isPrimary', true
      )
    )
    ELSE '[]'::jsonb
  END AS photos,

  -- 4. hasVehicleAccess (boolean/text) → hasVehicle (text: "Yes"/"No")
  --    Convert boolean or boolean-like text to "Yes"/"No"
  CASE
    WHEN LOWER(tmp.hasVehicleAccess) IN ('true', 't', 'yes', '1') THEN 'Yes'
    WHEN LOWER(tmp.hasVehicleAccess) IN ('false', 'f', 'no', '0') THEN 'No'
    ELSE 'No'
  END AS hasVehicle,

  -- 5. Combination: city + state + postalZipCode → location
  --    Combine address fields into single location string
  CONCAT_WS(', ',
    NULLIF(TRIM(tmp.city), ''),
    NULLIF(TRIM(tmp.state), ''),
    NULLIF(TRIM(tmp.postalZipCode), '')
  ) AS location

FROM temp_contractor_import AS tmp
WHERE tmp.id IS NOT NULL;


-- ================================================================
-- SECTION D: VERIFY MIGRATION RESULTS
-- ================================================================
-- Run this after migration to verify data was copied correctly
-- ================================================================

-- Check record counts and data quality
SELECT
  COUNT(*) as total_migrated_records,
  COUNT(DISTINCT id) as unique_ids,

  -- Check text fields
  COUNT(CASE WHEN "firstName" IS NOT NULL AND "firstName" != '' THEN 1 END) as records_with_firstName,
  COUNT(CASE WHEN "lastName" IS NOT NULL AND "lastName" != '' THEN 1 END) as records_with_lastName,
  COUNT(CASE WHEN mobile IS NOT NULL AND mobile != '' THEN 1 END) as records_with_mobile,

  -- Check transformed array/jsonb fields
  COUNT(CASE WHEN languages IS NOT NULL AND array_length(languages, 1) > 0 THEN 1 END) as records_with_languages,
  COUNT(CASE WHEN services IS NOT NULL AND array_length(services, 1) > 0 THEN 1 END) as records_with_services,
  COUNT(CASE WHEN photos IS NOT NULL AND jsonb_array_length(photos) > 0 THEN 1 END) as records_with_photos,

  -- Check vehicle status
  COUNT(CASE WHEN "hasVehicle" = 'Yes' THEN 1 END) as records_with_vehicle_yes,
  COUNT(CASE WHEN "hasVehicle" = 'No' THEN 1 END) as records_with_vehicle_no,

  -- Check location
  COUNT(CASE WHEN location IS NOT NULL AND location != '' THEN 1 END) as records_with_location
FROM public.worker_profiles;

-- View sample of migrated data
SELECT
  id,
  "firstName",
  "lastName",
  mobile,
  languages,
  services,
  photos,
  "hasVehicle",
  location
FROM public.worker_profiles
LIMIT 10;


-- ================================================================
-- SECTION E: CLEANUP
-- ================================================================
-- Run this after verifying migration is successful
-- ================================================================

DROP TABLE IF EXISTS temp_contractor_import;


-- ================================================================
-- ADDITIONAL NOTES
-- ================================================================
--
-- 1. EMAIL MAPPING:
--    The CSV notes mention "the email should be at the authentication
--    branch users table". If you need to link worker_profiles to the
--    users table, you'll need additional logic to match contractors
--    to user accounts (e.g., by email, userId, etc.)
--
-- 2. DATA VALIDATION:
--    Before running this in production, test with a small sample
--    of data to ensure transformations work as expected
--
-- 3. ARRAY HANDLING:
--    If languageSpoken or titleRole contain comma-separated values
--    in production (e.g., "English, Spanish"), you may need to
--    split them into proper arrays. Current script assumes single values.
--
--    To handle comma-separated values, replace the transformation with:
--    string_to_array(TRIM(tmp.languageSpoken), ',')::text[]
--
-- 4. CONFLICT HANDLING:
--    If worker_profiles already has data and you want to avoid
--    duplicates, add this clause before FROM:
--
--    ON CONFLICT (id) DO UPDATE SET
--      firstName = EXCLUDED.firstName,
--      lastName = EXCLUDED.lastName,
--      ... (other fields)
--
-- ================================================================
