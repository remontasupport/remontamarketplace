# S1 — Preview-first verification of `apps/api`: Plan

**Unit:** S1-preview-first (a process-and-environment unit on the path to "apps/api deployed and in use")
**Requested:** 2026-09-30 — "while testing the new backend api, make sure it is being done to the Preview
before pushing to production, this will make sure that the production won't compromise".
**Amends:** `infrastructure-design.md` Q3.5 (staging api was deferred; it is now required first),
`S1-infrastructure-code-generation-plan.md` steps 2, 4 and 5 (a staging stack and a staging deploy trigger),
`aidlc-state.md` "The path to deployed and in use" (a preview stop before every production step).
**Status:** **PLANNING — awaiting the answers in §7.** Nothing in §5 runs before Q1 is answered.

---

## 1. What is true today (verified 2026-09-30)

- `main` deploys to production for both apps within ~2 minutes of a merge. Every merge is a production change.
- The worker sign-up switch: `legacy` is the **pre-S1 page itself** (PR #15). `api` needs `NEXT_PUBLIC_API_URL`
  and `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`; production has the Upstash key `switch:registration` = `legacy`.
- `apps/api` is deployed nowhere. Its infrastructure design (approved 2026-09-28) deliberately had **no staging
  environment** and planned the first verification "with the switch off, on production". This plan reverses that.
- Vercel builds a Preview for every branch. Environment variables have Production / Preview / Development scopes,
  and a Preview variable can be pinned to one branch. **What the Preview scope points at today is unknown from this
  machine** (Q1). If previews share production's database and Redis, every PR preview already runs against
  production data — that is the first thing to fix.
- Two production incidents this morning were found only because the live domain was checked, not a preview.

## 2. The rule

> **Nothing on the `apps/api` path serves a production user until the same commit has passed the checklist in §6
> on a Vercel Preview talking to a staging api and a non-production database.**
> A merge to `main` may add code, but must not change what a live path does. A live-path change sits behind a
> switch whose "off" is the exact old code, and the flip happens only after the checklist has passed.

## 3. Environments

| | Production | Staging (Vercel Preview of `staging`) | Local |
|---|---|---|---|
| App | `main` → `app.remontaservices.com.au` | `staging` → `remonta-app-git-staging-remontasupport.vercel.app` (stable branch URL) | `localhost:3000` |
| Api | `RemontaApiProd` → `api.remontaservices.com.au` (later) | `RemontaApiStaging` → `api-staging.remontaservices.com.au` | `localhost:4000` |
| Database | production Neon | Neon branch `staging` — a reset copy of production with the S1 migrations, suburb list and backfills applied (the `rehearse-w1` procedure) | Docker `remonta-s1-pg` |
| Redis | production Upstash | none (the app tolerates it) or a second Upstash database — never production's | none |
| Sign-up switch | Upstash key only (`legacy`) | env `REGISTRATION_BACKEND=api`, pinned to the `staging` branch | env |
| Suburb source | Google until cut-over (explicit, §5 S2) | the database | the database |
| CRM webhook | live n8n | a sink (Q5) | `http://127.0.0.1:9/` |
| Email | Resend, verified domain | Resend test sender (delivers to the account owner only) or the verified domain with `[staging]` in the subject | Resend test sender |
| reCAPTCHA | production key pair | a **second** key pair whose domain is the branch URL (Q4) | the test pair |
| Secrets | `/remonta/api/prod/*` | `/remonta/api/staging/*` | `apps/api/.env` |

Other previews (feature branches): the Preview scope's defaults point at the staging database, never production,
with `REGISTRATION_BACKEND` unset (legacy page). They are for the app's own changes; the api path is verified on
`staging` only, because CORS and reCAPTCHA allowlists need one stable origin.

## 4. Branch model

```
feature/fix branch ──PR──▶ staging ──PR──▶ main (= production)
                          (preview + staging api: the §6 checklist)
```

- Every unit lands in `staging` first through a PR (the usual checks + the `staging` preview).
- `staging` → `main` only when the whole slice is verified on the preview, as one "Merge pull request" (no squash).
- A production hotfix (as today's two were) branches from `main`, PRs to `main`, and `main` is merged back into
  `staging` straight after. Invariant: **`staging` always contains `main`.**
- `apps/api` deploys: push to `staging` → `RemontaApiStaging`; push to `main` → `RemontaApiProd`. Same image
  recipe, same workflow, different stack and secrets.

## 5. Steps

### S1 — Isolate previews from production (Vercel; the user, with the values I prepare)
- [ ] Answer Q1. If any Preview-scope variable points at production (database URLs, Upstash, Blob token, n8n
      webhook, Resend), replace it: database → the Neon `staging` branch (S4 creates it), Upstash → empty,
      n8n → the sink, Blob → a separate store or empty.
- [ ] Preview scope defaults: `REGISTRATION_BACKEND` absent; `NEXT_PUBLIC_APP_URL` absent (the code uses the
      preview's own host).
- [ ] Branch-pinned to `staging`: `REGISTRATION_BACKEND=api`, `NEXT_PUBLIC_API_URL=https://api-staging.remontaservices.com.au`,
      `NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<staging key>`, `NEXT_PUBLIC_APP_URL=https://remonta-app-git-staging-remontasupport.vercel.app`.
- [ ] Production scope: confirm `REGISTRATION_BACKEND`, `NEXT_PUBLIC_API_URL` are **absent**.
- [ ] Verify: a preview of any branch signs in against staging data (a user that exists only there), and the
      production domain is unchanged.

### S2 — Two code guards (`apps/app`, small PR)
- [ ] `lib/registration-switch.ts`: on a **production** deployment (`VERCEL_ENV === "production"`) the env var is
      ignored; only the Upstash key can select `api`. On previews and locally the env var works as now. Test: the
      production case with `REGISTRATION_BACKEND=api` and no key resolves to `legacy`.
- [ ] `lib/suburbs`: an explicit `SUBURBS_SOURCE` = `google` | `localities` | `auto` (default `auto`, today's
      behaviour). Production gets `SUBURBS_SOURCE=google` in Vercel until cut-over, so the production migration
      (S4) changes nothing users see. Test: `google` never queries `au_localities` even when it exists.
- [ ] Both are additive; the `legacy` page is untouched.

### S3 — Staging api (amends the infrastructure plan; done inside that unit)
- [ ] `infra/`: a `RemontaApiStaging` stack from the same construct as `RemontaApiProd`, parameterised by stage:
      1 task, 0.25 vCPU / 0.5 GB, no auto-scaling, WAF on (same rules), log group `/remonta/api/staging` 30 days,
      alarms only for task health and outbox dead letters, to the same topic with a `[staging]` prefix. Secrets
      `/remonta/api/staging/*`. Plain environment: `CORS_ORIGINS` and `RECAPTCHA_ALLOWED_HOSTNAMES` = the branch
      URL / host, `APP_BASE_URL` = the branch URL, `AUTH_DATABASE_URL` = the Neon `staging` branch (pooled),
      `N8N_REGISTRATION_WEBHOOK_URL` = the sink, `EMAIL_FROM` = the test sender.
- [ ] Certificate for `api-staging.remontaservices.com.au` (DNS on Vercel, like production's).
- [ ] `deploy-api.yml`: trigger on push to `staging` → deploy `RemontaApiStaging`; on push to `main` →
      `RemontaApiProd`. The OIDC role trusts `refs/heads/staging` and `refs/heads/main`.
- [ ] The infrastructure design's Q3.5 row and "Deferred" list updated; the code-generation plan's steps 2/4/5
      gain the staging items. Cost: roughly USD 35–45/month (one small task + one ALB).

### S4 — Database: staging first, production last
- [ ] Neon: create branch `staging` as a fresh reset copy of production (or rename `rehearse-w1`; Q2). Run the
      runbook on it: migrations → suburb list (`--expect=<hash>`) → backfill dry runs → apply → apply again (0).
- [ ] The **production** database run moves to S7. Until then production has no S1 tables and (with S2) Google
      suburb search.

### S5 — The CRM notification (already step 5 of the path; unchanged, but it is now verified on staging)
- [ ] The outbox handler that posts api-mode sign-ups to n8n; payload snapshot-tested against the legacy request.
- [ ] On staging it posts to the sink; the checklist reads the sink.

### S6 — Verify on the `staging` preview (the acceptance gate; recorded per run)
See §6. Results, with the app deployment id and the api image SHA, go in
`aidlc-docs/construction/S1-registration/preview-verification.md`. A failed item blocks S7.

### S7 — Promote
- [ ] PR `staging` → `main`; "Merge pull request"; production still serves the legacy page.
- [ ] Production checks (sign in, dashboard, sign-up page = legacy, reset email host).
- [ ] Production database run per the runbook (S1 tables appear; `SUBURBS_SOURCE=google` keeps search unchanged).
- [ ] `RemontaApiProd` deploys from `main`; health, suburb search, a photo upload against production — **switch off**.
- [ ] Production Vercel: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` (production key).
- [ ] Canary: Upstash `switch:registration` = `api`; one real sign-up with an internal email; the §6 list again on
      production. Rollback at any point: the key back to `legacy` (the old page returns on the next request).
- [ ] `SUBURBS_SOURCE=localities` in production after the canary holds.

### S8 — Documentation (this PR)
- [x] `CLAUDE.md`: "Preview before production" section; "no staging branch" replaced by the branch model.
- [ ] `aidlc-state.md`: the path re-ordered around S1–S7 (done with this plan's approval).

## 6. The checklist (on the `staging` preview, per commit that touches the api path)

1. Sign in with a staging-only user; open a dashboard (a real database query).
2. `GET /v1/health` on the staging api is 200 through the ALB; a plain-HTTP call to another route is 403.
3. Suburb search on the sign-up page returns rows **with ids** (the database, not Google).
4. Photo upload stages a file on the staging api and shows the preview.
5. A full sign-up with an internal test email: the email code arrives, the account is created, the
   `ACCOUNT_REGISTERED` audit row exists, the outbox event reaches `DONE`, the worker appears in the admin list,
   the CRM sink received a payload that matches the legacy snapshot.
6. Duplicate sign-up with the same email: the "existing account" notice arrives, no second account.
7. Rate limit: the 11th code request in an hour from one address is refused with `Retry-After`.
8. Rollback drill: set the branch's `REGISTRATION_BACKEND=legacy`, redeploy the preview, the old page renders;
   set it back.
9. `k6 run tests/load/smoke.test.js` against the preview: no errors.
10. The production domain, checked at the same time, is unchanged (legacy page; reset email on the production host).

## 7. Questions (answer inline; defaults apply if you say "defaults")

| # | Question | Default |
|---|---|---|
| Q1 | In Vercel (`remonta-app`), what do the **Preview**-scope variables point at today: the production database and Upstash, or something else? | Assume production until checked — S1 is then the first action |
| Q2 | Staging database: rename Neon branch `rehearse-w1` (a 2026-09-28 reset copy, migrations + backfills applied) to `staging`, or reset a fresh copy? It holds real worker data either way — acceptable for staging? | Fresh reset copy named `staging`; internal access only; reset again before the canary |
| Q3 | Staging api hostname `api-staging.remontaservices.com.au` (DNS on Vercel)? | Yes |
| Q4 | A second reCAPTCHA key pair for staging (domain = the branch URL), rather than adding `vercel.app` to the production key? | Second pair |
| Q5 | Where staging CRM notifications go: a sink I can read (a request-bin URL kept in the staging secrets), or a Zoho sandbox? | Sink |
| Q6 | The long-lived `staging` branch (§4) rather than per-feature previews only? | `staging` branch |
| Q7 | AWS account and region for both stacks: the one from the infrastructure plan (one account, `ap-southeast-2`)? | Yes |

## 8. Out of scope

- A staging environment for `apps/web` (marketing; no database).
- Production traffic mirroring or percentage canaries (the switch is all-or-nothing by design; the canary is a
  short window with a real sign-up).
- Moving other forms onto the engine (parked by the standing instruction).
