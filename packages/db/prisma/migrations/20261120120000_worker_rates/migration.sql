-- worker-rates (2026-11-20): the worker's own rates (Services -> Rates), one row per worker, amounts in cents.
-- Expand-only: a new table; nothing existing changes, and the previous api image never reads or writes it. Empty at
-- creation. Each amount, when set, is 1..999999 cents ($0.01..$9,999.99), checked here as well as by the contract.
-- Rollback: down.sql (drops the table: rates saved meanwhile are lost).
CREATE TABLE "worker_rates" (
    "workerProfileId" TEXT NOT NULL,
    "weekdayCents" INTEGER,
    "saturdayCents" INTEGER,
    "sundayCents" INTEGER,
    "publicHolidayCents" INTEGER,
    "eveningCents" INTEGER,
    "inactiveSleepoverCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "worker_rates_pkey" PRIMARY KEY ("workerProfileId"),
    CONSTRAINT "worker_rates_amounts_check" CHECK (
        ("weekdayCents" IS NULL OR "weekdayCents" BETWEEN 1 AND 999999) AND
        ("saturdayCents" IS NULL OR "saturdayCents" BETWEEN 1 AND 999999) AND
        ("sundayCents" IS NULL OR "sundayCents" BETWEEN 1 AND 999999) AND
        ("publicHolidayCents" IS NULL OR "publicHolidayCents" BETWEEN 1 AND 999999) AND
        ("eveningCents" IS NULL OR "eveningCents" BETWEEN 1 AND 999999) AND
        ("inactiveSleepoverCents" IS NULL OR "inactiveSleepoverCents" BETWEEN 1 AND 999999)
    )
);

-- A worker profile's rates go with the profile.
ALTER TABLE "worker_rates" ADD CONSTRAINT "worker_rates_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "worker_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
