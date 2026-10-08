# Tech Stack Decisions -- unit `api-identity` (U1)

| # | Decision | Chosen | Alternatives considered | Why |
|---|---|---|---|---|
| T1 | Token format | JWT (compact JWS), HS256, 5-minute lifetime | opaque random token with a server-side lookup; asymmetric RS256/EdDSA | stateless verification in-process (no lookup, no network); one shared secret per stage is enough for two first-party sides; asymmetric keys buy nothing while the only verifier is the api |
| T2 | Library | `jose` 6.x in `apps/api` and `apps/app` (direct dependencies) | hand-written HMAC JWT; `jsonwebtoken` | audited, ESM, no dependencies, used by NextAuth already; `jsonwebtoken` is CommonJS with a larger surface; a hand-written JWT would need the corner cases `jose` already handles (alg confusion, base64url, timing-safe compare) |
| T3 | Claims definition | Zod schema and constants in `packages/api-contract/src/auth.ts` | a copy in each app | one definition, P-6 respected (Zod only); both sides compile against it |
| T4 | Minting | a Next.js route `GET /api/auth/api-token` reading `getSession()` and the `users` row, signing with `jose.SignJWT` | a NextAuth callback adding the token to the session; a server action | a route keeps the token out of the session object (never serialised into the cookie), is cacheable as `no-store`, and can read the account's current status |
| T5 | Verification | `JwtAuthenticator` on the existing `Authenticator` port, `jose.jwtVerify` with `algorithms: ['HS256']`, issuer, audience, `clockTolerance: 30` | a Fastify plugin; a Nest guard | the pipeline already has the step; guards are forbidden by the contract-only rule |
| T6 | Secret handling | `API_TOKEN_SECRET` (+ optional `API_TOKEN_SECRET_PREVIOUS`) as UTF-8 bytes; `kid: 'current'` on minted tokens; Secret Manager (api) and Vercel env (app) | a key file; a JWKS endpoint | no keys on disk; rotation without downtime through the previous secret; a JWKS is for asymmetric keys |
| T7 | Token transport in the browser | in-memory token source; `Authorization: Bearer` on `createClient` calls | a cookie for the api's domain; `localStorage` | the api is cross-site (no cookie would be sent with `SameSite=Lax`, and a `None` cookie is a CSRF surface); storage would survive the tab and be readable by any script on the origin |
| T8 | Rate limiting | api: the existing Postgres fixed-window limiter with `per: 'user'`; app: the existing Upstash `strictApiRateLimit` on the token route | a new limiter | both exist and are tested |
| T9 | Attribution in logs | pino child bindings `{userId, impersonatorId}` set by the pipeline after authentication | a correlation table | zero cost; every later line inherits them |
| T10 | Alerting | a log-based metric + a Cloud Monitoring policy applied by `apply-alerts.sh` | an application-side counter and a metrics client | consistent with the six existing policies; no new dependency |
| T11 | Tests | `vitest` 2 + `fast-check` 4; an interop test file importing both sides' functions with a test secret; the test-only header authenticator kept for route-security tests | mocking `jose` | real signatures are cheap; mocking would hide alg-confusion bugs |
| T12 | Clock | the api's injectable `Clock` for the verifier's tolerance tests; `jose`'s `currentDate` option | `Date.now` | the existing port makes P3 (the tolerance window) a pure property test |

## Versions (to pin in the lockfile at code generation)

| Package | Where | Version policy |
|---|---|---|
| `jose` | `apps/api` and `apps/app` dependencies | latest 6.x at generation time (the lockfile already resolves 6.2.12 transitively) |
| `fast-check`, `vitest`, `zod` | present | unchanged |

## Configuration

| Variable | Side | Rule |
|---|---|---|
| `API_TOKEN_SECRET` | api (Secret Manager `remonta-api[-staging]-API_TOKEN_SECRET`), app (Vercel Production = prod's value, Preview = staging's value) | required; 32+ bytes; `loadConfig` refuses shorter |
| `API_TOKEN_SECRET_PREVIOUS` | api only | optional; present only during a rotation |
| `NEXT_PUBLIC_API_URL` | app | existing; the admin client's base URL |

## Runbook: rotate the secret (U1-AVAIL-03)

1. Generate a new 32+ byte value. In Secret Manager add it as a new version of `API_TOKEN_SECRET` and set
   `API_TOKEN_SECRET_PREVIOUS` to the old value; redeploy the api (both stages, in turn).
2. In Vercel set `API_TOKEN_SECRET` to the new value (Production and Preview with their own values); redeploy the
   app.
3. After at least one token lifetime (5 minutes), remove `API_TOKEN_SECRET_PREVIOUS` (disable its version);
   redeploy the api. Check the auth-failure alert stayed silent.

## Not in this unit: the caches

The instant-repeat caches decided on 2026-10-08 (requirements D15-D17: the browser's private HTTP cache with
ETag/304 through the contract's `privateCacheSeconds`, the api's bounded response memo, canonical URLs and the
freshness line) belong to **U2 `admin-search`** (execution plan amendment: api side in PR 2, page side in PR 3) and
appear in U2's NFR requirements and tech stack. The only cache in U1 is the in-memory token source (T7), which is
deliberately not an HTTP cache: a token is never cacheable (`no-store`).
