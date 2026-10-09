# Domain Entities -- unit `api-identity` (U1)

Nothing is persisted by this unit: no table, no column, no migration. The entities live in a token, in a request,
and in a page's memory.

## E1 ApiTokenClaims (`packages/api-contract/src/auth.ts`)

| Claim | Type | Meaning | Constraint |
|---|---|---|---|
| `sub` | string | the user the request acts as | non-empty; a `users.id` |
| `role` | `Role` | that user's role at mint time | one of WORKER, CLIENT, COORDINATOR, ADMIN |
| `act` | string? | the admin impersonating `sub` | present only during impersonation; a `users.id` |
| `iss` | literal | `remonta-app` | |
| `aud` | literal | `remonta-api` | |
| `iat` | int | issued at (seconds) | |
| `exp` | int | expiry (seconds) | `iat + 300` |
| `jti` | string | token id | UUID; logged, not stored |

Strict object: no other claim. Serialised as a compact JWS, HS256.

## E2 Principal (`apps/api/src/platform/auth/authenticator.ts`, extended)

| Field | From | Used by |
|---|---|---|
| `userId` | `sub` | role policy, per-user limits, the request log, handlers |
| `role` | `role` | role policy |
| `impersonatorId?` | `act` | the request log; future audit rows |

## E3 TokenSource state (`apps/app/src/lib/api/token.ts`, page memory)

| Field | Meaning |
|---|---|
| `token?` | the current compact JWS |
| `expiresAt?` | its expiry (epoch seconds) |
| `inflight?` | the one fetch in progress |

Transitions: empty -> (fetch) -> cached; cached -> (now > expiresAt - 60 s or invalidate) -> empty/fetching;
fetching -> 200 -> cached; fetching -> 401 -> empty + Unauthenticated; fetching -> 5xx/network twice -> empty +
Unavailable.

## E4 Account read at mint (existing table `users`, read only)

| Column | Use |
|---|---|
| `id` | the subject |
| `status` | must be `ACTIVE` (R2.2) |
| `role` | the token's role (R2.3) |

## Relationships

```
NextAuth session (apps/app) --mint (C11)--> ApiTokenClaims --Bearer--> Principal (apps/api)
         |                                                                 |
   session.user.id / role / impersonatedBy                  request.log {userId, impersonatorId}
```

## Configuration (not entities, listed for completeness)

| Name | Side | Value |
|---|---|---|
| `API_TOKEN_SECRET` | both | 32+ bytes; per stage (Infrastructure Design) |
| `API_TOKEN_TTL_S` | contract constant | 300 |
| clock tolerance | api constant | 30 s |
| renew-before | app constant | 60 s |
