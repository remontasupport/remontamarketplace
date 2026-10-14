# Infrastructure Design Plan -- unit `worker-area` (U1)

**Inputs:** the functional design (R6, R7, L6, L7), the NFR requirements (U1-SCL-03/05, U1-PRF-03, U1-REL-01..03),
the NFR design (P2, P4, P5, P10, P11, P13, the logical components), the infra code as it is: `infra/lib/stages.ts`
(prod 1-4 instances, `MAX_IN_FLIGHT` 128; staging 1-1, 64; `DB_POOL_SIZE` 5 both), `render.ts` (`minScale`/`maxScale`,
`containerConcurrency`, CPU always allocated), `infra/test/cloudrun.test.ts` (asserts `[1, 4]` for prod and the set
of differing env names), `deploy-api.yml` (push to main → staging; `workflow_dispatch(stage, imageTag)` → promote
or roll back), `infra/README.md` (the cost section: one always-on 1 vCPU instance ≈ A$80-100 a month; the Neon
pooled-string note), the Neon project (Sydney; the compute size and pooler limit not in the repository).

Three questions, each pre-filled with a proposal; leave or change the letter and say "approved" (or "done"). The
categories the rule names are covered by the questions or by the justified mappings below.

## Question 1
Where the load test runs (U1-PRF-03, P10). The numbers must be representative: Cloud Run and Neon are in Sydney.

A) **From the operator's machine in Australia, against staging**, with the staging secrets in the shell as the
checklist runner uses them (`STAGING_API_TOKEN_SECRET`, `STAGING_AUTH_DATABASE_URL`); the report file is committed
to the construction notes by hand. Latency includes the operator's last mile, which is small within Australia and
is noted in the report. Recommended: no secrets leave the two stores, the same practice as every checklist run.

B) **A `workflow_dispatch` job in GitHub Actions** (`load-test.yml`) with the staging secrets in GitHub; reproducible
from the browser, but GitHub's runners are in the United States, so every latency number carries 150-200 ms of
distance and the thresholds would have to be re-based; and a third copy of the staging secrets exists.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 2
The production instance ceiling and its cost (U1-SCL-03, P11). Instance-based billing charges every running instance
for its whole life, not per request; `minInstances` stays 1 (≈ A$80-100 a month today), and instances above it run
only while Cloud Run scales them up for load, then stop within minutes of the load ending.

A) **`maxInstances` 10.** At a sustained 25 req/s, one or two instances run; at a burst, up to ten for its duration.
Worst case, ten instances all month ≈ A$900-1,000, reached only under a month-long overload (which the 5xx-ratio
alert would have reported long before). No budget alert exists in the project today; the design proposes a Cloud
Billing budget at A$300 a month with an email at 50 / 90 / 100 % as a one-time console step in the runbook (not
code: budgets are not in the stages table). Recommended.

B) **`maxInstances` 6** with the same budget; a tighter cost ceiling, 480 admitted requests in flight, still above
the burst's need by the load test's arithmetic.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 3
The event-loop shedding drill on staging (P13 h) needs `MAX_EVENT_LOOP_DELAY_MS=50` for five minutes. The rendered
YAML is the source of truth and the drift test compares the table with the YAML, not with the live service.

A) **A temporary live override, restored by a redeploy**: `gcloud run services update remonta-api-staging --region
australia-southeast1 --update-env-vars MAX_EVENT_LOOP_DELAY_MS=50`, run the drill, then restore by dispatching
`deploy-api` for staging with the same image tag (which re-applies the rendered YAML). The two commands are the
runbook's drill section; the live override is never made on prod. Recommended: no code path for a one-off.

B) **Skip drill (h)**; the CI shedder test (P13 d) and the burst drill (g) are enough evidence that shedding works.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Mappings fixed by earlier decisions (justified, not questions)

- **Deployment environment:** unchanged. Google Cloud project `remonta-api-510206`, `australia-southeast1`, the two
  Cloud Run services from the table; Vercel `remonta-app` untouched in U1 (PR 1 has no app change).
- **Compute:** the table's prod row changes to `maxInstances` 10 (Q2) and `MAX_IN_FLIGHT` 64; `concurrency` 80,
  `cpu` 1, `memory` 1Gi, `minInstances` 1 unchanged; staging unchanged. `infra/test/cloudrun.test.ts` updates its
  `[1, 4]` assertion; the drift test regenerates `service.prod.yaml`. Rollback of the table change = promoting the
  previous revision (Cloud Run keeps the previous env). No new service.
- **Storage:** none in U1. Neon unchanged; the pooled string verified by the operator (U1-SCL-05) and the values
  written into `infra/README.md`'s database section. The backfill (P14) writes existing columns only.
- **Messaging:** none in U1 (the outbox gains no handler until U4).
- **Networking:** unchanged. The worker entry is served on the api's `run.app` URL; CORS stays exact per stage;
  the app will call it with the bearer token from `NEXT_PUBLIC_API_URL` (U2's PR 3). No DNS, no gateway.
- **Monitoring:** the existing seven policies cover the entry (U1-REL-01); the 503 `reason` field feeds two saved
  log queries documented in `docs/worker/README.md`; the drills' observations come from Cloud Run revision events
  and the load report. The budget alert of Q2 is the only addition, by console.
- **Shared infrastructure:** the api's pool, limiter table, outbox and scheduler are shared with the registration
  and admin areas on the same service; the worker read adds short transactions only; the pool arithmetic (50 at
  full scale) is the shared constraint recorded in the README.

## Execution checklist

- [x] 1. Confirm the three answers; resolve any ambiguity in a clarification file
- [x] 2. `infrastructure-design.md`: the stages table diff, the test changes, the Neon verification procedure and
  where its values are recorded, the budget step, the load-test runbook (environment, command, thresholds, where the
  report goes), the drills' runbook (g, h) with the restore step, the backfill runbook (staging then prod), the
  rollback of each
- [x] 3. `deployment-architecture.md`: the picture (operator machine → staging; Cloud Run staging/prod; Neon pooled;
  the promotion path) and PR 1's deployment sequence (merge → staging deploy → Neon check → backfill dry run and
  apply on staging → load test → drills → promote → backfill on prod → re-record rollback ids)
- [x] 4. Cross-check against U1-SCL-03/05, U1-PRF-03, U1-REL-03, US-WP-30/32
- [x] 5. Present for approval
