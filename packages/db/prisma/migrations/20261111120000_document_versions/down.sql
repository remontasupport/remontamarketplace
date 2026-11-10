-- Reverse of document-history U1. The history rows written since the release are lost; their files stay in the bucket
-- (nothing deletes them without a row). The audit action stays: Postgres cannot drop an enum value without rebuilding
-- the type, and audit_logs rows written with it are the record of admin deletes.
DROP TABLE IF EXISTS "document_versions";
DROP TYPE IF EXISTS "DocumentVersionReason";
