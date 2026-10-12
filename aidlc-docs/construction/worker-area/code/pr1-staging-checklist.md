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

## 4. The apply on staging, and PRs #51 and #52

**Apply** (02:00Z, 512 s; `backfill-staging-apply.json`): 1,790 examined, **240 changed**, 0 failed, 8 moved to
IN_PROGRESS (an earlier apply had already written 174 before dying: 414 in all, as the dry run said). That earlier
death was Prisma **P2028** "Unable to start a transaction in the given time": an interactive transaction waits only
Prisma's default 2 s for a pool connection, and `errors.ts` mapped P2024 but not P2028 to 503 -- under pool
pressure in production the same would have been a 500. **PR #52** (`fix/transaction-max-wait`, merged 02:04Z,
`b9ff6f4`): P2028 -> 503 `reason: pool`; `maxWait` 5 s on both transaction helpers. **Second apply** from the
merged `main`: 1,790 examined, **0 changed**, 0 failed -- idempotent.

**PR #51** (`fix/backfill-completion-batched`, merged 01:58Z, `e9449f1`): the batched backfill, the exemption,
the token refresh. Both PRs green on CI (App/Web Quality skipped by path filter).

## 5. The load test, run 2 (02:14Z-02:27Z, `load-2026-10-12-run2.json`), with the exemption

`RATE_LIMIT_EXEMPT_IPS` set on staging for this machine (revision `00023-rdg`, the boot warning logged). The
first attempt still got 429s: Cloud Run sees this machine's **IPv6** address (`httpRequest.remoteIp`), not the
IPv4 one `api.ipify.org` returns -- both listed (revision `00024-f88`), run restarted. Server-side figures are the
api's own `responseTime` per request from Cloud Logging; the script's figures include this machine's ~250 ms
round trip to Sydney (and its "p95" is autocannon's p97.5).

| Phase | Requests | Status | Server-side p50 / p95 / p99 | Script: p50 / p99 all, p95 admitted |
|---|---|---|---|---|
| sustained 25/s, 10 min | 14,873 | 9,693 × 200, 5,180 × 304, **0 × 429, 0 × 5xx**, 0 errors | 77 / 150-230 / 400-760 ms per minute (311 / 859 over the phase incl. the minute the burst starts in) | 138 / 789 ms; 380 ms |
| burst 125/s requested, 60 s | 3,325 served (~55/s reached the server) | 0 × 429, **0 × 503**, 0 errors | 465 / 983 / 1,658 ms | 573 / 7,330 ms; 1,791 ms |
| recovery 25/s, 60 s | 1,493 | 0 refused | 82 / 211 / 754 ms | 146 / 781 ms; 438 ms |

Thresholds (U1-PRF-03): sustained p99 ≤ 800 ms PASS, no 429 PASS, no 5xx PASS, no errors PASS; the script's
"sustained p95 ≤ 300 ms" row reads FAIL at 560 ms **from here**, while every server-side minute is well under
300 ms -- the threshold was written for a generator in Australia (infrastructure design Q1 A). Burst: no 5xx PASS,
no errors PASS; "p95 of admitted ≤ 1 s" FAIL at 1,791 ms from here (983 ms server-side). Recovery: PASS.

**Finding (design note, not a blocker):** one staging instance serves about **55 reads a second**; above that
latency climbs (the 5-connection pool is the bottleneck: a read holds a connection ~80 ms) and nothing is shed,
because in-flight stays far below `MAX_IN_FLIGHT` 64 and the event loop stays quiet. The 125 req/s burst needs
three instances; prod scales to ten. The shedder protects the process, the pool protects the database; the load
report shows the second one is the one that fills first.

## 6. The drills (P13 g, h)

**(g) Burst** = run 2's burst phase, watched: revisions `00024-f88` only (no new revision, no restart), no
`severity>=ERROR`, no liveness/probe line, **one** instance id throughout, zero 503. PASS.

**(h) Event-loop signal** (`MAX_EVENT_LOOP_DELAY_MS=50` on staging, revision `00025-tdd`; 5 min at 25 req/s,
02:30Z-02:35Z; `load-2026-10-12-eventloop-drill.json`): 7,424 requests, 4,988 × 200, 2,411 × 304, **25 × 503
with `reason: shed`** in one cluster at 02:33Z, 25 back-offs honoured, 0 errors; the next minute clean (979 × 200,
507 × 304). The signal fires and the service recovers on its own. PASS.

**Restore** (02:36Z): `MAX_EVENT_LOOP_DELAY_MS=200`, `RATE_LIMIT_EXEMPT_IPS` removed (revision `00026-xb5`);
health 200; the live environment equals `service.staging.yaml` exactly (checked variable by variable). The
runbook lessons (list the IPv6 address; the gcloud restore) are on `docs/drills-ipv6`.

## 7. Still to do for PR 1's promotion (operator)

- The Neon values in `infra/README.md` "Database connections" (console) and the A$300 budget (console).
- Promote: Actions → deploy-api → Run workflow → stage=prod, imageTag=`b9ff6f4` (the image that passed everything
  above, with PRs #51 and #52 in it).
- Right after: the production backfill, dry run then `--allow-production --apply` (from `apps/api/.env`'s
  production URL; about two minutes each with the batched read); then the production checks of §1 against the
  prod URL with a production worker token.

## 8. Production (2026-10-12, 03:07Z-03:38Z)

- **Promotion**: the first dispatch (03:04Z) failed at the image guard because the session had given the short
  sha (images are tagged with the full 40-character sha); nothing was applied. The second dispatch
  (run 38198491729, 03:07Z, imageTag `b9ff6f4156923c89ae49ec0af59056e7cda71762`) green: prod revision
  **`remonta-api-00008-dq4`**, maxScale 10, `MAX_IN_FLIGHT` 64, no exemption; health 200; the worker route live
  behind auth. Rollback, if ever needed: revision `remonta-api-00007-j7w` / image `024596f…` (deploy-api dispatch
  with that sha, or Cloud Run → Revisions → route traffic).
- **The 14 api checks against production** (a production worker's token, read-only): ALL PASS -- a placed worker
  with three services in the contract shape, masked bank data, cache headers, 304, 401/403/404/400, the admin
  search 200, staging health 200.
- **The backfill on production** (the URL from Secret Manager; `apps/api/.env` points at the local database, so
  the runbook's "from .env" was wrong -- corrected here; the guard needs `--allow-production` for any run on
  that host): dry run 231 s, 1,842 examined, 422 would change, 0 failed (`backfill-prod-dry.json`); **apply**
  1,288 s, 1,843 examined, **422 written**, 0 failed, 135 moved NOT_STARTED -> IN_PROGRESS, 154 now
  `profileCompleted` (`backfill-prod-apply.json`); **second apply: 0 changed, 1,843 unchanged** -- idempotent.
  Nothing outside the worker dashboard reads these flags; the dashboard computes its own until U2.

**PR 1 (U1 worker-area) is live.** Left for the U1 clean-up PR: CLAUDE.md's rollback rows (api revision
`00008-dq4`, image `b9ff6f4…`; the app unchanged), "the full sha" in the Promote line and in
`docs/worker/README.md` §7, the backfill runbook's URL source, the IPv6 note (merged via #53/#54), the Neon rows
still `_to record_` (deferred by the user, the pooler flag verified on both stages), and the design note on the
pool being the first limit (55 reads/s per instance).
