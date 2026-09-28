# S1 — Worker Registration: Code Generation Plan

**Slice:** S1 (first vertical slice, workflow change 2026-09-25)
**Branch:** `s1/worker-registration`, from `main` @ `25eb04e`
**Designs:** `construction/S1-registration/S1-design.md` (approved; Q1–Q3 = A) · `construction/S1-registration/S1-data-model.md` (decisions complete)
**Stories:** US-REG-01..06, US-NOT-01; enablers US-NOT-03, US-AUD-01, US-MIG-01, US-MIG-07
**Status:** **PART 2 — GENERATION.** Plan approved 2026-09-25. Steps 1–8 done and verified (step 4 before step 3; 5b added; CRM deferred).

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
- [x] `GET /v1/localities?q=`: prefix match on suburb or postcode, then later-word matches ("kilda" finds St Kilda); "suburb postcode" narrows by both; current rows only; at most 10; held in memory and reloaded hourly; `Cache-Control` 1 h
- [x] Photo upload: magic-byte check (JPEG/PNG/WebP/HEIC); server-generated key `workers/registration/<uuid>.<ext>`; staged row with an HMAC IP hash; `PhotoStore` port with Vercel Blob and local-disk adapters (`PHOTO_STORE`; local is refused in production)
- [x] Registration use case: R1–R5 in the single transaction (data model §4): user, profile + legacy location columns, services, HOME location, onboarding marker + first transition, audit, outbox. The photo is claimed inside the same transaction
- [x] HIBP check (k-anonymity, padding; unreachable → accept, record in the audit metadata, warn: Q2 = A). Checked for every email before the lookup, so a refusal reveals nothing
- **Verify:** unit tests; PBT: the response for an existing email is byte-identical to the one for a new email
- **Verified 2026-09-25:**
  - Tests: `@remonta/api` 189. That includes 18 registration tests on PostGIS: every row of the transaction; byte-identical responses as a property; two simultaneous sign-ups with one email; photo claimed once, expired, never issued; breached password refused for new and existing emails alike; atomic rollback on an injected failure (all 8 tables unchanged).
  - 8 deliberate bugs each caught: 409 for an existing email; no hash for an existing email; photo claimable twice; no transaction; breach check only for new emails; both retired-suburb guards removed; and others.
  - Live smoke test with the user's `.env`: the server boots; suburb search works; a JPEG is staged (201) and HTML renamed .jpg is refused (415); a fake token is refused by the real reCAPTCHA (403, `invalid-input-response`); live HIBP reports "password" breached (52 M).
  - All gates and `turbo run build` pass.
- **Decisions / deviations:**
  - `registration_photo_uploads.url` added to the unreleased `s1_registration` migration: the store's URL, copied to `worker_profiles.photos` on claim (migration cycle re-verified).
  - The mobile is stored as E.164 (`+614…`); legacy stored it as typed.
  - The suburb is checked in the database inside the transaction, not in the hourly cache, and `placeHome` also refuses a retired suburb (two guards).
  - The Vercel Blob SDK calls Vercel's fixed API host directly: the one outbound call not made through SafeHttpClient, with no caller-supplied URL.
  - New config: `IP_HASH_SECRET` (required), `PHOTO_STORE`, `PHOTO_LOCAL_DIR`, `BLOB_READ_WRITE_TOKEN` (required for Vercel Blob). The n8n URLs are now optional.
  - Obligations are not known at sign-up (the catalogue is not in apps/api yet), so the marker starts SIGNED_UP with zero counts; the reconciler fills them in.

### Step 8 — `apps/api` events and jobs
- [→] ~~`NotifyCrmOfRegistration`~~ **Deferred (user, 2026-09-25: "you can skip the CRM updates for now").** `zohoLeadId` is still validated and stored. The n8n URLs are optional config. Production must not switch to `api` until it exists (step 12 gate).
- [x] `SendRegistrationConfirmation` (Resend through SafeHttpClient, idempotency key per event, truthful wording: "your account is ready, you can sign in now")
- [x] `SendExistingAccountNotice`, with sign-in and reset links. Decided when the event is **queued**, not when it is sent: at most one per account per 10 minutes, none within 10 minutes of the account's creation (R5: the browser retrying its own sign-up), serialised by a per-account advisory lock
- [x] `PurgeUnclaimedRegistrationPhotos` (daily; the blob first, then the row; a failed blob delete keeps the row for the next run)
- [x] `OnboardingReconciler`:
  - runs every 5 minutes, with a watermark and a 60 s overlap;
  - picks up changed profiles, requirements, sign-ins and just-passed expiries, plus every worker without a marker;
  - uses `source = RECONCILER`, an optimistic lock, and records jumps;
  - creates or moves HOME from the legacy address via `legacy-match.ts`, which step 10 reuses. It never guesses: ambiguous or unknown addresses get no HOME.
- [x] A scheduler with a lease per job (`scheduled_jobs`), so each job runs on one instance only. Also an outbox retention job (DONE rows deleted after 30 days; DEAD rows kept) and the rate-limit purge moved onto the scheduler.
- **Verify:** outbox retry PBT (the n8n payload snapshot tests move with the deferred CRM handler)
- **Verified 2026-09-25:**
  - Tests: `@remonta/api` 214. That includes the outbox retry property (DONE exactly when a send succeeds within 6 attempts; never retried once final; given up after 62 min), 10 scheduler/purge/retention/email tests and 7 reconciler tests on PostGIS.
  - 10 deliberate bugs, each caught:
    - scheduler ignoring the lease, or its interval;
    - matcher trusting the city column first, or guessing an ambiguous postcode;
    - `EXPIRED` status ignored;
    - no idempotency key;
    - no per-account lock;
    - no R5 skip;
    - no 10-minute window.
  - Two of them first survived and exposed weak tests, which were fixed: the lease test was masked by the due check, and the lock test never really raced.
  - The real server boots and runs all four jobs with 0 errors.
  - All gates and `turbo run build` pass.
- **Decisions / deviations:**
  - New tables in the unreleased migrations: `scheduled_jobs` (s1_onboarding) and the `outbox_events(type, createdAt)` index (s1_registration). The migration cycle was re-verified.
  - Resend 4xx (except 429) is a `PermanentFailure`: the event is DEAD at once instead of being retried six times.
  - Legacy `verification_requirements` mapping:
    - `PENDING` counts as uploaded only if a document is attached;
    - `SUBMITTED` → uploaded;
    - `EXPIRED` → a lapsed approval;
    - one row per `requirementType`, the latest update winning;
    - only `isRequired` rows count.
  - `firstSignInAt` is approximated from `users.lastLoginAt` when the reconciler first sees it.
  - New config: `EMAIL_FROM`, `APP_BASE_URL`, `RECONCILER_INTERVAL_MS`.
- **Not verified:** a real email send. With the Resend test sender, Resend delivers only to the account owner's address; sending needs the user's go-ahead and, for real inboxes, a verified Remonta sender in `EMAIL_FROM`.

### Step 9 — `apps/app`: organise, remove, switch, suburb fix
- [ ] Feature folder `features/worker-registration/` (S1-design §4.1); re-check every import of a moved file
- [ ] `useRecaptcha`, `submitRegistration` (legacy | api), typed ts-rest client, switch (`switch:registration` → `REGISTRATION_BACKEND` → `legacy`)
- [ ] **`/api/suburbs` and `actions/suburbs.ts` read `au_localities`** (same response shape; no Google calls); remove the 244-row `australianPostcodes.ts` from `apps/app` if nothing else imports it (`apps/web`'s copy is checked separately, P-1)
- [ ] Remove `api/auth/register/route.ts` (the file only: the sibling `register/client/` and `register/coordinator/` routes are live and stay), `api/auth/check-email/route.ts` + the step-2 call, `Step7Verification.tsx` (if unimported); n8n URL to config in `register-async`
- **Verify:** `@remonta/app` quality within baselines; build; no import of a removed file remains (`grep`)

### Step 9 revision (user, 2026-09-25): a schema-driven form engine replaces per-screen files
**Supersedes S1-design §4.1** ("one feature folder, a file per step").
- **Why:** `apps/app` has 8 hand-copied suburb autocompletes and 11 hand-built multi-step pages. The user asked for a dynamic approach, not a file per API or per screen. The backend already works this way (one contract and one handler file per area).
- **Design** (`apps/app/src/features/forms/`):
  - `defineForm({ steps, fields, submit: <contract entry>, captcha, constants, fromQuery, adapters })`: a form is **data**.
  - `<FormWizard>`: written once. It covers steps, progress, per-step validation, server field errors, the draft on the device (fields marked `neverSaved` excluded), the offline banner, retries with a fresh CAPTCHA token per attempt, status messages and the success redirect.
  - **Field kinds**, one component each, shared by every form: `text`, `email`, `phone`, `password`, `locality`, `services`, `photo`, `consent`. Each kind knows its value, how it maps to the contract field, and its validation.
  - **Validation comes from the contract** entry's schema (api mode). A legacy adapter supplies today's `contractorFormSchema` rules and the legacy body, so **legacy mode stays exactly as today, including name rules** (user decision: the stricter name rule applies in api mode only).
- **Order:** 9.2 engine and field kinds → 9.3 the worker sign-up definition (both modes) and the switch → 9.4 step 9b. Other forms (client registration, the 8 suburb pickers) move later, one per change.
- The uncommitted per-screen work becomes the engine's internals: `retry`, `draft`, `useRecaptcha`, `useOnlineStatus`, `shrinkImage`, and the step UIs become field kinds.

**Built 2026-09-25 (9.2 `f313a9a`, 9.3 in the next commit)**, in three layers (user request: "store the form to the ui folder … separate the logic"):
1. **Logic**, framework-free: `packages/form-engine`. P-7 bans React, React Native, react-hook-form, Next, the server, the database and Node built-ins (proven by a lint probe).
2. **UI**, presentational only, in `apps/app/src/components/ui/form-wizard/`:
   - `FormWizardView` and `WizardIntro`;
   - `fields.tsx`: TextField, PasswordField, LocalityField, ServicesField (plus the pure `toggleService` / `saveSubcategories`), PhotoField, ConsentField.
   Named `form-wizard`, not `form`: `components/ui/form.tsx` already exists.
3. **Glue**, in `apps/app/src/features/forms/`:
   - `useFormWizard` (react-hook-form + engine);
   - `FormWizard` (a field kind to a component);
   - `adapters/`: browser storage and connectivity, reCAPTCHA, image shrink, suburb search;
   - `definitions/workerRegistration.ts` (worker sign-up as data, with the legacy adapter), plus `WorkerRegistrationWizard`, because a definition holds functions and cannot cross the server/client boundary.
- **Verified:**
  - Tests: engine 22 (form = contract acceptance property, fresh token per attempt, Retry-After, offline, draft never stores the password); app 8 (the definition; legacy mode posts the exact pre-S1 body; the switch; the services-picking property).
  - Real run: `apps/app` in dev, against the local database with Redis disabled (`.env` points at production Redis), in api mode with `apps/api` running. The page renders (200); `/api/suburbs` answers from `au_localities`.
  - All gates and `turbo run build` pass.
  - `apps/app` baselines tightened to 144 type / 496 lint (the replaced screens carried the removed findings).
- **Caught before it shipped:** passing the definition (with functions) from the server page to the client wizard would have crashed at runtime; typecheck cannot see it. Fixed with the client wrapper.
- **Not yet verified in a browser:** stepping through the wizard and a full api-mode sign-up with a real reCAPTCHA token (this needs the site key to allow localhost, or a preview deployment). Covered by step 12's preview check.

### Step 9 additions (user, 2026-09-25): the sign-up page survives a bad connection
- [x] Automatic retries with back-off for network errors, timeouts, 429 and 503, honouring `Retry-After`. Resending is safe: the server returns the identical 202 and never creates a duplicate
- [x] A **fresh reCAPTCHA token for every attempt**: v3 tokens are single-use and expire after 2 minutes. Today's page reuses one token, so a retry after a network blip fails (existing bug)
- [x] Offline detection: a banner, Submit held, automatic resume
- [x] Progress kept on the device (browser storage), **never the password**, cleared on success
- [x] Photo uploaded separately with its own retry and progress, and **shrunk on the device** first
- [x] Clear states: sending / still trying / done -- sign in now

### Step 9b — Query performance (user, 2026-09-25: "fast as possible" at 10,000+ users)
Measured on a local 100,000-worker benchmark (`packages/db/bench/`, results in its README). The system is read-heavy, so, following the user's notes: indexes first, then caching, then read replicas. Nothing here needs sharding, Kafka or a write-optimised database.
- [x] **Sign-in lookup:** today's `mode: "insensitive"` becomes `ILIKE`, a full scan of `users` on every sign-in (47 ms at 100 k, growing). Add `users (lower(email))` (CONCURRENTLY, its own migration) and look up `lower(email) = lower($1)` in `apps/app` sign-in (0.009 ms). This changes production sign-in, so it gets its own preview check (sign in with mixed-case input)
- [x] **Reconciler indexes** (CONCURRENTLY, own migration): `worker_profiles("updatedAt")`, `verification_requirements` (`updatedAt`, `submittedAt`, `reviewedAt`, `expiresAt`), `users("lastLoginAt")`. Scan goes from 61 ms to 1.6 ms
- [ ] **Later (a contract step, not S1):** drop the two duplicate `users.email` indexes, after checking nothing depends on their names
- [ ] Step 12: rerun the benchmark; every key query must use an index and stay under 5 ms at 100 k workers
- **Done 2026-09-25 (9.4):**
  - Seven migrations `s1_idx_*`, one CONCURRENTLY index each; the six column indexes are also declared in the schema.
  - `apps/app/src/lib/user-lookup.ts` (`lower(email) = lower($1)`), used by sign-in, impersonation and the admin impersonate route.
- **Security finding (fixed by the same change):** Prisma's `mode: "insensitive"` equals is `ILIKE` with no escaping. A sign-in lookup for `a_b@…` returned `axb@…`, and `%@domain` returned another user. Passwords were still checked, but a guess could be aimed at an unknown account, and failed attempts could push it towards lock-out.
- **Verified:**
  - Migrations: all 12 S1 migrations forward, all 7 new indexes valid, drift limited to the known point columns (Prisma ignores the expression index), every down.sql newest-first with an empty diff against `main`, re-apply.
  - Plan at 100 k users: `users_lower_email_idx`, 0.2 ms. The lookup test seeds 20 k rows, because a tiny table gave a misleading plan.
  - Tests: 4 for the lookup, with reverting to ILIKE shown to fail; all gates and `turbo run build` pass.
- **Also noted, not changed:** sign-in caches the user row, including `passwordHash` and the lock state, in Redis for 1 h (`CACHE_KEYS.user`). Worth reviewing in slice 2 (Identity).
- **Production:** the index migrations run with the other S1 migrations in step 12; CONCURRENTLY means no write lock on `users` / `worker_profiles` / `verification_requirements`. Sign-in is correct before the index exists, just not yet fast.

### Step 10 — Backfill scripts (dry run by default)
- [x] `apps/api/scripts/backfill-worker-locations.ts` (`pnpm --filter @remonta/api backfill:locations`): a HOME row for every worker without one, matched by `legacy-match.ts` on the `location` string and postcode (never the city column alone); matched / ambiguous / unmatched counted, ambiguous and unmatched rows listed for review and never guessed; `--report=<file>` writes the full JSON
- [x] `apps/api/scripts/backfill-worker-onboarding.ts` (`backfill:onboarding`): a first marker for every worker without one, `source = BACKFILL`, stage from `deriveStage`, timestamps from the rows (`initialMarker`); the report gives the stage distribution and how many timestamps had to be estimated
- [x] Both idempotent (a worker with a HOME / a marker is never touched; re-checked inside each worker's transaction), dry run by default, `--apply` required to write, keyset paging, a failed worker is listed and the run continues
- **Verify:** run on a Neon branch copy; you review both reports before any production run — **pending the Neon branch** (section 6)
- **Verified 2026-09-28 (locally):**
  - Tests: `@remonta/api` 233 (+19): 11 `initialMarker` tests including 4 properties (stage and counts are exactly deriveStage's; every timestamp is a row date or a declared `now` estimate; a milestone is set exactly when the stage reached it; pure), 4 onboarding-backfill and 4 location-backfill tests on PostGIS (dry run writes nothing; apply; idempotent; the reconciler then agrees: no stage change, HOME unchanged).
  - 3 deliberate bugs, each caught: the dry run writing; HOME written with the wrong source; `stageEnteredAt = now` for everyone.
  - Both CLIs run against the local database with 3 seeded legacy workers: dry run → apply → apply again (0 written), report file written. Output recorded in audit.md.
  - A real bug found by the tests: Prisma cursor paging over a filter the writes shrink (`onboarding: null`) skipped a page under `--apply`; replaced by keyset paging on `id`.
- **Decisions / deviations:**
  - `initialMarker` (`modules/onboarding/domain/initial-marker.ts`) is shared: the **reconciler now uses it too** when it meets a worker without a marker, so a legacy sign-up reconciled today is dated from their rows, not from the run, and the two paths cannot disagree (the reconciler's update path is unchanged).
  - Estimates are explicit: `publishedAt` = profile `updatedAt` (apps/app never records publication), `firstSignInAt` = last sign-in, and `now` only where a row has no date at all — each counted in the report.
  - The backfill does not correct the legacy `city` column (23 suburbs mis-parsed by apps/app) or fill missing legacy `latitude/longitude`; those columns are apps/app's until the contract step.
  - Trap found: `@remonta/db`'s refresh integration test TRUNCATEs `au_localities` and leaves it empty (by design, header comment). After running it locally, reload with `localities:refresh --apply`. Recorded in CLAUDE.md.

### Step 13 — Email verification before the password (scope change, user, 2026-09-28)
**User input:** "add a verification to the email address before proceeding to enter the password ... The password won't get enable when if the code entered is wrong". Service question answered first: Resend (already used on both sides; free tier 3,000/month; every send tracked in its dashboard and by the id we store).

**Design**
- **Flow (api mode):** on step 2 the worker types their email, presses *Send code*, receives a 6-digit code, types it, presses *Verify*. The password box is disabled until the email is verified; a wrong code shows an error and leaves it disabled. Changing the email address resets the verification. Legacy mode is unchanged (the legacy route cannot enforce it; legacy stays a true rollback).
- **Stateless, as the client sign-up (user, 2026-09-28: "I don't need the table ... the same approach on the client signup").** No table. The send answers a TICKET: `token = HMAC-SHA256(secret, email:code:expiresAt)` and `expiresAt` (10 min), the same signed string as apps/app's `lib/otp.ts`. The server keeps nothing; verifying recomputes the HMAC.
- **Contract (registration area), two entries:** `POST /v1/registrations/worker/email-codes` {email, captchaToken} → 202 {token, expiresAt} (CAPTCHA action `worker_email_code`, 10/h per IP); `POST /v1/registrations/worker/email-codes/verify` {email, code, token, expiresAt} → 200 {verified: true}, or 400 on `code` (wrong / expired). Guessing is bounded by the per-IP limit (30/h) and the 10-minute expiry, as in the client flow. The sign-up body gains `emailVerification` {token, expiresAt, code}.
- **No enumeration (R1):** the send never looks at `users`; every address gets a code and the same 202. An existing email verifies like a new one and then lands in the existing R1 branch at submit.
- **Send is synchronous** (not the outbox): the code exists only in memory at send time, so the handler sends through the mailer with idempotency key `email-code/<token>`; a provider failure returns 503 with Retry-After, which the form's retry handles. The ticket signs with `IP_HASH_SECRET`, the server's existing keyed-hash secret (no new configuration); rotating it invalidates codes in flight, 10 minutes at most.
- **Server enforcement (R6):** the sign-up re-checks the proof against the body's email before the users lookup, so a refusal reveals nothing; otherwise 400 on `emailVerification` ("Please verify your email address again"). Tracking is the provider's (Resend shows every send); nothing is stored on our side, as the user chose.
- **Resend cooldown:** in the UI only (60 s); the per-IP limit of 10 an hour is the real bound.
- **Form engine:** a new field kind `emailCode` { for: <email field>, sendEntry, verifyEntry } whose value is the proof (the contract's rule in api mode; nothing in legacy mode); `enabledWhen` on any field disables it until another key holds a value; `resetsOf` clears the proof when the address changes; `requestEmailCode` / `confirmEmailCode` call the contract with retries and a fresh CAPTCHA token per attempt (no React). `defineForm` checks the entries exist, that `for` names an email field on this or an earlier step, and that `enabledWhen` names a field.
- **Availability check (user, 2026-09-28: "If the user is not focus on the email address field, the api will check if the email address is being used already and that is the time the Send code button will be pressable ... should return the response fast"):** `POST /v1/registrations/worker/email-availability` {email} → {available}. One lookup on `users_lower_email_idx` (0.009 ms at 100 k), no CAPTCHA, 60/h per IP. Asked when the email field loses focus, once per address; Send code is pressable only for an available address; a taken address shows "already exists. Sign in". **This entry reveals account existence by design** (the live form already does); the send-code and sign-up entries keep their identical answers. A failed check does not block (fail open): the sign-up still handles an existing address. Engine: `availabilityEntry` on the emailCode kind, `checkEmailAvailability`; the wizard exposes field-blur events.
- **UI:** one presentational `EmailCodeField` (send / code input / verify / resend after 60 s / verified state); the wizard's glue hook owns the status and calls the engine.
- **Status: built 2026-09-28, verified locally by tests; not yet tried in a browser** (the local servers were stopped for memory and are restarted only on request).
- **Verified 2026-09-28:**
  - `@remonta/schemas` 46 tests, `@remonta/api-contract` 33 (openapi.json regenerated; 5 registration entries), `@remonta/form-engine` 47 (emailCode kind: defineForm refusals, api/legacy schema, resetsOf, request/confirm through a fake fetch), `@remonta/api` 259 (26 registration tests on PostGIS incl. 6 for the codes: ticket shape and signature, same 202 for an existing address, right/wrong/other-address/expired code, R6 at sign-up for a new and an existing email alike, 503 + Retry-After on a provider outage; 5 property tests on the ticket), `@remonta/app` quality 144/496, 85 tests.
  - 2 deliberate bugs, each caught: the sign-up no longer checking the proof; the expiry ignored.
- **Decisions / deviations:**
  - No table (user): the client sign-up's stateless scheme, through the contract and the pipeline instead of ad-hoc routes. Attempt limiting is therefore the per-IP rate limit plus the 10-minute expiry, not a counter per code; tracking of sends is Resend's dashboard.
  - The ticket is signed with `IP_HASH_SECRET` (no new configuration). apps/app's client flow signs with `NEXTAUTH_SECRET`; the two are independent.
  - Legacy mode shows no verification step: the legacy route cannot enforce one, and legacy stays a true rollback.
  - The password field is not shown until the proof exists (`visibleWhen`; user, 2026-09-28: "visible only if the code is correct"; `enabledWhen` exists too, for a disabled-but-shown field); the proof is `neverSaved`, so a restored draft verifies again.
- **To test in a browser:** the code email goes through Resend's test sender, which delivers only to the Resend account owner's address -- sign up with that address, or verify a Remonta domain in Resend first. The send step is behind reCAPTCHA, so `localhost` must be allowed on the site key.

### Step 11 — CI and docs
- [ ] `ci-api.yml`: quality, PostGIS service container, integration tests, `openapi.json` drift check
- [ ] Turbo tasks; `CLAUDE.md` gets the `apps/api` commands and the localities refresh procedure
- **Verify:** CI green on the branch

### Step 12 — Build & Test (its own AI-DLC stage)
- [ ] All gates (CLAUDE.md §2) + `@remonta/api` quality
- [ ] Local end to end with the switch on `api`: localities search → photo → register → rows present in all tables → outbox events delivered to test endpoints
- [ ] The same run with the switch on `legacy`: nothing regressed
- [ ] Vercel preview: sign in, load a dashboard, submit the registration form (legacy path), suburb search returns the complete list
- [ ] **Gate before any production switch to `api`:** the deferred CRM notification must exist, or registrations made through `apps/api` never reach the CRM
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
