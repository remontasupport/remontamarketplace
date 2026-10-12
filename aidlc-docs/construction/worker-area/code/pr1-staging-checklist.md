# PR 1 (#50) -- the staging checklist (U1 worker-area)

PR #50 merged to `main` as `eba2d42` on 2026-10-12 01:31Z ("Merge pull request", 5 commits). `deploy-api` run
38192197213 on `eba2d42`: success; staging revision **`remonta-api-staging-00020-5vt`** at 100 % (was
`00019-n5d`). The database steps read the `rehearse-w1` copy (host `ep-wandering-shadow`); nothing on production
was touched.

## 1. The api checks (session, `scripts/_u1-staging-check.ts`, not committed; 2026-10-12 ~01:50Z)

Secrets through `gcloud secrets versions access` (the staging pair; the token secret is 44 characters with no
surrounding whitespace, so the api and the app agree). Tokens minted for the first active worker, the newest
placed worker with services, the first admin, and a WORKER account without a profile.

| Check | Result |
|---|---|
| staging health | PASS 200 in 448 ms |
| WORKER read -> 200 in the contract shape | PASS 200 in 250 ms; `profileSchema` parses |
| the body | `displayRole="Support Worker"`, 1 service, `serviceArea="North Sydney, NSW 2060"`, `verificationStatus=NOT_STARTED`, completion all false / percent 31, mandatory 7 items (part 1 approved, the rest missing), trainings 4 items missing, sections empty, bankAccount null |
| no raw bank numbers in the body | PASS |
| cache headers | PASS `private, max-age=60`, ETag present, `Vary: Authorization` |
| If-None-Match -> 304, same ETag | PASS 304 in 324 ms, 0 bytes |
| same body twice (P4) | PASS equal ETags |
| no token -> 401 | PASS |
| ADMIN token -> 403 | PASS |
| tampered token -> 401 | PASS |
| WORKER without a profile -> 404 envelope | PASS `{"error":{"code":"NOT_FOUND",...}}` |
| query parameter -> 400 | PASS |
| admin search still 200 | PASS 200 in 262 ms |
| ten reads from this machine | min 242 ms, median 258 ms, max 265 ms (round trip to Sydney included) |
| production unchanged | PASS prod health 200; prod `GET /v1/worker/profile` 404 (route not deployed) |

**ALL PASS (14 checks).**

## 2. The backfill on staging

**First attempt** (01:40Z) from this machine with the merged code: each worker is its own transaction of ~17
statements and every statement a round trip to Sydney (~250 ms), so 1,790 workers would take about two hours;
stopped after ten minutes (a dry run writes nothing). Fix on `fix/backfill-completion-batched`: the backfill
reads a page of workers per transaction (`readProfileRowsPage`, a statement per relation per page, the catalogue
once, selected per worker in memory; a 15 s statement / 90 s transaction deadline for the page; a property test
proves the in-memory selection equals the per-worker query).

**Dry run with the batched read** (01:49Z, 129 s for 1,790 profiles; `backfill-staging-dry.json`):

| | |
|---|---|
| examined / would change / unchanged / failed | 1,790 / **414** / 1,376 / 0 |
| `verificationStatus` NOT_STARTED -> IN_PROGRESS | 135 |
| accountDetails | on 161, off 0 |
| compliance | on 16, off 49 |
| trainings | on 42, off 28 |
| services | on 36, off 26 |
| profileCompleted | on **148**, off 1 |

The "off" counts are stored flags the older per-section copies had set that the fixed rules do not grant (status
now checked on contract, code-of-conduct, training and service rows; REQUIRED links only). Nothing outside the
worker dashboard reads these flags today (completion-today.md), and the dashboard still computes its own, so no
screen changes until U2 moves the sidebar.

**Apply** (the same code, 01:55Z): _recorded in §4 below._

## 3. The load test, run 1 (01:41Z-01:55Z, `load-2026-10-12-run1-ip-limited.json`)

200 workers, 25 req/s for 10 min, a 60 s burst at 125 req/s, 60 s recovery, from this machine (one IP).

| Phase | Requests | 200 / 304 | 429 | 401 | 5xx | p50 / p99 (all) | p95 admitted |
|---|---|---|---|---|---|---|---|
| warm-up (13/s) | 774 | 437 / 163 | 174 | 0 | 0 | 120 / 779 ms | 315 ms |
| sustained (25/s) | 14,899 | 781 / 419 | 11,899 | 1,800 | 0 | 92 / 441 ms | 360 ms |
| burst (125/s) | 7,404 | 202 / 98 | 7,104 | 0 | 0 | 109 / 758 ms | 889 ms |
| recovery (25/s) | 1,500 | 193 / 107 | 1,200 | 0 | 0 | 102 / 426 ms | 370 ms |

Thresholds: every row PASS except **"no 429" (11,899)**. Zero 5xx, zero errors, zero timeouts; staging stayed on
revision `00020-5vt` (no restart); no `reason` lines in Cloud Logging (nothing was shed: 300 reads a minute never
approach `MAX_IN_FLIGHT`).

Two findings, both fixed on `fix/backfill-completion-batched`:

1. **The per-IP limit (300/min) refused four requests in five before the read ran** -- correct for production,
   where 10,000 workers an hour come from thousands of IPs, but it means a single-machine run cannot measure the
   read path. Decision (user, 2026-10-12): `RATE_LIMIT_EXEMPT_IPS`, a config list the per-IP rules skip, empty by
   default, absent from both stage tables (asserted), set on staging by hand for a run and removed by redeploy,
   warned at boot. Per-user rules still apply.
2. **1,800 × 401 in the second half of the sustained phase**: tokens live five minutes and were re-minted only
   between phases. The script now refreshes stale tokens every 10 s during a phase.

So the sustained and burst numbers above are the **limiter's** load test (11,899 fast refusals a phase at ~90 ms
from here, no errors), not the read path's. Run 2 with the exemption deployed is the measurement the design asks
for; it needs the fix PR merged and `RATE_LIMIT_EXEMPT_IPS=<this machine's IP>` set on staging first.

## 4. Still to do for PR 1's promotion

- Merge the fix PR (`fix/backfill-completion-batched`: batched backfill, the exemption, the token refresh);
  staging redeploys.
- Set the exemption on staging; run 2 of the load test (`--rate 25 --minutes 10 --burst 5`); the burst drill
  (revision events) and the event-loop drill (`MAX_EVENT_LOOP_DELAY_MS=50`); restore by redeploy.
- The Neon values in `infra/README.md` and the A$300 budget (console, operator).
- Promote the image; the production backfill (`--allow-production --apply`).
