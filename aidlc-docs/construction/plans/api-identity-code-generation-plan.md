# Code Generation Plan -- unit `api-identity` (U1)

**Single source of truth for this unit.** Design: `../api-identity/{functional-design,nfr-requirements,nfr-design,
infrastructure-design}/`. Stories US-AS-08, 09, 10, 14, 17, 18. Requirements FR-ID-01..06, FR-PLT-01/02,
NFR-03/04/06/07/09. Two PRs carry this unit: **PR 1** (api side + contract + infra, this plan's Parts A-D) on a
code branch **`feat/api-identity` from `main`**, and the app side (Part E) inside **PR 3** with U2's page work
(branch `feat/admin-search-app`, planned in U2's code generation plan). The AI-DLC documents stay on
`aidlc/admin-search-api`, as previous cycles did: Part 0 commits them there before the code branch is cut.

## Unit context

- **Implements**: the api token's claims (contract), the JWT authenticator and the secret pair (api), the
  attributed request log, the secret in the stage table with its bootstrap and the auth-failure alert (infra), the
  token route and the client's token source (app, PR 3).
- **Depends on**: nothing in U2. U2's entries depend on this unit's authenticator at runtime; U2's tests use the
  test-only `FakeAuthenticator`, so PR 2 does not wait for PR 1.
- **Touches** (PR 1): `packages/api-contract/src/{auth.ts (new), index.ts}`, `packages/api-contract/test/auth.test.ts`
  (new); `apps/api/src/platform/auth/{authenticator.ts, jwt-authenticator.ts (new)}`,
  `apps/api/src/platform/pipeline/pipeline.ts`, `apps/api/src/config/config.ts`, `apps/api/src/main.ts`,
  `apps/api/package.json`, `apps/api/.env.example`, `apps/api/test/helpers.ts`,
  `apps/api/test/auth/jwt-authenticator.test.ts` (new), `apps/api/test/auth/attribution.test.ts` (new);
  `infra/lib/stages.ts`, `infra/cloudrun/service.{staging,prod}.yaml` (regenerated), `infra/cloudrun/bootstrap.sh`,
  `infra/cloudrun/lib.sh`, `infra/cloudrun/monitoring/auth-failed.json` (new), `infra/test/{cloudrun,monitoring}.test.ts`,
  `infra/README.md`; `docs/admin/README.md` (new).
- **Owns**: no data. The secrets `remonta-api[-staging]-API_TOKEN_SECRET[_PREVIOUS]`, the metric
  `remonta-api-auth-failed`, the policy `remonta-api auth-failed`.

## Guiding rules

- Modify in place; never a `_new` or `_modified` file. Existing tests keep passing; `FakeAuthenticator` stays for
  the route-security enumeration.
- No `jose` in `packages/api-contract` (P-6 spirit: Zod only). Both apps declare `jose` 6 directly.
- The claims schema and the constants are imported from the contract by both sides; the interop test in `apps/api`
  mints with `jose` + the contract's constants exactly as the app will (no cross-app import).
- Secrets never appear in code, tests (a test secret is a literal 32-byte string), the YAML or the docs.
- Every step that changes behaviour cites its rule (R#) or property (P#).

## Steps

### Part 0 -- branches

- [ ] **0.1 Commit the AI-DLC documents** on `aidlc/admin-search-api` (`aidlc-docs/` only; message "aidlc: admin-search
  cycle inception and design"), so the working tree is clean. Push the branch (no PR yet; the docs PR comes at the
  cycle's close as before).
- [ ] **0.2 Cut `feat/api-identity` from `main`** (`git checkout main && git pull && git checkout -b feat/api-identity`).

### Part A -- the contract (`packages/api-contract`)

- [ ] **A1 new `src/auth.ts`**: `API_TOKEN_ISSUER = 'remonta-app'`, `API_TOKEN_AUDIENCE = 'remonta-api'`,
  `API_TOKEN_TTL_S = 300`, `API_TOKEN_ALG = 'HS256'`, `API_TOKEN_KID = 'current'`, `apiTokenClaimsSchema`
  (strict: `sub` min 1, `role` enum `ROLES`, `act?` min 1, `iss` literal, `aud` literal, `iat` int, `exp` int, `jti`
  min 8), `ApiTokenClaims`, `principalOf(claims)`. Header comment: who mints, who verifies, no personal data (R1).
- [ ] **A2 `src/index.ts`**: `export * from './auth'`.
- [ ] **A3 new `test/auth.test.ts`**: P4 (strict: extra key, bad role, missing claim rejected; a valid set parses and
  `principalOf` maps `sub`/`role`/`act`), a `fast-check` property over generated valid claims (parse round-trip),
  constants pinned (`TTL 300`, `HS256`).
- [ ] **A4 `pnpm --filter @remonta/api-contract run quality`** green (the OpenAPI drift test is unaffected: no entry
  changes).

### Part B -- the api (`apps/api`)

- [ ] **B1 `package.json`**: add `"jose": "^6"` to `dependencies`; `pnpm install` (lockfile updated, no other change).
- [ ] **B2 `src/platform/auth/authenticator.ts`**: `Principal` gains `impersonatorId?: string`; the header comment
  no longer says "arrives in slice 2"; `DenyAllAuthenticator` kept (tests, and a safe default).
- [ ] **B3 new `src/platform/auth/jwt-authenticator.ts`**: `class JwtAuthenticator implements Authenticator`,
  constructor `{ secrets: { current: Uint8Array; previous?: Uint8Array }; log; clock?; skewS = 30 }`;
  `authenticate(headers)` per L2: single `authorization` header (R3.2), `Bearer` scheme, length <= 4096 (R3.3);
  pick the key by `kid` (`current`/`previous`), else try current then previous; `jose.jwtVerify(token, key,
  { algorithms: [API_TOKEN_ALG], issuer, audience, clockTolerance: skewS, currentDate })`; map `jose` errors to
  the reasons (`bad-signature`, `expired`, `not-yet-valid`, `bad-issuer`, `bad-audience`, else `malformed`);
  `apiTokenClaimsSchema.safeParse(payload)` else `bad-claims`; one `log.warn({ auth: 'rejected', reason }, 'auth
  rejected')` per refusal (R3.9); return `principalOf(claims)`. No cookie, no query (R3.1). Pure otherwise (R3.11).
- [ ] **B4 `src/config/config.ts`**: `API_TOKEN_SECRET: z.string().min(32, 'missing or shorter than 32 characters')`,
  `API_TOKEN_SECRET_PREVIOUS: z.string().min(32, ...).optional()` (optional so local `.env` files need only one;
  always present on Cloud Run per the infra design). Doc comments name the pairing rule.
- [ ] **B5 `src/platform/pipeline/pipeline.ts`**: the `Authenticator` port keeps its signature. Logging shape, final:
  the authenticator (built with the app logger) logs the refusal `{ auth: 'rejected', reason }` (one line, the
  metric's match: `jsonPayload.auth="rejected" AND jsonPayload.reason:*`); the pipeline, on `null`, logs
  `request.log.warn({ entry: id, auth: 'rejected' }, 'auth rejected')` so the entry is known too (R3.9). After a
  successful `authenticate`, `request.log = request.log.child({ userId, ...(impersonatorId && { impersonatorId }) })`
  before the role check, so the 403 line and every later line carry the ids (R4.1, R4.2). Step comment updated.
- [ ] **B6 `src/main.ts`**: `new JwtAuthenticator({ secrets: { current: utf8(config.API_TOKEN_SECRET), previous:
  config.API_TOKEN_SECRET_PREVIOUS ? utf8(...) : undefined }, log: () => app logger })`: Fastify's logger exists only
  after `createApp`, so the constructor takes a logger getter (one-line indirection) and the authenticator is built
  before `createApp`. The `DenyAllAuthenticator` import leaves `main.ts`.
- [ ] **B7 `.env.example`**: `API_TOKEN_SECRET=` (32+ chars; "the same value as the app's `API_TOKEN_SECRET` for
  this stage") and `API_TOKEN_SECRET_PREVIOUS=` (optional; rotation).
- [ ] **B8 `test/helpers.ts`**: `testApp` accepts `authenticator?: Authenticator` (default `FakeAuthenticator`).
- [ ] **B9 new `test/auth/jwt-authenticator.test.ts`**: a 32-byte test secret; a `mint(claims, key, { kid? })`
  helper using `jose.SignJWT` and the contract's constants (the app's exact recipe); example tests for every
  reason (missing, malformed scheme, too long, bad signature, expired, not-yet-valid, bad issuer, bad audience,
  bad claims incl. unknown role and extra claim, wrong `alg` e.g. `none` and `HS512`), the impersonation token
  (`act`), the previous secret (accepted with `kid: 'previous'`, with no `kid`, and rejected when no previous is
  configured), the warn line shape (a captured logger); properties P1 (round-trip), P2 (single-field corruption),
  P3 (tolerance window with an injected clock), P7 (purity); R3.1 (a cookie or query token ignored). (US-AS-14,
  US-AS-10)
- [ ] **B10 new `test/auth/attribution.test.ts`**: `testApp` with the real `JwtAuthenticator` and the synthetic
  private contract from `route-security.test.ts` (extract it to `test/fixtures/private-contract.ts`): a valid
  ADMIN token reaches the handler with `ctx.principal` populated; a WORKER token answers 403 and the captured log
  line carries `userId` and `impersonatorId`; no token answers 401 with the two warn lines. (US-AS-17)
- [ ] **B11 `pnpm --filter @remonta/api run quality`** green (lint incl. the no-controller rule, strict tsc, every
  test; the DB-gated suites skip locally as before unless `TEST_DATABASE_URL` is set).

### Part C -- infra (`infra/`)

- [ ] **C1 `lib/stages.ts`**: `SECRET_NAMES` gains `'API_TOKEN_SECRET'`, `'API_TOKEN_SECRET_PREVIOUS'`; the doc
  comment says eight and names the pairing rule with Vercel.
- [ ] **C2 `pnpm --filter @remonta/infra run render`**: both YAML files regenerated (two `secretKeyRef` entries each).
- [ ] **C3 `cloudrun/bootstrap.sh`**: `SECRETS=(...)` gains the two names; after the secret loop a new step
  "4b. Seed the previous token secret with a throwaway value (only if it has no version)":
  `exists gcloud secrets versions describe latest --secret="$SVC-API_TOKEN_SECRET_PREVIOUS" || openssl rand
  -base64 32 | gcloud secrets versions add "$SVC-API_TOKEN_SECRET_PREVIOUS" --data-file=-`; the `metric` list gains
  `remonta-api-auth-failed` with filter `resource.type="cloud_run_revision" AND jsonPayload.auth="rejected" AND
  jsonPayload.reason:*`; the header comment's step list updated. `bash -n`.
- [ ] **C4 `cloudrun/lib.sh`**: `alerts_for prod` gains `auth-failed` (staging unchanged).
- [ ] **C5 new `cloudrun/monitoring/auth-failed.json`**: exactly the policy of `infrastructure-design.md` section 4.
- [ ] **C6 `test/cloudrun.test.ts`**: the test title says "eight"; the assertion already derives from
  `SECRET_NAMES`. `test/monitoring.test.ts`: assert `auth-failed.json`'s condition (metric type, `ALIGN_SUM` 300 s,
  `COMPARISON_GT` 20, severity ERROR, autoClose 1800 s) and that prod's list contains `auth-failed` and
  staging's does not.
- [ ] **C7 `README.md`**: the pieces table says eight secrets; a new section "The api token secret" (what it is,
  the pairing rule, "Set it" runbook: generate, `gcloud secrets versions add`, Vercel Production/Preview; the
  rotation runbook from `deployment-architecture.md` section 5; the saved queries).
- [ ] **C8 `pnpm --filter @remonta/infra run quality`** green (lint, tsc, tests, `render:check`).

### Part D -- documentation and summary

- [ ] **D1 new `docs/admin/README.md`**: "The admin api" index: the token (claims, lifetime, how the app obtains
  it, how to mint one by hand on staging with a documented `node -e` one-liner using `jose` and the staging
  secret, the rejection reasons, the saved Cloud Logging queries, the rotation runbook pointer); a placeholder
  section "Entries" to be filled by PR 2.
- [ ] **D2 CLAUDE.md**: the Cloud Run block's `Secrets:` line mentions the token secret pair and the pairing rule
  with Vercel (one sentence).
- [ ] **D3 new `aidlc-docs/construction/api-identity/code/pr1-summary.md`**: files created/modified, decisions
  taken during generation (B5's logging shape, B6's logger indirection), test counts, the local gate results,
  what the staging checklist must prove (deployment-architecture section 2 step 5).
- [ ] **D4 `npx turbo run build`** green; `git diff --ignore-all-space --numstat` shows no regenerated Prisma
  client noise; commit on `feat/api-identity` with a message per part; push; open the PR with the compare link
  (slash encoded); record the PR number in the summary.

### Part E -- the app side (generated with PR 3; listed here for the unit's completeness)

- [ ] **E1 `apps/app/package.json`**: `"jose": "^6"`.
- [ ] **E2 new `apps/app/src/app/api/auth/api-token/route.ts`**: per L1 and R2 (session, account read through
  `withRetry`, 503 on a db error, 401 on inactive/role-changed, `checkServerActionRateLimit(userId,
  strictApiRateLimit)` failing open with a warn, `SignJWT` with `kid: 'current'`, `no-store`).
- [ ] **E3 new `apps/app/src/lib/api/token.ts`**: `createTokenSource` per L4 and R5.
- [ ] **E4 `apps/app/src/lib/api/admin.ts`**: the auth wrapper part (L5) -- the entries themselves are U2's.
- [ ] **E5 tests**: the route (fake session/db/limiter: each branch), the token source (P5 model-based, the retry
  table), the wrapper's single 401 retry.
- [ ] **E6** Vercel: `API_TOKEN_SECRET` set in Production and Preview before PR 3's preview is checked (operator).

## Story coverage

| Story | Steps |
|---|---|
| US-AS-14 Verify every token | A1, B3, B9 |
| US-AS-10 Impersonation refused | B3, B9, B10 |
| US-AS-17 Log, limit, alert (the U1 part) | B5, B10, C3, C5 |
| US-AS-18 Cut over (secrets first, PR 1) | C1-C8, D1, D2, deployment-architecture section 2 |
| US-AS-08 The invisible token | E2, E3, E4, E5 |
| US-AS-09 Sign-in on expiry | E2, E3, E4, E5 |
