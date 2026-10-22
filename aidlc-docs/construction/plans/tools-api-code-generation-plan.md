# U1 `tools-api`: code generation plan (2026-10-22)

**Single source of truth for U1's code.** Branch `feat/worker-tools-api` from `main` `62e24f9`; one PR; "Merge pull
request". Design: `construction/tools-api/functional-design/` (E1-E4, BR-1..BR-17, flows 1-4, P1-P5) and
`construction/shared/nfr-design/` (N1-N8). Requirements traced: FR-1, FR-3..FR-9 (U1 parts), NFR-1..NFR-5.

**Found while planning:** the search response echoes the filters (`appliedFiltersSchema`, optional fields). `tools` is
echoed there as an optional field, present only when the query has tools; the old app never sends `tools`, so it never
receives the field. N1's "unchanged" test asserts the profile and services schemas byte-for-byte and the search response
unchanged **except** that optional `appliedFilters.tools`.

## Steps

### Step 1 -- The declaration (`packages/schemas`) [FR-1, BR-1, BR-6]
- [ ] `packages/schemas/src/data/serviceTools.ts`: `SERVICE_TOOLS` (E1's 29 ids/labels, F1 order), `ToolService`,
      `TOOL_SERVICES`, `TOOL_IDS`, `toolServiceOf`, `OTHER_TOOLS_MAX` (5), `OTHER_TOOL_MAX_CHARS` (60),
      `normaliseOtherTools` (pure; returns the cleaned list, the caller checks the limits).
- [ ] `packages/schemas/src/data/serviceTools.test.ts`: examples (E1 table, the scenarios of the logic model) + P1, P5
      with fast-check.

### Step 2 -- The migration (`packages/db`) [E2]
- [ ] `packages/db/prisma/schema.prisma` `WorkerService`: `toolIds String[] @default([])`, `otherTools String[] @default([])`.
- [ ] `packages/db/prisma/migrations/20261022120000_worker_services_tools/migration.sql`: two `ADD COLUMN ... text[] NOT
      NULL DEFAULT '{}'` (expand-only; no index, BR-12).
- [ ] Do not commit regenerated Prisma clients under `apps/app` (CLAUDE.md trap); check with `git diff --ignore-all-space --numstat`.

### Step 3 -- The contract (`packages/api-contract`) [E3, E4, N1, N2]
- [ ] `worker.sections.ts` or `worker.contract.ts` (next to the services shapes): `serviceToolsBodySchema`,
      `serviceToolsSchema`, `serviceToolsViewSchema`, `serviceToolsParamsSchema`.
- [ ] `worker.contract.ts`: entries `getServiceTools` (`GET /v1/worker/services/tools`, `workerRead({ noCache: true })`)
      and `putServiceTools` (`PUT /v1/worker/services/:categoryId/tools`, `workerWrite(PROFILE_UPDATE, { maxBodyKb: 4 })`).
- [ ] `admin.contract.ts`: `tools` on `workerSearchQuerySchema` (`csv(z.enum(TOOL_IDS), TOOL_IDS.length)`); `tools`
      optional on `appliedFiltersSchema`; `adminWorkerParamsSchema`, `adminWorkerServicesSchema`; entry
      `getWorkerServices` (`GET /v1/admin/workers/:workerId/services`, `adminRead({ user: 120, ip: 300 })`).
- [ ] Regenerate `openapi.json` (`pnpm --filter @remonta/api-contract run openapi`).
- [ ] Tests: the new entries pass `checkContracts`; P6 (control characters refused); the N1 compatibility test
      (`profileSchema`, `workerServiceSchema`, `servicesViewSchema` JSON Schema equal to a snapshot taken from `main`;
      `workerSearchResponseSchema` equal except `appliedFilters.tools`).

### Step 4 -- Worker write and read (`apps/api`) [Flows 1-2, BR-2..BR-11, BR-15..BR-17]
- [ ] `apps/api/src/modules/worker/application/sections/service-tools.ts`: `writeServiceTools(tx, profileId, categoryId,
      body)` (BR-3..BR-8; 400 field messages `toolIds` / `otherTools`) and `readServiceTools(tx, profileId)` (BR-9, BR-17).
- [ ] `worker.handlers.ts`: `putServiceTools` through `replaceSection({ section: 'putServiceTools.<id>', completion: false })`;
      `getServiceTools` as the other reads.
- [ ] Tests: `apps/api/test/worker/service-tools.test.ts` (unit: P2, the scenario table, the field errors);
      `apps/api/test/worker/service-tools.int.test.ts` (database-gated: P3 round trip; 404 not chosen; removal with
      `PUT /v1/worker/services` clears, keeping a service keeps -- BR-10; the audit row; completion unchanged).

### Step 5 -- The admin filter and read (`apps/api`) [Flows 3-4, BR-12..BR-14]
- [ ] `admin/domain/search-query.ts`: `tools` and `toolsByService` on `SearchQuery`; `appliedFiltersOf` echoes `tools`.
- [ ] `admin/application/filters.ts`: the `tools` row (one `EXISTS` per service, `@>`, ANDed).
- [ ] `admin/application/worker-services.ts` + `admin.handlers.ts`: `getWorkerServices` (404 unknown; log line with the
      profile id).
- [ ] Tests: unit (query normalisation, the SQL fragment's shape); database-gated (P4 oracle against random workers;
      combines with another filter; `getWorkerServices` order, unlisted services empty, 404).

### Step 6 -- Docs [NFR-5]
- [ ] `docs/worker/README.md`: the two entries, rules, errors, the columns.
- [ ] `docs/admin/README.md`: the `tools` filter (all-of), `getWorkerServices`.

### Step 7 -- Gates, then the PR
- [ ] `pnpm --filter @remonta/schemas run quality`, `@remonta/api-contract`, `@remonta/db` (lint/types), `@remonta/api`
      (the database-gated tests skip here: Docker is down; CI's API Quality runs them), `@remonta/app` typecheck (the
      contract is shared), `npx turbo run build`.
- [ ] Commit by step (no `git add -A`); push; hand the compare link to you
      (`compare/main...feat%2Fworker-tools-api?expand=1`). The PR body lists the staging checks of Build and Test.
- [ ] Code summary `construction/tools-api/code/U1-summary.md`.

## Not in U1
Every `apps/app` change (U2). No deployment step here: merge → staging is automatic; the promotion is yours, after the
staging checks (Build and Test).
