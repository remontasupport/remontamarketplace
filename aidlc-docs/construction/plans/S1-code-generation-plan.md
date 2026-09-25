# S1 — Worker Registration: Code Generation Plan

**Slice:** S1 (first vertical slice, workflow change 2026-09-25)
**Branch:** `s1/worker-registration`, from `main` @ `25eb04e`
**Designs:** `construction/S1-registration/S1-design.md` (approved; Q1–Q3 = A) · `construction/S1-registration/S1-data-model.md` (decisions complete)
**Stories:** US-REG-01..06, US-NOT-01; enablers US-NOT-03, US-AUD-01, US-MIG-01, US-MIG-07
**Status:** **PART 2 — GENERATION.** Plan approved 2026-09-25. Steps 1–6 done and verified (step 4 before step 3; 5b added).

---

## 1. Where the two designs disagree (the data model wins)

`S1-data-model.md` was written after `S1-design.md` and changes it. Code follows the data model:

| S1-design says | Now | Why |
|---|---|---|
| §3.3 `location`: free text, 3–120 chars, parsed server-side | **`localityId`**: an id from `au_localities`, which must be current (not retired) | The worker picks from our own list; no parsing and no guessing |
| §3.5 `GeocodeWorkerLocation` handler on `WorkerRegistered` | **Removed.** Registration places the worker at the locality centroid | No geocoding call at sign-up; US-REG-05 moves to onboarding (slice 3) |
| §3.1 two endpoints | **Three**: + `GET /v1/localities?q=` (public, rate-limited) | Replaces two Google calls per keystroke |
| §3.4 transaction | + `worker_locations` HOME (50 km), `worker_onboarding` (SIGNED_UP), first transition | Data model §4 |
| — | + reconciler (5 min) and two backfill scripts | Data model §3.4, §2.2 |

**One correction to the data model, made in this plan:** a suburb can span more than one postcode, and the worker picks "Parramatta 2150", not "Parramatta". So `au_localities` has **one row per (suburb, postcode) pair**. The unique key is `(locality_pid, postcode)`, not `locality_pid` alone (`locality_pid` = G-NAF `LOCALITY.LOCALITY_PID`; renamed from `gnaf_locality_pid` 2026-09-25 because G-NAF has a different, often-empty column called `GNAF_LOCALITY_PID`). Refreshes match on that pair. `S1-data-model.md` §2.1 is updated to match when this plan is approved.

---

## 2. Constraints this plan works within

- **Migrations** (`packages/db/prisma/migrations/README.md`): each one ships a `down.sql` tested against a real database; `db push` is banned; indexes on `worker_profiles` / `verification_requirements` are created `CONCURRENTLY` in their own migration. Adding a nullable column is instant and needs no special handling.
- **Production migrations are not part of the build.** `migrate:deploy` is run deliberately. Applying S1's migrations to production is a **separate step the user approves** (§5, step 12).
- **`apps/api` does not run in production in S1.** It runs locally and in CI until Infrastructure Design delivers AWS Sydney. Consequences:
  - the switch stays `legacy` in production;
  - the reconciler does not run in production yet, so the onboarding marker stays at its backfilled values until then (no S1 screen reads it);
  - **the suburb fix reaches production anyway**, because `apps/app`'s existing `/api/suburbs` is changed to read `au_localities` directly (step 9). Workers get the complete list without waiting for AWS.
- **Tooling on this machine:** Node 20.11, pnpm, no Python, **no Docker yet**. The G-NAF loader is written in TypeScript (no `gnaf-loader`/Python). Database tests need Docker Desktop installed before step 11.
- **Existing gates stay green:** `@remonta/app` (149 ts / 518 lint baselines, tests), `@remonta/web`, `@remonta/schemas` (P-1..P-5), `turbo run build`.
- **Regenerated Prisma clients are never committed** (CLAUDE.md). Each commit is checked with `git diff --ignore-all-space --numstat`.

---

## 3. Suburb data: how it gets into the database

G-NAF is about 1.5 GB of pipe-separated files. Only three tables are needed:

| G-NAF file | Gives |
|---|---|
| `LOCALITY` | locality PID, name, state, locality class |
| `LOCALITY_POINT` | the centroid (lat/lng) |
| `ADDRESS_DETAIL` (streamed, 15.9 M rows) | the distinct postcodes used by addresses in each locality |

**Two steps, so every update is reviewable in a PR:**

1. **Build** (offline, run by a developer): `pnpm --filter @remonta/db localities:build --release=YYYYMM --src=<unzipped G-NAF>` streams the files and writes **`packages/db/data/au_localities.csv`** (≈ 16–18 k rows, ≈ 1–2 MB) plus `ATTRIBUTION.md`. The CSV is **committed**, as the licence permits with attribution. A G-NAF update then shows up as a plain PR diff of suburbs added, renamed or moved.
2. **Load** (`localities:refresh`, data model §2.1a): reads the committed CSV → staging table → diff report → applies on `--apply`. Added rows are inserted, changed rows updated in place, dropped rows retired and never deleted. Idempotent.

Only localities with at least one address, or with a gazetted class (not "unofficial"/"historic"), are kept, so the list has no ghost suburbs. The rule is written down in the build script.

---

## 4. Decisions made in this plan (defaults; say if you want otherwise)

| # | Decision | Default |
|---|---|---|
| D1 | ts-rest and Zod 4 compatibility | **Verified in step 3 before anything depends on it.** If ts-rest can't take Zod 4 schemas, the contract keeps the same shape (one file per area, same metadata) with a thin in-house binder instead. Logged, not re-asked |
| D2 | reCAPTCHA v3 in `apps/api` | Reuses the existing keys (`RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` are already in `apps/app/.env`, used by `lib/recaptcha.ts`); **you copy the secret into `apps/api/.env`** yourself (never in chat). Without it, `apps/api` refuses to boot, as designed |
| D3 | Rate-limit store | Postgres table `rate_limit_buckets` (as designed); Redis later via the port |
| D4 | `apps/api` framework | NestJS 11 + Fastify adapter, Vitest (same as `apps/app`), fast-check for PBT |
| D5 | Local database for tests | Docker Compose `postgis/postgis:16-3.4`; the same image as a GitHub Actions service container in CI |

---

## 5. Steps

Each step is **one commit**, verified before the next starts. `[ ]` → `[x]` as each one completes.

### Step 1 — `packages/db`: schema + expand migrations
- [x] Prisma models: `AuLocality`, `WorkerLocation`, `WorkerOnboarding`, `WorkerOnboardingTransition`, `OutboxEvent`, `RegistrationPhotoUpload`, `RateLimitBucket`; enums `OnboardingStage`, `LocationKind`, `LocationPrecision`, `LocationSource`; `AuditAction.ACCOUNT_REGISTERED`
- [x] `WorkerProfile` + `consentProfileShareAt`, `consentWordingVersion`, `zohoLeadId` (nullable)
- [x] Geography columns as `Unsupported("geography(Point,4326)")`, generated from lat/lng
- [x] Migrations, each with `down.sql`: `s1_postgis` · `s1_localities` · `s1_worker_locations` (partial unique HOME index, GiST) · `s1_onboarding` (indexes `(stage, stage_entered_at)`, `(stage, last_activity_at)`) · `s1_registration` (profile columns, outbox, photo uploads, rate limit, enum value)
- [→] ~~Second generator~~ **Moved to step 5 (deviation):** a second `generator` in the shared schema would also run in the `apps/app` Vercel build (its buildCommand runs a plain `prisma generate` on this schema), which is the Prisma-bundling path that failed five times in U5. Instead, `apps/api` derives a copy of the schema with its own output at build time; the shared schema and the `apps/app` build stay untouched.
- **Verify:** `migrate diff` shows only additions; forward and `down.sql` run on local PostGIS (after Docker) and on a Neon branch before step 12; `apps/app` client unchanged except the new models
- **Verified 2026-09-25:** `prisma validate` passes; the migrations contain every statement `migrate diff` generates (the only differences are the hand-written GENERATED `point` columns); `@remonta/app` quality (ts 149 known, eslint 518 known, 62/62 tests) and `@remonta/schemas` quality pass. **Verified on local PostGIS 2026-09-25** (`postgis/postgis:16-3.4`, database from `template0`): full history applies forward; 27 constraint probes behave as designed, each rejection naming its intended constraint; the `s1_registration` down refuses while an `ACCOUNT_REGISTERED` row exists; all five `down.sql` run newest-first and leave a schema identical to `main` (empty `migrate diff`); re-apply after reversal succeeds. Only drift: the two GENERATED `point` columns read as defaults (documented in the migrations README). **Still to do on the Neon branch before step 12:** same cycle, and record whether PostGIS was already installed (the `s1_postgis` down must be skipped if so).

### Step 2 — `packages/db`: G-NAF build + load scripts
- [x] `scripts/localities/build.ts` (streaming reader, the filter rule, CSV writer, attribution)
- [x] `scripts/localities/refresh.ts` (diff report, `--apply --expect=<hash>`, retire-not-delete, audit)
- [x] Unit tests with a fixture G-NAF extract (11 localities incl. Melbourne with two postcodes and one dropped between releases A and B)
- [x] G-NAF Aug 2026 downloaded by the user; `au_localities.csv` built (15,467 rows) and committed
- **Verify:** re-running `refresh` on the same CSV reports 0 changes; PBT: no refresh ever orphans a `worker_locations` row
- **Verified 2026-09-25:** 50 unit/PBT tests + 7 integration tests on local PostGIS (57); each plan property shown to fail on a deliberately broken rule (3 mutations); real release: rebuild byte-identical, dry run → apply (hash `074d18238f0f0465`) → re-run plans 0 changes; migration cycle re-run (exact reversal); `@remonta/app`/`web`/`schemas` quality and `turbo run build` pass.
- **Deviations:**
  - **Plan computed in memory, not in a staging table.** Reading, planning and applying happen in one transaction under `SHARE ROW EXCLUSIVE`; a dry run is a READ ONLY transaction. Same guarantee (production untouched until `--apply`), and the diff is a pure function that can be property-tested.
  - **`--apply` needs `--expect=<planHash>`** from the reviewed dry run, so a database that changed in between is refused.
  - **New table `au_locality_refreshes`** (added to the unreleased `s1_localities` migration): the audit trail §2.1a asks for. `audit_logs` has no fitting action and adding one needs an enum migration.
  - **Filter rule refined from the real data:** postcodes come from current *principal* addresses only; address-less localities are kept only if gazetted with a plausible `PRIMARY_POSTCODE` (placeholders 0000/9998/9999 rejected). Only Melbourne (3000/3004) has two postcodes, so the table has 15,467 rows, not the 16–18 k estimated.
  - **One centroid per locality** (`LOCALITY_POINT`), shared by its postcode rows. Only Melbourne is affected.
  - **Key column renamed** `gnafLocalityPid` → `localityPid` (user decision; commit 8193815).

### Step 3 — `packages/api-contract` (new)
- [x] Package, strict tsconfig, ESLint boundary **P-6** (no Nest, Prisma, React/Next or Node built-ins in `src/`); a fixture with 7 forbidden imports proves the rule rejects
- [x] `meta()` security-metadata type (validated at load); `registration.contract.ts` (3 entries); `public-endpoints.json` (each with a reason)
- [x] D1 check: ts-rest + Zod 4 — **fails** (see below); fallback taken as pre-agreed
- **Verify:** package quality passes; the boundary rule fails on a deliberate bad import
- **Verified 2026-09-25:** `@remonta/api-contract` quality (lint, strict tsc incl. compile-time type tests, 31 tests); 11 checks each shown to reject a bad contract; 6 malformed-meta cases rejected; a stale `@ts-expect-error` fails tsc; `@remonta/app` (149/518, 62), `@remonta/web` (76), `@remonta/schemas` quality and `turbo run build` pass.
- **D1 outcome:** ts-rest 3.52.1 (latest stable, Mar 2025) requires Zod 3; with Zod 4 its inferred request/response types are `never` and `generateOpenApi` emits `"schema": {}`. 3.53 exists only as a June 2025 RC whose OpenAPI package still needs Zod 3. **In-house instead:** `defineContract` + derived types (`BodyInput`/`BodyOutput`/`RequestInput`/`SuccessResponse`), `createClient` (validates responses), `toOpenApi` (OpenAPI 3.1 via `z.toJSONSchema`, with `x-remonta-security` per operation), `checkContracts` (for tests now, apps/api boot in step 5). Consequence for step 5: no `@ts-rest/nest`; the binder is ours.
- **Decisions:** `searchLocalities` rate limit 120/min per IP, 6,000/min global, cached 1 h (the design left it open); one error shape for all entries (`errors.ts`). `openapi.json` is committed and a test fails on drift (CI wiring in step 11).
- **Follow-up (not S1):** `packages/schemas` `UserRole` (`CLIENT | SUPPORT_WORKER | ADMIN`) is stale against the database enum; the contract uses the database values.

### Step 4 — `packages/schemas`: `workerRegistrationSchema` (done before step 3: the contract imports it)
- [x] Strict schema (S1-design §3.3 with `localityId`), email/mobile normalisers, consent version constant
- [x] PBT: page/server parity, normaliser idempotence, E.164 stability
- **Verify:** `@remonta/schemas` quality (P-1..P-5) passes
- **Verified 2026-09-25:** 40 tests; three deliberate bugs (E.164 without `+`, non-strict request, weaker server password rule) each caught; `@remonta/schemas` quality (now lint + strict tsc on the new files + tests) and `@remonta/app` quality (149/518, 62) pass.
- **Shape:** `workerRegistrationFormSchema` (what the page validates) and `workerRegistrationSchema` = form + `captchaToken` (the request); parity between them is a property test. `packages/schemas` gains `typecheck:strict` scoped to files listed in `tsconfig.strict.json`, so new code is strictly checked without re-checking the 15 tracked errors.

### Step 5 — `apps/api` platform core
- [x] Scaffold: NestJS 11 + Fastify, Vitest (SWC), strict tsc, ESLint, `.env.example`; tsup bundle
- [x] `config` (Zod env, fail on missing, values never echoed) · `observability` (Pino, request ID, redaction list) · `errors`
- [x] `pipeline` steps 1–11 · `policy` (roles; DenyAll authenticator until slice 2) · `rate-limit` (Postgres) · `captcha` (reCAPTCHA v3, fails closed) · `http-clients/SafeHttpClient`
- [x] `persistence` (derived Prisma client as `#db`, unit-of-work) · `outbox` (writer, dispatcher with lease + `SKIP LOCKED`, back-off, dead-letter)
- [x] `contract` binder + startup checks (every entry has a handler, no stray handlers, allow-list, no route outside a contract)
- [x] Route-security enumeration test (401/403/413/415/429/503/400 for every entry)
- **Verify:** `@remonta/api` quality; the service refuses to boot with a missing secret and with an unbound contract entry (both proven by tests)
- **Verified 2026-09-25:** `@remonta/api` quality (lint, strict tsc, 104 tests incl. 14 on local PostGIS); 8 deliberate bugs each caught (rate limiter failing open, CAPTCHA outage as a pass, response check removed, audit enforcement removed, unbound entries allowed, lease ignored, …); the built `dist/main.js` refuses to start on missing config and, with complete config, on the three unbound registration entries (expected until step 7); all other gates and `turbo run build` (3 apps) pass.
- **Deviations / decisions:**
  - **NestJS 11.2.6**, not the newer 12.x: the approved version. **Fastify pinned to 5.11.3**, the version `@nestjs/platform-fastify` pins, so there is one copy.
  - **No Nest controllers.** Nest is the module system; every route is created by the contract binder on the Fastify instance. A lint rule forbids Nest route decorators (tested). Nest's own not-found/error handlers are disabled so every response has the contract's error shape.
  - **Health endpoint** `GET /v1/health` added as a `platform` contract (on the public allow-list), because no route may exist outside a contract.
  - **Output shaping fails closed:** response schemas are strict, so a handler returning an undeclared field gets a 500 (logged) instead of a silently stripped response.
  - **Audit enforcement:** an entry with `audit` must record it in its transaction or explicitly skip it (e.g. existing-email registration).
  - **Back-off** 2, 4, 8, 16, 32 min: 6 attempts over about 62 min.
  - **`SKIP LOCKED` is throughput, not correctness:** a mutation test showed double delivery is prevented by the PROCESSING status + lease re-check; an adversarial in-flight test now guards that.
  - **Prisma client** generated from a derived schema copy into `apps/api/generated/db` (gitignored), imported via the `#db` package import, external to the bundle.
  - **`.env`** is loaded with `node --env-file` (Node 20.11 has no `process.loadEnvFile`).
  - Vercel installs the whole workspace, so its installs now include `apps/api` dependencies (slower install; builds unaffected).

### Step 5b — `apps/api` overload protection (added 2026-09-25, user request)
The user asked about bursts of simultaneous requests and suggested Kafka. The recommendation was overload protection inside `apps/api` instead; the queue choice stays with OI-08. The user chose it.
- [x] **Load shedding** (`LoadShedder`): a fast 503 with `Retry-After` when in-flight requests exceed `MAX_IN_FLIGHT` (256) or the event-loop p99 exceeds `MAX_EVENT_LOOP_DELAY_MS` (200). Runs before any work. The health check is exempt via `meta.loadShedding: 'exempt'`, which `checkContracts` allows only on a GET with no input.
- [x] **Bulkhead** (`Bulkhead`): bounded concurrency and queue with a queue timeout; overflow gets a 503.
- [x] **Worker-thread password hashing** (`WorkerPoolHasher`): bcryptjs cost 12 in `HASH_CONCURRENCY` worker threads (default cores − 1, at most 8), behind a bulkhead. Hashes are bcryptjs-compatible, so `apps/app` sign-in accepts them. Step 7 uses it for registration.
- [x] **Bounded DB pool:** `DB_POOL_SIZE` (10) and `DB_POOL_TIMEOUT_S` (5); a pool timeout (P2024) or an unreachable database maps to 503 + `Retry-After`, not 500.
- [x] **k6 burst test** (`apps/api/load/`): harness plus scenario, with results recorded in `load/README.md`.
- **Verified 2026-09-25:**
  - `@remonta/api` 116 tests, including shedding under real concurrency, no slot leaks across any mix of outcomes (PBT), bulkhead bounds (PBT), real pool exhaustion on PostGIS giving P2024 → 503, event loop kept free while hashing, and hashes accepted by `bcryptjs.compare`.
  - Burst at 20 sign-ups/s:
    - no protection: health checks took 6–22 s and sign-ups timed out;
    - with protection and 2 threads: health checks at 1–2 ms (100% OK); 33% of sign-ups accepted in about 1.6 s, the rest a fast 503;
    - 4 threads: 64% accepted.
  - All other gates and `turbo run build` pass.
- **Findings:**
  - (1) While bcryptjs hashes on the main thread, the process cannot accept connections, so in-process shedding cannot help. Moving hashing off the thread was required, not optional.
  - (2) The health check must be exempt, or a burst gets the instance restarted.
  - (3) Enqueue now stamps `nextAttemptAt` from the app clock. The database clock ran about 60 ms ahead, which made new events "not yet due".
  - (4) The first burst comparison was invalid (a stale process held the port) and was rerun.

### Step 6 — `apps/api` domain: onboarding stage and location rules
- [x] `deriveStage(facts)` (pure) + transition edges (`modules/onboarding/domain/`)
- [x] PBT: total and deterministic; every change is an allowed edge; replaying facts = computing from the final facts
- [x] HOME placement from a locality (centroid, `LOCALITY`, 50 km) + the legacy `worker_profiles` columns (`modules/locations/domain/home.ts`)
- **Verify:** tests pass; each PBT property shown to fail on a deliberately broken rule
- **Verified 2026-09-25:**
  - 34 new tests, including 11 properties and a witness event for each of the 23 edges;
  - 6 deliberately broken rules (obligation order, rejection ignored, zero obligations counted as verified, not total, wall clock instead of `facts.now`, live worker with a missing document) are each caught by properties, not only by examples;
  - legacy parity over all 15,467 suburbs;
  - `@remonta/api` quality: 150 tests.
- **Decisions and deviations (for review):**
  - **The stage is derived only from what the source rows hold now.** An earlier draft used "was verified before"; a property test (counterexample: upload, approve, new obligation) showed the API, the 5-minute reconciler and the backfill could then disagree for the same worker. Consequence: a verified, **unpublished** worker given a new obligation is `DOCUMENTS_IN_PROGRESS` (the diagram said `ACTION_REQUIRED`). A published one is still `ACTION_REQUIRED`.
  - **A published worker stays `PUBLISHED` while a replacement awaits review.** The first draft flagged an early renewal as `ACTION_REQUIRED`, which means "waiting on the worker".
  - **No mandatory obligations → never `VERIFIED`/`PUBLISHED`** ("nothing to check is not checked"); published with none → `ACTION_REQUIRED`.
  - A document expiring exactly now counts as expired.
  - **Edges:** the design drew 10; single real events produce 23. All are listed in `transitions.ts` with their cause. The reconciler records a multi-event jump as-is, marked `singleStep: false`.
- **Finding for step 10:** `apps/app`'s `parseLocation` mis-parses 23 real suburbs: names containing a full state name ("Mount Victoria, NSW 2786" → city "Mount") and all OT territories (state null). Existing workers there likely have a wrong `city`. The dual-write sets the columns from the suburb record, so new values are correct. The backfill must match on postcode + the `location` string, not `city`.

### Step 7 — `apps/api` registration module
- [ ] `GET /v1/localities?q=` (prefix match on suburb or postcode, current rows only, max 10, cached)
- [ ] Photo upload (magic-byte check, server-generated key, staged row, `PhotoStore` port → Vercel Blob)
- [ ] Registration use case: R1–R5; the single transaction (data model §4: user, profile + legacy location columns, services, HOME location, onboarding, transition, audit, outbox)
- [ ] HIBP check (k-anonymity; unreachable → accept, record, warn: Q2 = A)
- **Verify:** unit tests; PBT: the response for an existing email is byte-identical to the one for a new email

### Step 8 — `apps/api` events and jobs
- [ ] `NotifyCrmOfRegistration`: **both** n8n payloads, exactly as today (Q1 = A), URLs `N8N_REGISTRATION_WEBHOOK_URL`, `N8N_WEBHOOK_URL`
- [ ] `SendRegistrationConfirmation` (Resend, idempotency key = event ID, truthful wording) · `SendExistingAccountNotice` (1 per email per 10 min)
- [ ] `PurgeUnclaimedRegistrationPhotos` (daily) · `OnboardingReconciler` (every 5 min, watermark, `source = RECONCILER`)
- **Verify:** payload snapshot tests against today's two payloads, field for field; outbox retry PBT

### Step 9 — `apps/app`: organise, remove, switch, suburb fix
- [ ] Feature folder `features/worker-registration/` (S1-design §4.1); re-check every import of a moved file
- [ ] `useRecaptcha`, `submitRegistration` (legacy | api), typed ts-rest client, switch (`switch:registration` → `REGISTRATION_BACKEND` → `legacy`)
- [ ] **`/api/suburbs` and `actions/suburbs.ts` read `au_localities`** (same response shape; no Google calls); remove the 244-row `australianPostcodes.ts` from `apps/app` if nothing else imports it (`apps/web`'s copy is checked separately, P-1)
- [ ] Remove `api/auth/register/route.ts` (the file only: the sibling `register/client/` and `register/coordinator/` routes are live and stay), `api/auth/check-email/route.ts` + the step-2 call, `Step7Verification.tsx` (if unimported); n8n URL to config in `register-async`
- **Verify:** `@remonta/app` quality within baselines; build; no import of a removed file remains (`grep`)

### Step 10 — Backfill scripts (dry run by default)
- [ ] `backfill-worker-locations.ts`: postcode + suburb → `au_localities`; the report lists matched, unmatched and ambiguous; unmatched rows are never guessed
- [ ] `backfill-worker-onboarding.ts`: `deriveStage` for every worker, `source = BACKFILL`, best available timestamps
- [ ] Both idempotent; `--apply` required to write
- **Verify:** run on a Neon branch copy; you review both reports before any production run

### Step 11 — CI and docs
- [ ] `ci-api.yml`: quality, PostGIS service container, integration tests, `openapi.json` drift check
- [ ] Turbo tasks; `CLAUDE.md` gets the `apps/api` commands and the localities refresh procedure
- **Verify:** CI green on the branch

### Step 12 — Build & Test (its own AI-DLC stage)
- [ ] All gates (CLAUDE.md §2) + `@remonta/api` quality
- [ ] Local end to end with the switch on `api`: localities search → photo → register → rows present in all tables → outbox events delivered to test endpoints
- [ ] The same run with the switch on `legacy`: nothing regressed
- [ ] Vercel preview: sign in, load a dashboard, submit the registration form (legacy path), suburb search returns the complete list
- [ ] **Production (separate approval):** record `SELECT extversion FROM pg_extension WHERE extname = 'postgis'` first (decides whether the `s1_postgis` down applies) → apply the migrations → load localities → backfill dry runs → you approve → `--apply` → merge (a merge commit, not squash) → verify production

---

## 6. What you need to do during generation

| When | What |
|---|---|
| Before step 1 is verified | Install **Docker Desktop** |
| Step 2 | Download the latest **G-NAF** release (GDA2020, PSV) from data.gov.au and tell me the folder |
| Step 5 | Put `RECAPTCHA_SECRET_KEY`, `RESEND_API_KEY`, both n8n URLs and `AUTH_DATABASE_URL` into `apps/api/.env` |
| Before step 12 | Create a **Neon branch** for the migration, down.sql and backfill rehearsal |

---

## 7. Risks

| Risk | Mitigation |
|---|---|
| PostGIS not enabled on the Neon project | `s1_postgis` runs first on a Neon branch; if it's refused, the fallback is lat/lng + a bounding-box index (the matching queries are behind one adapter) |
| n8n workflows depend on exact payloads | Snapshot tests on both payloads, field for field |
| A moved file is imported somewhere unexpected | Every move is followed by a whole-repo `grep` plus build |
| Suburb shape change breaks the legacy form | `/api/suburbs` keeps its response shape; verified in the preview |
| The backfill mismatches suburbs | Dry run first; unmatched rows are listed, never guessed |
