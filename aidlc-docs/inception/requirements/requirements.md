# drop-legacy-location-columns (search-locations U7) -- requirements (2026-11-10)

Goal (user, 2026-11-10): "Yes let's do the U7 but make sure double check and production won't compromise".

- FR-1 Drop `worker_profiles.location, city, state, postalCode, latitude, longitude` and the five indexes
  (`city`, `state`, `postalCode`, `latitude+longitude`, `isPublished+city`) in one migration.
- NFR-1 No running code may read or write them (proven: guard tests, SQL scan, schema/generated clients, rehearsal).
- NFR-2 No database object depends on them except the five indexes (proven on the developer copy; production check by the user).
- NFR-3 A way back for the data: a Neon branch of production taken just before the promotion, kept 30+ days.
- NFR-4 Fail fast, never block: `lock_timeout = 5s`; one ALTER statement (all or nothing).
- NFR-5 down.sql restores the structure (tested on a Neon branch, per the migrations README).
- Out of scope: any other column; the 8 unplaced workers' legacy values (kept only in the backup branch).
