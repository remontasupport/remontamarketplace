-- S1: au_localities -- every Australian suburb-postcode pair, from Geoscape G-NAF.
--
-- Additive. The table starts empty; it is filled by
-- `pnpm --filter @remonta/db localities:refresh` from data/au_localities.csv.
-- Rows are never deleted: a locality dropped by a release is retired.
--
-- Hand-written, beyond what Prisma generates (keep them if a later migration is
-- generated): the GENERATED "point" column and the CHECK constraints.

-- CreateTable
CREATE TABLE "au_localities" (
    "id" SERIAL NOT NULL,
    -- G-NAF LOCALITY.LOCALITY_PID, not its GNAF_LOCALITY_PID column (often empty)
    "localityPid" TEXT NOT NULL,
    "suburb" TEXT NOT NULL,
    "searchName" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "postcode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "point" geography(Point, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint("longitude", "latitude"), 4326)::geography
    ) STORED,
    "sourceVersion" TEXT NOT NULL,
    "retiredAt" TIMESTAMP(3),
    "supersededById" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "au_localities_pkey" PRIMARY KEY ("id"),
    -- G-NAF states, including OT (other territories: Jervis Bay, Christmas, Cocos)
    CONSTRAINT "au_localities_state_check"
        CHECK ("state" IN ('NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT', 'OT')),
    CONSTRAINT "au_localities_postcode_check" CHECK ("postcode" ~ '^[0-9]{4}$'),
    -- Australia and its external territories, generously bounded
    CONSTRAINT "au_localities_latitude_check" CHECK ("latitude" BETWEEN -55 AND -9),
    CONSTRAINT "au_localities_longitude_check" CHECK ("longitude" BETWEEN 72 AND 169),
    CONSTRAINT "au_localities_not_self_superseded_check" CHECK ("supersededById" <> "id")
);

-- CreateIndex
CREATE UNIQUE INDEX "au_localities_localityPid_postcode_key" ON "au_localities"("localityPid", "postcode");

-- CreateIndex
CREATE INDEX "au_localities_searchName_idx" ON "au_localities"("searchName");

-- CreateIndex
CREATE INDEX "au_localities_postcode_idx" ON "au_localities"("postcode");

-- CreateIndex
CREATE INDEX "au_localities_point_idx" ON "au_localities" USING GIST ("point");

-- AddForeignKey
ALTER TABLE "au_localities" ADD CONSTRAINT "au_localities_supersededById_fkey" FOREIGN KEY ("supersededById") REFERENCES "au_localities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
