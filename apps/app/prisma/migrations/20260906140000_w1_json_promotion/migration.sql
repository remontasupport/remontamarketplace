-- CreateEnum
CREATE TYPE "DayOfWeek" AS ENUM ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY');

-- CreateEnum
CREATE TYPE "CareDomain" AS ENUM ('DISABILITY', 'AGED_CARE', 'WORKING_WITH_CHILDREN', 'MENTAL_HEALTH', 'CHRONIC_MEDICAL');

-- CreateTable
CREATE TABLE "worker_job_history" (
    "id" TEXT NOT NULL,
    "workerAdditionalInfoId" TEXT NOT NULL,
    "jobTitle" TEXT NOT NULL,
    "company" TEXT NOT NULL,
    "startMonth" INTEGER,
    "startYear" INTEGER,
    "endMonth" INTEGER,
    "endYear" INTEGER,
    "currentlyWorking" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_job_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_education" (
    "id" TEXT NOT NULL,
    "workerAdditionalInfoId" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "qualification" TEXT NOT NULL,
    "startMonth" INTEGER,
    "startYear" INTEGER,
    "endMonth" INTEGER,
    "endYear" INTEGER,
    "currentlyStudying" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_education_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_availability" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "dayOfWeek" "DayOfWeek" NOT NULL,
    "startMinute" INTEGER NOT NULL,
    "endMinute" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_availability_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_experience" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "domain" "CareDomain" NOT NULL,
    "isProfessional" BOOLEAN NOT NULL DEFAULT false,
    "isPersonal" BOOLEAN NOT NULL DEFAULT false,
    "specificAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "otherAreas" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_experience_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "worker_job_history_workerAdditionalInfoId_idx" ON "worker_job_history"("workerAdditionalInfoId");

-- CreateIndex
CREATE INDEX "worker_education_workerAdditionalInfoId_idx" ON "worker_education"("workerAdditionalInfoId");

-- CreateIndex
CREATE INDEX "worker_availability_workerProfileId_idx" ON "worker_availability"("workerProfileId");

-- CreateIndex
CREATE INDEX "worker_availability_dayOfWeek_idx" ON "worker_availability"("dayOfWeek");

-- CreateIndex
CREATE UNIQUE INDEX "worker_availability_workerProfileId_dayOfWeek_startMinute_e_key" ON "worker_availability"("workerProfileId", "dayOfWeek", "startMinute", "endMinute");

-- CreateIndex
CREATE INDEX "worker_experience_domain_idx" ON "worker_experience"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "worker_experience_workerProfileId_domain_key" ON "worker_experience"("workerProfileId", "domain");

-- AddForeignKey
ALTER TABLE "worker_job_history" ADD CONSTRAINT "worker_job_history_workerAdditionalInfoId_fkey" FOREIGN KEY ("workerAdditionalInfoId") REFERENCES "worker_additional_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_education" ADD CONSTRAINT "worker_education_workerAdditionalInfoId_fkey" FOREIGN KEY ("workerAdditionalInfoId") REFERENCES "worker_additional_info"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_availability" ADD CONSTRAINT "worker_availability_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_experience" ADD CONSTRAINT "worker_experience_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

