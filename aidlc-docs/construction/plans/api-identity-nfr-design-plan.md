# NFR Design Plan -- unit `api-identity` (U1)

**Inputs:** `../api-identity/nfr-requirements/` (U1-PERF/SCAL/AVAIL/SEC/REL/MAINT, T1-T12), the functional design
(R1-R6, P1-P7), the api's existing platform pieces (`Authenticator` port, pipeline step 5, Postgres rate limiter,
`LoadShedder`, pino, `Clock`), the app's pieces (`getSession`, `withRetry` around Prisma reads in `auth.config.ts`,
the Upstash limiters, which **fail open** when Upstash errors and key by client IP; `checkServerActionRateLimit`
keys by an identifier).

Two questions, each pre-filled with a proposal; leave or change the letter and say "approved" (or "done"). Every
category the rule names is then either a question here or a fixed pattern below with its justification.

## Question 1 (RESILIENCY-14): Resiliency Testing Approach
How will resiliency mechanisms (failover, recovery) be validated for this unit?

A) Use our existing DR testing / game day / chaos engineering practice -- provide the reference. AI-DLC will
document test scenarios that fit it.

B) **No practice exists -- AI-DLC proposes a light plan**: (1) automated failure-injection tests in CI: a wrong
secret on the verifier (every token 401, the warn line present), an expired token (401 then one re-mint and
retry in the client model), the token route answering 401 / 429 / 5xx / network failure (the token source's
typed outcomes, R5.3-R5.4), the account suspended between mints (no new token), both secrets set with a token
signed by the previous one (accepted) and by neither (rejected), clock skew at the tolerance edges (P3);
(2) one staging drill per release that touches this code: run the rotation runbook end to end while an admin
keeps searching on a preview, observe no notice and the alert silent, then set a deliberately wrong secret on
the api for five minutes, observe 401s, the client's sign-in redirect and the auth-failure email, restore and
confirm recovery; recorded in the construction notes; (3) the DR runbook inherited from S1 gains the secret
(where it lives, how to re-create it, that losing it only costs a rotation). Recommended.

C) Defer to the Operations phase -- capture test scenarios now, execute during Operations.

X) Other (describe after [Answer]: tag below)

[Answer]: B -- proposed

## Question 2
The token route when the app's rate limiter cannot be reached. The app's `applyRateLimit` **fails open** on an
Upstash error (today's behaviour on every app route) and keys by client IP; the token route needs a per-user key
(`checkServerActionRateLimit(userId, strictApiRateLimit)` provides that and shares the same fail-open path).

A) **Fail open, like every app route.** An Upstash outage lets the token route mint without a limit; the damage is
bounded because a token needs a valid session, costs one indexed read, and the api's own per-user limits (which
fail closed) still bound what a token can do. Logged as a warn line so the outage is visible. Recommended:
consistent with the app, and the api is the real gate.

B) **Fail closed for this route only**: an Upstash error answers 503 with `Retry-After: 5`; the token source
retries once, then the screen shows `unavailable`. Stricter; an Upstash outage then locks every admin out of the
api until it recovers, although the api itself is healthy.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Fixed by earlier decisions (not questions)

- **Resilience patterns:** verification is pure and in-process (no dependency to fail, no retry, no breaker:
  there is no call to break); the token route makes one indexed read through the app's existing `withRetry`
  (the same wrapper `auth.config.ts` uses for user lookups) and fails closed on a read failure (401 is not
  acceptable there because it would redirect the admin: a database error answers 503 so the client surfaces
  `unavailable` after one retry, R5.4); the client's retry budget is fixed (R5.4, R5.6); no circuit breaker
  anywhere in this unit (justification: at most one outbound call per mint, bounded by Prisma's pool timeout).
- **Scalability patterns:** stateless verification scales with instances; the token route is bounded per user
  (30/min) and the admin entries per user and per IP (Q1 of NFR Requirements); no shared state is introduced
  (no replay store, no session table); the previous-secret acceptance adds one extra HMAC per request only
  during a rotation.
- **Performance patterns:** `jose.jwtVerify` with the secret pre-imported once at boot (`Uint8Array`, not
  re-derived per request); the claims schema compiled once; the child logger created once per request; the token
  source renews lazily on use (no timers, no background traffic from idle tabs).
- **Security patterns:** defence in depth (the app's session gate, the account read at mint, the api's signature
  and claims checks, the role policy, the per-user limit); fail closed at every layer except the app limiter's
  documented fail-open (Q2); least privilege for the secret (the runtime account only); no personal data in the
  token; constant-time comparison inside `jose`; alg pinned; the token never leaves the `Authorization` header.
- **Logical components:** no queue, no cache (the caches are U2's), no breaker; one secret pair; one log metric
  and one alert policy; the existing limiter, pipeline, logger and clock. The `kid` is the only new protocol
  element.

## Execution checklist

- [x] 1. Confirm the two answers above; resolve any ambiguity in a clarification file
- [x] 2. `aidlc-docs/construction/api-identity/nfr-design/nfr-design-patterns.md`: each pattern with the requirement
  it satisfies and the rule it implements; the resiliency test scenarios per Q1
- [x] 3. `logical-components.md`: the components with their non-functional responsibilities and what they reuse,
  on the api, the app and the platform
- [x] 4. Present for approval
