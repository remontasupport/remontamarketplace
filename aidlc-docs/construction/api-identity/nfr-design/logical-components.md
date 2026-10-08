# Logical Components -- unit `api-identity` (U1)

Each component with the non-functional responsibilities it carries and the platform pieces it reuses. Code
components are the application design's C1, C3, C4, C10, C11, C12, C13 (auth part), C15.

## Contract (`packages/api-contract`)

| Component | NFR responsibilities | Reuses |
|---|---|---|
| `auth.ts` (C1) | the single strict claims schema (no unknown claims, roles from `ROLES`); constants for issuer, audience, 300 s lifetime, HS256; no personal data in the claim set | zod; `meta.ts`'s `ROLES` |

## Api (Cloud Run, `remonta-api[-staging]`)

| Component | NFR responsibilities | Reuses |
|---|---|---|
| `JwtAuthenticator` (C3) | pure in-process verification (P1); secret pair pre-imported at boot; `kid` routing and the previous-key fallback (P6); header bounds (4,096 chars, single header); ordered rejection reasons with one warn line each (P9); never touches a cookie or the query | `Authenticator` port; `Clock`; pino; `jose` |
| `config.ts` (C4) | `API_TOKEN_SECRET` required 32+ bytes, `API_TOKEN_SECRET_PREVIOUS` optional 32+ bytes; boot refusal names the variable, never the value (P7) | `loadConfig` Zod schema |
| Pipeline step 5-6 (C10) | child logger with `userId`/`impersonatorId` (P9); role policy 403; per-user limits keyed on `userId` through the Postgres limiter (fail closed, P3) | `pipeline.ts`; `PostgresRateLimiter`; `rate_limit_buckets` |
| Admin entries' `meta()` (declared in U2's contract) | `rateLimit: [{per:'user', 120, '1m'}, {per:'ip', 300, '1m'}]` on the search; `60`/`120` on the lists | `meta()` validation |
| Load shedder (existing) | unchanged; a flood of bad tokens is shed like any flood before verification | `LoadShedder` |

## App (Vercel, `remonta-app`)

| Component | NFR responsibilities | Reuses |
|---|---|---|
| `GET /api/auth/api-token` (C11) | session gate; one indexed read through `withRetry` (P2); 503 on a database error, 401 on an inactive account or a changed role; `checkServerActionRateLimit(userId, strictApiRateLimit)` failing open with a warn (P3); `no-store`; `jose.SignJWT` with `kid: 'current'`; logs `{reason}` with the user id on refusal, never a token | `getSession`; `authPrisma`; `withRetry`; the Upstash limiter; `jose` |
| `lib/api/token.ts` (C12) | in-memory token, lazy renewal at 60 s, one shared in-flight fetch, the bounded retry table (P8), typed `Unauthenticated` / `Unavailable`; nothing in storage (P7) | `fetch` |
| `lib/api/admin.ts` auth part (C13) | `authorization` header on every call; one retry on 401 after `invalidate()`; the outcome mapping U2's screens consume | `createClient`; C12 |

## Infrastructure and operations

| Component | NFR responsibilities | Reuses |
|---|---|---|
| Secret Manager `remonta-api[-staging]-API_TOKEN_SECRET` (+ `-API_TOKEN_SECRET_PREVIOUS`) (C15) | per-stage values; readable by the runtime account only; new versions need a redeploy (instances read at start) | the existing six-secret pattern; `stages.ts` `SECRET_NAMES` |
| Vercel env `API_TOKEN_SECRET` | Production = prod's value, Preview = staging's value; never in a Preview that points at prod | the existing scope rule (CLAUDE.md) |
| Log metric `remonta-api-auth-failed` + policy `remonta-api auth-failed` | `> 20` rejections per 5 min, prod, ERROR, auto-close 30 min, the existing email channel (P9) | `bootstrap.sh` metric helper; `apply-alerts.sh`; `monitoring/*.json` pattern |
| Saved queries (docs) | rejections by reason over 24 h; requests by `userId` | Cloud Logging, 90-day retention |
| Rotation runbook | the three steps, with the previous-key window of at least one lifetime | `docs/admin/README.md` |

## What is deliberately absent

| Not built | Why |
|---|---|
| A session or replay store | Q3 C of the requirements was declined; the 5-minute lifetime bounds replay; `jti` is logged for forensics |
| A circuit breaker | no outbound call on the verification path; one bounded read at mint |
| A response cache on the token route | tokens are credentials: `no-store` by rule |
| A dashboard | Q4 A: the alert set and two saved queries suffice at this traffic |
| MFA | outside the unit (follow-up 14) |
