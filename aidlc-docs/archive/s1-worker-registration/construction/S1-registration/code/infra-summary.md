# S1 — Infrastructure unit: what was generated and how it was verified

**Date:** 2026-09-30. **Branch:** `s1/infrastructure` (from `main` at 926f06b). **Plan:**
`plans/S1-infrastructure-code-generation-plan.md` — approved with the §3a amendments (staging first, prod by
promotion), then **pivoted to Google Cloud Run** the same day (§3b, D14–D21) when the user judged AWS too
complicated for the requirements. The AWS/CDK version exists in the branch's history (commits 6af2c7b…7746df4)
and its design documents stay as the reasoning record; the components map to Cloud Run one for one.
**Result:** code and configuration only. Nothing is deployed; production is unchanged.

## Generated

| Step | Files | What |
|---|---|---|
| 1 | `packages/api-contract/src/{meta,checks,platform.contract}.ts`, `openapi.json`; `apps/api/src/{app.ts, platform/contract/binder.ts, platform/captcha/captcha.ts, config/config.ts, config/hosts.ts}` | `probe: true` replaces `loadShedding: 'exempt'`: the health entry is never shed and is served over plain HTTP (Cloud Run's probes and any load balancer's checker carry no `X-Forwarded-Proto`). One-wildcard-label allow-lists for staging (`https://*.vercel.app`, `*.vercel.app`) in the CORS plugin and the reCAPTCHA verifier. Also fixed: `initialMarker` declares `stageEnteredAt` as an estimate when the stage's date is one (the property test that failed at random). |
| 2' | `infra/lib/stages.ts`, `infra/lib/render.ts`, `infra/scripts/render.ts`, `infra/cloudrun/service.{staging,prod}.yaml`, `infra/cloudrun/bootstrap.sh`, `infra/cloudrun/registry-cleanup.json`, `infra/cloudrun/monitoring/*.json` (6 alert policies), `infra/test/cloudrun.test.ts`, `infra/README.md`; `pnpm-workspace.yaml`, `.dockerignore`; `apps/api/Dockerfile` (verified 2026-09-28, now committed) | The stage table is the single source of truth; the Knative service definitions are rendered from it and drift-checked; one idempotent `gcloud` script prepares a project (APIs, registry, service accounts, empty secrets, Workload Identity Federation, log metrics, retention, alerts). |
| 3' | `.github/workflows/ci-infra.yml` | Infra Quality on PRs and pushes touching `infra/`. |
| 4' | `.github/workflows/deploy-api.yml`, `.github/scripts/api-health.sh` | Push to `main` → quality → image `api:<sha>` → **staging** (`gcloud run services replace` of the rendered YAML); `workflow_dispatch` promotes an existing image to staging or prod (also the rollback). Readiness and health read from `gcloud`. |
| 5' | `CLAUDE.md` ("apps/api on Google Cloud Run"), `infrastructure-design.md` and `deployment-architecture.md` (superseded-by notes, runbook re-pointed), `S1-production-run.md` (order relative to the api), this file | |

## Verified (2026-09-30, this machine)

| Gate | Result |
|---|---|
| `@remonta/api-contract` quality | 33 tests; the OpenAPI drift test passes with the regenerated file |
| `@remonta/api` quality with `TEST_DATABASE_URL` (local PostGIS) | 354 tests, 22 files; exactly `platform.health` is a probe, 200 over plain HTTP, every other entry 403 without `X-Forwarded-Proto: https` |
| `@remonta/infra` quality | eslint, strict tsc, 15 tests over the rendered definitions, `render:check` (committed YAML == the table), **no cloud credentials** |
| `@remonta/app`, `@remonta/web`, `@remonta/schemas`, `@remonta/form-engine` quality | green (144 ts / 508 eslint known / 79 tests; 76 eslint known; 46; 49) |
| Workflows | both parse as YAML; job graph: quality → build-push → deploy-staging on push; promote on dispatch |
| `npx turbo run build` | 3 of 3 (apps/app, apps/web, apps/api) |
| `docker build -f apps/api/Dockerfile .` | 623 MB image |
| Container in production mode against the local database | `GET /v1/health` over plain HTTP with **no** header → 200 (Cloud Run's probes will pass); `GET /v1/localities` plain → 403, with `X-Forwarded-Proto: https` → 200; CORS preflight from `https://remonta-app-abc-remontas-projects.vercel.app` → allowed, from `https://evil.example` → no header; Docker `healthy`; SIGTERM → "shutting down", exit 0 |
| Regenerated Prisma clients | none committed (`git show --stat` per commit checked) |

Not verifiable here: the `gcloud` commands in `bootstrap.sh` and the workflow, the alert policy documents and
the service definition against a real project. They run for the first time on the user's project (below);
`gcloud run services replace` validates the YAML before creating a revision, and a refused definition fails
the job without touching the running revision.

## What the first deploy needs from the user (also in `infra/README.md`)

1. A Google Cloud project with billing attached (default: a new one named `remonta-api`), `gcloud` installed
   and signed in as its Owner.
2. `./infra/cloudrun/bootstrap.sh <project-id>` — once. It prints three values: set them as GitHub repository
   **variables** `GCP_PROJECT_ID`, `GCP_WORKLOAD_IDENTITY_PROVIDER`, `GCP_DEPLOY_SERVICE_ACCOUNT`.
3. The six **staging** secret values (`gcloud secrets versions add remonta-api-staging-<NAME> --data-file=-`):
   `AUTH_DATABASE_URL` = the `rehearse-w1` pooled string; a fresh `IP_HASH_SECRET` (`openssl rand -hex 32`);
   a sink URL for `N8N_REGISTRATION_WEBHOOK_URL`; the shared Resend key and Blob token; and the staging
   reCAPTCHA secret — a second v3 key pair with domain `vercel.app` (its site key goes to Vercel's Preview scope).
4. Merge the PR. `deploy-api` deploys staging and prints the service URL. Confirm the alert email subscription
   if Cloud Monitoring asks.
5. Vercel Preview scope: `REGISTRATION_BACKEND=api`, `NEXT_PUBLIC_API_URL=<the staging URL>`,
   `NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<staging site key>`.
6. Run the preview checklist from a PR preview; record it in `preview-verification.md`.
7. Only then: the production database run, the `remonta-api-<NAME>` prod secrets, the promotion to prod, the
   production checks with the switch off, and the canary flip.

Optional hardening in GitHub: an environment `production` with required reviewers; the promote job already
declares it for `stage=prod`. Cost lever: pause staging between test rounds (README).
