# Component Dependencies -- admin worker search on `apps/api`

## Dependency matrix

| Component | Depends on | Used by |
|---|---|---|
| C1 `auth.ts` (contract) | zod, `ROLES` | C3, C11 |
| C2 `admin.contract.ts` | zod, `define.ts`, `meta.ts` | C10, C13, openapi, parity script |
| C3 `JwtAuthenticator` (api) | `jose`, C1, `Authenticator` port, `Clock`, logger | pipeline (`main.ts` wiring) |
| C4 config | zod | C3 (secret) |
| C5 `search-query.ts` (api, pure) | C2 types, `CareDomain` | C6, C7, C8 |
| C6 `filters.ts` | C5, `Prisma.sql` | C7 |
| C7 `worker-search-sql.ts` | C5, C6, `Db` (`$queryRaw`), PostGIS | C8 |
| C8 `search-workers.ts` | C5, C7, Prisma (`auLocality`), `Clock`, `ApiError` | C10 |
| C9 `list-users.ts`, `list-suspended.ts` | Prisma | C10 |
| C10 `admin.handlers.ts` | C2, C8, C9, `defineHandlers` | `main.ts` (handler sets) |
| C11 `api-token` route (app) | `jose`, C1, `getSession`, the app's limiter | C12 |
| C12 `lib/api/token.ts` | C11 (HTTP) | C13 |
| C13 `lib/api/admin.ts` | C2 (`createClient`), C12, `NEXT_PUBLIC_API_URL` | C14 |
| C14 admin screens | C13, `/api/suburbs` (ids), `requireRole` | admins |
| C15 infra | `stages.ts`, `bootstrap.sh`, `apply-alerts.sh` | deploy workflow, Cloud Run, Monitoring |
| C16 parity script | C2 (`createClient`), the old route (HTTP) | the staging checklist |

Boundaries respected: `packages/api-contract` imports only `zod` and `@remonta/schemas` (P-6; `jose` is used by the
two apps, never by the package); `packages/form-engine` is untouched (P-7); `apps/web` is untouched (P-1/P-2);
no `fetch` to the api outside `createClient` (Semgrep); no Nest controller; no `$queryRawUnsafe`.

## Communication patterns

- **Browser to app (same origin):** `GET /api/auth/api-token` with the NextAuth cookie (SameSite=Lax, same site);
  JSON back; never cached.
- **Browser to api (cross-origin):** `GET https://remonta-api…run.app/v1/admin/...` with `Authorization: Bearer`,
  `accept: application/json`, `x-request-id` optional; CORS preflight once per 10 minutes per origin (`maxAge 600`),
  `authorization` already in `allowedHeaders`, `credentials: false`; errors in the contract envelope with
  `retry-after` exposed.
- **Api to database:** Prisma typed calls for the locality and the two lists; one `$queryRaw` transaction for the
  search with `SET LOCAL statement_timeout`.
- **Api to Cloud Logging:** pino JSON lines; the auth rejection line feeds a log metric; the request line carries
  `userId`, `impersonatorId`, `reqId`, duration.
- **Secret distribution:** Secret Manager `remonta-api[-staging]-API_TOKEN_SECRET` mounted as env at start; Vercel
  env `API_TOKEN_SECRET` (Production = prod's value, Preview = staging's value). The same bytes on both sides of a
  stage; never the same across stages.

## Data flow: one search

```mermaid
sequenceDiagram
    participant UI as AdminDashboardClient
    participant T as lib/api/token.ts
    participant R as /api/auth/api-token
    participant C as lib/api/admin.ts
    participant P as api pipeline
    participant A as JwtAuthenticator
    participant S as search-workers
    participant D as Neon (PostGIS)
    UI->>C: searchWorkers({localityId, withinKm, gender, ...})
    C->>T: getToken()
    T->>R: GET (session cookie)  [only if none cached or < 60 s left]
    R-->>T: {token, expiresAt}
    C->>P: GET /v1/admin/workers?... Authorization: Bearer
    P->>A: authenticate(headers)
    A-->>P: Principal {userId, role: ADMIN}
    P->>P: role ok, per-user limit, strict query parse
    P->>S: searchWorkers(query)
    S->>D: auLocality.findUnique(localityId)
    S->>D: BEGIN; SET LOCAL statement_timeout; SELECT ... ST_DWithin ... COUNT(*) OVER(); SELECT unplaced; COMMIT
    D-->>S: rows, total, unplacedCount
    S-->>P: {data, pagination, appliedFilters, unplacedCount}
    P-->>C: 200 (response schema checked, no-store)
    C-->>UI: {kind: 'ok', body}
```

## Data flow: a rejected token

```
UI -> C13 -> P: Bearer <expired>  -> A: jwtVerify fails (exp) -> warn {auth:'rejected', reason:'expired'} -> 401
C13: invalidate(); getToken() -> R: new token -> retry once -> 200
(second 401: {kind:'unauthenticated'} -> UI redirects to sign-in)
```

## Data flow: the parity check (PR 2, staging)

```
cases.json (today's URLs) -> parity script -> old route on a preview (cookie) and new entry on staging (token)
  -> per case: ids and total equal? -> report -> construction notes
```

## Amendment 2026-10-08 -- caches

| Component | Depends on | Used by |
|---|---|---|
| C17 `privateCacheSeconds` (contract) | `meta.ts`, `checks.ts`, `openapi.ts` | C18, C2 |
| C18 pipeline cache step + `ResponseMemo` (api) | `node:crypto` (hash), `Clock`, C17 | every admin GET; the search handler binding opts into the memo |

**Data flow: a repeated search.** Browser cache hit (same canonical URL, under 60 s): no request. After 60 s:
`GET ... If-None-Match: "sha256-..."` -> pipeline -> memo hit (or the statement) -> same body -> 304. From another
admin within 60 s: memo hit -> 200 from memory, no statement.
