-- Manual Migration: Change age column from TEXT to INTEGER
-- This migration safely converts existing age data from string to integer
-- Date: 2025-11-24

-- Step 1: Add a new temporary integer column
ALTER TABLE "worker_profiles" ADD COLUMN "age_new" INTEGER;

-- Step 2: Convert existing string ages to integers
-- This handles cases where age might be a valid number string or NULL
-- Invalid values will remain NULL
UPDATE "worker_profiles"
SET "age_new" = CASE
    WHEN "age" ~ '^\d+$' THEN CAST("age" AS INTEGER)
    ELSE NULL
END;

-- Step 3: Drop the old text column
ALTER TABLE "worker_profiles" DROP COLUMN "age";

-- Step 4: Rename the new column to 'age'
ALTER TABLE "worker_profiles" RENAME COLUMN "age_new" TO "age";

-- Migration complete!
-- The age column is now INTEGER type and existing data has been preserved
