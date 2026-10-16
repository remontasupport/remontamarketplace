-- api-review U5d: when the password last changed. A session (the app's NextAuth token) or an api token issued before
-- it is refused, so a password change signs out the other devices (user decision, 2026-10-16). Expand-only: one
-- nullable column, no data change; null means "never changed through the api" and refuses nothing.
-- Rollback: down.sql (drops it; the app treats a missing value as null).
ALTER TABLE "users" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);
