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
| Merged (merge commit) | pending |
| `deploy-api` -> staging revision | pending |
| health 200; `apps/api listening` | pending |
| `GET /v1/admin/workers?page=1` without a token -> 401; with a WORKER token -> 403; with an ADMIN token -> 200 | pending |
| a tampered token -> 401 + `bad-signature` line in Cloud Logging (deferred from PR 1) | pending |
| `GET /v1/admin/users?search=...` and `GET /v1/admin/workers/suspended` -> 200 with `Cache-Control: private, max-age=60`, `ETag`; a repeat with `If-None-Match` -> 304 | pending |
| `EXPLAIN ANALYZE` of the slowest geo case on staging (GiST index on `worker_locations.point`) | pending (pasted here) |
| parity: `parity:admin-search` against a preview's old route and staging | pending (report pasted here) |
| timing: `--time` p95 under 500 ms | pending (report pasted here) |
| S9 pool-exhaustion drill: 12 concurrent distinct searches -> some 503 with `Retry-After`; recovery | pending |
| S12 rollback rehearsal on staging: promote the previous image; the entries answer 404; re-deploy | pending |
| production unchanged (`remonta-api-00005-j74`) | pending |

## Promotion (PRs 1 and 2 as one image)

| Step | Result |
|---|---|
| `deploy-api` dispatch, stage=prod, imageTag=<the merge sha> | pending |
| prod health 200; `GET /v1/admin/workers` without a token -> 401 | pending |
| `auth-failed` alert silent | pending |
