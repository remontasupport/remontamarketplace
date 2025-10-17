-- AlterTable: Reorder aboutYou column to be after yearsOfExperience
-- PostgreSQL doesn't support column reordering directly, so we need to recreate the table

-- Step 1: Create a new table with the correct column order
CREATE TABLE "ContractorProfile_new" (
    "id" TEXT NOT NULL,
    "zohoContactId" TEXT NOT NULL,

    -- Basic Information
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "gender" TEXT,

    -- Location
    "city" TEXT,
    "state" TEXT,
    "postalZipCode" TEXT,

    -- Professional Details
    "titleRole" TEXT,
    "yearsOfExperience" INTEGER,
    "aboutYou" TEXT,

    -- Qualifications & Skills
    "qualificationsAndCertifications" TEXT,
    "languageSpoken" TEXT,
    "hasVehicleAccess" BOOLEAN,

    -- Personal Details
    "funFact" TEXT,
    "hobbiesAndInterests" TEXT,
    "whatMakesBusinessUnique" TEXT,
    "additionalInformation" TEXT,

    -- Profile Image
    "profilePicture" TEXT,

    -- System Fields
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "ContractorProfile_new_pkey" PRIMARY KEY ("id")
);

-- Step 2: Copy all data from old table to new table
INSERT INTO "ContractorProfile_new" (
    "id",
    "zohoContactId",
    "firstName",
    "lastName",
    "email",
    "phone",
    "gender",
    "city",
    "state",
    "postalZipCode",
    "titleRole",
    "yearsOfExperience",
    "aboutYou",
    "qualificationsAndCertifications",
    "languageSpoken",
    "hasVehicleAccess",
    "funFact",
    "hobbiesAndInterests",
    "whatMakesBusinessUnique",
    "additionalInformation",
    "profilePicture",
    "lastSyncedAt",
    "createdAt",
    "updatedAt",
    "deletedAt"
)
SELECT
    "id",
    "zohoContactId",
    "firstName",
    "lastName",
    "email",
    "phone",
    "gender",
    "city",
    "state",
    "postalZipCode",
    "titleRole",
    "yearsOfExperience",
    "aboutYou",
    "qualificationsAndCertifications",
    "languageSpoken",
    "hasVehicleAccess",
    "funFact",
    "hobbiesAndInterests",
    "whatMakesBusinessUnique",
    "additionalInformation",
    "profilePicture",
    "lastSyncedAt",
    "createdAt",
    "updatedAt",
    "deletedAt"
FROM "ContractorProfile";

-- Step 3: Drop old table
DROP TABLE "ContractorProfile";

-- Step 4: Rename new table to original name
ALTER TABLE "ContractorProfile_new" RENAME TO "ContractorProfile";

-- Step 5: Recreate unique constraints
CREATE UNIQUE INDEX "ContractorProfile_zohoContactId_key" ON "ContractorProfile"("zohoContactId");
CREATE UNIQUE INDEX "ContractorProfile_email_key" ON "ContractorProfile"("email");

-- Step 6: Recreate indexes
CREATE INDEX "ContractorProfile_email_idx" ON "ContractorProfile"("email");
CREATE INDEX "ContractorProfile_zohoContactId_idx" ON "ContractorProfile"("zohoContactId");
CREATE INDEX "ContractorProfile_city_idx" ON "ContractorProfile"("city");
CREATE INDEX "ContractorProfile_deletedAt_idx" ON "ContractorProfile"("deletedAt");
