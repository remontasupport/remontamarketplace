-- Removes PostGIS. Run only after s1_localities and s1_worker_locations are
-- reversed: their geography columns depend on it and the DROP fails otherwise
-- (no CASCADE, deliberately -- it must never take a table with it).
DROP EXTENSION IF EXISTS postgis;
