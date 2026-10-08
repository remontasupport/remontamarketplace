# Frontend Components -- unit `api-identity` (U1)

This unit adds no visible component. It adds the plumbing the admin screens (U2) use, and defines the behaviour
those screens must honour on authentication outcomes.

## Component hierarchy (the U1 part)

```
AdminDashboardClient / impersonate page / suspended list   (U2)
  └── lib/api/admin.ts  (adminApi: the contract client + auth wrapper)      C13 (auth part in U1)
        └── lib/api/token.ts (TokenSource)                                   C12
              └── GET /api/auth/api-token                                    C11 (server route, same origin)
```

## `createTokenSource()` (C12)

- **State:** `{token?, expiresAt?, inflight?}` in module memory (one per page load); nothing in storage (R5.7).
- **API:** `getToken(): Promise<string>`, `invalidate(): void`.
- **Behaviour:** R5.1-R5.5; errors `Unauthenticated` and `Unavailable` as typed classes.
- **No React:** a plain module; screens call it through `adminApi`, never directly.

## `adminApi` auth wrapper (C13, U1 part)

- **Input:** an entry name and its args; **output:** `ApiOutcome<T>`.
- **Behaviour:** R5.6 (one retry on 401 with a fresh token); maps statuses to outcomes; never throws for an HTTP
  outcome; passes `signal` through for cancellation.
- **Headers:** `authorization: Bearer <token>` on every call; `accept: application/json` (the client's default).

## What a screen must do with each outcome (contract for U2's notices)

| Outcome | Screen behaviour |
|---|---|
| `unauthenticated` | redirect to `/login?callbackUrl=<current URL>`; keep nothing sensitive on screen |
| `forbidden` | notice "Your account cannot use the admin search" (impersonation or a role change); keep the last results |
| `rateLimited(n)` | notice with the wait; automatic retry after `n` seconds; last results kept |
| `unavailable` | notice with a retry button; last results kept |
| `failed(requestId)` | generic notice with the request id for support |

## The token route (C11), as the browser sees it

- `GET /api/auth/api-token` -> `200 {token, expiresAt}` | `401 {error}` | `429` (+ `Retry-After`); `Cache-Control:
  no-store`; the NextAuth cookie is sent automatically (same origin); no CSRF token needed (a GET that returns a
  credential only to the session's own origin; the token is useless cross-site because the api checks the
  audience and the app's CORS does not expose the route's response to other origins).

## Interaction flow: first load

```
page mounts -> adminApi.searchWorkers(...) -> getToken() -> GET /api/auth/api-token -> token cached
            -> api call with Bearer -> outcome -> render / notice
```

## Interaction flow: renewal

```
4 min later: getToken() sees < 60 s left -> one fetch (shared by concurrent calls) -> new token -> calls continue
```
