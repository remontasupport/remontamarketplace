-- admin-clients U1: two audit actions for the admin's client / coordinator pages: a detail view (who looked at whose
-- participants, the record of health information seen, FR-10) and a service request status change by an admin.
-- Expand-only: ADD VALUE changes only the type's catalogue, no table rewrite; the previous api image never writes them.
-- Rollback: down.sql.
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'ADMIN_RECORD_VIEW';
ALTER TYPE "AuditAction" ADD VALUE IF NOT EXISTS 'SERVICE_REQUEST_STATUS_CHANGE';
