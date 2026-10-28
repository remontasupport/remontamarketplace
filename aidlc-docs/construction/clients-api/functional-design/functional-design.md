# U1 `clients-api` -- Functional Design (2026-10-28, revised the same day: no password)

Requirements FR-1..FR-10, NFR-1..NFR-6; code structure CS-1..CS-5 (execution plan).

**Revision (user, 2026-10-28):** "change of design, do not apply the password for now, admin can see the details
instantly". The unlock entry, the redaction, the sensitive-field list, the password secret and the unlock index are
gone; D1, D2 and D4 lapse with them. D3 stands.

## Entries (admin area, `packages/api-contract/src/admin.contract.ts`)

"Requester" is the code's existing word for a client or coordinator (`service_requests.requesterId`); one set of
entries serves both roles (CS-1).

| Entry | Method, path | Meta |
|---|---|---|
| `listRequesters` | `GET /v1/admin/requesters?role=CLIENT\|COORDINATOR&search&requestStatus&fundingType&page&pageSize` | `adminRead` limits; **no private cache** (NFR-5) |
| `getRequester` | `GET /v1/admin/requesters/:userId` | admin, user 120/min; no cache; `audit: ADMIN_RECORD_VIEW` |
| `setRequestStatus` | `PUT /v1/admin/service-requests/:requestId/status` `{status}` | admin, user 60/min; `audit: SERVICE_REQUEST_STATUS_CHANGE` |

## Rules

- **BR-1 Lists (FR-1).** Users with the given role and a profile of that role. Row: `userId`, `firstName`, `lastName`,
  `email`, `mobile`, `organisation` (coordinators; absent for clients), `participantCount` (owned: `participants.userId`
  = the user, FR-5), `requestCount` (`service_requests.requesterId` = the user). Newest account first, then id; paged
  with the existing `paginationSchema`.
- **BR-2 Search and filters (FR-2).** `search`: case-insensitive contains on email, first or last name.
  `requestStatus`: at least one of the user's requests in that status. `fundingType`: at least one owned participant
  with it. Filters combine with AND. One SQL statement (`persistence/requester-sql.ts`): `service_requests` has no
  foreign key to `users`, so Prisma relations cannot express the counts and the status filter.
- **BR-3 Detail (FR-3, FR-4, FR-9).** 404 unless the user exists with that role's profile. Body: the profile row of
  BR-1, and `participants[]` (owned, newest first), each with every field of the row (`dateOfBirth`, `conditions`,
  `fundingType` included) and `requests[]` (that participant's requests, newest first): `id`, `status`, `services`,
  `location`, `details` (in full), `assignedWorkerName` (from `assignedWorker` if present), `createdAt`, `updatedAt`.
- **BR-4 Status values** declared once: `SERVICE_REQUEST_STATUSES` in `packages/schemas` (the seven Prisma values, in
  order); the contract's enum, the filter and the status change use it (CS-3). The client routes keep their own lists
  for now (`updateServiceRequestSchema` lacks MATCHING: follow-up, out of scope).
- **BR-5 Funding types** likewise: the contract reuses the existing `FundingType` values (from `packages/schemas`'
  request schema, exported once if not already) rather than spelling them again.
- **BR-7 Status change (FR-7, FR-8).** Any of the seven values, from any value. 404 unknown request. Same status: 200,
  no write, no event (repeat-safe, as `setWorkerActivation`). Otherwise one transaction: update `status` (and
  `selectedWorkers = []` when CANCELLED, as the client's cancel), the audit row (`{requestId, from, to}`), and an
  outbox event `ServiceRequestStatusChanged` `{serviceRequestId, adminUserId}` (ids only). Answer `{requestId, status}`.
- **BR-8 The n8n handler (D3).** For `ServiceRequestStatusChanged`, reads the request and its participant fresh and
  posts to `N8N_SERVICE_REQUEST_WEBHOOK_URL`, mirroring the client: `{action: "Cancel", zohoRecordId}` for CANCELLED,
  `{action: "Archive", zohoRecordId}` for ARCHIVED, otherwise the client's Edit payload (same fields) with
  `action: "Edit"`; every payload adds `changedBy: "admin"`. Non-2xx: retried by the dispatcher (backoff, 6 attempts,
  then DEAD). URL absent: the event completes with a warning log (staging may have none, NFR-6).
- **BR-9 Audit of views (FR-10).** `getRequester` records `ADMIN_RECORD_VIEW` `{requesterUserId}`.
- **BR-10 Logs** carry ids and counts only (NFR-4), one line per entry as the other admin handlers.

(BR-6 withdrawn with the password.)

## Data

- Migration (expand-only): `AuditAction` += `ADMIN_RECORD_VIEW`, `SERVICE_REQUEST_STATUS_CHANGE`. Down: nothing to
  undo safely (the values stay; unused values are harmless).
- Config + `infra/lib/stages.ts` secret: `N8N_SERVICE_REQUEST_WEBHOOK_URL` (prod = Vercel's `Cancel_Archive_Webhook`
  value; staging empty or a test URL).

## Files (CS-5)

`modules/admin/application/requesters.ts` (list, detail, status change), `persistence/requester-sql.ts`,
`admin.handlers.ts` (+3 bindings), the outbox handler beside the notification handlers, `main.ts` wiring. Reused:
`adminRead`, `paginationSchema`, `platform/audit`, `platform/outbox`, the `httpsUrl` config.

## Decisions

D3 (2026-10-28, user): mirror the client's actions, marked admin. D1, D2, D4 lapsed with the password.

## Found, out of scope (follow-ups)

- `POST /api/client/service-request/action-webhook` lets any signed-in user fire the n8n webhook for any request id
  (no ownership check).
- `updateServiceRequestSchema`'s status enum lacks MATCHING.
