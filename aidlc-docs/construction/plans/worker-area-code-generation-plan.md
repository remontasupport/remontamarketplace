# Code Generation Plan -- unit `worker-area` (U1)

**Single source of truth for this unit.** Design: `../worker-area/{functional-design,nfr-requirements,nfr-design,
infrastructure-design}/`. Stories US-WP-26, 27 (read half), 28, 30, 31, 32. Requirements FR-WRK-01..04, 06, 08,
FR-PLT-01/02/06, NFR-01..07, 11, 12. One PR carries this unit: **PR 1** (contract + api + scripts + infra + docs) on
a code branch **`feat/worker-area` from `main`**. The AI-DLC documents stay on `aidlc/worker-profile-api` (Part 0
pushes them; the docs PR comes at the cycle's close as before).

## Unit context

- **Implements**: the `worker` contract area with `getProfile`; the worker module skeleton (handlers, ownership,
  the one-transaction read, the completion domain with its oracles, the services table, the requirement groups,
  displayRole); `persistCompletion` and the backfill script; the probe exemption and recent-success health; the
  redaction paths; the load script; the stages table change; `DenyAllAuthenticator` deleted; OpenAPI 304/503;
  the Semgrep `Prisma.raw` rule; `docs/worker/README.md`.
- **Depends on**: nothing new. The JWT authenticator (admin-search U1) admits WORKER tokens already; the
  `privateCacheSeconds` step exists.
- **Touches**: `packages/api-contract/src/{worker.contract.ts (new), index.ts, openapi.ts}`,
  `packages/api-contract/openapi.json` (regenerated), `packages/api-contract/test/{worker.test.ts (new),
  contract.test.ts}`; `apps/api/src/modules/worker/**` (new), `apps/api/src/modules/platform/platform.handlers.ts`,
  `apps/api/src/platform/persistence/db.ts`, `apps/api/src/platform/pipeline/pipeline.ts`,
  `apps/api/src/platform/logging.ts`, `apps/api/src/platform/auth/authenticator.ts`, `apps/api/src/main.ts`,
  `apps/api/package.json` (+ `autocannon` dev), `apps/api/scripts/{load-worker.ts, backfill-completion.ts} (new)`,
  `apps/api/test/worker/** (new)`, `apps/api/test/{helpers.ts, route-security.test.ts, pipeline.test.ts,
  cache/pipeline-cache.test.ts}`, `apps/api/test/registration/harness.ts`, `apps/api/test/admin/harness.ts`;
  `.semgrep/remonta.yml`, `.semgrep/remonta.ts`; `infra/lib/stages.ts`, `infra/cloudrun/service.prod.yaml`
  (regenerated), `infra/test/cloudrun.test.ts`, `infra/README.md`; `docs/worker/README.md` (new), CLAUDE.md (the
  reach line), `aidlc-docs/construction/worker-area/code/` (summaries, reports).
- **Owns**: no table. The read-only `worker.getProfile` entry; `worker_profiles.setupProgress`/`profileCompleted`
  as the persisted completion (written by the backfill in U1, by section writes from U2).

## Guiding rules

- Modify in place; never a `_new` or `_modified` file. Existing tests keep passing.
- No raw SQL in U1; the read is Prisma nested selects in one interactive transaction with `SET LOCAL
  statement_timeout` via `Prisma.raw` of a clamped integer (the admin pattern); the Semgrep rule learns to accept
  exactly that shape (a `Prisma.raw` with a non-literal argument is flagged).
- `completionOf` and `SERVICE_REQUIREMENTS` are pure; the oracles under `test/worker/oracles/` are copies of the
  app's functions adapted to take rows; nothing in the api imports from `apps/app`.
- Every step that changes behaviour cites its rule (R#), property (P#) or NFR id.
- Secrets never appear in code, tests, the YAML or the docs.
- Line endings: the repository's existing files keep theirs; new TypeScript files LF (as the api's are).

## Steps

### Part 0 -- branches

- [ ] **0.1 Push `aidlc/worker-profile-api`** (`aidlc-docs/` only, already committed) so the record is off this
  machine. No PR yet.
- [ ] **0.2 Cut `feat/worker-area` from `main`** (`git checkout main && git pull && git checkout -b feat/worker-area`).

### Part A -- the contract (`packages/api-contract`)

- [ ] **A1 new `src/worker.contract.ts`**: `workerRead(opts?)` and `workerWrite(audit, opts?)` meta helpers (R8.1:
  access `{roles: ['WORKER']}`, `bot: 'none'`, reads `[{per:'user',limit:120,window:'1m'},{per:'ip',limit:300,
  window:'1m'}]` + `maxBodyKb 1` + `privateCacheSeconds 60`; writes `[{user 60/1m},{ip 120/1m}]` + `maxBodyKb 16` +
  `audit`); the shared schemas of E1-E3 (`profileSchema` strict with every field, `completionSchema`,
  `requirementItemSchema`, `maskedBankAccountSchema`, `serviceAreaSchema`, `homeAddressSchema`, the sections'
  read schemas); `workerContract = defineContract('worker', { getProfile: { method: 'GET', path:
  '/v1/worker/profile', summary, responses: { 200: profileSchema }, meta: workerRead() } })`. Header comment: the
  area, the ownership rule (R1.1), what is added per unit.
- [ ] **A2 `src/index.ts`**: export `./worker.contract`; `contracts` gains `workerContract`.
- [ ] **A3 `src/openapi.ts`**: `errorStatuses` adds 503 for every entry (shedding, pool, timeout: U1-MNT-03) and
  the operation adds a 304 response when `meta.privateCacheSeconds` is set; regenerate `openapi.json`
  (`pnpm --filter @remonta/api-contract openapi`).
- [ ] **A4 new `test/worker.test.ts`**: `checkContracts` passes with the four areas; `getProfile` is not public, has
  both limits and `privateCacheSeconds`; a `fast-check` property that a generated `Profile` parses and an extra key
  is rejected (strict); the `workerWrite` helper refuses a missing audit at type level (a `// @ts-expect-error` case).
  `test/contract.test.ts`: the "every area" enumeration includes `worker`.
- [ ] **A5 `pnpm --filter @remonta/api-contract run quality`** green (incl. the OpenAPI drift test after A3).

### Part B -- the api module (`apps/api/src/modules/worker/`)

- [ ] **B1 `domain/completion.ts`**: `CompletionInput`, `Completion`, `completionOf` per L3 and R3.1-R3.8, R3.10;
  `baseType`, the alias map, the presence rules as named functions; pure, no imports from persistence.
- [ ] **B2 `domain/service-requirements.ts`**: `SERVICE_REQUIREMENTS` (E4, the 11 rows of `completion-today.md`),
  `requirementsFor(categoryName, subcategoryIds)` → `{required, optional}` (lower-cased, trimmed match; the
  "no subcategory" row).
- [ ] **B3 `domain/requirement-groups.ts`**: `requirementGroups(input)` per L5 and R4.1-R4.4 (`TRAINING_STEP_ORDER`
  and the folded ids copied as constants with a comment naming their app source).
- [ ] **B4 `domain/display-role.ts`**: `displayRoleOf(services)` per R5.1.
- [ ] **B5 `domain/bank-account.ts`**: `maskBankAccount(stored)` → `MaskedBankAccount | null` (last three digits; R2.3),
  `BANK_REDACT_PATHS`.
- [ ] **B6 `persistence/profile-read.ts`**: `readProfileRows(db, principal)` -- one interactive `$transaction`
  (ReadCommitted) that runs `SET LOCAL statement_timeout = 5000` (`Prisma.raw` of a constant), the profile
  `findUnique` by `userId` with nested selects (services, requirements, availability, experience, job history,
  education, additional info, `locations` where kind HOME with `locality`), then the catalogue `category.findMany`
  for the services' ids/names with documents and matching sub-categories; returns `ProfileRows | null`; ≤ 8
  statements (U1-PRF-01); `lastDbSuccessAt` updated on commit (B9).
- [ ] **B7 `application/own-profile.ts`**: `profileIdOf` is served by B6's rows (`null` → `ApiError(404,
  'WORKER_PROFILE_NOT_FOUND')` + warn log, R1.2); `assertOwned` stub for U2+ (`OwnedKind` type; 404 on mismatch).
- [ ] **B8 `application/get-profile.ts`**: `getProfile(deps, principal)` per L2: rows → `completionOf` →
  `requirementGroups` → shape to `Profile` (E1: photos parsed from today's formats, `serviceArea` from the HOME row,
  `homeAddress` null, `bankAccount` masked, `displayRole`, sections). `worker.handlers.ts`: `workerHandlers({db,
  clock})` with `getProfile` → `{status: 200, body}` and one info line `{entry: 'worker.getProfile', durationMs,
  userId}` (U1-SEC-06).
- [ ] **B9 `platform/persistence/db.ts`**: `recordDbSuccess()` / `lastDbSuccessAt()` (module-level timestamp, P4);
  `unitOfWork` and B6 call `recordDbSuccess()` after commit; `readTransaction(db, work)` helper (ReadCommitted,
  5 s timeout, the `SET LOCAL`) used by B6.
- [ ] **B10 `modules/platform/platform.handlers.ts`**: recent-success health per P4 (200 without a query when
  `now - lastDbSuccessAt ≤ 30 s`; else `SELECT 1` inside a 2 s statement-timeout transaction; 503 on failure);
  `platformHandlers({db, clock})`.
- [ ] **B11 `platform/pipeline/pipeline.ts`**: both `enforceLimits` calls skipped when `m.probe` (R6.1, L6); 503s
  from the shedder/pool/timeout/limiter carry `reason` in their log line (P12) -- the error mapping in
  `platform/errors.ts` gains the `reason` field where it builds the 503.
- [ ] **B12 `platform/logging.ts`**: the redaction list gains `*.bankAccount`, `*.bsb`, `*.accountNumber`,
  `*.streetLine`, `*.storageKey`, `*.signedUrl` (U1-SEC-02).
- [ ] **B13 `platform/auth/authenticator.ts`**: delete `DenyAllAuthenticator` (U1-MNT-03); keep the port and
  `Principal`.
- [ ] **B14 `main.ts`**: `workerHandlers({db, clock: systemClock})` in `handlerSets`; `platformHandlers({db, clock})`;
  the memo's `entries` unchanged (U1-SCL-04).
- [ ] **B15 `domain/persist-completion.ts`**: `persistCompletion(tx, profileId, completion)` per L4 (writes only on
  change; `NOT_STARTED → IN_PROGRESS`; returns `changed`).

### Part C -- tests (`apps/api/test/worker/`, others)

- [ ] **C1 `oracles/completion-oracle.ts`**: today's `getAllCompletionStatusOptimized` ported to rows (the exact
  predicates of `completion-today.md`, defects included); `oracles/service-requirements-oracle.ts`: today's
  `getServiceDocumentRequirements` copied. Header comments name the source file and date.
- [ ] **C2 `generators.ts`**: `fast-check` arbitraries for `ProfileColumns`, `ServiceRow`, `RequirementRow` (types
  from the known lists, statuses, categories), `CatalogueRows`, section counts, `additionalInfo`; a `hitsFixCase(rows)`
  classifier for R3.12's partition; exported for U2-U4.
- [ ] **C3 `completion.test.ts`**: P2 (oracle equality outside the fix cases; the fixed behaviour inside; both
  partitions non-empty via `fc.statistics` or counters); P3 (percent monotonic, bounds, 13 → 100); the services
  table equals the oracle for every known service/sub-category (E4); R3.1 whitespace case; R3.4 ABN-counts case.
- [ ] **C4 `requirement-groups.test.ts`**: P5; the splice and the folded ids; empty without services.
- [ ] **C5 `display-role.test.ts`, `bank-account.test.ts`**: R5.1 cases; masking (last three digits, null, malformed JSON).
- [ ] **C6 `profile.int.test.ts`** (database-gated): seed a worker with a profile, HOME row, sections, requirements,
  catalogue rows; `getProfile` 200 with the E1 shape; `If-None-Match` → 304; P1 ownership (a second worker's
  token sees only its own rows; an ADMIN token 403; no token 401; a WORKER without a profile 404); P4 idempotent read
  with the same ETag; the query-count assertion (≤ 8) via the Prisma query event; `profileCompleted`/`setupProgress`
  untouched by the read (R2.8).
- [ ] **C7 `persist-completion.int.test.ts`**: P7 idempotency; the `NOT_STARTED → IN_PROGRESS` transition; no write
  when unchanged.
- [ ] **C8 `health.test.ts`** (unit, fake clock): recent → 200 without a query; stale + db ok → 200 after `SELECT 1`;
  stale + db down → 503 within 2 s (P13 f).
- [ ] **C9 failure injections** (P13 a-e; database-gated where needed): `DB_POOL_SIZE=1` with two concurrent reads
  (one 503 `reason: 'pool'`, health 200); a forced statement timeout (503 `reason: 'timeout'`); the limiter table
  dropped (503 `reason: 'limiter'`, health 200 -- P6); `MAX_IN_FLIGHT=2` (503 `reason: 'shed'`; `load.test.ts`
  extended); a changed row after a 304 → 200 with a new ETag.
- [ ] **C10 existing suites**: `route-security.test.ts` enumerates the worker entry (WORKER 200, others 403, none
  401); `pipeline.test.ts` the probe branch (P6: the limiter spy never called for `platform.health`);
  `cache/pipeline-cache.test.ts` the worker read's headers; `registration/harness.ts` and `admin/harness.ts` bind
  `unreachableHandlers(workerContract)`; `helpers.ts` gains a `workerToken(userId)` helper for `FakeAuthenticator`.
- [ ] **C11 `lint.test.ts` + Semgrep**: `.semgrep/remonta.yml` rule `remonta-api-no-unsafe-raw-sql` gains a pattern
  for `Prisma.raw($X)` where `$X` is not a string literal (`pattern-not: Prisma.raw("...")`); `.semgrep/remonta.ts`
  gains one `ruleid:` line (`Prisma.raw(\`SET LOCAL ${x}\`)`) and one `ok:` line (`Prisma.raw('SET LOCAL
  statement_timeout = 5000')`); the api's B6 uses the literal form.

### Part D -- scripts (`apps/api/scripts/`)

- [ ] **D1 `package.json`**: `autocannon` (exact version) in `devDependencies`; scripts `load:worker` and
  `backfill:completion` (the backfill via `node --env-file=.env --import tsx`, as the S1 backfills).
- [ ] **D2 new `scripts/load-worker.ts`** per L7 and R7: the host guards (exit 2), `STAGING_*` secrets, N workers
  from the staging copy, token minting with `jose` (the checklist runner's `mint`), the request mix (reads only
  until U2, said in the report), phases A/B/recovery, autocannon under a token bucket, per-worker `Retry-After`
  back-off, the thresholds table (U1-PRF-03), the JSON report, exit codes. Unit tests `test/scripts/load-worker.test.ts`
  for the guards, the mix and the threshold evaluation (no network).
- [ ] **D3 new `scripts/backfill-completion.ts`** per P14: dry run by default, `--apply`, `--allow-production`,
  `--report`, batches of 200, idempotent; uses B1 + B15 + the catalogue read of B6; unit tests for the guard and
  the report shape; an int test that a second `--apply` changes nothing.

### Part E -- infra (`infra/`)

- [ ] **E1 `lib/stages.ts`**: prod `maxInstances: 10`, `MAX_IN_FLIGHT: '64'`; comment citing U1-SCL-03.
- [ ] **E2 `pnpm --filter @remonta/infra run render`** → `cloudrun/service.prod.yaml` regenerated;
  `test/cloudrun.test.ts`: `[1, 10]`; the differing-env list drops `MAX_IN_FLIGHT`; `render:check` green.
- [ ] **E3 `README.md`**: new section "Database connections (U1 worker-area)" with the Neon verification procedure
  and placeholders the operator fills (host `-pooler`, `pgbouncer=true`, compute size, `max_connections`, pooler
  limit, autoscaling, date); the cost section gains the budget step and the ten-instance arithmetic; a "Drills"
  section with the event-loop override and its restore (§5 of the infrastructure design).

### Part F -- documentation

- [ ] **F1 new `docs/worker/README.md`**: an index like `docs/signup/`: the entry (parameters, response E1, errors,
  limits, caching), the token (link to `docs/admin/`), the tables read, the completion rules with the [fix] list and
  the percent, the requirement groups, the load test and drills (link to the runbooks), the backfill, the two saved
  queries (U1-REL-02), the note on the 5xx-ratio policy and 503s.
- [ ] **F2 CLAUDE.md**: the `Reach:` line mentions the worker profile read (U1) beside the admin lists; the quality
  gate counts line left for Build and Test.
- [ ] **F3 `aidlc-docs/construction/worker-area/code/U1-summary.md`**: files created/modified with line counts
  (U1-MNT-01), the rules and properties covered, deviations, what Build and Test must run.

### Part G -- gates (local, before the PR)

- [ ] **G1** `pnpm --filter @remonta/api-contract run quality`, `pnpm --filter @remonta/api run quality` (the
  database-gated suites skip on this machine: CI's API Quality is the proof -- stated in the summary),
  `pnpm --filter @remonta/infra run quality`, `pnpm --filter @remonta/app run quality` (unchanged app; the
  contract change must not break its typecheck), `npx turbo run build`; `semgrep --test .semgrep` if available
  locally, else CI.
- [ ] **G2** `git diff --ignore-all-space --numstat` shows no regenerated Prisma client noise; commit in logical
  units (contract; module + tests; platform; scripts; infra; docs); push `feat/worker-area`; the compare URL for
  the PR with the encoded slash.

## Story traceability

| Story | Steps |
|---|---|
| US-WP-26 only my own profile | A1, B6-B8, C6, C10 |
| US-WP-27 (read half) one-statement read, caching | B6, B9, C6, C9, C10 |
| US-WP-28 completion in one place | B1, B2, B15, C1-C3, C7, D3 |
| US-WP-30 limits, shedding, the load test | A1, B11, E1-E2, D2, C9 |
| US-WP-31 audit and logs | B8, B12, C6 (log capture) |
| US-WP-32 the entries ship first | E3, F1-F3, G1-G2 (the checklist itself is Build and Test) |

**Scope:** about 30 steps; new files ≈ 14 source, ≈ 12 test, 2 scripts; modified ≈ 14. The oracles bring the app's
two functions into the api's test folder; nothing in `apps/app` changes in PR 1.
