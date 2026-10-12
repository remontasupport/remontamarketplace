# U1 `worker-area` -- code generation summary (PR 1)

Branch **`feat/worker-area`** from `main` `c51d430`, pushed 2026-10-12 (four commits: `3611b43` contract,
`937a019` module + platform, `d923e83` tests + scripts + Semgrep + infra, `2e8ecd5` docs). Compare URL:
`https://github.com/remontasupport/remontamarketplace/compare/main...feat%2Fworker-area?expand=1`
(expect 4 commits, 52 files). Plan: `../../plans/worker-area-code-generation-plan.md`, every step ticked.

## Files (U1-MNT-01)

| Area | Created (lines) | Modified (+/-) |
|---|---|---|
| `packages/api-contract` | `src/worker.contract.ts` 220 · `test/worker.test.ts` 180 | `src/index.ts` +3/-1 · `src/openapi.ts` +5/-1 · `openapi.json` regenerated |
| `apps/api/src/modules/worker` | `domain/completion.ts` 335 · `domain/service-requirements.ts` 77 · `domain/requirement-groups.ts` 121 · `domain/display-role.ts` 17 · `domain/bank-account.ts` 17 · `domain/persist-completion.ts` 42 · `persistence/profile-read.ts` 108 · `application/own-profile.ts` 30 · `application/get-profile.ts` 116 · `worker.handlers.ts` 28 · `backfill.ts` 97 | |
| `apps/api/src` platform | | `platform/persistence/db.ts` +49/-4 · `modules/platform/platform.handlers.ts` +28/-6 · `platform/pipeline/pipeline.ts` +8/-6 · `platform/errors.ts` +19/-2 · `app.ts` +8/-4 · `platform/logging.ts` +2/-1 · `platform/auth/authenticator.ts` +5/-10 (DenyAll deleted) · `main.ts` +4/-1 |
| `apps/api/test` | `worker/oracles/completion-oracle.ts` 201 · `worker/oracles/service-requirements-oracle.ts` 79 · `worker/generators.ts` 294 · `worker/completion.test.ts` 224 · `worker/requirement-groups.test.ts` 89 · `worker/units.test.ts` 144 · `worker/health.test.ts` 95 · `worker/profile.http.test.ts` 159 · `worker/harness.ts` 141 · `worker/profile.int.test.ts` 190 · `worker/backfill.test.ts` 82 · `scripts/load-worker.test.ts` 73 | `helpers.ts` +17 (log capture, `workerToken`) · `route-security.test.ts` +30/-14 (role from the entry; probes) · `pipeline.test.ts` +13 (P6) · `registration/harness.ts` +3/-3 |
| `apps/api/scripts` | `load-worker.ts` 313 · `backfill-completion.ts` 41 | `package.json` (+`autocannon` 8.0.0, `@types/autocannon`; `load:worker`, `backfill:completion`) |
| `.semgrep` | | `remonta.yml` +9/-3 (`Prisma.raw($X)` unless a string literal) · `remonta.ts` +5 (one `ruleid:`, one `ok:`) |
| `infra` | | `lib/stages.ts` prod `maxInstances 10`, `MAX_IN_FLIGHT 64` · `cloudrun/service.prod.yaml` regenerated · `test/cloudrun.test.ts` `[1, 10]`, differing env list, shed < concurrency · `README.md` +54 (cost arithmetic and budget; "Database connections"; "Drills") |
| docs | `docs/worker/README.md` 166 | `CLAUDE.md` reach line |

28 new files, 24 modified; +5,255 / -66 lines (the regenerated `openapi.json` and the lockfile included).

## Rules and properties covered

| Rule / property | Where |
|---|---|
| R1.1-R1.5 ownership | `own-profile.ts`, `profile.http.test.ts`, `profile.int.test.ts` (P1), `route-security.test.ts` |
| R2.1-R2.8 the read | `profile-read.ts` (one `readTransaction`, `SET LOCAL statement_timeout = 5000`), `get-profile.ts`, `units.test.ts` (shaping), `profile.int.test.ts` (P4, R2.8, the statement bound) |
| R3.1-R3.11 completion, the [fix] list | `completion.ts`, `completion.test.ts` (one case per fix) |
| R3.12 the oracle partition (P2) | `oracles/completion-oracle.ts`, `generators.ts` (`fixCasesOf`), `completion.test.ts`: 600 runs, equality outside the fix cases, every fix kind hit, both partitions > 50 |
| R3.10 percent (P3) | `completion.test.ts` |
| E4 the services table | `service-requirements.ts`, `oracles/service-requirements-oracle.ts`, `completion.test.ts` (every service and sub-category id) |
| R3.9 persistence (P7) | `persist-completion.ts`, `profile.int.test.ts`, `backfill.test.ts` |
| R4.1-R4.4 the groups (P5) | `requirement-groups.ts`, `requirement-groups.test.ts` |
| R5.1 displayRole | `display-role.ts`, `units.test.ts` |
| R6.1-R6.2 probes (P6) | `pipeline.ts`, `pipeline.test.ts`, `route-security.test.ts` |
| R7.1-R7.4 the load script | `load-worker.ts`, `scripts/load-worker.test.ts` (guards, mix, thresholds) |
| R8.1-R8.2 contract hygiene | `worker.contract.ts` (`workerRead`/`workerWrite`), `test/worker.test.ts` |
| P4 recent-success health, P13 f | `platform.handlers.ts`, `db.ts`, `health.test.ts` |
| P5 / P12 503 reasons | `errors.ts` (`UnavailableReason`), `app.ts`, `pipeline.ts`; asserted on captured log lines |
| P13 a-e failure injections | `profile.int.test.ts` (a pool, b timeout), `profile.http.test.ts` (c limiter, d shed, e changed row) |
| P14 the backfill | `backfill.ts`, `backfill-completion.ts`, `backfill.test.ts` |
| U1-SEC-02 redaction | `logging.ts`; `profile.http.test.ts` checks the captured lines for names and numbers |
| U1-SCL-03 | `stages.ts`, `cloudrun.test.ts` |
| U1-MNT-03 | `authenticator.ts`, `openapi.ts` (304 on cached reads, 503 everywhere), `.semgrep` |

## Facts learned from the staging copy (probe, 2026-10-12)

1,790 profiles, 1,720 with a HOME row, **1** with `profileCompleted = true`, 578 with no `setupProgress`.
`verificationStatus` holds `PENDING_REVIEW` (939), `NOT_STARTED` (850) and one legacy **`Verified`**. The `abn`
JSON is `{workerEngagementType: {type, signed: true}}` for 749 rows and `{type, value: "<number>"}` for 3.
`worker_services.subcategoryIds` are slugs (`domestic-tasks`); the names are long ("Domestic tasks (cleaning,
laundry, home organisation)"), so today's name-hyphenation never matches an id, only the `name in` half of the
query does. `CategoryDocument.documentType` has `OPTIONAL` rows (e.g. `qualification-certificate` on cleaning);
`conditionKey` is null everywhere in the sample. The catalogue: 6 categories, 26 documents, 11 sub-category links.

## Deviations from the plan and the design

1. **`verificationStatus` is a bounded string, not an enum** (E1 said enum): the column is free text and one
   production row reads `Verified`; an enum would have made that worker's read a 500. The five values are
   documented; normalising the column is a follow-up (13).
2. **"A valid ABN in the `abn` JSON"** (R3.4, R3.10) is read as *an ABN engagement that is signed, or that
   stores an 11-digit number*: nothing else is stored today. `abn.value` is reported when stored.
3. **Statement count (U1-PRF-01 "≤ 8")**: Prisma's nested selects issue one statement per relation (not per
   row): **17** on CI's first run for a worker with services (the profile, its nine relations, the catalogue and
   its five); the test holds the bound at 20 and proves it does not grow with the rows. Collapsing them needs
   Prisma's `relationJoins` preview or raw SQL, both excluded for U1 by decision (T3); revisit if the load report
   shows the read dominating.
3b. **The statement timeout is set with `set_config('statement_timeout', $1, true)`**, a bound parameter in a
   tagged template, instead of the design's `SET LOCAL` through `Prisma.raw` of a constant: the new Semgrep rule
   flagged the template form in `db.ts` on PR #50's first run (a `Prisma.raw` with a non-literal argument is exactly
   what it rejects), and the admin search's identical line was converted too, so no `Prisma.raw` remains in the
   service. Same semantics (a transaction-local setting).
4. **`platformHandlers` takes `{db, clock, lastSuccessAt?}`** (was `(db)`) for the fake clock in the tests.
5. **The catalogue query keeps today's quirk**: with no sub-category chosen, every sub-category of the matched
   categories is read (as the app does). Said in the code; U3 owns the catalogue question (Q3).
6. **`persistCompletion` does not bump `updatedAt`**, so the backfill does not make the onboarding reconciler
   revisit 1,790 workers at once; the read's ETag is of the body anyway.
7. **Test seams added**: `createDb(..., { queryEvents })`, `AppOptions.logStream` / `testApp({ logs })`, the
   `read` injection on `workerHandlers`. Tests only; production wiring unchanged.

## Gates run on this machine (2026-10-12)

| Gate | Result |
|---|---|
| `@remonta/api-contract` quality | 56 tests, lint and strict tsc green, OpenAPI drift test green |
| `@remonta/api` quality | lint, tsc green; **432 passed, 151 skipped** (the database-gated suites, incl. the new `profile.int.test.ts` and `backfill.test.ts`: CI's API Quality job is the proof; Docker is down here) |
| `@remonta/app` quality | 142 type / 471 lint known (unchanged), 122 tests |
| `@remonta/infra` quality | 40 tests, `render:check` green |
| `@remonta/form-engine`, `@remonta/schemas` | 58 / 63 tests |
| `npx turbo run build` | 3 successful (the regenerated app/web Prisma clients reverted, not committed) |
| Semgrep `--test` | not installed locally; the Semgrep workflow on the PR proves the new `ruleid:`/`ok:` lines (green on PR #50; the code-scanning check then flagged `db.ts`, fixed by 3b) |

## What Build and Test must do (PR 1)

1. Open the PR from the compare URL; CI: App/Web/API Quality, Supply chain, Package boundaries, CodeQL, Semgrep
   (the `semgrep --test` step is the one that fails on a bad rule).
2. The database-gated suites in API Quality: `test/worker/profile.int.test.ts`, `test/worker/backfill.test.ts`
   (first run anywhere).
3. After the merge deploys staging: the preview checklist (`docs/worker/README.md` §7): health, a worker token,
   `GET /v1/worker/profile` 200 then 304, the backfill dry run then `--apply` on staging, the load test
   (`--rate 25 --minutes 10 --burst 5`, report committed here), the two drills, the Neon values in
   `infra/README.md`, the A$300 budget. Then the promotion and the production backfill.
