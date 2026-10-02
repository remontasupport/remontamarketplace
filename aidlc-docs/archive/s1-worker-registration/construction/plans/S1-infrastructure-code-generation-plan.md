# S1 — Infrastructure: Code Generation Plan

**Unit:** S1-infrastructure (step 3 of the path to "apps/api deployed and in use")
**Branch:** `s1/worker-registration` (continues; the PR for its earlier commits is open)
**Designs:** `construction/S1-registration/infrastructure-design/infrastructure-design.md` and
`deployment-architecture.md` (both approved 2026-09-28)
**Stories / requirements:** enablers US-MIG-01 (the switch is the canary), NFR-RES-02/-04/-06,
NFR-SEC-01/-02/-05/-07/-09/-10, NFR-OBS-01, NFR-CMP-03
**Status:** **APPROVED 2026-09-30** (user: "go ahead with the infrastructure code") with the amendments in §3a;
**PART 2 — GENERATION in progress** on branch `s1/infrastructure`. This plan is the single source of truth for
this unit's code generation.

---

## 1. Constraints

- Brownfield: existing files are modified in place; nothing is duplicated.
- `main` is production for both apps. Everything here lands through one PR; merging it changes
  nothing user-facing until the first-deploy runbook is executed (the api is not reachable from
  the app until `NEXT_PUBLIC_API_URL` is set and the switch is flipped).
- Every existing gate stays green: `@remonta/app`, `@remonta/web`, `@remonta/schemas`,
  `@remonta/api-contract`, `@remonta/form-engine`, `@remonta/api` (with the local database),
  `turbo run build`. Regenerated Prisma clients are never committed.
- The `infra/` package must synthesise **without AWS credentials** (no context lookups; explicit
  availability zones), so `cdk synth` runs in CI and in tests like any other quality gate.
- The two blanks in the design stay as they are: Neon retention is a runbook step; the
  application's other origins are a single value (`CORS_ORIGINS`) the user can extend in the task
  environment without a code change.

## 2. Decisions made in this plan (defaults; say if you want otherwise)

| # | Decision | Why |
|---|---|---|
| D1 | Three stacks: `RemontaGithubOidc` (provider + deploy role), `RemontaApiEcr` (repository), `RemontaApiProd` (everything else) | The image must exist before the service can start: the workflow pushes to a repository that the bootstrap already created. OIDC and ECR are deployed once from the developer machine (runbook step 1); the workflow deploys `RemontaApiProd` |
| D2 | CDK app runs TypeScript directly through `tsx` (`cdk.json` → `tsx bin/remonta-api.ts`); no build step, vitest for tests, the shared ESLint base and tsconfig | Same toolchain as the other packages; nothing to compile |
| D3 | Versions: `aws-cdk-lib ^2.271.0`, `constructs ^10.8.1`, `aws-cdk ^2.1143.0` (npm, 2026-09-28) | Current at the time of writing |
| D4 | `imageTag` is a CDK context value (`-c imageTag=<sha>`); synth without it uses `local` so tests and CI synth work | The workflow always passes the SHA |
| D5 | The ACM certificate's validation record is read from the ACM console at first deploy (no hosted zone in AWS; DNS is on Vercel) | The design's runbook step 2 |
| D6 | `ci-infra.yml` runs quality + `cdk synth` only; `cdk diff` against the live account is added after the bootstrap exists (needs the lookup role) | Cannot diff against an account that does not exist yet |
| D7 | The deploy workflow re-runs the api quality gate (no database: PostGIS-backed suites skip) before building; the full database-backed gate remains `ci-api.yml` on the PR | Green quality before an image is built, without duplicating the PostGIS service in the deploy job |
| D8 | Alarms and the dashboard are constructs in `lib/observability.ts`; WAF in `lib/waf.ts`; the OIDC role in `lib/github-oidc-stack.ts` | One file per concern, each testable |

## 3. Steps

### Step 1 — `probe: true` replaces `loadShedding: 'exempt'` (contract + api)
- [ ] `packages/api-contract/src/meta.ts`: `probe?: true` with the design's doc comment; schema `z.literal(true).optional()`; `loadShedding` removed
- [ ] `packages/api-contract/src/checks.ts`: the existing "exempt entries must be a GET with no input" check now keys on `probe`; message updated
- [ ] `packages/api-contract/src/platform.contract.ts`: `health` declares `probe: true`
- [ ] `packages/api-contract/test/contract.test.ts`: the rejection test uses `probe: true`
- [ ] `packages/api-contract/openapi.json` regenerated (`pnpm --filter @remonta/api-contract run openapi`); the drift test proves it
- [ ] `apps/api/src/platform/contract/binder.ts`: route config `probe?: boolean` from `entry.meta.probe`
- [ ] `apps/api/src/app.ts`: the `onRequest` hook skips load shedding **and** the HTTPS check when `probe` is set; HSTS still sent on every other route
- [ ] `apps/api/test`: a test that with `requireHttps: true` a plain-HTTP `GET /v1/health` is 200 and a plain-HTTP call to any other entry is 403 (proves the exemption is exactly one route)
- [ ] Verify: `@remonta/api-contract` and `@remonta/api` quality green

### Step 2 — `infra/` package (`@remonta/infra`)
- [ ] `pnpm-workspace.yaml`: add `infra`; `.dockerignore`: add `infra`
- [ ] `infra/package.json` (scripts: `lint`, `typecheck`, `test`, `synth`, `quality`, `cdk`), `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`, `cdk.json`, `README.md` (how to bootstrap, deploy, roll back; points at the design)
- [ ] `infra/bin/remonta-api.ts`: the app; region `ap-southeast-2`; account from `CDK_DEFAULT_ACCOUNT`; the three stacks; tags `Project=remonta`, `Service=api`, `Environment=prod`
- [ ] `infra/lib/github-oidc-stack.ts`: OIDC provider for `token.actions.githubusercontent.com`; role `remonta-api-prod-deploy` trusting only `repo:remontasupport/remontamarketplace:ref:refs/heads/main`; permissions: ECR push to `remonta-api`, assume the CDK bootstrap roles; output the role ARN
- [ ] `infra/lib/ecr-stack.ts`: repository `remonta-api`, immutable tags, scan on push, lifecycle keep last 20
- [ ] `infra/lib/api-stack.ts`: VPC 10.42.0.0/16 with two public subnets in `ap-southeast-2a/b`, no NAT; security groups (`alb`: 80/443 in; `api`: 4000 from `alb` only); ACM certificate (DNS validation) for `api.remontaservices.com.au`; ALB (443 TLS 1.2+ policy, 80→443 redirect, access logs to an S3 bucket with a 90-day lifecycle, idle 60 s, drop invalid headers); target group HTTP:4000, health `/v1/health` 15 s / 5 s / 2 / 3, deregistration 20 s; ECS cluster + Fargate service (2 tasks, 0.5 vCPU / 1 GB, public IP, rolling 100/200, circuit breaker with rollback, grace 60 s, stopTimeout 30 s, auto-scale 2→4 on CPU 60 %); task definition with the plain environment from the design §6 and the six secrets from `Secret.fromSecretNameV2`; execution role (ECR pull, logs, those secrets), empty task role; log group `/remonta/api/prod`, 90 days, removal policy retain; outputs: ALB DNS name, service name, log group
- [ ] `infra/lib/waf.ts`: web ACL with the four rules from the design §5 (`SizeRestrictions_BODY` overridden to count), logging to CloudWatch Logs `aws-waf-logs-remonta-api-prod` (30 days), association with the ALB
- [ ] `infra/lib/observability.ts`: SNS topic + email subscription `support@remontaservices.com.au`; metric filters `outboxDeadLetter`, `requestFailed`, `configRefused`; the seven alarms from the design §7; EventBridge rule for ECS deployment `FAILED` → the topic; dashboard `remonta-api-prod`
- [ ] `infra/test/*.test.ts` (CDK assertions): the `api` security group admits only the `alb` group on 4000 and nothing from `0.0.0.0/0`; the task definition references exactly the six secret names and no other; log retention is 90 days; ECR tags immutable and scan on push; the ALB listener 80 redirects to 443; the circuit breaker is on with rollback; every alarm has the SNS action; the WAF `SizeRestrictions_BODY` override is present; a synth with no `imageTag` context succeeds
- [ ] Verify: `pnpm --filter @remonta/infra run quality` (lint, tsc, tests, `cdk synth` of all three stacks) green with no AWS credentials

### Step 3 — `.github/workflows/ci-infra.yml`
- [ ] On `pull_request` and `push` to `main` with paths `infra/**`, `pnpm-lock.yaml`, the workflow file: pnpm + Node 20, `pnpm install --frozen-lockfile`, `pnpm --filter @remonta/infra run quality`; check name **Infra Quality**
- [ ] Verify: the workflow file passes `actionlint` if available, otherwise a YAML parse

### Step 4 — `.github/workflows/deploy-api.yml`
- [ ] On `push` to `main` with paths `apps/api/**`, `packages/**`, `infra/**`, `pnpm-lock.yaml`, the workflow file; plus `workflow_dispatch` with input `imageTag` (a previous SHA = rollback); concurrency group `deploy-api`, no cancel; `permissions: id-token: write, contents: read`
- [ ] Job `quality`: `pnpm --filter @remonta/api run quality` and `pnpm --filter @remonta/infra run quality`
- [ ] Job `build-push` (needs quality; skipped on `workflow_dispatch` with an `imageTag`): OIDC → `aws-actions/configure-aws-credentials` with `vars.AWS_DEPLOY_ROLE_ARN`; `aws-actions/amazon-ecr-login`; `docker buildx build -f apps/api/Dockerfile --platform linux/amd64 --sbom=true --provenance=true --push -t <ecr>/remonta-api:<sha> .`
- [ ] Job `deploy` (needs build-push, or runs directly on dispatch): OIDC; `pnpm --filter @remonta/infra exec cdk deploy RemontaApiProd --require-approval never -c imageTag=<sha or input>`; then `aws ecs wait services-stable`; then `curl` the health URL and fail the job on non-200 (a rolled-back deploy fails visibly)
- [ ] Verify: YAML parses; the job graph and the `if` conditions reviewed against the design §2

### Step 5 — Documentation
- [ ] `CLAUDE.md`: new section "apps/api on AWS" with the operations reference from `deployment-architecture.md` §6, the three-stack bootstrap order, and the rule "rollback = redeploy a previous SHA, never rebuild"
- [ ] `aidlc-docs/construction/S1-registration/code/infra-summary.md`: what was generated, how it was verified, what the first deploy still needs from the user (the runbook)
- [ ] `aidlc-docs/construction/S1-registration/S1-production-run.md`: one line linking the api deploy runbook and its order relative to the database run

### Step 6 — Verification and hand-off
- [ ] All gates: `app`, `web`, `schemas`, `api-contract`, `form-engine`, `api` (with `TEST_DATABASE_URL`), `infra`, `turbo run build`
- [ ] `docker build -f apps/api/Dockerfile .` still succeeds and the container test from 2026-09-28 still passes (the `probe` change removes the need for the health check header; the `HEALTHCHECK` keeps sending it, harmlessly)
- [ ] `git diff --ignore-all-space --numstat` shows no regenerated Prisma client; `git status` clean apart from the intended files
- [ ] Commits on `s1/worker-registration`, one per step; then the user opens the PR (the existing open PR may be merged first or this rides on it — the user's choice)

## 3a. Amendments of 2026-09-30 (preview-first; approved by the user: "go ahead with the infrastructure code")

The preview-first plan (`S1-preview-first-verification-plan.md`) requires that the api's first deployment target a
copy of production and be verified from a Vercel preview before anything reaches production. That changes this
unit as follows; everything else above stands.

| # | Decision | Why |
|---|---|---|
| D9 | **One `ApiStack` construct, parameterised by stage; two instances: `RemontaApiStaging` and `RemontaApiProd`.** Stage table in `infra/lib/stages.ts`: prod as designed (2 × 0.5 vCPU/1 GB, 2→4, 90-day logs, seven alarms); staging = 1 × 0.25 vCPU/0.5 GB, no auto-scaling, 30-day logs, two alarms (`healthy-hosts` < 1, `outbox-dead-letter`), WAF on with the same rules. Names carry the stage: `remonta-api-<stage>-…`, secrets `remonta/api/<stage>/*`, log group `/remonta/api/<stage>`, hostname `api.` (prod) / `api-staging.` (staging) `remontaservices.com.au`. | The staging api must exist before production does, and must be the same code path. A hostname and certificate are needed after all: a Vercel preview is `https`, so a plain `http://<alb dns>` call would be blocked as mixed content (corrects the preview-first plan's "the ALB DNS name is enough") |
| D10 | **Deploy flow: push to `main` → build image → deploy `RemontaApiStaging` automatically. `RemontaApiProd` deploys only by `workflow_dispatch` (`stage=prod`, `imageTag=<sha>`): a promotion of an image that already runs on staging.** The same dispatch with an older SHA is the rollback for either stage. | Q7.2's "deploy automatically on push to main" now means staging; production is a deliberate act after the preview checklist. Optional hardening the user can add in GitHub: an environment `production` with required reviewers on the prod job |
| D11 | **Staging admits Vercel previews:** `CORS_ORIGINS=https://*.vercel.app` and `RECAPTCHA_ALLOWED_HOSTNAMES=*.vercel.app`. The api gains a small, tested pattern matcher (one leading `*.` label; `https` only; never for localhost or in production's values) used by the CORS plugin and the reCAPTCHA verifier. Production keeps exact values. | Preview hostnames differ per deployment. A wildcard on staging is acceptable: a caller still needs a token from the staging reCAPTCHA site key, the rate limits apply, and the data is a copy |
| D12 | Staging `AUTH_DATABASE_URL` secret = the `rehearse-w1` Neon branch (pooled); `APP_BASE_URL` = `https://app.remontaservices.com.au` (the email links have no stable preview host; recorded); `N8N_REGISTRATION_WEBHOOK_URL` = a sink; `EMAIL_FROM` the same sender. | The branch already has the S1 tables, suburb list and backfills (rehearsed 2026-09-28; previews use it today) |
| D13 | The OIDC deploy role trusts `refs/heads/main` only; `workflow_dispatch` runs on `main`, so the same role serves promotions and rollbacks. One role, both stacks. | Nothing but `main` ever deploys |

Step changes: **Step 1** gains the pattern matcher (D11) with tests in `config.test.ts` and a unit test. **Step 2** gains
`stages.ts`, the second stack instance and per-stage tests (staging has 1 task and 30-day logs; prod has 2 and
90; both reference exactly their six `remonta/api/<stage>/*` names). **Step 4** implements D10. **Step 5**
documents staging in CLAUDE.md and the runbook (bootstrap → staging first → checklist → prod). The runbook's
step 5 ("verify with the switch off on production") becomes "verify on staging from a preview" and production
gets the same checks after its own deploy.

## 3b. Pivot to Google Cloud Run (2026-09-30, user: "AWS is very complicated for my requirements"; "go for Google Cloud Run")

The AWS design's complexity (VPC, load balancer, WAF, IAM/OIDC, CDK) came from one requirement: an always-on
process for the outbox dispatcher and the scheduler. Cloud Run meets that requirement with one setting
(instance-based billing, `run.googleapis.com/cpu-throttling: 'false'`, minimum one instance) and removes the
rest. The CDK package (steps 2–4 above, committed on `s1/infrastructure`) is **replaced**; step 1 (the `probe`,
the staging allow-lists) and the workflow shape (staging on push, prod by promotion) **stay**.

| # | Decision | Why |
|---|---|---|
| D14 | **Google Cloud Run, region `australia-southeast1`**, one GCP project, two services: `remonta-api-staging`, `remonta-api`. Instance-based billing, minimum 1 instance (staging max 1; prod max 4), 1 vCPU, 512 MiB (prod 1 GiB), concurrency 80, request timeout 60 s, execution environment gen2, startup CPU boost. Startup and liveness probes on `/v1/health`. | Always-on for the background work; Cloud Run is multi-zone within the region (NFR-RES-06 without two tasks); scaling is automatic |
| D15 | **Service definitions are rendered, not hand-written:** `infra/lib/stages.ts` stays the single source of truth; `infra/lib/render.ts` produces the Knative service YAML per stage into `infra/cloudrun/service.<stage>.yaml` (committed); a drift test proves the committed files equal the render. The deploy substitutes the image and the project id and runs `gcloud run services replace`. | The repository's "declare once" rule, and a reviewable diff of exactly what Cloud Run will run |
| D16 | **No custom domain for now.** Cloud Run's domain mapping is not offered in `australia-southeast1` (checked 2026-09-30); the alternatives (a global load balancer with a serverless NEG, or Firebase Hosting) reintroduce components. The api is called only by the app's JavaScript, so it uses the deterministic `https://remonta-api[-staging]-<project number>.australia-southeast1.run.app` URL (Google-managed TLS). `NEXT_PUBLIC_API_URL` points at it. CORS and reCAPTCHA concern the **app's** origin, not the api's, so nothing else changes. A branded hostname is a later, optional unit (the load balancer path, which also brings Cloud Armor). | Simplest thing that works; no DNS or certificate steps in the runbook |
| D17 | **Secrets in Secret Manager**, names `remonta-api-<stage>-<NAME>` (the six of §6), regional replication in Sydney, read by a per-stage runtime service account with `secretAccessor` on exactly those six. | Same six values as before; Secret Manager names cannot contain `/` |
| D18 | **CI → GCP trust by Workload Identity Federation** (no keys): pool `github`, provider for `token.actions.githubusercontent.com` with the condition `assertion.repository == 'remontasupport/remontamarketplace' && assertion.ref == 'refs/heads/main'`; a deploy service account with `run.admin`, `artifactregistry.writer` and `serviceAccountUser` on the two runtime accounts. GitHub repository variables `GCP_PROJECT_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_DEPLOY_SERVICE_ACCOUNT`. Images in **Artifact Registry** `australia-southeast1-docker.pkg.dev/<project>/remonta/api:<sha>`, tag = git SHA, cleanup policy keeps the newest 20 tagged. | The same trust model as D13, on GCP |
| D19 | **Bootstrap is one idempotent script**, `infra/cloudrun/bootstrap.sh` (gcloud): enable APIs, the registry, the service accounts and bindings, the pool/provider, the empty secrets, the log-based metrics, the notification channel and the alert policies (`infra/cloudrun/monitoring/*.json`), 90-day log retention. Run once by the user with Owner on a fresh project; prints the three GitHub variables. Secret **values** are entered by the user (console or `gcloud secrets versions add`). | Replaces `cdk bootstrap` + two stacks; no IaC tool to learn |
| D20 | **No WAF** (Cloud Armor needs the load balancer of D16). The api's own controls stand: per-route rate limits, reCAPTCHA, body limits, load shedding. Recorded as a deliberate deviation from Q3.4; revisited with the load balancer unit if ever. Alerts: Cloud Monitoring policies — staging: instance down (uptime check on `/v1/health`) and outbox dead letters; prod: those plus 5xx ratio, p95 latency, request-failed count, container start failures. Logs: Cloud Logging (pino JSON lands as `jsonPayload`), retention 90 days on prod's project bucket. | Alerting parity with the design at no code |
| D21 | **Cost, corrected:** an always-on 1 vCPU / 512 MiB instance in Sydney is roughly **A$80–100 a month** (instance-based rates × 730 h; the earlier "A$30–50" was request-based thinking). Two environments ≈ A$170–200. Lever: pause staging between test rounds (`gcloud run services update remonta-api-staging --min-instances=0 --cpu-throttling`), or delete and redeploy it. | Said plainly before the user commits |

Revised steps (replacing 2–5): **2'** `infra/`: remove the CDK (lib, bin, test, cdk.json); add `lib/stages.ts` (Cloud Run shape), `lib/render.ts`, `scripts/render.ts`, `cloudrun/service.{staging,prod}.yaml` (rendered), `cloudrun/bootstrap.sh`, `cloudrun/monitoring/*.json`, tests (drift + invariants), README; `package.json` drops `aws-cdk*`, adds `yaml`; quality = lint · tsc · tests · render-check. **3'** `ci-infra.yml` unchanged in shape. **4'** `deploy-api.yml`: `google-github-actions/auth` (WIF), build and push to Artifact Registry, `gcloud run services replace` for staging on push; promote by dispatch; `.github/scripts/api-health.sh` reads the service URL and status from `gcloud`. **5'** CLAUDE.md, the design documents and the runbook re-pointed at Cloud Run; `infra-summary.md` rewritten. **6'** the same gates minus synth; the container test stands.

Questions (defaults apply): **Q-CR1** a new GCP project (`remonta-api`) with billing attached by the user — default yes. **Q-CR2** the `run.app` URL rather than a branded hostname — default yes (D16). **Q-CR3** staging always on (≈A$80–100/month) or paused between test rounds — default always on until the first promotion, then paused.

## 4. Out of scope (recorded, not done here)

A branded api hostname (global load balancer + serverless NEG, brings Cloud Armor); Terraform or another IaC tool (the bootstrap script and the rendered service YAML are the infrastructure code); the AWS design (superseded 2026-09-30, kept in git history and `infrastructure-design/`); `cdk diff` in PRs (after bootstrap); S3 for photos (OI-07 → Onboarding); OpenTelemetry and an error tracker (observability unit); the CRM notification handler (step 5 of the path); Vercel variables and the switch flip (runbook steps 6–7, user actions); a GitHub `production` environment with required reviewers (user's choice, documented).
