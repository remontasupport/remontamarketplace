# NFR Requirements -- unit `api-identity` (U1)

**Decisions:** NFR plan Q1 A (limits 120/300 and 60/120 per minute), Q2 A (auth-failure alert > 20 in 5 min),
Q3 A (two-secret rotation with `kid`), Q4 A (Cloud Logging saved queries); approved 2026-10-08. Traced to the
cycle's requirements (FR-ID, FR-PLT, NFR-03..09), the business rules (R#) and the stories (US-AS-#).

## Performance

| ID | Requirement | Trace |
|---|---|---|
| U1-PERF-01 | The token route answers in under 150 ms at p95 on production: one indexed `users` read by primary key, one HMAC, one Upstash limiter call | R2, US-AS-08 |
| U1-PERF-02 | `authenticate` costs under 1 ms per request in-process (HMAC over a few hundred bytes, a Zod parse of eight claims); the pipeline's measured latency does not change | R3.11 |
| U1-PERF-03 | Renewal never blocks a screen: the token source renews 60 s before expiry on the next call, and concurrent calls share one fetch | R5.1, R5.2 |
| U1-PERF-04 | The token adds at most about 300 bytes to every admin request (header); no extra round trip except one mint per 4-5 minutes per tab | R1 |

## Scalability and capacity

| ID | Requirement | Trace |
|---|---|---|
| U1-SCAL-01 | Per-user limits on the admin entries: search 120 per minute per user and 300 per minute per IP; users and suspended lists 60 per user and 120 per IP; 429 with `Retry-After`; counted by the Postgres limiter before the handler | Q1 A, FR-ID-05, NFR-06 |
| U1-SCAL-02 | The token route is limited by the app's strict Upstash limiter: 30 per minute per user id; with a 5-minute token and 60 s renewal, a tab needs about 15 mints an hour | R2.4 |
| U1-SCAL-03 | Verification holds no state, so it scales with the instances (prod 1-4) without coordination; the secret is read once at start | R3.11 |
| U1-SCAL-04 | Ceiling stated: at 120 searches a minute of 100 rows an admin can list 12,000 rows a minute; the whole active worker list is about 2,000 rows, so a scraper gains nothing a single page of the suspended and search lists would not give; accepted (NFR-06) | Q1 A |

## Availability and resiliency

| ID | Requirement | Trace |
|---|---|---|
| U1-AVAIL-01 | No new runtime dependency on the api's request path: verification is in-process; the api does not call the app or the database to authenticate | R3.11, RESILIENCY-10 |
| U1-AVAIL-02 | The token route depends on the app's database and Upstash exactly as every app route does; a failure there surfaces as `unavailable` on the admin screen after one retry (R5.4) and never as a silent empty list | R5.4, NFR-11 |
| U1-AVAIL-03 | Rotation without downtime: the api accepts `API_TOKEN_SECRET` and, when set, `API_TOKEN_SECRET_PREVIOUS`; the minter sets `kid: 'current'`; the verifier tries the key named by `kid`, else the current then the previous; the runbook is three steps (api with both; app with the new; api without the previous after one lifetime) | Q3 A, R6.3 |
| U1-AVAIL-04 | A missing or short secret stops the api at boot with the variable named (fail closed, never deny-all silently); a wrong secret on one side yields 401s that the alert surfaces within 5 minutes | R1.5, SECURITY-15 |
| U1-AVAIL-05 | Rollback: the api image before PR 1 denies every admin call (deny-all), which is safe; the app before PR 3 does not call the api; the order in the execution plan keeps every step a promote | NFR-13 |
| U1-AVAIL-06 | Clock tolerance 30 s on exp/nbf covers Cloud Run and Vercel clock drift; both run NTP-synchronised hosts | R3.5, R3.6 |

## Security and privacy

| ID | Requirement | Trace |
|---|---|---|
| U1-SEC-01 | Signature, algorithm (HS256 only), issuer, audience, expiry and not-before verified on every request; nothing from the client decides identity or role | R3, SECURITY-08 |
| U1-SEC-02 | The secret: 32+ bytes, per stage, in Secret Manager and Vercel only; never in the repository, the image, the YAML, a log or a response; the previous secret under the same rules during a rotation | R1.5, SECURITY-12 |
| U1-SEC-03 | Lifetime 5 minutes; no refresh token; the only way to get a token is the signed-in session of the app on its own origin | R1.2, SECURITY-12 |
| U1-SEC-04 | No personal data in the token; the subject is an opaque id; `jti` random | R1.3 |
| U1-SEC-05 | Transport: the token travels only in the `Authorization` header over TLS; never in a URL, a cookie or storage; CORS keeps `credentials: false` | R3.1, R5.7, SECURITY-08 |
| U1-SEC-06 | Logs: the `authorization` header is already a redaction path; the rejection line carries a reason and the entry id only; the attributed line carries ids, not names | R3.9, R4.1, SECURITY-03 |
| U1-SEC-07 | Suspension and role change: no new token after the next renewal (the minter reads the account); an issued token lives at most 5 minutes; stated as the accepted lag | R2.2, R2.3, R6 |
| U1-SEC-08 | Impersonation never widens rights: the token carries the impersonated user's role; admin entries answer 403; both ids are logged | R2.6, R4.2, S1 FR-ID-07 |
| U1-SEC-09 | Brute force: a signature guess is infeasible (256-bit HMAC); the per-IP limits on admin entries bound the attempts; the alert fires above 20 rejections in 5 minutes | Q2 A, SECURITY-14 |
| U1-SEC-10 | MFA for admin accounts remains absent in `apps/app` (follow-up 14); this unit does not change the app's login | SECURITY-12, recorded |

## Reliability, observability

| ID | Requirement | Trace |
|---|---|---|
| U1-REL-01 | The log metric `remonta-api-auth-failed` counts `jsonPayload.auth="rejected"`; the policy `remonta-api auth-failed`: ALIGN_SUM 300 s, GT 20, duration 0 s, auto-close 1800 s, severity ERROR, production only, emailed to support | Q2 A, FR-PLT-02 |
| U1-REL-02 | Two saved Cloud Logging queries documented in `docs/admin/`: rejections by reason over 24 h; requests by `userId`; retention 90 days as configured | Q4 A, SECURITY-14 |
| U1-REL-03 | Every admin request line carries `userId`, `impersonatorId?`, `reqId`, the entry id and the duration | R4.1 |
| U1-REL-04 | The token route logs the refusal reason (`account-inactive`, `role-changed`) at info with the user id, never the token | R2.2, R2.3 |

## Maintainability and testability

| ID | Requirement | Trace |
|---|---|---|
| U1-MAINT-01 | One claims definition (`packages/api-contract/src/auth.ts`) imported by both sides; a change to the claims is one PR touching both apps through the package | C1 |
| U1-MAINT-02 | Property tests P1-P7 with `fast-check`, example tests for the eight rejection reasons, the impersonation token, the suspended mint, the 401-then-retry path, and the `jose` interop test (the app's minting function against the api's verifier) | PBT-01..10 |
| U1-MAINT-03 | The test-only header authenticator (`x-test-principal`) stays for the api's route-security tests; `JwtAuthenticator` has its own tests with a test secret; the two are never both wired in `main.ts` | existing pattern |
| U1-MAINT-04 | `docs/admin/README.md` documents the token (claims, lifetime, how to mint one by hand on staging for a checklist, the rotation runbook) | FR-PLT-04 |

## Compliance at this stage

### Security (blocking)

| Rule | Status | Note |
|---|---|---|
| SECURITY-01 | N/A | no new store |
| SECURITY-03 | Compliant | U1-SEC-06, U1-REL-03 |
| SECURITY-05 | Compliant | the claims schema is strict; the header is bounded (4,096 chars) |
| SECURITY-06 | Compliant | the secret readable by the runtime account only (Infrastructure Design) |
| SECURITY-08 | Compliant | U1-SEC-01, -05, -08 |
| SECURITY-09 | Compliant | generic 401; no secret in config files |
| SECURITY-10 | Compliant | `jose` 6 pinned by the lockfile; no `latest` |
| SECURITY-11 | Compliant | one authenticator module; limits in `meta()`; abuse cases U1-SCAL-04, U1-SEC-09 |
| SECURITY-12 | Compliant for the token; MFA gap recorded | U1-SEC-02, -03, -07, -10 |
| SECURITY-13 | Compliant | signature verified every request |
| SECURITY-14 | Compliant | U1-REL-01, -02 |
| SECURITY-15 | Compliant | U1-AVAIL-04; the token source's typed failures |
| SECURITY-02, -04, -07 | N/A | unchanged |

### Resiliency (blocking)

| Rule | Status | Note |
|---|---|---|
| RESILIENCY-01, -02, -03, -08, -11..13, -15 | Compliant | inherited (requirements section 5); no new state |
| RESILIENCY-04 | Compliant | U1-AVAIL-05 |
| RESILIENCY-05, -07 | Compliant | U1-REL-01..03 |
| RESILIENCY-06 | Compliant | health probe unchanged; verification needs no dependency |
| RESILIENCY-09 | Compliant | U1-SCAL-01..03 |
| RESILIENCY-10 | Compliant | U1-AVAIL-01, -02 |
| RESILIENCY-14 | At NFR Design | scenarios: secret rotation; token route down; a wrong secret on one side |

### PBT

| Rule | Status | Note |
|---|---|---|
| PBT-09 | Compliant | `fast-check` + `vitest` in every affected package |
| PBT-01 | Compliant | P1-P7 in the functional design |
