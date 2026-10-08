# Code Quality Assessment (2026-10-08)

Scope: the four areas under review. For `apps/app` and `apps/web` the S1 analysis and `.brd` stand; the one route
this cycle replaces is assessed in `inception/requirements/admin-search-inventory.md`.

## Test Coverage

- **Overall:** Good in the four areas. Every guard has a test proving it rejects; the domain is property-tested; the
  database paths run against real PostGIS in CI and the bucket against a fake server.
- **Unit tests:** api 31 files / 4,363 lines (404 tests on 2026-10-05, 128 of them DB-or-bucket gated);
  api-contract 6 files (35); form-engine 4 files (58); infra 2 files (37). Property-based: `hosts`, `home`,
  `legacy-match`, `stage` (up to 5,000 runs), `initial-marker`, `email-code`, `gcs-policy`, `photo-units`,
  `notifications`, `registration.int` (byte-identical responses), form-engine (`engine`, `input`), the contract's
  retry/backoff.
- **Integration tests:** `db.int` (rate limiter exactness under concurrency, outbox once-only delivery with two
  dispatchers, crash reclaim), `jobs.int` (leases, watermarks, purge, retention), `registration.int` (543 lines:
  the full transaction, 20 simultaneous attempts, atomicity), `hostile.int`, `photo-gcs.int`, the two backfills,
  the reconciler. All `describe.skipIf(!local)`: **without `TEST_DATABASE_URL` they skip, which CLAUDE.md calls a
  weaker gate**. `deploy-api.yml`'s pre-build quality job runs without a database, so only `ci-api.yml` on the PR
  proves them.
- **Not covered:** no test touches a role-restricted entry end to end except through the test-only header
  authenticator (`test/helpers.ts`, `x-test-principal`); no PostGIS query exists to test; the admin search in
  `apps/app` has no tests at all (it is in the app's 86-test suite only indirectly, by lint and type baselines).

## Code Quality Indicators

- **Linting:** configured everywhere (ESLint 9 flat, `@remonta/config`); api forbids Nest controllers (lint + Semgrep
  + boot); boundaries P-6/P-7 proven by tests. App and web run against baselines (app 149 TypeScript and 523 ESLint
  known per the workflow comments; the state file recorded 144/488 on 2026-10-02: the baselines grew, worth a look).
- **Code style:** consistent, heavily commented with decision references (dates, question ids, rule ids); files are
  small (the largest source file in the four areas is 204 lines); ASCII diagrams in headers.
- **Documentation:** good: `docs/signup/` (flow, api, data model, events), `infra/README.md`, CLAUDE.md, the
  committed `openapi.json`, the `.brd` and the archives. Some stale text (below).

## Technical Debt

Numbered for reference from the requirements. Items marked **(cycle)** bear on this cycle's design.

1. **(cycle) No authentication on the api.** `DenyAllAuthenticator` is the only implementation
   (`apps/api/src/platform/auth/authenticator.ts`); S1's FR-ID-02/03 (short-lived token, session record) were
   deferred to "slice 2". The pipeline, `meta.access.roles`, per-user limits, CORS `authorization` header and the
   OpenAPI bearer scheme are already in place for it.
2. **(cycle) No PostGIS query exists** in `apps/api` although both location tables carry GiST-indexed geography
   points; the only readers of worker coordinates are the three `apps/app` search routes on the legacy columns,
   with the distance code copied four times and two bounding-box formulas (`.brd` STR-02).
3. **(cycle) The legacy location dual write** (`locations/domain/home.ts` `LegacyLocationColumns`;
   `reconciler.ts:90` leaves the legacy columns alone) stays until every search reader moves; `apps/app` still owns
   the source of truth for a worker's address.
4. **(cycle) 70 unplaced workers** (no HOME row) from the backfill, plus any legacy stragglers the reconciler has not
   matched; `lib/worker-search.ts` (363 lines) has zero callers.
5. **Secret reuse:** `IP_HASH_SECRET` is also the email-code ticket signer (`main.ts:52,55`); rotating one
   invalidates codes in flight. Email codes are stateless and multi-use for 10 minutes (only the pipeline's 30/h
   per-IP limit bounds guessing).
6. **Shutdown order:** the hasher closes before the HTTP server drains (`main.ts:101-102`); no try/catch around the
   shutdown steps.
7. **Timeouts that do not stop work:** the dispatcher's 15 s race leaves an ignoring handler running
   (`dispatcher.ts:85-88`); the scheduler only passes `signal` (`scheduler.ts:78-80`); the reconciler stops the whole
   run at the first failing worker with no dead-lettering (`reconciler.ts:156`).
8. **Silent catches:** `purge-photos.ts:43`, `photo-process.ts:51,83`; `audit.satisfies` passes on any `skip()`
   (`audit.ts:39`); `lastError` and mailer bodies may carry addresses unredacted; redaction depth 2.
9. **Rate-limit keys store raw client IPs** in `rate_limit_buckets` (`pipeline.ts:92`) while photos store only a
   keyed hash.
10. **Promotion proves existence, not staging success:** `deploy-api.yml:142-143` only checks the image exists;
    production reviewers are optional; the pre-build quality job skips the DB suites.
11. **Stage table duplicated** in `infra/cloudrun/lib.sh`, `bootstrap.sh` (`SECRETS`, untested) and
    `.github/scripts/api-health.sh`; `ALERT_EMAIL` and `StageConfig.alerts` unused in code;
    `PHOTO_PUBLIC_BASE_URL` names a public URL for a bucket that is now private; alpha/beta gcloud commands;
    `ci-infra.yml` ignores `packages/**` though infra depends on `@remonta/config`.
12. **Contract/doc drift:** `openapi.ts` under-lists error statuses (409/404 on confirm, 403 captcha);
    `meta.ts:41` promises `probe` is health-only but `checks.ts:51` allows any input-free GET; the form engine's
    `localityValue` schema is looser than the contract's `localitySchema`; `def.captcha` is not checked against
    `meta.bot`; `getCaptchaToken!` non-null assertion turns a missing adapter into five pointless retries.
13. **Stale text:** `ci-api.yml:15-16` and CLAUDE.md's layout line ("local/CI only until AWS"), `pnpm-workspace.yaml:3`,
    `.npmrc`'s header vs its setting, form-engine `index.ts:5` ("per backend mode"), `docs/signup/03` note that
    production lacks the S1 tables (it has them since 2026-10-02).
14. **Turbo:** `envMode: loose` keeps env out of the cache key; inconsistent task names; `vercel.json` duplicates the
    app build command three times.
15. **Config:** `N8N_REGISTRATION_WEBHOOK_URL` validated and allow-listed with no consumer; `DIRECT_DATABASE_URL`
    read by the Prisma schema but not by `config.ts`; Prisma log events configured but unsubscribed.

## Patterns and Anti-patterns

- **Good Patterns:** contract-first with boot refusal; one pipeline, parameterised by `meta()`; ports with fakes;
  transactional outbox + leased jobs; pure domain with fast-check; "prove the guard fails" tests; fail-closed
  dependencies (limiter, captcha, config); SSRF-guarded outbound client; keyless WIF restricted to `main`;
  promote-don't-rebuild; table-rendered infrastructure with a drift gate; idempotency keys on every email; keyset
  paging with per-row fallback in the backfills; optimistic locking on markers; advisory lock on the notice.
- **Anti-patterns:** distance maths in JavaScript over a bounding box with two-pass pagination (`apps/app`
  `api/admin/contractors/route.ts`, `api/client/workers/route.ts`, `api/public/workers/route.ts`); a free-text
  location geocoded by a third party with a silent fallback; response caching keyed on the raw query string with a
  hidden 500 km default; `catch {}` swallowing; `$executeRaw` for a `SELECT` (`existing-account.ts:17`); type casts
  on Prisma rows (`as LegacyRequirement[]`, `locality as Locality`); the test-only authenticator keyed on a header
  (fine in tests, must never ship).
