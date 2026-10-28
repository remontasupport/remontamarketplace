# NFR Design (shared, U1 + U2) -- admin-clients (2026-10-28)

Requirements NFR-1..NFR-6; U1 Functional Design BR-1..BR-10, D1-D4.

- **N1 Compatibility.** Additions only: four new entries, no existing entry or response changes, so the production
  app (strict `z.strictObject` parsing) is unaffected by U1's promotion. The openapi drift check shows additions only.
  The migration is expand-only (enum values, one index); a rollback to the previous image leaves them in place.
- **N2 Access.** Every entry `access: { roles: ['ADMIN'] }` through the pipeline (bearer token from
  `/api/auth/api-token`). A worker, client or coordinator token: 403. A user id of the other role on `getRequester`: 404.
- **N3 The shared password.**
  - Stored only as a bcrypt hash (cost 12, `BCRYPT_COST`) in Secret Manager `remonta-api[-staging]-SENSITIVE_DATA_PASSWORD_HASH`,
    added with `printf '%s'` (no trailing newline, follow-up 15). Staging and prod differ.
  - Compared through the existing `PasswordHasher` (worker pool, bcrypt's constant-time compare); the body field is
    never logged (the pipeline's redaction list gains `password` if absent) and never echoed.
  - Guessing: user 5 / 15 min and ip 20 / 15 min on `unlockSensitive` (the pipeline's `rate_limit_buckets`), on top
    of bcrypt's cost. Every failure is an audit row.
  - Rotation: a new secret version, then a redeploy (instances read secrets at start); runbook line in `infra/README.md`.
- **N4 The unlock window.** Derived from the newest `SENSITIVE_DATA_UNLOCK` audit row of the admin (BR-6), read with
  the new index `(userId, action, createdAt)`; 15 minutes from the clock (`Clock`, testable). No state elsewhere, so
  every instance agrees and a restart keeps it.
- **N5 Redaction at one point.** `domain/sensitive.ts` removes the D1 fields from the detail response before it leaves
  the handler; the field list is the contract's `SENSITIVE_FIELDS`. A property test: without an unlock, no response
  ever carries a sensitive key, whatever the stored data.
- **N6 Audit.** Pipeline-enforced for the declared actions (view, unlock, status change); the failed unlock is written
  by the handler in its own transaction before the 403. Metadata: ids, `sensitive` boolean, `from`/`to` status. Never
  names, dates or conditions.
- **N7 Freshness.** `listRequesters` and `getRequester` answer `Cache-Control: no-store` (no private cache, no memo):
  a status change or an unlock shows on the next read.
- **N8 n8n delivery.** Outbox event in the status change's transaction, so a change never happens without its
  notification and vice versa. The dispatcher's retries (6, backoff), DEAD after; the existing outbox alert covers
  dead events. The payload is built at send time from fresh rows; the outbox row holds ids only. Staging's URL is
  empty or a test endpoint, never the live webhook (NFR-6); its host joins the egress allowlist as the registration
  webhook's does.
- **N9 Performance.** The list: one statement, counts by correlated subqueries on indexed columns
  (`participants.userId`, `service_requests.requesterId`), paged (page size max as the admin lists). The detail: two
  queries (profile; participants with requests). Measured on the staging copy in the check script; no new alert.
- **N10 Logs.** One line per entry: entry name, admin user id, target id, counts, duration. No search text, no
  filter values except role and status, no personal data.
- **N11 Tests.** Unit and property tests for the redaction, the unlock window and the status rules; a database test
  (CI) for the list SQL against an oracle, the transaction (status + audit + outbox), and the unlock lookup; contract
  checks. A staging check script (untracked, as before) runs the checklist with a staging admin token.
