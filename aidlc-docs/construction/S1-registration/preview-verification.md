# S1 — Preview verification record

The checklist from `construction/plans/S1-preview-first-verification-plan.md` §3, run on a Vercel **Preview**
against the **staging** api. Production is not touched by any step here. One section per run.

## Environment

| What | Value |
|---|---|
| Staging api | `https://remonta-api-staging-154148201608.australia-southeast1.run.app` (Cloud Run, `australia-southeast1`, project `remonta-api-510206`) |
| Staging database | Neon branch `rehearse-w1` (a reset copy of production, 2026-09-28) |
| Vercel Preview scope | `REGISTRATION_BACKEND=api`, `NEXT_PUBLIC_API_URL=<staging api>`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<staging v3 site key>` (Preview only; set 2026-10-01) |
| Not on previews | production database, production Upstash, the live n8n webhooks (detached 2026-09-30) |
| Shared by decision | Blob store and Resend (use internal addresses only) |

## Run 1 — 2026-10-01

Preview: _(URL of this branch's Vercel preview)_ · commit: _(sha)_

| # | Check | Result | Notes |
|---|---|---|---|
| 1 | Sign in with a staging-only user; open a dashboard | | |
| 2 | `GET /v1/health` on the staging api is 200 | ✅ | 200 `{"status":"ok"}` without a Google identity; includes `SELECT 1` on `rehearse-w1` (2026-10-01) |
| 3 | Suburb search on the sign-up page returns rows with ids | | api alone: `/v1/localities?q=parram` returns rows with ids (2026-10-01) |
| 4 | Photo upload stages a file on the api | | |
| 5 | Full sign-up with an internal email: code arrives, account created, `ACCOUNT_REGISTERED` audit row, outbox `DONE`, worker in the admin list | | CRM sink part waits for the CRM notification (not built; staging webhook unset) |
| 6 | Duplicate sign-up: existing-account notice, no second account | | |
| 7 | Rollback drill: `REGISTRATION_BACKEND=legacy` on the preview renders the old page | | |
| 8 | Production domain at the same time: legacy page, reset email on the production host | | |

Also checked on the api (2026-10-01): CORS preflight from a `*.vercel.app` origin is allowed; from another origin it
is refused.
