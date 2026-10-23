# U1 `activation-api`: code generation plan (2026-10-23)

**Single source of truth for U1's code.** Branch `feat/worker-activation-api` from `main` `8943f93`; one PR; "Merge
pull request". Design: `construction/activation-api/functional-design/functional-design.md` (BR-1..BR-12, BR-11
superseded by N4) and `construction/shared/nfr-design/nfr-design.md` (N1-N7). Requirements traced: FR-1, FR-2, FR-3,
FR-6, FR-7 (api part), FR-10 (read), FR-11; NFR-1..NFR-5.

## Steps

### Step 1 -- The migration (`packages/db`) [domain entities, N2]
- [x] `schema.prisma` `WorkerProfile`: `isActivated Boolean @default(false)`.
- [x] `migrations/20261023120000_worker_profiles_is_activated/migration.sql` (one `ADD COLUMN`, a header comment as
      the earlier ones) and `down.sql`.
- [x] Do not commit regenerated Prisma clients under `apps/app` (check `git diff --ignore-all-space --numstat`).

### Step 2 -- The contract (`packages/api-contract`) [contract table, N1, N3]
- [x] `admin.contract.ts`: `activation: z.enum(['active','inactive']).optional()` and `withActivation: flag.optional()`
      on `workerSearchQuerySchema`; `activated: z.boolean().optional()` on `workerRowSchema`; `activation` optional on
      `appliedFiltersSchema`; body/response schemas; entries `setWorkerActivation`, `setWorkerSuspension` with an
      `adminWrite(limits)` meta helper (ADMIN, per-user + per-IP, 1 KB, no cache).
- [x] `worker.contract.ts`: `getActivation` (`GET /v1/worker/activation`, `workerRead({ noCache: true })`).
- [x] Regenerate `openapi.json`.
- [x] Tests: `checkContracts`; N1 snapshot test (schemas equal to `main`'s except the optional keys); strict bodies
      refuse extra keys.

### Step 3 -- Admin search (`apps/api`) [BR-5, BR-6, P1, P2, P5]
- [x] `admin/domain/search-query.ts`: `activation` and `withActivation` on `SearchQuery`; `appliedFiltersOf` echoes
      `activation`.
- [x] `admin/application/filters.ts`: the `activation` row.
- [x] `admin/persistence/worker-search-sql.ts`: select `p."isActivated" AS activated`; `search-workers.ts` `shapeRow`
      adds `activated` iff `withActivation` (the suspended list never passes it).
- [x] Tests: unit (query normalisation P5, the fragment, the row shape with and without); db-gated P1, P2, the unplaced
      count with the filter.

### Step 4 -- The two writes (`apps/api`) [BR-1..BR-4, BR-7, BR-8, BR-10, P3, P4]
- [x] `admin/application/worker-status.ts`: `setWorkerActivation(deps, workerId, activated)`,
      `setWorkerSuspension(deps, workerId, suspended)` (404s; WORKER only; no-op when unchanged).
- [x] `admin.handlers.ts`: the two handlers with one log line each.
- [x] Tests: unit with a fake db (404, role, mapping); db-gated P3, P4, the migration default on existing and new rows
      (a sign-up through the registration test harness reads `isActivated = false`).

### Step 5 -- The worker read (`apps/api`) [BR-9]
- [x] `worker.handlers.ts` + a small read: `getActivation` from the caller's profile (404 without one, as the others).
- [x] Tests: unit + db-gated (own value only; impersonation as the other reads); a worker body carrying `isActivated`
      is 400.

### Step 6 -- Docs
- [x] `docs/admin/README.md`: the two writes, the filter, `withActivation`; `docs/worker/README.md`: `getActivation`;
      `docs/signup/`: a new profile starts inactive (the column).

### Step 7 -- Gates and PR
- [x] `quality` for db, api-contract, api, schemas, form-engine, app (unchanged baselines); `turbo run build`.
- [ ] Push; PR compare link (`feat%2Fworker-activation-api`); CI incl. API Quality's database tests.
- [ ] After merge: staging deploy-api run green; the preview checklist (CLAUDE.md) + the new entries on staging with
      `withActivation`; then promote the full sha. **No user-facing change** (N1).

## Done (2026-10-23)

- Steps 1-6 written; Step 7's local gates below. Deviations from the design:
  - **BR-2:** `worker_profiles.updatedAt` has no `@updatedAt`, so activation leaves it alone (as the tour's time;
    not a profile change) instead of moving it. Suspension sets `users.updatedAt` (as the account writes).
  - **BR-11** superseded by N4 (no memo code in U1).
  - Step 4's default test creates profiles without the field (the column default) rather than through the
    registration harness: the sign-up's `create` names no `isActivated`, so it gets the same default.
  - The worker-tools N1 search check moved into `worker-activation.test.ts` against a new fixture
    `compat-2026-10-23.json` (main `8943f93`'s profile, search and suspended-list schemas).
- **Migration proven** on the developer's Neon branch (`DEV_DATABASE_URL`, 1,852 profiles) inside a rolled-back
  transaction: up adds `NOT NULL DEFAULT false`, every row reads false; down removes it.
