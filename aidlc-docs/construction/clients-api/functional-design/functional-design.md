# U1 `clients-api` -- Functional Design (2026-10-28)

Requirements FR-1..FR-10, NFR-1..NFR-6; code structure CS-1..CS-5 (execution plan).

## Entries (admin area, `packages/api-contract/src/admin.contract.ts`)

"Requester" is the code's existing word for a client or coordinator (`service_requests.requesterId`); one set of
entries serves both roles (CS-1).

| Entry | Method, path | Meta |
|---|---|---|
| `listRequesters` | `GET /v1/admin/requesters?role=CLIENT\|COORDINATOR&search&requestStatus&fundingType&page&pageSize` | `adminRead` limits; **no private cache** (NFR-5) |
| `getRequester` | `GET /v1/admin/requesters/:userId` | admin, user 120/min; no cache; `audit: ADMIN_RECORD_VIEW` |
| `unlockSensitive` | `POST /v1/admin/sensitive-unlock` `{password}` | admin; user 5 / 15 min, ip 20 / 15 min; `audit: SENSITIVE_DATA_UNLOCK` |
| `setRequestStatus` | `PUT /v1/admin/service-requests/:requestId/status` `{status}` | admin, user 60/min; `audit: SERVICE_REQUEST_STATUS_CHANGE` |

No separate "sensitive read" entry: `getRequester` includes the sensitive fields when the admin holds a current unlock
(BR-6), so the app reads once and re-reads after an unlock (CS-4).

## Rules

- **BR-1 Lists (FR-1).** Users with the given role and a profile of that role. Row: `userId`, `firstName`, `lastName`,
  `email`, `mobile`, `organisation` (coordinators; absent for clients), `participantCount` (owned: `participants.userId`
  = the user, FR-5), `requestCount` (`service_requests.requesterId` = the user). Newest account first, then id; paged
  with the existing `paginationSchema`.
- **BR-2 Search and filters (FR-2).** `search`: case-insensitive contains on email, first or last name.
  `requestStatus`: at least one of the user's requests in that status. `fundingType`: at least one owned participant
  with it -- **needs a current unlock** (otherwise 403 `unlock required`), because the filter reveals funding type
  (decision D2). Filters combine with AND. One SQL statement (`persistence/requester-sql.ts`): `service_requests` has
  no foreign key to `users`, so Prisma relations cannot express the counts and the status filter.
- **BR-3 Detail (FR-3, FR-4).** 404 unless the user exists with that role's profile. Body: the profile row of BR-1, and
  `participants[]` (owned, newest first), each with `requests[]` (that participant's requests, newest first): `id`,
  `status`, `services`, `location`, `details` (sensitive parts per BR-5), `assignedWorkerName` (from `assignedWorker`
  if present), `createdAt`, `updatedAt`. Participant: `id`, names, `location`, `gender`, `relationshipToClient`,
  `additionalInfo`, `servicesRequested`, and the sensitive fields per BR-5. `sensitiveUnlockedUntil` (ISO) or absent.
- **BR-4 Status values** declared once: `SERVICE_REQUEST_STATUSES` in `packages/schemas` (the seven Prisma values, in
  order); the contract's enum, the filter and the status change use it (CS-3). The client routes keep their own lists
  for now (`updateServiceRequestSchema` lacks MATCHING: follow-up, out of scope).
- **BR-5 Sensitive fields** declared once (`SENSITIVE_FIELDS` beside the contract, read by the api's redaction and the
  app's lock): participant `dateOfBirth`, `conditions`, `fundingType`; request `details.fundingType` and
  `details.ndisDetails` (holds a date of birth, the NDIS number, plan manager, plan dates) -- decision D1. Without an
  unlock they are **absent** from the response, and `sensitiveLocked: true` tells the app to show the lock.
- **BR-6 The unlock (FR-9).** `unlockSensitive` compares the password with the stored bcrypt hash through the existing
  `PasswordHasher` (worker pool). Right: an audit row `SENSITIVE_DATA_UNLOCK` for the admin; answer `{unlockedUntil}`
  (now + 15 min). Wrong: 403, and an audit row `SENSITIVE_DATA_UNLOCK_FAILED` (written outside the failed request's
  transaction). **The unlock is that audit row**: an admin is unlocked while their newest `SENSITIVE_DATA_UNLOCK` row
  is under 15 minutes old -- no new table, no token for the app to hold (CS-2, CS-4). Per admin account, not per
  browser (decision D4). Hash absent in config: 503 `sensitive data unavailable`.
- **BR-7 Status change (FR-7, FR-8).** Any of the seven values, from any value. 404 unknown request. Same status: 200,
  no write, no event (repeat-safe, as `setWorkerActivation`). Otherwise one transaction: update `status` (and
  `selectedWorkers = []` when CANCELLED, as the client's cancel), the audit row (`{requestId, from, to}`), and an
  outbox event `ServiceRequestStatusChanged` `{serviceRequestId, adminUserId}` (ids only). Answer `{requestId, status}`.
- **BR-8 The n8n handler.** For `ServiceRequestStatusChanged`, reads the request and its participant fresh and posts to
  `N8N_SERVICE_REQUEST_WEBHOOK_URL` the client's Edit payload (same fields) with `action` per decision D3 and
  `changedBy: "admin"`. Non-2xx: retried by the dispatcher (backoff, 6 attempts, then DEAD). URL absent: the event
  completes with a warning log (staging may have none, NFR-6).
- **BR-9 Audit of views (FR-10).** `getRequester` records `ADMIN_RECORD_VIEW` `{requesterUserId, sensitive: bool}`.
- **BR-10 Logs** carry ids and counts only (NFR-4), one line per entry as the other admin handlers.

## Data

- Migration (expand-only): `AuditAction` += `ADMIN_RECORD_VIEW`, `SENSITIVE_DATA_UNLOCK`,
  `SENSITIVE_DATA_UNLOCK_FAILED`, `SERVICE_REQUEST_STATUS_CHANGE`; index `audit_logs (userId, action, createdAt)` for
  BR-6's lookup. Down: drop the index; the enum values stay (unused values are harmless).
- Config + `infra/lib/stages.ts` secrets: `SENSITIVE_DATA_PASSWORD_HASH` (bcrypt), `N8N_SERVICE_REQUEST_WEBHOOK_URL`
  (prod = Vercel's `Cancel_Archive_Webhook` value; staging empty or a test URL).

## Files (CS-5)

`modules/admin/application/requesters.ts` (list, detail, status change), `application/sensitive-unlock.ts`,
`persistence/requester-sql.ts`, `domain/sensitive.ts` (the redaction, one function), `admin.handlers.ts` (+4
bindings), the outbox handler beside the notification handlers, `main.ts` wiring. Reused: `adminRead`,
`paginationSchema`, `platform/audit`, `platform/outbox`, `PasswordHasher`, the `httpsUrl` config.

## Decisions for the user

**Decided 2026-10-28 (user): D1 yes, all of it; D2 needs the unlock; D3 mirror the client; D4 per admin, 15 minutes.**

- **D1** Sensitive set: participant date of birth, conditions, funding type, **and the request's funding type and NDIS
  details** (NDIS number, plan manager, plan dates, a date of birth). Recommended: all behind the password.
- **D2** The funding-type filter needs an unlock (otherwise it reveals funding). Recommended: yes.
- **D3** The n8n `action` for an admin change: mirror the client (`Cancel` for CANCELLED, `Archive` for ARCHIVED,
  `Edit` with the full payload otherwise), plus `changedBy: "admin"`. To confirm with whoever owns the n8n workflow.
- **D4** The unlock is per admin account for 15 minutes (any of their open tabs). Recommended: yes.

## Found, out of scope (follow-ups)

- `POST /api/client/service-request/action-webhook` lets any signed-in user fire the n8n webhook for any request id
  (no ownership check).
- `updateServiceRequestSchema`'s status enum lacks MATCHING.
