-- service_requests.status: a MATCHING value between PENDING and MATCHED, for a request whose worker is being found
-- (asked 2026-10-26). Expand-only: ADD VALUE changes only the type's catalogue, no table rewrite, no lock on the rows;
-- no product code writes it yet, so the previous api image and app are unaffected.
-- Rollback: down.sql (moves any MATCHING row back to PENDING, then rebuilds the type without the value).
ALTER TYPE "ServiceRequestStatus" ADD VALUE IF NOT EXISTS 'MATCHING' BEFORE 'MATCHED';
