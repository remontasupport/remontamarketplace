-- ============================================
-- REORDER createdAt and updatedAt COLUMNS IN worker_profiles
-- Moves createdAt and updatedAt to be after setupProgress (at the end)
-- ============================================
-- IMPORTANT: This assumes middleName migration has already been run!
-- ============================================

-- Step 1: Create a new table with the correct column order
CREATE TABLE "worker_profiles_new" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    -- Name fields (assuming middleName is already after firstName)
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,

    -- Contact & Basic Info
    "mobile" TEXT NOT NULL,
    "location" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "age" INTEGER,
    "dateOfBirth" TEXT,
    "gender" TEXT,
    "languages" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],

    -- Profile Content
    "experience" TEXT,
    "introduction" TEXT,
    "qualifications" TEXT,
    "hasVehicle" TEXT,
    "funFact" TEXT,
    "hobbies" TEXT,
    "uniqueService" TEXT,
    "photos" TEXT,

    -- Geolocation Fields
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    -- Business Info
    "abn" TEXT,

    -- Setup Progress & Status Fields
    "setupProgress" JSONB,
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,

    -- Verification & Timestamp Fields
    "verificationStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_profiles_new_pkey" PRIMARY KEY ("id")
);

-- Step 2: Copy ALL data from old table to new table
-- CRITICAL: This preserves all existing data including timestamps
INSERT INTO "worker_profiles_new" (
    "id",
    "userId",
    "firstName",
    "middleName",
    "lastName",
    "mobile",
    "location",
    "city",
    "state",
    "postalCode",
    "age",
    "dateOfBirth",
    "gender",
    "languages",
    "experience",
    "introduction",
    "qualifications",
    "hasVehicle",
    "funFact",
    "hobbies",
    "uniqueService",
    "photos",
    "latitude",
    "longitude",
    "abn",
    "setupProgress",
    "profileCompleted",
    "isPublished",
    "verificationStatus",
    "createdAt",         -- All existing timestamps are preserved!
    "updatedAt"
)
SELECT
    "id",
    "userId",
    "firstName",
    "middleName",
    "lastName",
    "mobile",
    "location",
    "city",
    "state",
    "postalCode",
    "age",
    "dateOfBirth",
    "gender",
    "languages",
    "experience",
    "introduction",
    "qualifications",
    "hasVehicle",
    "funFact",
    "hobbies",
    "uniqueService",
    "photos",
    "latitude",
    "longitude",
    "abn",
    "setupProgress",
    "profileCompleted",
    "isPublished",
    "verificationStatus",
    "createdAt",         -- Timestamps copied from old table
    "updatedAt"
FROM "worker_profiles";

-- Step 3: Verify data copy was successful
DO $$
DECLARE
    old_count INTEGER;
    new_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO old_count FROM "worker_profiles";
    SELECT COUNT(*) INTO new_count FROM "worker_profiles_new";

    IF old_count != new_count THEN
        RAISE EXCEPTION 'Data copy failed! Old table has % rows but new table has % rows', old_count, new_count;
    END IF;

    RAISE NOTICE 'SUCCESS: Copied % rows from worker_profiles to worker_profiles_new', new_count;
END $$;

-- Step 4: Drop old table (this will cascade to child tables temporarily)
DROP TABLE "worker_profiles" CASCADE;

-- Step 5: Rename new table to original name
ALTER TABLE "worker_profiles_new" RENAME TO "worker_profiles";

-- Step 6: Recreate unique constraint
CREATE UNIQUE INDEX "worker_profiles_userId_key" ON "worker_profiles"("userId");

-- Step 7: Recreate ALL indexes (order matters for performance!)

-- Single-column indexes
CREATE INDEX "worker_profiles_city_idx" ON "worker_profiles"("city");
CREATE INDEX "worker_profiles_isPublished_idx" ON "worker_profiles"("isPublished");
CREATE INDEX "worker_profiles_postalCode_idx" ON "worker_profiles"("postalCode");
CREATE INDEX "worker_profiles_state_idx" ON "worker_profiles"("state");
CREATE INDEX "worker_profiles_userId_idx" ON "worker_profiles"("userId");
CREATE INDEX "worker_profiles_verificationStatus_idx" ON "worker_profiles"("verificationStatus");
CREATE INDEX "worker_profiles_gender_idx" ON "worker_profiles"("gender");
CREATE INDEX "worker_profiles_age_idx" ON "worker_profiles"("age");
CREATE INDEX "worker_profiles_dateOfBirth_idx" ON "worker_profiles"("dateOfBirth");
CREATE INDEX "worker_profiles_firstName_idx" ON "worker_profiles"("firstName");
CREATE INDEX "worker_profiles_lastName_idx" ON "worker_profiles"("lastName");
CREATE INDEX "worker_profiles_mobile_idx" ON "worker_profiles"("mobile");
CREATE INDEX "worker_profiles_createdAt_idx" ON "worker_profiles"("createdAt");

-- Geospatial index (compound)
CREATE INDEX "worker_profiles_latitude_longitude_idx" ON "worker_profiles"("latitude", "longitude");

-- GIN index for array field (PostgreSQL-specific for fast array queries)
CREATE INDEX "worker_profiles_languages_idx" ON "worker_profiles" USING GIN ("languages");

-- Compound indexes for common filter combinations
CREATE INDEX "worker_profiles_isPublished_city_idx" ON "worker_profiles"("isPublished", "city");
CREATE INDEX "worker_profiles_isPublished_gender_idx" ON "worker_profiles"("isPublished", "gender");
CREATE INDEX "worker_profiles_isPublished_verificationStatus_idx" ON "worker_profiles"("isPublished", "verificationStatus");

-- Step 8: Recreate foreign key constraint to users table
ALTER TABLE "worker_profiles"
    ADD CONSTRAINT "worker_profiles_userId_fkey"
    FOREIGN KEY ("userId")
    REFERENCES "users"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- Step 9: Recreate foreign key constraints FROM child tables
-- (These were dropped in Step 4 when we used CASCADE)

-- From verification_requirements
ALTER TABLE "verification_requirements"
    ADD CONSTRAINT "verification_requirements_workerProfileId_fkey"
    FOREIGN KEY ("workerProfileId")
    REFERENCES "worker_profiles"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- From worker_services
ALTER TABLE "worker_services"
    ADD CONSTRAINT "worker_services_workerProfileId_fkey"
    FOREIGN KEY ("workerProfileId")
    REFERENCES "worker_profiles"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- From worker_additional_info
ALTER TABLE "worker_additional_info"
    ADD CONSTRAINT "worker_additional_info_workerProfileId_fkey"
    FOREIGN KEY ("workerProfileId")
    REFERENCES "worker_profiles"("id")
    ON DELETE CASCADE
    ON UPDATE CASCADE;

-- Step 10: Final verification
SELECT
    COUNT(*) as total_rows,
    COUNT(DISTINCT "userId") as unique_users,
    MIN("createdAt") as earliest_created,
    MAX("createdAt") as latest_created,
    COUNT(*) FILTER (WHERE "isPublished" = true) as published_profiles
FROM "worker_profiles";

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'MIGRATION COMPLETED SUCCESSFULLY!';
    RAISE NOTICE 'Column reordering completed:';
    RAISE NOTICE '  - Location columns: location, city, state, postalCode';
    RAISE NOTICE '  - Status fields: setupProgress, profileCompleted, isPublished';
    RAISE NOTICE '  - verificationStatus, createdAt, updatedAt at the end';
    RAISE NOTICE 'All data, indexes, and constraints restored';
    RAISE NOTICE '========================================';
END $$;
