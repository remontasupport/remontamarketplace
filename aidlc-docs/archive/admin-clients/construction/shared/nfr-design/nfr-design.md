# NFR Design (shared, U1 + U2) -- admin-clients (2026-10-28, revised the same day: no password)

Requirements NFR-1..NFR-6; U1 Functional Design BR-1..BR-10, D3. The password items (hash, guessing limit, unlock
window, redaction) were withdrawn with FR-9's change.

- **N1 Compatibility.** Additions only: three new entries, no existing entry or response changes, so the production
  app (strict `z.strictObject` parsing) is unaffected by U1's promotion. The openapi drift check shows additions only.
  The migration is expand-only (two enum values); a rollback to the previous image leaves them in place.
- **N2 Access.** Every entry `access: { roles: ['ADMIN'] }` through the pipeline (bearer token from
  `/api/auth/api-token`). A worker, client or coordinator token: 403. A user id of the other role on `getRequester`: 404.
- **N6 Audit.** Pipeline-enforced for the declared actions (view, status change). Metadata: ids and `from`/`to`
  status. Never names, dates or conditions. With no password, the view audit is the record of who saw whose health
  information.
- **N7 Freshness.** `listRequesters` and `getRequester` answer `Cache-Control: no-store` (no private cache, no memo):
  a status change shows on the next read.
- **N8 n8n delivery.** Outbox event in the status change's transaction, so a change never happens without its
  notification and vice versa. The dispatcher's retries (6, backoff), DEAD after; the existing outbox alert covers
  dead events. The payload is built at send time from fresh rows; the outbox row holds ids only. Staging's URL is
  empty or a test endpoint, never the live webhook (NFR-6); its host joins the egress allowlist as the registration
  webhook's does.
- **N9 Performance.** The list: one statement, counts by correlated subqueries on indexed columns
  (`participants.userId`, `service_requests.requesterId`), paged (page size max as the admin lists). The detail: two
  queries (profile; participants with requests). Measured on the staging copy in the check script; no new alert.
- **N10 Logs.** One line per entry: entry name, admin user id, target id, counts, duration. No search text, no
  filter values except role, status and funding type, no personal data.
- **N11 Tests.** Unit tests for the status rules and the n8n payload mapping; a database test (CI) for the list SQL
  against an oracle and the transaction (status + audit + outbox); contract checks. A staging check script
  (untracked, as before) runs the checklist with a staging admin token.
