# NFR Requirements Plan -- unit `api-identity` (U1)

**Inputs:** the functional design (`../api-identity/functional-design/`, rules R1-R6, properties P1-P7), the cycle's
NFR-03/04/06/07/08/09/13, the api's runtime (Node 22 on Cloud Run, 1-4 instances in prod, the Postgres rate
limiter with windows 1m/10m/1h/1d, pino logging, the log-metric alerts), the app's runtime (Next.js 15 on Vercel,
NextAuth 4.24 with `jose` 4 bundled, Upstash limiters: strict 30/min).

Four decisions, each pre-filled with a proposal; leave or change the letter and say "approved" (or "done").

## Question 1
Rate limits on the admin entries (requirements FR-ID-05, NFR-06; `meta().rateLimit` with `per: 'user'` and
`per: 'ip'`). An admin who flicks through filters sends a request per change, but repeats are served by the
browser cache (D15), so the api sees mostly new combinations.

A) **Per user 120 per minute and per IP 300 per minute** on the search; **60 / 120** on the users and suspended
lists. Generous for one person, tight for a scraper (120 pages of 100 rows = 12,000 rows a minute at most, with
`unplacedCount` and totals visible either way). Recommended.

B) **Per user 60 per minute and per IP 120** on all three entries. Halves the ceiling; a fast admin with the
cache cold may see a 429 during a burst of filter changes.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 2
The auth-failure alert threshold (requirements FR-PLT-02, OI-4; the log metric `remonta-api-auth-failed` counts
the `auth: 'rejected'` warn lines). Normal traffic produces a few `expired` rejections a day (a tab left open
past renewal); a scan or a stolen-token attempt produces many in minutes.

A) **More than 20 rejections in a 5-minute window, production only, severity ERROR, auto-close 30 minutes**,
emailed to support like the others; the policy's documentation names the reasons to look for in the logs.
Recommended: above anything the renewal flow produces, below what a scan produces in its first minute.

B) **More than 5 in 5 minutes**: earlier, noisier (a few admins with stale tabs after a deploy could trip it).

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 3
Secret rotation (R6.3). The secret lives in Secret Manager (api, read at instance start) and in Vercel (app, read
at build/deploy). The two sides cannot be switched at the same instant.

A) **The api accepts two secrets during a rotation.** `API_TOKEN_SECRET` (current) and an optional
`API_TOKEN_SECRET_PREVIOUS`; the verifier tries the current first, then the previous (`jose` keyed by `kid`:
the minter sets `kid: 'current'`; the verifier maps `kid` to the secret, or tries both when absent). Rotation
runbook: (1) api: previous = old, current = new, redeploy; (2) app: new, redeploy; (3) after one token lifetime,
api: drop previous, redeploy. No admin notices anything. Recommended.

B) **A hard cut.** One secret; rotate both sides as fast as possible; for the gap every admin call fails once and
the client re-mints (R5.6); if the app still has the old secret the re-mint also fails and admins are sent to sign
in until both sides match. Simpler, a visible blip.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 4
Where the auth-failure lines and the attributed request lines are read (SECURITY-14, RESILIENCY-05).

A) **Cloud Logging only, with two saved queries** documented in `docs/admin/`: rejections by reason over 24 h, and
requests by `userId` for one admin; the log retention stays at 90 days; no dashboard is added (the existing alert
set plus the new policy cover the operational need). Recommended.

B) **Add a Cloud Monitoring dashboard** (request rate, latency and rejections for the admin entries) created by
a new script beside `apply-alerts.sh`. More to maintain; useful once admin traffic is significant.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Tech stack decisions that are not questions (stated so they can be objected to)

- **`jose` 6.x** declared directly in `apps/api` and `apps/app` (ESM, Node 20+; the app's NextAuth keeps its own
  bundled `jose` 4, no conflict). HS256 through `SignJWT` / `jwtVerify`; no other library.
- **The claims schema in `packages/api-contract`** (Zod 4, P-6 respected: no `jose` in the package).
- **The token route uses the app's existing Upstash `strictApiRateLimit`** (30/min) keyed by user id, and the
  existing `getSession()`; a Prisma read of `users` by id (indexed primary key).
- **The api's limiter stays the Postgres fixed-window one**; `per: 'user'` keys are `<entry>:user:<userId>`.
- **Logging:** pino child bindings; the warn line's shape fixed by R3.9; the log metric filter
  `jsonPayload.auth="rejected"`; no new logging dependency.
- **Tests:** `vitest` + `fast-check` (PBT-09) in `apps/api`, `apps/app` and `packages/api-contract`; the
  `jose` interop test imports the app's minting function and the api's verifier in one test file under
  `apps/api/test` with the contract's schema; no network.
- **Performance targets:** the token route under 150 ms at p95 (one indexed read, one HMAC); `authenticate` under
  1 ms per request (an HMAC over a few hundred bytes); no measurable change to the pipeline's latency.
- **Availability:** no new runtime dependency on the request path: verification is in-process; the token route
  depends on the app's database and Upstash as every app route does.

## Execution checklist

- [x] 1. Confirm the four answers above; resolve any ambiguity in a clarification file
- [x] 2. `aidlc-docs/construction/api-identity/nfr-requirements/nfr-requirements.md`: performance, scalability,
  availability, security, reliability, maintainability, traced to the cycle's NFRs, the rules and the stories;
  the compliance tables for Security, Resiliency and PBT at this stage
- [x] 3. `tech-stack-decisions.md`: the table of decisions with alternatives and reasons; versions to pin
- [x] 4. Present for approval
