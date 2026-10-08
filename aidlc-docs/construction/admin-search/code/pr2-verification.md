# PR 2 verification record -- admin-search, api side

Branch `feat/admin-search-api`, 6 commits (`b31bccf`, `ddacf3c`, `e3909dd`, `874327d`, `5de0629`, `d943f96`). PR #42.

## CI on the PR

| Check | Result |
|---|---|
| API Quality (Node 20, 22; PostGIS + fake GCS): the 14 new gated tests run here | failed on `874327d` and `5de0629` (the registration harnesses did not bind the admin area: BootError in the gated suites); **success on `d943f96`** 05:49Z |
| Infra Quality, App Quality, Web Quality | success |
| Supply chain, CodeQL, Semgrep | success (13 checks; failures: none) |

## Merge and staging

| Step | Result |
|---|---|
| Merged (merge commit) | #42 -> `b09a9c1`, 2026-10-08 05:57Z (the first two "Merged" reports were checked by refs and found open; the third was real) |
| `deploy-api` -> staging revision | run 37734997370 success 06:03:18Z; `remonta-api-staging-00016-8xb` ready 06:02:24Z, 100% traffic; image tag `b09a9c1…` |
| health 200; `apps/api listening` | 200 in 0.45 s; "apps/api listening" 06:02:37Z on 00016; no ERROR line |
| `GET /v1/admin/workers?page=1` without a token -> 401; with a WORKER token -> 403; with an ADMIN token -> 200 | run 5 on `00017-h7x` (06:2xZ, `apps/api/scripts/staging-admin-check.ts`, run by the user): 401 / 403 / 200 (total 1765, unplaced 69, 20 rows). Runs 3-4 on `00016` answered 401 to every token: the secret had been stored with a line ending (44 chars + `

` as printed); both stages' `API_TOKEN_SECRET` got a clean version 2 (06:14Z) and staging was redeployed (`00017`, same image) |
| a tampered token -> 401 + `bad-signature` line in Cloud Logging (deferred from PR 1) | 401; Cloud Logging on `00016`/`00017`: `auth: rejected, reason: bad-signature` lines present (25 counted at 06:12Z) |
| `GET /v1/admin/users?search=...` and `GET /v1/admin/workers/suspended` -> 200 with `Cache-Control: private, max-age=60`, `ETag`; a repeat with `If-None-Match` -> 304 | search and suspended: 200, `private, max-age=60`, ETag, `Vary: Authorization`, repeat -> 304. Users list: the runner sent `search=a` and got 400 (the contract requires 2+ characters: correct); run 6 with `search=an`: 200, private caching headers, ETag, 304 (18/19 rows passed; the one failure is the timing replay below) |
| `EXPLAIN ANALYZE` of the slowest geo case on staging (GiST index on `worker_locations.point`) | Parramatta 50 km, distance sort, pageSize 100: `Index Scan using worker_locations_point_idx` (`point && _st_expand(..., 50000)` + `st_dwithin` filter, 343 rows, 10 removed), pk joins to profiles/users/localities, top-N heapsort; execution 116 ms cold, 14 ms and 6 ms warm. Radius checks: 10 km -> 87 rows all <= 10 km, sorted nearest first; 50 km -> 336 total; any distance -> 1696 (= 1765 - 69 unplaced); unknown id -> 400 `fields.localityId`; unknown parameter -> 400 |
| parity: `parity:admin-search` against a preview's old route and staging | not run: needs a preview session cookie; the user declined to supply one in this run (the timing replay ran instead). Open until PR 3's preview, where the same comparison can be made from the screen |
| timing: `--time` p95 under 500 ms | from the user's machine (Manila -> Sydney; `/v1/health` alone 460-640 ms): p50 ~290 ms, p95 300-600 ms per case. Server side, from the logs on `00017` (30 min, n=159 admin requests): Cloud Run edge p50 56 ms, p95 100 ms, max 383 ms; the search handler itself (`admin search` lines, n=148) p50 39 ms, p95 69 ms. NFR-01 met at the api; the client figure is the network path. Run 6: the replay (450 back-to-back calls, ~200/min) was cut off at case 13-15 by the per-admin limit (429 `RATE_LIMITED`, 120/min): the limit works as declared; the replay is now paced at 550 ms (`--pace`) |
| S9 pool-exhaustion drill: 12 concurrent distinct searches -> some 503 with `Retry-After`; recovery | 12 concurrent searches (pool 5): all 200, slowest 627 ms from the client, recovery 200. No shedding was needed at this load; the 503 path remains proven by the unit tests (`errors.test.ts`) |
| S12 rollback rehearsal on staging: promote the previous image; the entries answer 404; re-deploy | 06:44Z: traffic 100% to `00015-sgw` (PR 1 image) by the user (`gcloud run services update-traffic`); health 200 x3, `/v1/admin/workers` and `/v1/admin/users` 404 x3, `/v1/localities` 200 x3. 06:46Z: traffic 100% back to `00017-h7x`; health 200, both entries 401 again. Seconds each way, no rebuild |
| production unchanged (`remonta-api-00005-j74`) | throughout (last check 06:46Z): `remonta-api-00005-j74` serving, health 200, `/v1/admin/workers` 404 |

## Promotion (PRs 1 and 2 as one image)

| Step | Result |
|---|---|
| `deploy-api` dispatch, stage=prod, imageTag=`b09a9c1dedd3558b4eda08d72f8bfa8e0334aa3a` | pending (the user dispatches; the staging checklist above is complete, parity-against-the-old-route excepted) |
| prod health 200; `GET /v1/admin/workers` without a token -> 401 | pending |
| `auth-failed` alert silent | pending |
