# S1 — Infrastructure unit: what was generated and how it was verified

**Date:** 2026-09-30. **Branch:** `s1/infrastructure` (from `main` at 926f06b). **Plan:**
`plans/S1-infrastructure-code-generation-plan.md` (approved 2026-09-30 with the §3a amendments).
**Result:** code and configuration only. Nothing is deployed; production is unchanged.

## Generated

| Step | Files | What |
|---|---|---|
| 1 | `packages/api-contract/src/{meta,checks,platform.contract}.ts`, `openapi.json`; `apps/api/src/{app.ts, platform/contract/binder.ts, platform/captcha/captcha.ts, config/config.ts, config/hosts.ts}` | `probe: true` replaces `loadShedding: 'exempt'`: the health entry is never shed and is served over plain HTTP (the ALB's health checker carries no `X-Forwarded-Proto`). One-wildcard-label allow-lists for staging (`https://*.vercel.app`, `*.vercel.app`) in the CORS plugin and the reCAPTCHA verifier. Also fixed on the way: `initialMarker` declares `stageEnteredAt` as an estimate when the stage's date is one (the property test that failed at random). |
| 2 | `infra/` (`@remonta/infra`): `lib/{stages,app,api-stack,ecr-stack,github-oidc-stack,waf,observability}.ts`, `bin/remonta-api.ts`, `test/stacks.test.ts`, `cdk.json`, `README.md`; `pnpm-workspace.yaml`, `.dockerignore`, `.gitignore`; `apps/api/Dockerfile` (verified 2026-09-28, now committed) | Four stacks: `RemontaApiEcr`, `RemontaGithubOidc`, `RemontaApiStaging`, `RemontaApiProd`. One `ApiStack` construct, a stage table. |
| 3 | `.github/workflows/ci-infra.yml` | Infra Quality on PRs and pushes touching `infra/`. |
| 4 | `.github/workflows/deploy-api.yml`, `.github/scripts/api-health.sh` | Push to `main` → quality → image `:<sha>` → **staging**; `workflow_dispatch` promotes an existing image to staging or prod (also the rollback). |
| 5 | `CLAUDE.md` ("apps/api on AWS"), `infrastructure-design.md` (Q3.5, NFR-RES-03, §11), `deployment-architecture.md` (§1 runbook steps, §6 reference), `S1-production-run.md` (order relative to the api), this file | |

## Verified (all on 2026-09-30, this machine)

| Gate | Result |
|---|---|
| `@remonta/api-contract` quality | 33 tests; OpenAPI drift test passes with the regenerated file |
| `@remonta/api` quality with `TEST_DATABASE_URL` (local PostGIS) | 354 tests, 22 files; the route-security proof: exactly `platform.health` is a probe, 200 over plain HTTP, every other entry 403 without `X-Forwarded-Proto: https` |
| `@remonta/infra` quality | eslint, strict tsc, 24 CDK assertions, `cdk synth` of all four stacks **with no AWS credentials** (the VPC's zones are seeded in `cdk.json`) |
| `@remonta/app`, `@remonta/web`, `@remonta/schemas`, `@remonta/form-engine` quality | green (144 ts / 508 eslint known / 79 tests; 76 eslint known; 46; 49) |
| Workflows | both parse as YAML; job graph reviewed against deployment-architecture §2 and D10 |
| `docker build -f apps/api/Dockerfile .` | 623 MB image |
| Container in production mode against the local database | `GET /v1/health` over plain HTTP with **no** header → 200 (the probe; the ALB will pass); `GET /v1/localities` plain HTTP → 403, with `X-Forwarded-Proto: https` → 200; CORS preflight from `https://remonta-app-abc-remontas-projects.vercel.app` → allowed, from `https://evil.example` → no header; Docker `healthy`; SIGTERM → "shutting down", exit 0 |
| `npx turbo run build` | 3 tasks successful (apps/app, apps/web, apps/api), 2m30s |
| Regenerated Prisma clients | none committed (`git show --stat` per commit checked) |

## What the first deploy still needs from the user (runbook: `infrastructure-design/deployment-architecture.md` §5)

1. An AWS account (or the one chosen), an admin identity for the bootstrap, `cdk bootstrap`, then
   `cdk deploy RemontaApiEcr RemontaGithubOidc`; the role ARN → GitHub variable `AWS_DEPLOY_ROLE_ARN`.
2. The six **staging** secrets `remonta/api/staging/*` (`AUTH_DATABASE_URL` = the `rehearse-w1` pooled
   string; a fresh `IP_HASH_SECRET`; a sink URL for the CRM webhook; the shared reCAPTCHA secret, Resend key
   and Blob token).
3. A second reCAPTCHA v3 key pair for staging with domain `vercel.app` (the site key goes to Vercel's Preview
   scope, the secret to `remonta/api/staging/RECAPTCHA_SECRET_KEY`).
4. Merge the PR. The first `deploy-api` run pauses on the certificate: add the validation CNAME in Vercel DNS,
   then `api-staging` CNAME → the `ApiLoadBalancerDns` output. Confirm the SNS email.
5. Vercel Preview scope: `REGISTRATION_BACKEND=api`, `NEXT_PUBLIC_API_URL=https://api-staging.remontaservices.com.au`,
   `NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<staging site key>`.
6. Run the preview checklist from a PR preview; record it in `preview-verification.md`.
7. Only then: the production database run, the `remonta/api/prod/*` secrets, the promotion to prod, the
   production checks with the switch off, and the canary flip.

Optional hardening in GitHub: an environment `production` with required reviewers; the promote job already
declares it for `stage=prod`.
