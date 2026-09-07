-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "JobApplicationStatus" AS ENUM ('PENDING', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'SUSPENDED', 'LOCKED', 'PENDING_VERIFICATION');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_SUCCESS', 'EMAIL_CHANGE', 'PROFILE_UPDATE', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'EMAIL_VERIFIED', 'ROLE_CHANGE', 'IMPERSONATION_START', 'IMPERSONATION_END');

-- CreateEnum
CREATE TYPE "DocumentCategory" AS ENUM ('PRIMARY', 'SECONDARY', 'WORKING_RIGHTS', 'SERVICE_QUALIFICATION');

-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('WORKER', 'CLIENT', 'COORDINATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'PENDING_REVIEW', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RepresentativeType" AS ENUM ('SELF', 'PARENT', 'GUARDIAN', 'FAMILY_MEMBER', 'LEGAL_REPRESENTATIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "FundingType" AS ENUM ('NDIS', 'AGED_CARE', 'INSURANCE', 'PRIVATE', 'OTHER');

-- CreateEnum
CREATE TYPE "ServiceRequestStatus" AS ENUM ('PENDING', 'MATCHED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "client_profiles" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "isSelfManaged" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "client_profiles_new_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "coordinator_profiles" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "organization" TEXT,
    "clientTypes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "coordinator_profiles_new_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "participants" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3),
    "location" TEXT,
    "gender" TEXT,
    "conditions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "fundingType" "FundingType",
    "relationshipToClient" TEXT,
    "isSelfManaged" BOOLEAN NOT NULL DEFAULT false,
    "servicesRequested" JSONB,
    "additionalInfo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "participants_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "impersonatedBy" TEXT,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "status" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
    "resetPasswordToken" TEXT,
    "resetPasswordExpires" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "accountLockedUntil" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_requirements" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "requirementType" TEXT NOT NULL,
    "requirementName" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "status" "RequirementStatus" NOT NULL DEFAULT 'PENDING',
    "documentUrl" TEXT,
    "documentUploadedAt" TIMESTAMP(3),
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "approvedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "documentCategory" "DocumentCategory",
    "notes" TEXT,
    "metadata" JSONB,

    CONSTRAINT "verification_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "worker_profiles" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "middleName" TEXT,
    "lastName" TEXT NOT NULL,
    "mobile" TEXT NOT NULL,
    "location" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postalCode" TEXT,
    "age" INTEGER,
    "dateOfBirth" TEXT,
    "gender" TEXT,
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "experience" TEXT,
    "introduction" TEXT,
    "qualifications" TEXT,
    "hasVehicle" TEXT,
    "funFact" TEXT,
    "hobbies" TEXT,
    "uniqueService" TEXT,
    "photos" TEXT,
    "additionalPhotos" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "abn" JSONB,
    "setupProgress" JSONB,
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "verificationStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_profiles_new_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hasExpiration" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requiresQualification" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subcategory" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requiresRegistration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subcategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoryDocument" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "conditionKey" TEXT,
    "requiredIfTrue" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoryDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubcategoryDocument" (
    "id" TEXT NOT NULL,
    "subcategoryId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubcategoryDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_services" (
    "id" TEXT NOT NULL DEFAULT (gen_random_uuid())::text,
    "workerProfileId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "categoryName" TEXT NOT NULL,
    "subcategoryIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subcategoryNames" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "worker_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "jobs" (
    "id" TEXT NOT NULL,
    "zohoId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "recruitmentTitle" TEXT,
    "service" TEXT,
    "description" TEXT,
    "jobDescription" TEXT,
    "city" TEXT,
    "state" TEXT,
    "postedAt" TIMESTAMP(3),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "jobs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "workerId" TEXT NOT NULL,
    "status" "JobApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_additional_info" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "jobHistory" JSONB DEFAULT '[]',
    "education" JSONB DEFAULT '[]',
    "languages" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "culturalBackground" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "religion" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "interests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "workPreferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "lgbtqiaSupport" BOOLEAN,
    "nonSmoker" BOOLEAN,
    "petFriendly" BOOLEAN,
    "personality" TEXT,
    "uniqueService" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "funFact" TEXT,
    "availability" JSONB DEFAULT '{}',
    "bankAccount" JSONB,
    "experience" JSONB DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_additional_info_new_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_requests" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "participantId" TEXT NOT NULL,
    "services" JSONB NOT NULL,
    "details" JSONB NOT NULL,
    "location" TEXT NOT NULL,
    "zohoRecordId" TEXT,
    "assignedWorker" JSONB,
    "selectedWorkers" TEXT[],
    "status" "ServiceRequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "accounts_userId_idx" ON "accounts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "client_profiles_new_userId_key" ON "client_profiles"("userId");

-- CreateIndex
CREATE INDEX "idx_client_profiles_userid" ON "client_profiles"("userId");

-- CreateIndex
CREATE INDEX "client_profiles_isSelfManaged_idx" ON "client_profiles"("isSelfManaged");

-- CreateIndex
CREATE UNIQUE INDEX "coordinator_profiles_new_userId_key" ON "coordinator_profiles"("userId");

-- CreateIndex
CREATE INDEX "idx_coordinator_profiles_userid" ON "coordinator_profiles"("userId");

-- CreateIndex
CREATE INDEX "participants_userId_idx" ON "participants"("userId");

-- CreateIndex
CREATE INDEX "participants_location_idx" ON "participants"("location");

-- CreateIndex
CREATE INDEX "participants_fundingType_idx" ON "participants"("fundingType");

-- CreateIndex
CREATE INDEX "participants_isSelfManaged_idx" ON "participants"("isSelfManaged");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_sessionToken_key" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_sessionToken_idx" ON "sessions"("sessionToken");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_impersonatedBy_idx" ON "sessions"("impersonatedBy");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_resetPasswordToken_key" ON "users"("resetPasswordToken");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_resetPasswordToken_idx" ON "users"("resetPasswordToken");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "users_accountLockedUntil_idx" ON "users"("accountLockedUntil");

-- CreateIndex
CREATE INDEX "users_createdAt_idx" ON "users"("createdAt");

-- CreateIndex
CREATE INDEX "idx_users_email" ON "users"("email");

-- CreateIndex
CREATE INDEX "idx_users_email_status_locked" ON "users"("email", "status", "accountLockedUntil");

-- CreateIndex
CREATE INDEX "verification_requirements_documentCategory_idx" ON "verification_requirements"("documentCategory");

-- CreateIndex
CREATE INDEX "verification_requirements_requirementType_idx" ON "verification_requirements"("requirementType");

-- CreateIndex
CREATE INDEX "verification_requirements_requirementName_idx" ON "verification_requirements"("requirementName");

-- CreateIndex
CREATE INDEX "verification_requirements_status_idx" ON "verification_requirements"("status");

-- CreateIndex
CREATE INDEX "verification_requirements_workerProfileId_idx" ON "verification_requirements"("workerProfileId");

-- CreateIndex
CREATE INDEX "verification_requirements_workerProfileId_requirementType_idx" ON "verification_requirements"("workerProfileId", "requirementType");

-- CreateIndex
CREATE INDEX "verification_requirements_workerProfileId_requirementName_idx" ON "verification_requirements"("workerProfileId", "requirementName");

-- CreateIndex
CREATE INDEX "verification_requirements_workerProfileId_status_idx" ON "verification_requirements"("workerProfileId", "status");

-- CreateIndex
CREATE INDEX "idx_verification_requirements_worker_profile" ON "verification_requirements"("workerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE INDEX "verification_tokens_token_idx" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "worker_profiles_userId_key" ON "worker_profiles"("userId");

-- CreateIndex
CREATE INDEX "worker_profiles_city_idx" ON "worker_profiles"("city");

-- CreateIndex
CREATE INDEX "worker_profiles_isPublished_idx" ON "worker_profiles"("isPublished");

-- CreateIndex
CREATE INDEX "worker_profiles_latitude_longitude_idx" ON "worker_profiles"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "worker_profiles_postalCode_idx" ON "worker_profiles"("postalCode");

-- CreateIndex
CREATE INDEX "worker_profiles_state_idx" ON "worker_profiles"("state");

-- CreateIndex
CREATE INDEX "worker_profiles_userId_idx" ON "worker_profiles"("userId");

-- CreateIndex
CREATE INDEX "worker_profiles_verificationStatus_idx" ON "worker_profiles"("verificationStatus");

-- CreateIndex
CREATE INDEX "worker_profiles_gender_idx" ON "worker_profiles"("gender");

-- CreateIndex
CREATE INDEX "worker_profiles_age_idx" ON "worker_profiles"("age");

-- CreateIndex
CREATE INDEX "worker_profiles_dateOfBirth_idx" ON "worker_profiles"("dateOfBirth");

-- CreateIndex
CREATE INDEX "worker_profiles_firstName_idx" ON "worker_profiles"("firstName");

-- CreateIndex
CREATE INDEX "worker_profiles_lastName_idx" ON "worker_profiles"("lastName");

-- CreateIndex
CREATE INDEX "worker_profiles_mobile_idx" ON "worker_profiles"("mobile");

-- CreateIndex
CREATE INDEX "worker_profiles_languages_idx" ON "worker_profiles" USING GIN ("languages");

-- CreateIndex
CREATE INDEX "worker_profiles_isPublished_city_idx" ON "worker_profiles"("isPublished", "city");

-- CreateIndex
CREATE INDEX "worker_profiles_isPublished_gender_idx" ON "worker_profiles"("isPublished", "gender");

-- CreateIndex
CREATE INDEX "worker_profiles_isPublished_verificationStatus_idx" ON "worker_profiles"("isPublished", "verificationStatus");

-- CreateIndex
CREATE INDEX "worker_profiles_createdAt_idx" ON "worker_profiles"("createdAt");

-- CreateIndex
CREATE INDEX "Document_category_idx" ON "Document"("category");

-- CreateIndex
CREATE INDEX "idx_document_category" ON "Document"("category");

-- CreateIndex
CREATE INDEX "Subcategory_categoryId_idx" ON "Subcategory"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryDocument_categoryId_idx" ON "CategoryDocument"("categoryId");

-- CreateIndex
CREATE INDEX "CategoryDocument_documentId_idx" ON "CategoryDocument"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "CategoryDocument_categoryId_documentId_documentType_conditi_key" ON "CategoryDocument"("categoryId", "documentId", "documentType", "conditionKey");

-- CreateIndex
CREATE INDEX "SubcategoryDocument_subcategoryId_idx" ON "SubcategoryDocument"("subcategoryId");

-- CreateIndex
CREATE INDEX "SubcategoryDocument_documentId_idx" ON "SubcategoryDocument"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "SubcategoryDocument_subcategoryId_documentId_key" ON "SubcategoryDocument"("subcategoryId", "documentId");

-- CreateIndex
CREATE INDEX "worker_services_categoryid_idx" ON "worker_services"("categoryId");

-- CreateIndex
CREATE INDEX "worker_services_categoryname_idx" ON "worker_services"("categoryName");

-- CreateIndex
CREATE INDEX "worker_services_workerprofileid_categoryname_idx" ON "worker_services"("workerProfileId", "categoryName");

-- CreateIndex
CREATE INDEX "worker_services_workerprofileid_idx" ON "worker_services"("workerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "worker_services_unique" ON "worker_services"("workerProfileId", "categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "jobs_zohoId_key" ON "jobs"("zohoId");

-- CreateIndex
CREATE INDEX "jobs_active_idx" ON "jobs"("active");

-- CreateIndex
CREATE INDEX "jobs_active_postedAt_idx" ON "jobs"("active", "postedAt");

-- CreateIndex
CREATE INDEX "jobs_active_state_idx" ON "jobs"("active", "state");

-- CreateIndex
CREATE INDEX "jobs_active_city_idx" ON "jobs"("active", "city");

-- CreateIndex
CREATE INDEX "jobs_zohoId_idx" ON "jobs"("zohoId");

-- CreateIndex
CREATE INDEX "jobs_postedAt_idx" ON "jobs"("postedAt");

-- CreateIndex
CREATE INDEX "jobs_state_idx" ON "jobs"("state");

-- CreateIndex
CREATE INDEX "jobs_city_idx" ON "jobs"("city");

-- CreateIndex
CREATE INDEX "job_applications_workerId_idx" ON "job_applications"("workerId");

-- CreateIndex
CREATE INDEX "job_applications_jobId_idx" ON "job_applications"("jobId");

-- CreateIndex
CREATE INDEX "job_applications_workerId_status_idx" ON "job_applications"("workerId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "job_applications_jobId_workerId_key" ON "job_applications"("jobId", "workerId");

-- CreateIndex
CREATE UNIQUE INDEX "worker_additional_info_workerProfileId_key" ON "worker_additional_info"("workerProfileId");

-- CreateIndex
CREATE INDEX "worker_additional_info_workerProfileId_idx" ON "worker_additional_info"("workerProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "service_requests_zohoRecordId_key" ON "service_requests"("zohoRecordId");

-- CreateIndex
CREATE INDEX "service_requests_requesterId_idx" ON "service_requests"("requesterId");

-- CreateIndex
CREATE INDEX "service_requests_status_idx" ON "service_requests"("status");

-- CreateIndex
CREATE INDEX "service_requests_createdAt_idx" ON "service_requests"("createdAt");

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "client_profiles" ADD CONSTRAINT "client_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordinator_profiles" ADD CONSTRAINT "coordinator_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "participants" ADD CONSTRAINT "participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_requirements" ADD CONSTRAINT "verification_requirements_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_profiles" ADD CONSTRAINT "worker_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subcategory" ADD CONSTRAINT "Subcategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryDocument" ADD CONSTRAINT "CategoryDocument_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoryDocument" ADD CONSTRAINT "CategoryDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubcategoryDocument" ADD CONSTRAINT "SubcategoryDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubcategoryDocument" ADD CONSTRAINT "SubcategoryDocument_subcategoryId_fkey" FOREIGN KEY ("subcategoryId") REFERENCES "Subcategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_services" ADD CONSTRAINT "worker_services_workerprofileid_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_additional_info" ADD CONSTRAINT "worker_additional_info_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_requests" ADD CONSTRAINT "service_requests_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "participants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

