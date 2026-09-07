-- AlterTable
ALTER TABLE "worker_job_history" ALTER COLUMN "startMonth" SET DATA TYPE TEXT,
ALTER COLUMN "endMonth" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "worker_education" ALTER COLUMN "startMonth" SET DATA TYPE TEXT,
ALTER COLUMN "endMonth" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "worker_experience" DROP COLUMN "otherAreas",
ADD COLUMN     "otherAreas" TEXT[] DEFAULT ARRAY[]::TEXT[];

