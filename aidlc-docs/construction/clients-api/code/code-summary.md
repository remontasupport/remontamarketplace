# U1 `clients-api` -- code summary (2026-10-28)

Branch `feat/admin-clients-api` from `main` `2f418e2`, head `f0c72d1`; 4 commits, 35 files (openapi.json 1,016 lines of
additions).

| Commit | Content |
|---|---|
| `19b3f7b` | `packages/schemas/src/data/serviceRequests.ts` (`SERVICE_REQUEST_STATUSES`, `FUNDING_TYPES`; `FundingType` derived from it); migration `20261028120000_admin_clients_audit_actions` (2 `AuditAction` values, expand-only, `down.sql` keeps them on purpose); the app's committed auth client refreshed (7 files with content changes; it also catches up `MATCHING` from #121) |
| `8d2d66d` | contract: `listRequesters`, `getRequester` (audit `ADMIN_RECORD_VIEW`), `setRequestStatus` (audit `SERVICE_REQUEST_STATUS_CHANGE`); request `services`/`details` typed by the client's own `createServiceRequestSchema`; openapi additions only |
| `55f6639` | api: `application/requesters.ts`, `persistence/requester-sql.ts`, `domain/events.ts`, `domain/pagination.ts`, `outbox/service-request-webhook.ts`; 3 handler bindings; the outbox handler registered; config `N8N_SERVICE_REQUEST_WEBHOOK_URL` (`off` = none) joins the outbound hosts; tests |
| `f0c72d1` | infra: the ninth secret in `stages.ts`, `bootstrap.sh`, README, both service YAMLs rendered; `docs/admin/README.md` |

## Deviations from the plan

- **Reused `SafeHttpClient`** (host allow-list, https only, bounded) for the n8n call instead of a bare fetch; the
  plan did not know of it.
- **A 409** when the request changed between the read and the conditional update (not in the design; avoids an
  unseen overwrite).
- **`assignedWorkers: [{workerProfileId, name}]`** instead of a single name: `assignedWorker` holds a list of worker
  user ids; the profile id lets U2 link to the worker's admin page.

## Duplicate check (CS-1..CS-5)

- One list query, one row shaper, one detail, one set of entries for both roles; the role picks the profile table.
- Removed repetition found on the way: the pagination block (now `paginationOf`, used by the search, the suspended list
  and the new list); `adminRead` / `adminWrite` (now one `adminMeta`, `adminRead` adds the cache); the path id regex
  (now `recordId`, used by four params). The SQL module's query and role types come from the contract.
- Reused: `adminMeta` limits, `paginationSchema`, `readTransaction` / `unitOfWork`, the pipeline audit, `enqueue` and
  the dispatcher, `PermanentFailure`, `escapeLike`, `httpsUrl`, the events-file pattern, the client's request schemas.
- Not shared on purpose: the client routes keep their own status lists (follow-up, outside the cycle).

## Gates (local)

schemas 98 tests; db 50 (+7 database-gated, CI); api-contract 130 tests; api lint, strict tsc, 48 files / 993+ tests
green with the new unit tests (database tests incl. `requesters.int.test.ts` skipped locally: CI); infra quality +
render:check; app 40 files / 320 tests with type and lint baselines. Data fit checked read-only on the developer's Neon
branch: 28 requests, all match the client schemas (42 clients, 34 coordinators, 55 participants, 52 owned).
