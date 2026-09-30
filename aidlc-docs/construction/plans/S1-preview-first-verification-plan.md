# S1 — The new api never reaches production untested: Plan

**Unit:** S1-preview-first (process, on the path to "apps/api deployed and in use")
**Goal (user, 2026-09-30):** "we don't ship the new api to the production first without securing and testing".
**Amends:** `infrastructure-design.md` Q3.5 (the first api deploy targets a copy of production, not production),
`aidlc-state.md` "The path to deployed and in use".
**Status:** **Guard shipped; one question open (Q1).** Everything else uses the defaults below unless you say otherwise.

---

## 1. Why production is safe today, and what holds it there

Production can only use `apps/api` if **all three** are true: the api is deployed and reachable; production's
Vercel scope has `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`; the switch resolves to `api`.
As of 2026-09-30:

| Lock | State | Who can change it |
|---|---|---|
| The api is deployed nowhere | holds | the infrastructure unit, deliberately |
| Production Vercel has no `NEXT_PUBLIC_API_URL` or `REGISTRATION_BACKEND` | **confirmed by the user 2026-09-30** | the user, in the dashboard |
| Upstash `switch:registration` = `legacy` | holds (set and read back) | one REST call, deliberately |
| **Guard (this unit):** on a production deployment the env var `REGISTRATION_BACKEND` is ignored; only the Redis key can select `api` | in code, tested | a code change through a PR |
| `legacy` = the pre-S1 page, byte for byte | holds (PR #15) | a code change through a PR |

With the guard, an accidental variable in Vercel cannot flip production. The only way real users meet the new
api is a deliberate `switch:registration = api`, which this plan allows only after §3.

## 2. What "tested before production" means here (minimal)

The api is already tested locally and in CI against a PostGIS database, and its database side was rehearsed on a
Neon copy of production. What is missing is a test **of the deployed api, from the deployed app, on non-production
data**. The smallest arrangement that gives that:

1. **The first AWS deploy of the api targets a copy of production** — a Neon branch, not the production database.
   Same stack as the production one, parameterised by stage (`staging`, then `prod`); secrets under
   `/remonta/api/staging/*`; `CORS_ORIGINS` and `RECAPTCHA_ALLOWED_HOSTNAMES` admit the app's Vercel preview
   hosts (`*.vercel.app` for CORS on staging only; reCAPTCHA gets a second key pair whose domain is `vercel.app`).
   This is the infrastructure unit with one extra stack, not a new unit.
2. **Vercel's Preview scope** (every branch preview, no dedicated branch): `REGISTRATION_BACKEND=api`,
   `NEXT_PUBLIC_API_URL` = the staging api, the staging reCAPTCHA key, and database/Redis/webhook variables that
   point at staging resources or are empty — **never production's**. Production scope: unchanged.
3. **The checklist (§3) runs on a PR preview** with the commit that will be merged. It passing is the condition for:
   merging to `main` → the production database run → the `prod` stack → and only then the key flip, as a short
   canary with an internal sign-up. The key back to `legacy` is the rollback at every point.

Not needed for the goal, so dropped: a long-lived `staging` branch, a staging hostname of its own (the ALB DNS name
is enough), a CRM sandbox (a request sink suffices), a suburb-source switch (the migration's effect on suburb search
was rehearsed and is an improvement; it is recorded, not gated).

## 3. The checklist (on a PR preview against the staging api; recorded in `S1-registration/preview-verification.md`)

1. Sign in with a staging-only user; open a dashboard.
2. `GET /v1/health` on the staging api is 200 through the ALB.
3. Suburb search on the sign-up page returns rows with ids.
4. Photo upload stages a file on the api.
5. Full sign-up with an internal email: code arrives, account created, `ACCOUNT_REGISTERED` audit row, outbox
   `DONE`, worker in the admin list, CRM sink received the legacy-shaped payload.
6. Duplicate sign-up: the existing-account notice, no second account.
7. Rollback drill: `REGISTRATION_BACKEND=legacy` on the preview → the old page.
8. The production domain, checked at the same time: legacy page, reset email on the production host.

## 4. Steps

- [x] **Guard**: `lib/registration-switch.ts` ignores `REGISTRATION_BACKEND` when `VERCEL_ENV === "production"`; test added. (this PR)
- [x] **Q1 answered (2026-09-30)** by a preview-only diagnostic route on a throwaway branch (deleted after reading):
      - Database: previews use Neon endpoint `ep-wandering-shadow-a7pxwb8o` = the **`rehearse-w1` branch**, a
        reset copy of production with the S1 migrations, suburb list and backfills already applied. Production is
        `ep-delicate-recipe-a7mbt4ef`. **Previews do not touch the production database.** That branch is the
        staging database; no new Neon branch is needed.
      - Shared with production (all targets ticked): `UPSTASH_REDIS_REST_URL/TOKEN` (same cache keys and the same
        `switch:registration`, so a preview cannot be flipped to `api` while it reads production's key),
        `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, both reCAPTCHA keys, the Zoho credentials, and the n8n webhooks
        `N8N_WEBHOOK_URL`, `APPLY_WEBHOOK_URL`, `AI_SEARCH_WEBHOOK`, `Client_Registration_Webhook`,
        `Request_Service_Webhook`, `Cancel_Archive_Webhook`, `Select_Cancelling_Request_Webhook` — a preview
        sign-up posts to the **live CRM**.
      - Production scope: no `NEXT_PUBLIC_API_URL` / `REGISTRATION_BACKEND` (user). `NEXT_PUBLIC_APP_URL` was
        missing and was added to Production on 2026-09-30 (takes effect on the next deploy).
- [x] **Preview scope detached (the user, 2026-09-30, one command per variable; listing verified after):** the nine
      names below now carry `Development, Production` (or `Production`) only. Every webhook is skipped by the code
      when unset and the rate limiter and the cache run without Redis, so no replacement values were needed.
      Still shared, by decision: `BLOB_READ_WRITE_TOKEN`, `RESEND_API_KEY`, both reCAPTCHA keys, the Zoho
      credentials, and `ACCELERATE_DATABASE_URL` (a Prisma Accelerate URL read only by `lib/prisma.ts`, the
      legacy marketing-schema client, used by the two read-only `/api/contractors` GET routes; it fronts whatever
      database was configured in the Prisma console 7 months ago — not the sign-up path). The commands, for the record:
      ```
      ! npx vercel env rm UPSTASH_REDIS_REST_URL preview --cwd apps/app --yes
      ! npx vercel env rm UPSTASH_REDIS_REST_TOKEN preview --cwd apps/app --yes
      ! npx vercel env rm N8N_WEBHOOK_URL preview --cwd apps/app --yes
      ! npx vercel env rm APPLY_WEBHOOK_URL preview --cwd apps/app --yes
      ! npx vercel env rm AI_SEARCH_WEBHOOK preview --cwd apps/app --yes
      ! npx vercel env rm Client_Registration_Webhook preview --cwd apps/app --yes
      ! npx vercel env rm Request_Service_Webhook preview --cwd apps/app --yes
      ! npx vercel env rm Cancel_Archive_Webhook preview --cwd apps/app --yes
      ! npx vercel env rm Select_Cancelling_Request_Webhook preview --cwd apps/app --yes
      ! npx vercel env ls --cwd apps/app
      ```
      Left shared for now, recorded: Blob (preview photos land in the production store: clutter, not data),
      Resend (preview emails are real emails: use internal addresses), the Zoho credentials (an admin sync run
      on a preview would write to the live CRM: do not run it there), and a hard-coded n8n URL in
      `components/dashboard/ApplyModal.tsx` (client side; a preview "apply" reaches live n8n).
- [ ] **Infrastructure unit**: stage parameter; `RemontaApiStaging` (1 task, 0.25 vCPU) deployed first, against
      the Neon branch; `RemontaApiProd` after §3 passes. (folded into `S1-infrastructure-code-generation-plan.md`)
- [ ] **Database**: the runbook on the Neon branch (already rehearsed); production **after** §3.
- [ ] **CRM notification** (path step 5), verified on the preview against the sink.
- [ ] **Verify** (§3) → **promote**: merge → production database run → prod stack, switch off → production
      Vercel gets the two public variables → canary flip → hold or roll back.

## 5. Question

| # | Question | Default |
|---|---|---|
| Q1 | ~~(a) What do Vercel **Preview**-scope variables point at today? (b) Production scope~~ **Both answered 2026-09-30** — see §4: previews run on the `rehearse-w1` Neon branch; Upstash and the n8n webhooks are shared and must be detached from Preview; production has no api variables. | — |

No open questions. The infrastructure unit can proceed; the "Detach the Preview scope" step is the user's, and it
gates only the first preview verification, not the infrastructure work.
