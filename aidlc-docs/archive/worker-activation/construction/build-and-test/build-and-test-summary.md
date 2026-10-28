# Build and Test summary -- worker-activation (written at the close, 2026-10-28)

## Units

| Unit | PR / merge | Gates | Staging / preview | Production |
|---|---|---|---|---|
| U1 `activation-api` | #108, `main` `746a60d` | contract, api unit + database tests (CI API Quality, both Node versions after the `603fd4f` fix) | deploy-api run 39888211882; `_activation-staging-check.ts` 19/19 PASS (N1 strict-parse snapshot, FR-3 0 activated of 1,790, BR-5/6/9, 401/403/404/400, one activate/deactivate round trip) | promoted 2026-10-23 02:30Z, run 39889953683, revision `remonta-api-00017-4bz`; migration `worker_profiles_is_activated` applied |
| U2 `activation-app` | #109, `main` `8b8a82d` | app gate (55 type / 277 lint known, 39 test files) | PR preview against staging `746a60d`, taken as good by the user | Vercel builds of `8b8a82d`; login 200, www 200, `/api/public/workers` empty (FR-3, accepted); the user's "Perfect" taken as the signed-in check |

## Deviations

- **A flaky database test** (U1): the N3 role check read a worker flag left at a random draw by the P1/P2 property;
  failed on Node 20 by chance. Fixed in the test (`603fd4f`) before the merge.
- **Promotion sha corrected**: `603fd4f` named first; the image is the merge commit's, `746a60d`.
- **FR-10 / A8 withdrawn** by the user during U2 (the worker's activation note); `GET /v1/worker/activation` stays live, unused.
- **FR-5 changed after the release** (PR `fix/client-search-all-workers`): the signed-in client search shows every
  ACTIVE-account worker again; only the public list needs the flag.

## Changes made during the cycle, outside its units (all live)

#110/#111 nursing-type admin filter (api `00018-nl4` = `8daec55`); the client-search change and a stray "npm" text;
#114/#115 extra photos (api `00019-p5m` = `0275574`); #116 admin worker page tidy; #117/#118 Replace photo picks an
existing photo (api `00020-s7c` = `e0d7ec8`); #119 admin photo entries removed (api `ea66ac0`, promoted 08:05Z);
#120 the marketing jobs from the app; #121-#131 the client service requests (`MATCHING` status, api `90fdadb`
promoted 2026-10-26 05:41Z, run 40275596042; manage-request columns and actions; webhooks with `after()`), not
recorded in the audit when made (noted 2026-10-28).

## Not done

Revision names after `00020-s7c` not read (gcloud needs `gcloud auth login`). Database-gated tests ran only in CI
(Docker broken locally).
