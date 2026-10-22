# U1 `tools-api`: code summary (2026-10-22)

Branch `feat/worker-tools-api` (pushed, head `b52f532`), 7 commits on `main` `62e24f9`; 24 files, +3,207 / -4.
Plan: `construction/plans/tools-api-code-generation-plan.md` (steps 1-7 done).

| Step | Commit | Files |
|---|---|---|
| 1 Declaration | `c0045fc` | `packages/schemas/src/data/serviceTools.ts` (+ test: P1, P2, P5) |
| 2 Migration | `c9e7b18` | `packages/db/prisma/schema.prisma`; `migrations/20261022120000_worker_services_tools/{migration,down}.sql` |
| 3 Contract | `7cac7e4` | `worker.sections.ts` (tool shapes), `worker.contract.ts` (`getServiceTools`, `putServiceTools`), `admin.contract.ts` (`tools` query + `appliedFilters.tools`, `getWorkerServices`), `openapi.json` (additions only: 0 lines removed); tests `worker-tools.test.ts` (N1 compatibility against the fixture `compat-2026-10-22.json` from `main`'s schemas, P6), entry counts in `contract.test.ts` / `worker.sections.test.ts` |
| 4 Worker | `c6e6c3c` | `apps/api/.../sections/service-tools.ts`, `worker.handlers.ts`; tests `service-tools.test.ts` (unit, P2), `service-tools.int.test.ts` (database: P3, BR-3, BR-10, BR-14..BR-17) |
| 5 Admin | `f207093` | `admin/domain/search-query.ts`, `admin/application/filters.ts` (the `tools` row), `admin/application/worker-services.ts`, `admin.handlers.ts`; test `admin/tools.int.test.ts` (database: P4 oracle, AND with gender) |
| 6 Docs | `605960a`, `b52f532` | `docs/worker/README.md`, `docs/admin/README.md` (line endings kept as on `main`) |

## Gates (this machine, 2026-10-22)

| Gate | Result |
|---|---|
| `@remonta/schemas` quality | pass, 92 tests |
| `@remonta/api-contract` quality | pass, 117 tests |
| `@remonta/db` quality | pass, 50 (7 database-gated skipped) |
| `@remonta/form-engine` quality | pass, 76 |
| `@remonta/api` quality | pass: lint, strict tsc, 908 tests; **225 database-gated skipped** (Docker does not answer here; CI's API Quality runs them, incl. the 2 new `.int` files) |
| `@remonta/app` quality | pass: 277 lint findings all known (1 improved: the H1 leftover, follow-up 31), 286 tests |
| `npx turbo run build` | 3/3 |

## Deviations, stated

- **The app's generated Prisma clients were not committed.** The build regenerated `apps/app/src/generated/auth-client`
  with the two columns. The app deploys on merge, while production's database gets the columns only at the api's
  promotion (`deploy-api` runs `api-migrate.sh` per stage), so the app must not know them before U2. Restored with
  `git checkout`.
- The search response's `appliedFilters.tools` (found at planning) is the one allowed difference in N1's test.
- No GIN index (BR-12); the staging `EXPLAIN ANALYZE` is a Build and Test check.

## Next (Build and Test)

PR → CI green (the database-gated tests) → "Merge pull request" → staging deploys and migrates `rehearse-w1` → the
staging checks → promotion by the full sha (your word) → U2.
