# Business Logic Model -- unit `api-identity` (U1)

Algorithms step by step, technology-agnostic except where the port is named. Rules are cited as R#
(`business-rules.md`). Decisions: plan Q1 A (5 minutes), Q2 A (the minter reads the account), Q3 A (impersonation =
subject the impersonated user, `act` the admin); approved 2026-10-08.

## L1 `mintApiToken(session, deps)` -- the app's token route (C11)

```
1. session = getSession()                                  -- none -> 401 (R2.1)
2. account = db.user.findUnique({ id: session.user.id }, select { status, role })
   -- not found or status != ACTIVE -> 401, log info { reason: 'account-inactive' }        (R2.2)
   -- role != session.user.role     -> 401, log info { reason: 'role-changed' }            (R2.3)
3. limit = strictApiRateLimit per userId                     -- exceeded -> 429 + Retry-After (R2.4)
4. now = clock.now()  (seconds)
   claims = { sub: session.user.id, role: account.role, act?: session.user.impersonatedBy,
              iss: 'remonta-app', aud: 'remonta-api', iat: now, exp: now + 300, jti: uuid() }   (R1)
5. token = sign(claims, secret, HS256)                       -- jose SignJWT, header { alg: 'HS256', typ: 'JWT' }
6. respond 200 { token, expiresAt: iso(exp) } with Cache-Control: no-store                   (R2.5)
```

Impersonation (Q3 A): when `session.user.impersonatedBy` is set, `sub` is the impersonated user's id, `role` is
*their* role (read in step 2 for that id), and `act` is the admin's id. Step 2 reads the impersonated account; the
admin's own status is not re-read (the impersonation session was created by an active admin and ends with it).

## L2 `authenticate(headers)` -- the api's verifier (C3)

```
1. h = headers['authorization']                              -- absent or not a single string -> reject('missing')
2. [scheme, token] = split(h, ' ')                           -- scheme != 'Bearer' (case-insensitive) or token empty or len > 4096 -> reject('malformed')
3. payload = jwtVerify(token, secret, { algorithms: ['HS256'], issuer: 'remonta-app', audience: 'remonta-api', clockTolerance: 30 })
   -- JWSSignatureVerificationFailed -> reject('bad-signature')
   -- JWTExpired                     -> reject('expired')
   -- JWTClaimValidationFailed nbf   -> reject('not-yet-valid')
   -- JWTClaimValidationFailed iss   -> reject('bad-issuer')
   -- JWTClaimValidationFailed aud   -> reject('bad-audience')
   -- any other error (alg not allowed, malformed JWS)       -> reject('malformed')
4. claims = apiTokenClaimsSchema.safeParse(payload)          -- failure -> reject('bad-claims')
5. return { userId: claims.sub, role: claims.role, impersonatorId: claims.act }

reject(reason):
   a. log.warn({ auth: 'rejected', reason, entry }, 'auth rejected')                         (R3.9)
   b. return null                                            -- the pipeline answers 401 (R3.10)
```

Nothing is read from a cookie or the query string (R3.1). The verifier holds no state and never touches the
database (R3.11).

## L3 the pipeline after authentication (C10, platform)

```
5. principal = authenticator.authenticate(headers)           -- null -> 401
   request.log = request.log.child({ userId: principal.userId, impersonatorId: principal.impersonatorId })   (R4.1)
6. entry.meta.access.roles includes principal.role?           -- no -> 403 (logged by the existing path with the ids)  (R4.2)
   per-user rate limits keyed on principal.userId
7..11 unchanged
```

## L4 `getToken()` -- the client's token source (C12)

```
state: { token?: string; expiresAt?: epochSeconds; inflight?: Promise<string> }

getToken():
1. if token and expiresAt - now > 60 s -> return token                                     (R5.1)
2. if inflight -> return inflight                                                            (R5.2)
3. inflight = fetchToken()
   fetchToken():
     a. res = GET /api/auth/api-token (same origin, cookies sent by the browser)
     b. 200 -> { token, expiresAt } stored; return token
     c. 401 -> clear state; throw Unauthenticated                                            (R5.3)
     d. 429 -> wait Retry-After (cap 10 s) once, retry a; then throw Unavailable
     e. 5xx or network -> wait 1 s, retry a once; then throw Unavailable                      (R5.4)
   finally inflight = undefined
4. return inflight

invalidate(): clear token and expiresAt (keeps an in-flight fetch)                           (R5.5)
```

## L5 `call(entry, args)` -- the admin client's auth wrapper (C13, the U1 part)

```
1. token = tokenSource.getToken()        -- Unauthenticated -> outcome 'unauthenticated'; Unavailable -> 'unavailable'
2. res = client[entry](args, { headers: { authorization: `Bearer ${token}` } })
3. if res.status == 401 and not retried:
      tokenSource.invalidate(); retried = true; goto 1                                      (R5.6)
4. map: ok -> 'ok'; 401 -> 'unauthenticated'; 403 -> 'forbidden'; 429 -> 'rateLimited'(retryAfterSeconds);
        503 or thrown network error -> 'unavailable'; anything else -> 'failed'(requestId)   (U2 maps these to notices)
```

## Sequence: a normal admin request

```mermaid
sequenceDiagram
    participant UI
    participant TS as token source (C12)
    participant TR as /api/auth/api-token (C11)
    participant DB as users
    participant API as api pipeline + C3
    UI->>TS: getToken()
    TS->>TR: GET (session cookie)
    TR->>DB: findUnique(id) status, role
    TR-->>TS: 200 {token, expiresAt}  (no-store)
    UI->>API: GET /v1/admin/... Authorization: Bearer
    API->>API: jwtVerify (alg, iss, aud, exp, nbf +-30 s) -> claims schema -> Principal
    API->>API: role ADMIN? per-user limit; log child {userId}
    API-->>UI: 200
```

## Sequence: suspension during a session (Q2 A)

```
t0   admin A suspended by admin B (apps/app status route; users.status = SUSPENDED)
t0+  A's current token keeps working on the api until its exp (<= 5 min)                     (R6.1)
t0+4 A's tab renews: token route reads users.status -> 401 -> token source throws Unauthenticated
     -> admin client outcome 'unauthenticated' -> the page sends A to sign in                 (R6.2)
```

## Sequence: impersonation (Q3 A)

```
admin A starts impersonating worker W (existing flow: session.user = W, impersonatedBy = A)
token route: sub = W.id, role = WORKER (W's account read), act = A.id
admin entry: 403 (role WORKER), log { userId: W.id, impersonatorId: A.id }                   (R4.2)
A ends impersonation (existing flow restores A's session) -> next token: sub = A.id, role = ADMIN, no act
```

## Sequence: a rejected token

```
UI -> API: Bearer <expired> -> C3 reject('expired') -> warn {auth:'rejected', reason:'expired', entry} -> 401
UI: invalidate(); getToken() -> token route -> fresh token -> retry once -> 200
(second 401 -> 'unauthenticated' -> sign-in)
```
