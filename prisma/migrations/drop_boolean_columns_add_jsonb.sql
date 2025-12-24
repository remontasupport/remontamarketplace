-- Drop the individual boolean columns
ALTER TABLE "worker_profiles" DROP COLUMN IF EXISTS "accountDetailsCompleted";
ALTER TABLE "worker_profiles" DROP COLUMN IF EXISTS "complianceCompleted";
ALTER TABLE "worker_profiles" DROP COLUMN IF EXISTS "trainingsCompleted";
ALTER TABLE "worker_profiles" DROP COLUMN IF EXISTS "servicesCompleted";

-- Add JSONB column for setup progress tracking
ALTER TABLE "worker_profiles" ADD COLUMN IF NOT EXISTS "setupProgress" JSONB DEFAULT '{"accountDetails": false, "compliance": false, "trainings": false, "services": false}';

-- Add comment for documentation
COMMENT ON COLUMN "worker_profiles"."setupProgress" IS 'Tracks completion status of setup sections: accountDetails, compliance, trainings, services';
