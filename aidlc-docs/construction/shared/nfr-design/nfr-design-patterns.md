# onboarding-tour: NFR design patterns, U1 and U2 (2026-10-21)

Answers: `construction/plans/onboarding-tour-nfr-design-plan.md` Q1-Q4 (all A). Requirements: NFR-01..10, §5.

## P1 Fail silent, never block (NFR-01, F2 A)

The tour is an optional layer over the dashboard. Nothing on the page waits for it, and none of its failures shows
an error.

- **Read with a deadline (Q2 A).** The home asks `GET /v1/worker/tour` once. If no `200` arrives within **3 s**
  (`TOUR_READ_DEADLINE_MS = 3000`; an `AbortSignal` on the contract client's call), or the answer is anything but
  `200` with `seenAt: null`, the card does not appear for this visit. A late answer is dropped, never shown.
- **Save with one retry (Q1 A).** Not now, Skip, Esc and Finish close the tour first, then call
  `PUT /v1/worker/tour/seen` in the background. On a network error, 429 or 5xx: **one** retry after
  `Retry-After` seconds when the api sends it (capped at 30 s), otherwise after 5 s. A second failure is dropped; the
  card may come back next visit. 401/403/404 are not retried. No notice, no loop.
- **In-memory "seen" for the visit.** After a close, the page never offers the card again in the same visit, whatever
  the save's outcome.
- **Isolation.** The tour lives in its own client component tree, loaded lazily on the worker home; an exception in
  it is caught by an error boundary that renders nothing.

## P2 Not on someone else's behalf (Q3 A)

- **App:** when `session.user.impersonatedBy` is set, the welcome card is never offered and nothing is saved. The help
  button still runs the tour (a replay saves nothing anyway, D7).
- **Api, defence in depth (U1 amendment BR-10):** `putTourSeen` with an impersonating principal answers **403** with
  `NOT_WHILE_IMPERSONATING`, as the account entries do (`account.handlers.ts` `notImpersonating`); nothing is written.
  `getTour` answers normally (reading is harmless).

## P3 Access, input, abuse (NFR-03..05)

Unchanged from U1's business rules: the token's own worker only (BR-1, BR-2); no body, the server's clock (BR-4); the
worker area's limits (BR-6); first time kept (BR-3), so a flood of saves changes nothing. The help button and the
tour's code are rendered only for the WORKER role (U2).

## P4 Performance and release-day load (NFR-07, Q4 A)

- One read per **home** visit, none on other pages; one save per worker in the tour's lifetime (plus at most one retry).
- The read is one statement on `worker_profiles` by `"userId"` (unique): the same cost as the ownership lookup every
  worker write already makes. **No dedicated load test** (Q4 A); the staging checks (requirements §6.2) cover it.
- The tour's code is a lazy chunk, not in the bundle of other pages or other roles.

## P5 Backward compatibility (NFR-02)

Additive entries only; `GET /v1/worker/profile` and every existing schema are unchanged. Proven on staging after U1
merges: today's production app build (`main`) against the staging api loads the dashboard and the profile pages.

## P6 Observability

The existing request log (request id, entry, status, duration) and `replaceSection`'s `worker.putTourSeen` line.
The app logs nothing to the console for an expected failure (P1). No new alert or metric: a failure has no user impact
(SECURITY-14 N/A).

## P7 Resiliency testing scenarios (RESILIENCY-14)

| # | Scenario | Expected | Where |
|---|---|---|---|
| R1 | The read answers 500 / times out after 3 s / the api is unreachable | No card; the dashboard renders and works | U2 unit tests (mocked client); the preview with the api URL blocked |
| R2 | The read answers late (after 3 s) | Dropped; no card appears later | U2 unit test (fake timers) |
| R3 | The save fails once, then succeeds | Tour closed at once; one retry; stored once | U2 unit test |
| R4 | The save fails twice | Tour closed; no third call; card offered again next visit | U2 unit test |
| R5 | The save answers 429 with `Retry-After: 7` | The retry waits 7 s | U2 unit test |
| R6 | An impersonating admin on the home | No card; the save is not called; the api refuses it (403) | U2 unit test; U1 handler test |
| R7 | The api rolled back to `b8fe2eb` (no entries) | The read 404s; no card; nothing else changes | Reasoned from R1; checked on staging only if a rollback happens |

## P8 Property-based tests (PBT-01; `fast-check`)

| Unit | Property | Kind |
|---|---|---|
| U1 | For any sequence of 1..n saves at increasing clock values, the stored value equals the clock at the first save and every response carries it | Idempotency (database test) |
| U1 | For any two workers, one's saves never change the other's value, and each read returns only its own | Invariant (database test) |
| U1 | For any stored instant or null, the read's body parses with `TourView` and round-trips the instant | Round-trip |
| U2 | The tour as a state machine: for any sequence of Next / Back / Skip / Esc / Finish, the step stays within 1..5, Back never goes below 1, Finish exists only on step 5, and every ending requests exactly one save (none on a replay, none while impersonating) | Stateful model (PBT-06) |
| U2 | Every step's target resolves to a `WORKER_MENU` id or the checklist anchor | Invariant |
| U2 | The retry delay: for any `Retry-After` value (absent, 0..10,000, malformed), the delay is within 0..30 s and is 5 s when absent or malformed | Invariant |
