-- AlterTable
ALTER TABLE "worker_job_history" DROP COLUMN "startMonth",
ADD COLUMN     "startMonth" INTEGER,
DROP COLUMN "endMonth",
ADD COLUMN     "endMonth" INTEGER;

-- AlterTable
ALTER TABLE "worker_education" DROP COLUMN "startMonth",
ADD COLUMN     "startMonth" INTEGER,
DROP COLUMN "endMonth",
ADD COLUMN     "endMonth" INTEGER;

-- AlterTable
ALTER TABLE "worker_experience" ALTER COLUMN "otherAreas" DROP NOT NULL,
ALTER COLUMN "otherAreas" DROP DEFAULT,
ALTER COLUMN "otherAreas" SET DATA TYPE TEXT;

