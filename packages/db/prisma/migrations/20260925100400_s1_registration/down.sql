-- Reverses s1_registration.
--
-- What is lost:
--   - consent time and wording version, and zohoLeadId, for apps/api registrations
--     (legacy registrations never had them)
--   - undelivered outbox events -- check first:
--       SELECT status, count(*) FROM outbox_events GROUP BY status;
--   - staged photo rows (the blobs stay in storage; list them from blobKey first)
--
-- PostgreSQL cannot drop an enum value, so AuditAction is rebuilt without
-- ACCOUNT_REGISTERED. That fails if any audit row uses it, which is deliberate:
-- decide what those rows become before running this. To keep them under the
-- value apps/app used to log registrations with:
--   UPDATE audit_logs SET action = 'LOGIN_SUCCESS' WHERE action = 'ACCOUNT_REGISTERED';
-- The rebuild rewrites audit_logs under an exclusive lock; run it off-peak.

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM audit_logs WHERE action::text = 'ACCOUNT_REGISTERED') THEN
    RAISE EXCEPTION 'audit_logs has ACCOUNT_REGISTERED rows; see the header of this file';
  END IF;
END $$;

BEGIN;
CREATE TYPE "AuditAction_new" AS ENUM ('LOGIN_SUCCESS', 'LOGIN_FAILED', 'LOGOUT', 'PASSWORD_CHANGE', 'PASSWORD_RESET_REQUEST', 'PASSWORD_RESET_SUCCESS', 'EMAIL_CHANGE', 'PROFILE_UPDATE', 'ACCOUNT_LOCKED', 'ACCOUNT_UNLOCKED', 'EMAIL_VERIFIED', 'ROLE_CHANGE', 'IMPERSONATION_START', 'IMPERSONATION_END');
ALTER TABLE "audit_logs" ALTER COLUMN "action" TYPE "AuditAction_new" USING ("action"::text::"AuditAction_new");
ALTER TYPE "AuditAction" RENAME TO "AuditAction_old";
ALTER TYPE "AuditAction_new" RENAME TO "AuditAction";
DROP TYPE "AuditAction_old";
COMMIT;

DROP TABLE "rate_limit_buckets";
DROP TABLE "registration_photo_uploads";
DROP TABLE "outbox_events";
DROP TYPE "OutboxStatus";

ALTER TABLE "worker_profiles" DROP COLUMN "consentProfileShareAt",
DROP COLUMN "consentWordingVersion",
DROP COLUMN "zohoLeadId";
