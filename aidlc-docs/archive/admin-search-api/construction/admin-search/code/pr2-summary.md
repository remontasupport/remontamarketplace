# PR 2 -- admin-search, api side (generated 2026-10-08)

Branch `feat/admin-search-api` from `main` `c95435c` (PR 1 merged). Commits: `b31bccf` contract, `ddacf3c` platform
cache, `e3909dd` the admin module, `874327d` the parity script and docs. PR: #42 (opened by the user from the compare link); two
more commits after CI: `5de0629` (the token test's expiry edge; the quoted `precision` alias), `d943f96` (the
registration harnesses bind the admin area). Plan: `../../plans/admin-search-code-generation-plan.md` (Parts A-F ticked).

## Files

**Created**
- `packages/api-contract/src/admin.contract.ts` -- the three entries, the query/row/response schemas, the limits,
  `privateCacheSeconds: 60`; `src/canonical.ts` -- `serializeCanonical`, `canonicalQueryOf`;
  `test/canonical.test.ts` (G6 property, csv parsing, strictness)
- `apps/api/src/platform/cache/response-memo.ts` -- the bounded LRU memo; `test/cache/response-memo.test.ts` (G7
  model-based), `test/cache/pipeline-cache.test.ts` (headers, 304, memo hit/bypass/expiry, unbound entries)
- `apps/api/src/modules/admin/domain/search-query.ts`, `application/filters.ts`, `persistence/worker-search-sql.ts`,
  `application/search-workers.ts`, `application/lists.ts`, `admin.handlers.ts`
- `apps/api/test/admin/search-query.test.ts` (R1, G5, G9 against today's rule ported), `filters.test.ts` (R3
  fragments, G4 composition, the statement's shape), `search-workers.test.ts` (R6, G10, orchestration),
  `harness.ts` + `search.int.test.ts` + `lists.int.test.ts` (gated: the 300-worker fixture, G1-G3, every filter
  alone, the combined case, invariants, S1, the lists)
- `apps/api/test/errors.test.ts`; `apps/api/scripts/parity-admin-search.ts`, `parity-cases.json` (45 cases)

**Modified**
- `packages/api-contract/src/{meta.ts, checks.ts, index.ts}`, `openapi.json` (+1,093 lines: three operations),
  `test/contract.test.ts` (the admin entries; three new rejecting rows; a `meta()` row)
- `apps/api/src/platform/pipeline/pipeline.ts` (step 7b memo, step 10b private caching), `errors.ts` (57014),
  `main.ts` (handlers + memo), `test/helpers.ts` (`memo`), `test/route-security.test.ts` (principal on GET queries;
  another undeclared route), `package.json` (`parity:admin-search`)
- `docs/admin/README.md` (sections 2-4)

## Decisions taken during generation

| # | Decision | Why |
|---|---|---|
| G1 | The memo attaches through `PipelineDeps.memo = { store, entries }` keyed by entry id | `defineHandlers` stays untouched; one place in `main.ts` names the memoised entries |
| G2 | A memo hit skips the response-schema check | the body was checked when stored; the ETag is computed on every send |
| G3 | The bypass check is `(^|[\s,])(no-cache|max-age=0)([\s,]|$)` | a `\b`-based regex written through Python arrived as literal backspace bytes and never matched; the rewritten form needs no escapes |
| G4 | The search point is a scalar subquery on `au_localities.point` by id; the locality row is read by Prisma first for the 400 and the label | the same geography column on both sides of the predicate |
| G5 | `SET LOCAL statement_timeout` is built with `Prisma.raw` from a clamped integer constant | `SET` takes no bind parameter; the value is never input |
| G6 | `COUNT(*) OVER()::int` and a second `COUNT(*)` only for a page past the end | one round trip for page and total; the empty page still needs the total |
| G7 | The suspended list reuses `shapeRow` through a Prisma select mapped to the raw row | one row shape for both lists |
| G8 | The route-security enumeration now sends the admin principal on GET-query cases | until this PR every GET was public; the pipeline's order (auth before validation) is unchanged |
| G9 | Parity suburb cases resolve their id through the public `GET /v1/localities` | the cases file stays database-independent |
| G10 | Docker Desktop answered an error on this machine; the gated suites (14 new tests) were not run locally | CI's `API Quality` job with PostGIS and the suburb list is the proof; recorded as a deviation from step D6 |
| G11 | Any harness that serves `contracts` must bind every area (`unreachableHandlers(adminContract)` in the registration harnesses) | the binder refuses to boot with an unbound entry; the first two CI runs failed on exactly that, invisible without PostGIS |

## Gates (local, 2026-10-08)

| Gate | Result |
|---|---|
| `@remonta/api-contract` quality | 48 tests (39 + 9) |
| `@remonta/api` quality | lint, strict tsc, 366 passed / 142 skipped (the new gated suites among the skips) |
| `turbo run build` | 3/3 |
| Prisma noise | none (reverted after the install); 21 files changed, all intended |

## What the staging checklist must prove (`pr2-verification.md`)

The three entries with a staging admin's token (401 without, 403 with a worker's); `EXPLAIN ANALYZE` of the
slowest geo case showing the GiST index; the parity report; the timed replay under 500 ms p95; the pool-exhaustion
drill (S9) and the rollback rehearsal (S12); then the joint promotion of PRs 1 and 2.
