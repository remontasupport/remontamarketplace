-- DropForeignKey
ALTER TABLE "worker_job_history" DROP CONSTRAINT "worker_job_history_workerAdditionalInfoId_fkey";

-- DropForeignKey
ALTER TABLE "worker_education" DROP CONSTRAINT "worker_education_workerAdditionalInfoId_fkey";

-- DropForeignKey
ALTER TABLE "worker_availability" DROP CONSTRAINT "worker_availability_workerProfileId_fkey";

-- DropForeignKey
ALTER TABLE "worker_experience" DROP CONSTRAINT "worker_experience_workerProfileId_fkey";

-- DropTable
DROP TABLE "worker_job_history";

-- DropTable
DROP TABLE "worker_education";

-- DropTable
DROP TABLE "worker_availability";

-- DropTable
DROP TABLE "worker_experience";

-- DropEnum
DROP TYPE "DayOfWeek";

-- DropEnum
DROP TYPE "CareDomain";

