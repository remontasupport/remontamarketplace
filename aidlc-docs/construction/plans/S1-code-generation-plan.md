# S1 — Worker Registration: Code Generation Plan

**Slice:** S1 (first vertical slice, workflow change 2026-09-25)
**Branch:** `s1/worker-registration`, from `main` @ `25eb04e`
**Designs:** `construction/S1-registration/S1-design.md` (approved; Q1–Q3 = A) · `construction/S1-registration/S1-data-model.md` (decisions complete)
**Stories:** US-REG-01..06, US-NOT-01; enablers US-NOT-03, US-AUD-01, US-MIG-01, US-MIG-07
**Status:** **PART 2 — GENERATION.** Plan approved 2026-09-25. Step 1 done and verified on local PostGIS.

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
- [ ] `scripts/localities/build.ts` (streaming reader, the filter rule, CSV writer, attribution)
- [ ] `scripts/localities/refresh.ts` (staging, diff report, `--apply`, retire-not-delete, audit)
- [ ] Unit tests with a fixture G-NAF extract (10 localities, including one with two postcodes and one dropped between releases)
- [ ] **You download** G-NAF from data.gov.au (large); I run the build and commit `au_localities.csv`
- **Verify:** re-running `refresh` on the same CSV reports 0 changes; PBT: no refresh ever orphans a `worker_locations` row

### Step 3 — `packages/api-contract` (new)
- [ ] Package, strict tsconfig, ESLint boundary (no Nest, Prisma, React or DOM imports, P-5 style); a failing fixture proves the rule rejects
- [ ] `meta()` security-metadata type; `registration.contract.ts` (3 entries); `public-endpoints.json`
- [ ] D1 check: ts-rest + Zod 4
- **Verify:** package quality passes; the boundary rule fails on a deliberate bad import

### Step 4 — `packages/schemas`: `workerRegistrationSchema`
- [ ] Strict schema (S1-design §3.3 with `localityId`), email/mobile normalisers, consent version constant
- [ ] PBT: page/server parity, normaliser idempotence, E.164 stability
- **Verify:** `@remonta/schemas` quality (P-1..P-5) passes

### Step 5 — `apps/api` platform core
- [ ] Scaffold: NestJS 11 + Fastify, Vitest, strict tsc, ESLint (shared config), `.env.example`
- [ ] `config` (Zod env, fail on missing) · `observability` (Pino, request ID, redaction list) · `errors`
- [ ] `pipeline` steps 1–11 · `policy` · `rate-limit` (Postgres) · `captcha` (reCAPTCHA v3, fails closed) · `http-clients/SafeHttpClient`
- [ ] `persistence` (Prisma client, unit-of-work) · `outbox` (writer, dispatcher with `SKIP LOCKED`, back-off, dead-letter)
- [ ] `contract` binder + startup checks (every entry has a handler, access, rate limit; public allow-list)
- [ ] Route-security enumeration test (401/403/413/429/400 for every entry)
- **Verify:** `@remonta/api` quality; the service refuses to boot with a missing secret and with an unbound contract entry (both proven by tests)

### Step 6 — `apps/api` domain: onboarding stage and location rules
- [ ] `deriveStage(facts)` (pure) + transition edges
- [ ] PBT: total and deterministic; every change is an allowed edge; replaying facts = computing from the final facts
- [ ] HOME placement from a locality (centroid, `LOCALITY`, 50 km)
- **Verify:** tests pass; each PBT property shown to fail on a deliberately broken rule

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
