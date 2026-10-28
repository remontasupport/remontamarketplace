# U1 `clients-api` -- Code Generation plan (2026-10-28)

Design: `construction/clients-api/functional-design/functional-design.md` (revised, no password), shared NFR Design.
Branch `feat/admin-clients-api` from `main` `2f418e2`. One PR; merge -> staging -> check -> promote; U2 after.

## Steps

1. **Shared values** (`packages/schemas`): `SERVICE_REQUEST_STATUSES` and `FUNDING_TYPES` as `as const` arrays in one
   new file `src/data/serviceRequests.ts`; the existing `FundingType` type in `types/serviceRequest.ts` derived from it
   (one source, CS-3). No other caller changes.
2. **Database** (`packages/db`): migration `admin_clients_audit_actions`: `ALTER TYPE "AuditAction" ADD VALUE`
   `ADMIN_RECORD_VIEW`, `SERVICE_REQUEST_STATUS_CHANGE`; `down.sql` explains why the values stay. `schema.prisma`
   enum updated. Regenerated clients: only files with real content changes are committed.
3. **Contract** (`packages/api-contract/src/admin.contract.ts`): schemas `requesterListQuerySchema`
   (`role`, `search`, `requestStatus`, `fundingType`, `page`, `pageSize` reusing the existing paging fields),
   `requesterRowSchema`, `requesterListResponseSchema` (+ `paginationSchema`), `requesterDetailSchema`
   (row + participants + requests), `requestStatusBodySchema` / `requestStatusResponseSchema`; entries
   `listRequesters`, `getRequester`, `setRequestStatus`. Meta: `adminRead`'s limits with caching off (a `noStore`
   option on `adminRead` if the helper needs one, rather than a second helper); the write with
   `audit: 'SERVICE_REQUEST_STATUS_CHANGE'`, the detail with `audit: 'ADMIN_RECORD_VIEW'`. openapi.json regenerated
   (additions only, N1).
4. **Persistence** (`apps/api/src/modules/admin/persistence/requester-sql.ts`): one parameterised `$queryRaw` for the
   page and one for the total, sharing a single WHERE builder (role, search, status EXISTS, funding EXISTS).
5. **Application** (`modules/admin/application/requesters.ts`): `listRequesters`, `getRequester` (Prisma: the user
   with its role's profile; owned participants with `serviceRequests` ordered newest first), `setRequestStatus`
   (transaction: read, compare, update, `ctx.audit.record`, `enqueue`); one `shapeRequester` used by list and detail
   (CS-1). The event name and payload type in `modules/admin/domain/events.ts` (as `registration/domain/events.ts`).
6. **The n8n handler** (`modules/admin/outbox/service-request-webhook.ts`): parses the payload, reads fresh rows,
   builds the D3 body with one pure function `webhookBodyOf(request, participant)` (unit-tested), POSTs with a
   timeout; non-2xx throws (retried), 4xx other than 408/429 is a `PermanentFailure`; URL absent logs and returns.
7. **Wiring**: `admin.handlers.ts` (+3 bindings, one log line each, N10); `main.ts` registers the outbox handler;
   `config.ts` `N8N_SERVICE_REQUEST_WEBHOOK_URL: httpsUrl.optional()`, added to the outbound host list beside the
   registration webhook (line 149); `public-endpoints.json` unchanged (admin only).
8. **Infra**: `SECRET_NAMES` + `bootstrap.sh` + `infra/README.md` gain `N8N_SERVICE_REQUEST_WEBHOOK_URL`;
   `pnpm --filter @remonta/infra run render` regenerates both service YAMLs.
9. **Tests**: contract checks; unit tests for `webhookBodyOf` (three actions, `changedBy`) and the same-status no-op;
   database tests (CI): the list against an oracle (both roles, each filter, counts, owned-only), the detail (404 on
   the other role), the transaction (status + audit + outbox row; nothing on a repeat; `selectedWorkers` cleared on
   CANCELLED). Every gate in CLAUDE.md for the touched packages.
10. **Docs**: `docs/admin/README.md` (the three entries, the n8n event). Code summary in the record, with a duplicate
    check (CS-1..CS-5).

## Reused, not added

`adminRead`, `paginationSchema`, the page / pageSize fields, `defineHandlers`, the pipeline audit, `enqueue` + the
dispatcher, `PermanentFailure`, `httpsUrl`, the events-file pattern.

## Before the merge (the user)

The secret must exist on both stages before the deploy (Cloud Run refuses a missing secret):
- prod: `printf '%s' '<the value of Vercel's Cancel_Archive_Webhook>' | gcloud secrets create remonta-api-N8N_SERVICE_REQUEST_WEBHOOK_URL --data-file=-`
- staging: a value that is **not** the live webhook -- question Q1 below.

## Question

**Q1** Staging's `N8N_SERVICE_REQUEST_WEBHOOK_URL`: A) a test n8n workflow URL if one exists; B) a harmless https URL
that answers 2xx (e.g. a webhook.site inbox you own) to see the payloads; C) leave the handler off on staging (a
config value `off` treated as absent).
