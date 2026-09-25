-- S1: worker_locations -- where each worker is, and how far they travel.
--
-- Additive. Nothing existing reads it; the location columns on worker_profiles
-- keep being written alongside it during the transition (S1-data-model.md 2.2).
--
-- Hand-written, beyond what Prisma generates (keep them if a later migration is
-- generated): the GENERATED "point" column, the CHECK constraints, and the
-- partial unique index worker_locations_one_home_per_worker.

-- CreateEnum
CREATE TYPE "LocationKind" AS ENUM ('HOME', 'SERVICE_AREA');

-- CreateEnum
CREATE TYPE "LocationPrecision" AS ENUM ('LOCALITY', 'ADDRESS');

-- CreateEnum
CREATE TYPE "LocationSource" AS ENUM ('REGISTRATION', 'ONBOARDING', 'ADMIN', 'RECONCILER', 'BACKFILL');

-- CreateTable
CREATE TABLE "worker_locations" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "kind" "LocationKind" NOT NULL,
    "localityId" INTEGER NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "point" geography(Point, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography
    ) STORED,
    "travelRadiusKm" INTEGER,
    "precision" "LocationPrecision" NOT NULL,
    "source" "LocationSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_locations_pkey" PRIMARY KEY ("id"),
    -- The radius belongs to HOME and only HOME: a HOME row always has one.
    CONSTRAINT "worker_locations_radius_home_only_check"
        CHECK (("kind" = 'HOME') = ("travelRadiusKm" IS NOT NULL)),
    CONSTRAINT "worker_locations_radius_range_check"
        CHECK ("travelRadiusKm" IS NULL OR "travelRadiusKm" BETWEEN 1 AND 500),
    CONSTRAINT "worker_locations_latitude_check" CHECK ("latitude" BETWEEN -55 AND -9),
    CONSTRAINT "worker_locations_longitude_check" CHECK ("longitude" BETWEEN 72 AND 169)
);

-- Exactly one HOME row per worker. Prisma cannot express a partial index.
CREATE UNIQUE INDEX "worker_locations_one_home_per_worker"
    ON "worker_locations"("workerProfileId") WHERE "kind" = 'HOME';

-- CreateIndex
CREATE INDEX "worker_locations_workerProfileId_idx" ON "worker_locations"("workerProfileId");

-- CreateIndex
CREATE INDEX "worker_locations_localityId_idx" ON "worker_locations"("localityId");

-- CreateIndex
CREATE INDEX "worker_locations_point_idx" ON "worker_locations" USING GIST ("point");

-- AddForeignKey
ALTER TABLE "worker_locations" ADD CONSTRAINT "worker_locations_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_locations" ADD CONSTRAINT "worker_locations_localityId_fkey" FOREIGN KEY ("localityId") REFERENCES "au_localities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
