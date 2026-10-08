# Business Rules -- unit `api-identity` (U1)

Numbered so code and tests can cite them. "Generic envelope" is the contract's error body with a generic message
and the request id.

## R1 The token (C1 `auth.ts`)

| # | Rule |
|---|---|
| R1.1 | Claims, all required unless marked: `sub` (user id, non-empty), `role` (one of `ROLES`), `act?` (impersonating admin's user id), `iss = 'remonta-app'`, `aud = 'remonta-api'`, `iat` (seconds), `exp` (seconds), `jti` (UUID). The schema is strict: any other claim fails parsing. |
| R1.2 | `exp - iat = 300` (5 minutes, Q1 A). The verifier does not check the difference; it checks `exp` against now, so a minter with a wrong lifetime is caught by the contract test, not at runtime. |
| R1.3 | No personal data in the token: no email, no name, no phone. The subject is an opaque id. |
| R1.4 | Algorithm HS256 only. The header is `{alg: 'HS256', typ: 'JWT'}`; a token with any other `alg` is rejected as `malformed`. |
| R1.5 | The secret is the UTF-8 bytes of `API_TOKEN_SECRET`, at least 32 bytes after trimming, the same value on both sides of a stage and different across stages. Never logged, never in a response, never in the repository or the image. |

## R2 Minting (C11, the app's token route)

| # | Rule |
|---|---|
| R2.1 | No session: 401 with `{error: 'unauthenticated'}`; no token. |
| R2.2 | The account of the subject (the impersonated user when impersonating, else the signed-in user) is read by id before every mint; a missing account or `status != ACTIVE`: 401, log `{reason: 'account-inactive'}`, no token (Q2 A). |
| R2.3 | The account's `role` is the token's `role`; if it differs from the session's role the mint is refused with 401, log `{reason: 'role-changed'}` (the session is stale; signing in again fixes it). |
| R2.4 | The route applies the app's strict limiter (30 per minute) keyed by the subject's user id; exceeded: 429 with `Retry-After`. |
| R2.5 | Response: 200 `{token, expiresAt}` (ISO), `Cache-Control: no-store`; no cookie is set; the method is GET; the route is not CSRF-sensitive (it only reads and returns to the same origin). |
| R2.6 | Impersonation (Q3 A): `sub` = the impersonated user's id, `role` = their account's role, `act` = `session.user.impersonatedBy`. Without impersonation `act` is absent. |
| R2.7 | `jti` is a fresh random UUID per token; `iat` = now; `exp` = now + 300. |

## R3 Verification (C3 `JwtAuthenticator`)

| # | Rule | Reason logged |
|---|---|---|
| R3.1 | The token is read only from the `Authorization` header; a token in a query string, a cookie or any other header is ignored. | -- |
| R3.2 | Header absent, or present more than once: refuse. | `missing` |
| R3.3 | Scheme not `Bearer` (case-insensitive), token empty, or longer than 4,096 characters: refuse. | `malformed` |
| R3.4 | Signature does not verify with the secret: refuse. | `bad-signature` |
| R3.5 | `exp` earlier than now minus 30 s: refuse. | `expired` |
| R3.6 | `nbf` (if present) later than now plus 30 s: refuse. | `not-yet-valid` |
| R3.7 | `iss` not `remonta-app`, or `aud` not `remonta-api`: refuse. | `bad-issuer` / `bad-audience` |
| R3.8 | The payload fails `apiTokenClaimsSchema` (unknown role, unknown claim, missing claim, bad types): refuse. Any other parse or algorithm error: `malformed`. | `bad-claims` / `malformed` |
| R3.9 | Every refusal logs exactly one warn line `{auth: 'rejected', reason, entry}`; never a token fragment, never the header value. |
| R3.10 | Every refusal is 401 with the generic envelope (the pipeline's existing behaviour); the reason is never in the response. |
| R3.11 | Verification touches no database and no network; it is a pure function of (headers, secret, clock). |
| R3.12 | On success the principal is `{userId: sub, role, impersonatorId: act}`. |

## R4 The pipeline after authentication (C10)

| # | Rule |
|---|---|
| R4.1 | The request logger becomes a child with `{userId, impersonatorId?}` from the principal, so the request line and every handler line carry them. |
| R4.2 | The role check is the existing one: 403 when the principal's role is not in the entry's `roles`; the 403 line carries both ids (R4.1). |
| R4.3 | Per-user rate limits (`per: 'user'`) are keyed on `userId`, never on `impersonatorId`. |

## R5 The client's token source and auth wrapper (C12, C13)

| # | Rule |
|---|---|
| R5.1 | A cached token is used while more than 60 s remain before `expiresAt`. |
| R5.2 | Concurrent callers share one in-flight fetch; at most one token request is in flight per page. |
| R5.3 | A 401 from the token route clears the cache and surfaces as `unauthenticated` (the page redirects to sign-in with the return URL). |
| R5.4 | A 429 waits `Retry-After` (capped at 10 s) once; a 5xx or a network failure waits 1 s once; a second failure surfaces as `unavailable`. |
| R5.5 | `invalidate()` drops the cached token; it never aborts an in-flight fetch. |
| R5.6 | A 401 from an api entry invalidates and retries that call once with a fresh token; a second 401 surfaces as `unauthenticated`. |
| R5.7 | The token lives in page memory only: never `localStorage`, `sessionStorage`, a cookie or the URL. |

## R6 Lags, stated

| # | Rule |
|---|---|
| R6.1 | After a suspension, role change or sign-out, an already issued token is honoured by the api until its `exp`: at most 5 minutes. |
| R6.2 | No new token is minted for a suspended account or a changed role from the next renewal on (R2.2, R2.3). |
| R6.3 | A secret change invalidates every outstanding token at once (both sides restart with the new value); clients recover through R5.6 (one retry with a fresh token). The rotation procedure is NFR Design. |

## Properties (PBT-01)

| Property | Category | Where |
|---|---|---|
| P1 For any valid claims, `verify(sign(claims))` yields the principal `{sub, role, act}` (within the lifetime) | round-trip | C1 + C3 with a test secret |
| P2 Corrupting any one of: a claim value, the signature, the header `alg`, the issuer, the audience, the secret used to verify, makes `authenticate` return null with the matching reason | invariant | C3 |
| P3 For any clock offset: a token is accepted iff `iat - 30 s <= now <= exp + 30 s` | invariant | C3 |
| P4 The claims schema rejects any object with an extra key or a role outside `ROLES` | invariant | C1 |
| P5 For any sequence of `getToken`/`invalidate`/clock advances, the source never returns a token with less than 60 s of life, and the number of fetches equals the number of expiries plus invalidations (model-based) | invariant / oracle | C12 |
| P6 The token route's output always parses with the claims schema and has `exp - iat = 300` | invariant | C11 |
| P7 Verification is pure: the same (headers, secret, now) gives the same result regardless of call order | invariant | C3 |

Example-based tests pin: the eight rejection reasons one by one; the impersonation token; the suspended account at
mint; the 401-then-retry path; `jose` interop (a token minted by the app's code verifies with the api's code).
