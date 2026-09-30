# S1 — Infrastructure: Code Generation Plan

**Unit:** S1-infrastructure (step 3 of the path to "apps/api deployed and in use")
**Branch:** `s1/worker-registration` (continues; the PR for its earlier commits is open)
**Designs:** `construction/S1-registration/infrastructure-design/infrastructure-design.md` and
`deployment-architecture.md` (both approved 2026-09-28)
**Stories / requirements:** enablers US-MIG-01 (the switch is the canary), NFR-RES-02/-04/-06,
NFR-SEC-01/-02/-05/-07/-09/-10, NFR-OBS-01, NFR-CMP-03
**Status:** **PART 1 — PLANNING**, awaiting approval. This plan is the single source of truth for
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

## 4. Out of scope (recorded, not done here)

Staging environment; private subnets / NAT; `cdk diff` in PRs (after bootstrap); S3 for photos (OI-07 → Onboarding); OpenTelemetry and an error tracker (observability unit); the CRM notification handler (step 5 of the path); Vercel variables and the switch flip (runbook steps 6–7, user actions).
