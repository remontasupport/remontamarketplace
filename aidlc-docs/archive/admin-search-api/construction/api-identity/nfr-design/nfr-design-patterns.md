# NFR Design Patterns -- unit `api-identity` (U1)

**Decisions:** NFR design plan Q1 B (light resiliency testing plan), Q2 A (the token route fails open with the
app's limiter); approved 2026-10-08. Each pattern names the requirement it satisfies and the rule it implements.

## P1 Pure, in-process verification: no dependency, no retry, no breaker

`JwtAuthenticator.authenticate` is a function of (headers, secret bytes, clock). The secret is imported once at
boot into a `Uint8Array`; `jose.jwtVerify` runs with `algorithms: ['HS256']`, `issuer`, `audience`,
`clockTolerance: 30`; the claims schema is a module constant. Nothing is awaited but the HMAC. There is no
outbound call, so there is nothing to time out, retry or break. (U1-PERF-02, U1-AVAIL-01, R3.11)

## P2 One bounded read at mint, failing closed on error, not on identity

The token route makes one Prisma read of `users` by primary key through the app's existing `withRetry` wrapper
(the one `auth.config.ts` uses for its own user lookups: a short retry on transient errors). A database error
answers **503** with `Retry-After: 2`, never 401, so the client surfaces `unavailable` after its one retry (R5.4)
instead of redirecting a healthy session to sign-in. A found-but-inactive account answers 401 (R2.2). (U1-AVAIL-02,
SECURITY-15)

## P3 Fail open on the app's limiter, fail closed on the api's

The token route calls `checkServerActionRateLimit(userId, strictApiRateLimit)`; an Upstash error lets the mint
proceed and logs `warn {limiter: 'unavailable', route: 'api-token'}` (Q2 A, today's app behaviour). The api's
per-user and per-IP limits on the admin entries use the Postgres limiter, which answers 503 when it cannot count
(fail closed, existing pipeline behaviour). The gate that matters fails closed; the convenience limiter does not
lock admins out. (U1-SCAL-01, U1-SCAL-02)

## P4 Defence in depth, five layers

1. The app's page guard (`requireRole`) and the NextAuth session (secure, httpOnly, sameSite cookie).
2. The account read at mint: no token for a suspended account or a changed role (R2.2, R2.3).
3. The api's verification: signature, algorithm, issuer, audience, expiry, not-before, strict claims (R3).
4. The role policy per entry and the per-user limit (R4.2, R4.3).
5. The attributed log line and the auth-failure alert (R4.1, U1-REL-01).
No layer trusts the previous one's output beyond what it signs. (U1-SEC-01, SECURITY-08, -11)

## P5 Short-lived, stateless credentials with a stated lag

Five-minute tokens, renewed lazily 60 s before expiry on the next call, no refresh token, no server-side session
record. The lag after suspension, role change or sign-out is at most one lifetime, written in R6 and in the docs.
No replay store: `jti` is logged, not checked; the lifetime bounds replay. (U1-SEC-03, U1-SEC-07, R6)

## P6 Zero-downtime secret rotation with two accepted keys

The verifier holds `{current, previous?}`; a token's `kid` selects the key (`'current'` on every minted token);
when `kid` is absent or unknown the verifier tries current then previous. During a rotation the previous key
costs at most one extra HMAC per request. The runbook is three steps (tech stack decisions). (U1-AVAIL-03, R6.3)

## P7 Secret hygiene

The secret exists in Secret Manager (api, mounted as env at start) and Vercel env (app); `loadConfig` refuses to
boot under 32 bytes and never echoes the value; the previous secret under the same rules; `authorization` is a
redaction path; the token route's response is `no-store`; the token source keeps the token in memory only.
(U1-SEC-02, U1-SEC-05, R1.5, R5.7)

## P8 Lazy renewal, shared in-flight fetch, bounded client retries

`getToken()` renews only when called with less than 60 s left; concurrent callers await one promise; a token-route
401 clears and throws `Unauthenticated`; 429 waits `Retry-After` (cap 10 s) once; 5xx/network waits 1 s once; an
api 401 is retried once after `invalidate()`. No timers, no background traffic from idle tabs, no infinite loops:
every path ends in a typed outcome. (U1-PERF-03, R5)

## P9 Observability without personal data

The pipeline creates a child logger `{userId, impersonatorId?}` after authentication; the rejection line is
`{auth: 'rejected', reason, entry}`; the token route logs `{reason}` with the user id on refusal. The log metric
`remonta-api-auth-failed` and the policy (`> 20` in 5 min, ERROR, auto-close 30 min, prod) feed the existing email
channel; two saved queries are documented. (U1-REL-01..04, SECURITY-03, -14)

## P10 Impersonation preserved, never widened

The token's subject is the impersonated user with their role; `act` names the admin; admin entries answer 403;
both ids are logged. The existing impersonation flow (one-time token, 60 s expiry, both sides audited) is untouched.
(U1-SEC-08, R2.6, R4.2)

## Resiliency test scenarios (Q1 B, RESILIENCY-14)

| # | Scenario | Where | Expected |
|---|---|---|---|
| S1 | Verifier configured with a different secret than the minter | CI (`jwt-authenticator.test.ts`) | every token 401, reason `bad-signature`, one warn line each |
| S2 | Token expired (clock advanced past `exp + 30 s`) | CI | 401 `expired`; the client model re-mints once and retries (P8) |
| S3 | Token route answers 401 / 429 (+`Retry-After`) / 503 / network error | CI (token source with a fake fetch) | `Unauthenticated` at once / one wait then retry / one wait then `Unavailable` / same |
| S4 | Account suspended between two mints | CI (route handler with a fake session and db) | second mint 401 `account-inactive`; no token |
| S5 | Both secrets configured; token signed with the previous | CI | accepted; with neither: 401 `bad-signature` |
| S6 | Clock skew at the edges (`exp + 29 s` accepted, `exp + 31 s` rejected; `nbf` likewise) | CI (property P3) | as the tolerance says |
| S7 | Upstash unreachable at mint | CI (limiter throwing) | mint proceeds; warn `limiter: 'unavailable'` |
| S8 | Database unreachable at mint | CI (db throwing) | 503 + `Retry-After`, no 401 |
| S9 | Rotation runbook end to end while an admin searches on a preview | staging drill, per release touching this code | no notice on the screen; alert silent; recorded in the construction notes |
| S10 | Wrong secret on the api for five minutes | staging drill | 401s, the client's sign-in redirect, the auth-failure email within the window; recovery on restore |
| S11 | Loss of the secret value | DR runbook (S1's, extended) | rotate (runbook): no data is lost; admins re-mint |
