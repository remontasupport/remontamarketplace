-- CreateTable
CREATE TABLE "public"."ContractorProfile" (
    "id" TEXT NOT NULL,
    "zohoContactId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalZipCode" TEXT,
    "titleRole" TEXT,
    "yearsOfExperience" INTEGER,
    "qualificationsAndCertifications" TEXT,
    "languageSpoken" TEXT,
    "hasVehicleAccess" BOOLEAN,
    "funFact" TEXT,
    "hobbiesAndInterests" TEXT,
    "whatMakesBusinessUnique" TEXT,
    "additionalInformation" TEXT,
    "profileSubmission" TEXT,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContractorProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContractorProfile_zohoContactId_key" ON "public"."ContractorProfile"("zohoContactId");

-- CreateIndex
CREATE UNIQUE INDEX "ContractorProfile_email_key" ON "public"."ContractorProfile"("email");

-- CreateIndex
CREATE INDEX "ContractorProfile_email_idx" ON "public"."ContractorProfile"("email");

-- CreateIndex
CREATE INDEX "ContractorProfile_zohoContactId_idx" ON "public"."ContractorProfile"("zohoContactId");

-- CreateIndex
CREATE INDEX "ContractorProfile_city_idx" ON "public"."ContractorProfile"("city");
