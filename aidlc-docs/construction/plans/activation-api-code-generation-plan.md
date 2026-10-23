# U1 `activation-api`: code generation plan (2026-10-23)

**Single source of truth for U1's code.** Branch `feat/worker-activation-api` from `main` `8943f93`; one PR; "Merge
pull request". Design: `construction/activation-api/functional-design/functional-design.md` (BR-1..BR-12, BR-11
superseded by N4) and `construction/shared/nfr-design/nfr-design.md` (N1-N7). Requirements traced: FR-1, FR-2, FR-3,
FR-6, FR-7 (api part), FR-10 (read), FR-11; NFR-1..NFR-5.

## Steps

### Step 1 -- The migration (`packages/db`) [domain entities, N2]
- [ ] `schema.prisma` `WorkerProfile`: `isActivated Boolean @default(false)`.
- [ ] `migrations/20261023120000_worker_profiles_is_activated/migration.sql` (one `ADD COLUMN`, a header comment as
      the earlier ones) and `down.sql`.
- [ ] Do not commit regenerated Prisma clients under `apps/app` (check `git diff --ignore-all-space --numstat`).

### Step 2 -- The contract (`packages/api-contract`) [contract table, N1, N3]
- [ ] `admin.contract.ts`: `activation: z.enum(['active','inactive']).optional()` and `withActivation: flag.optional()`
      on `workerSearchQuerySchema`; `activated: z.boolean().optional()` on `workerRowSchema`; `activation` optional on
      `appliedFiltersSchema`; body/response schemas; entries `setWorkerActivation`, `setWorkerSuspension` with an
      `adminWrite(limits)` meta helper (ADMIN, per-user + per-IP, 1 KB, no cache).
- [ ] `worker.contract.ts`: `getActivation` (`GET /v1/worker/activation`, `workerRead({ noCache: true })`).
- [ ] Regenerate `openapi.json`.
- [ ] Tests: `checkContracts`; N1 snapshot test (schemas equal to `main`'s except the optional keys); strict bodies
      refuse extra keys.

### Step 3 -- Admin search (`apps/api`) [BR-5, BR-6, P1, P2, P5]
- [ ] `admin/domain/search-query.ts`: `activation` and `withActivation` on `SearchQuery`; `appliedFiltersOf` echoes
      `activation`.
- [ ] `admin/application/filters.ts`: the `activation` row.
- [ ] `admin/persistence/worker-search-sql.ts`: select `p."isActivated" AS activated`; `search-workers.ts` `shapeRow`
      adds `activated` iff `withActivation` (the suspended list never passes it).
- [ ] Tests: unit (query normalisation P5, the fragment, the row shape with and without); db-gated P1, P2, the unplaced
      count with the filter.

### Step 4 -- The two writes (`apps/api`) [BR-1..BR-4, BR-7, BR-8, BR-10, P3, P4]
- [ ] `admin/application/worker-status.ts`: `setWorkerActivation(deps, workerId, activated)`,
      `setWorkerSuspension(deps, workerId, suspended)` (404s; WORKER only; no-op when unchanged).
- [ ] `admin.handlers.ts`: the two handlers with one log line each.
- [ ] Tests: unit with a fake db (404, role, mapping); db-gated P3, P4, the migration default on existing and new rows
      (a sign-up through the registration test harness reads `isActivated = false`).

### Step 5 -- The worker read (`apps/api`) [BR-9]
- [ ] `worker.handlers.ts` + a small read: `getActivation` from the caller's profile (404 without one, as the others).
- [ ] Tests: unit + db-gated (own value only; impersonation as the other reads); a worker body carrying `isActivated`
      is 400.

### Step 6 -- Docs
- [ ] `docs/admin/README.md`: the two writes, the filter, `withActivation`; `docs/worker/README.md`: `getActivation`;
      `docs/signup/`: a new profile starts inactive (the column).

### Step 7 -- Gates and PR
- [ ] `quality` for db, api-contract, api, schemas, form-engine, app (unchanged baselines); `turbo run build`.
- [ ] Push; PR compare link (`feat%2Fworker-activation-api`); CI incl. API Quality's database tests.
- [ ] After merge: staging deploy-api run green; the preview checklist (CLAUDE.md) + the new entries on staging with
      `withActivation`; then promote the full sha. **No user-facing change** (N1).
