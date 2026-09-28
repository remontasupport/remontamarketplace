-- S1: enable PostGIS, for distance matching on worker and locality points.
--
-- Additive: an extension adds types and functions and touches no existing table.
-- Neon supports PostGIS; the project role can create it. If this is refused,
-- stop -- S1-code-generation-plan.md section 7 has the fallback.
CREATE EXTENSION IF NOT EXISTS postgis;
