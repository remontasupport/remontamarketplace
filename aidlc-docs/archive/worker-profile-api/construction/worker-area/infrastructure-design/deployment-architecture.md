# Deployment Architecture -- unit `worker-area` (U1)

## The picture

```
operator's machine (Australia)                      Google Cloud, australia-southeast1                 Neon, Sydney
┌────────────────────────────┐   load test / drills   ┌──────────────────────────────────┐   pooled, pgbouncer=true
│ scripts/load-worker.ts     │ ─────────────────────► │ remonta-api-staging (1 instance)  │ ──────► rehearse-w1 branch
│ scripts/backfill-…         │   backfill (staging)   │  MAX_IN_FLIGHT 64, pool 5         │          (copy of prod)
│ staging-admin-check.ts     │                        └──────────────────────────────────┘
│ gcloud (drill override)    │
│                            │   backfill (prod, flag) ┌──────────────────────────────────┐   pooled, pgbouncer=true
│                            │ ─────────────────────► │ remonta-api (1..10 instances)     │ ──────► production branch
└────────────────────────────┘                        │  MAX_IN_FLIGHT 64, pool 5 each    │          (50 connections max)
                                                      └──────────────────────────────────┘
GitHub main ──push──► deploy-api ──build──► Artifact Registry ──deploy──► staging
                      deploy-api (dispatch stage=prod, imageTag=<sha>) ──promote──► prod
Cloud Monitoring: the seven policies (unchanged) + a Billing budget (console) → support@
```

## PR 1's deployment sequence

| Step | Who | What | Evidence recorded |
|---|---|---|---|
| 0 | operator | Neon verification (infrastructure-design §2); budget created (§3) | README section; a line in the construction notes |
| 1 | CI | PR opened: App/Web/API Quality (PostGIS: the new unit and property tests, the failure injections of P13 a-f), Supply chain, Package boundaries, CodeQL, Semgrep (incl. the `Prisma.raw` rule test), both Vercel previews (no app change: the previews build unchanged) | green checks |
| 2 | operator | merge → `deploy-api` builds the image and deploys **staging** | the run's sha |
| 3 | operator | staging checklist (CLAUDE.md + US-WP-32): health 200; `GET /v1/worker/profile` 401 without a token, 403 with an admin token, 200 with a staging worker's token (body per E1), 304 on `If-None-Match`; a worker with no profile 404; the probe answers while a `DB_POOL_SIZE`-sized burst runs (P13 g) | the checklist runner's output |
| 4 | operator | backfill on staging: dry run, then `--apply` (§6) | the two reports |
| 5 | operator | the load test (§4) and the drills (§5), then the staging restore | the JSON reports, the summary table |
| 6 | operator | **promote**: `deploy-api` dispatch `stage=prod, imageTag=<sha>` | the dispatch run |
| 7 | operator | prod: health 200; `GET /v1/worker/profile` 401 without a token; the previous revision noted for rollback; backfill on prod (dry, then `--allow-production --apply`) | the reports; the revision name |
| 8 | session | CLAUDE.md rollback rows re-recorded if the app deployment changed (it did not: no app change in PR 1); the state file's U1 marked built | commit |

Rollback at any point after step 6: `deploy-api` dispatch with the previous sha (restores the previous YAML values
too). The backfill needs no rollback (nothing reads the flags yet; a re-run is idempotent).

## Environments and secrets

| | staging | prod |
|---|---|---|
| Service | `remonta-api-staging` | `remonta-api` |
| Database | `rehearse-w1` pooled | production pooled |
| Secrets touched by U1 | none (verification of `AUTH_DATABASE_URL`'s parameters only) | none |
| Env changed by U1 | none (`MAX_IN_FLIGHT` already 64) | `MAX_IN_FLIGHT` 64, `maxScale` 10 |
| Vercel | untouched | untouched |

## Shared infrastructure note

No `shared-infrastructure.md` is created: U1 adds no shared component. The pool arithmetic (api 50 + app pool) is
the one shared constraint and lives in `infra/README.md`'s new section.
