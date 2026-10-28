-- Nothing is undone. Postgres cannot drop an enum value without rebuilding the type, and audit_logs rows written with
-- these values are the record of what admins saw and changed: they must outlive a rollback of the code. An unused
-- value is harmless to the previous api image and app.
SELECT 1;
