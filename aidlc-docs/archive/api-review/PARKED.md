# api-review: parked 2026-10-21

Parked by the user to start a new cycle (`onboarding-tour`, 2026-10-21: "I am going to start a new AI DLC as I am going
to create a new feature"). The review documents are in `inception/review/` here; the audit trail stays in
`aidlc-docs/audit.md`.

## Released from this cycle

- Every api change of the cycle (#61-#85) is on production: revision `remonta-api-00011-99p` = image
  `b8fe2eb8c64697e8eb295f93cb5d2c90814bc2ac`, promoted 2026-10-19 01:34Z (previous `remonta-api-00010-8vk` = `182f94f`).
- The admin dashboard's State filter: PR #85 (api) and PR #86 (the dropdown), `main` `e2d8555`; confirmed on
  production by the user (2026-10-21).

## Open when parked (carry forward)

- **`feat/account-app`** (`4d62630`, worktree `../remonta-pr57`): the whole worker dashboard on `apps/api` -- PR #57
  (`feat/edit-profile-app`) plus U5a-U5d and the 2026-10-16 fixes, including the new sidebar (`WORKER_MENU`).
  **Held; not released.** Its api side is already on production, so the release is: merge `main` (`e2d8555`) in, run
  the app and api gates there, push; the preview checklist (CLAUDE.md "Preview before production", plus a document
  upload: compliance and a service document); then one PR `feat/account-app` -> `main` (close #57 as superseded) or
  #57 then the stack -- the user chooses; "Merge pull request"; production checks. An api promotion is needed only if
  `main` gains api commits after `b8fe2eb`.
- **The new cycle builds on it**: the onboarding tour points at `WORKER_MENU`, so its code branches from
  `feat/account-app` and ships with or after it.
- CodeQL's HaveIBeenPwned SHA-1 alert (false positive; the user dismisses it); "Previous" on the first training does
  not go back to the last mandatory step (offered); the answers owed from 2026-10-14; the 2026-10-15 staging checks if
  still wanted.
- The Vercel rollback rows in CLAUDE.md still name the 2026-10-09 builds (the api row: branch
  `docs/rollback-rows-2026-10-21` `1418732`, PR not opened).

## State at parking (verbatim from aidlc-state.md)

- **Current Cycle**: api-review -- started 2026-10-14 (user: "reset the ai dlc now, I want to check all the APIs in
  order and the structure of the api on how I built it, but before that, I want the test on the development or local
  first"). Record branch `aidlc/api-review` (from `aidlc/worker-profile-api` `b217341`). The previous cycle,
  worker-profile-api, is **parked** with open work: `aidlc-docs/archive/worker-profile-api/PARKED.md` (PR #57 held,
  the prod promotion of `182f94f...`, the column tests).
- **Current Stage (saved 2026-10-16 end of day -- READ THIS FIRST).** The worker dashboard is on `apps/api` except
  the jobs (excluded by the user). Everything is built and pushed; **nothing of it is released**: the user will add one
  more feature first (user, 2026-10-16: "I still need have to add a feature before I release these new updates").

  **Where things are:**
  - `main` `4b41ba1` (#84). Every api change is merged (#72, #74, #76-#84); staging runs image
    `4b41ba18ced9375f2c303c7f00f5058f8fbe093b` (= `main`), healthy.
  - **Production api: `b8fe2eb`** (#85, promoted 2026-10-19 01:34Z, revision `remonta-api-00011-99p`; previous
    `remonta-api-00010-8vk` = `182f94f`). It carries every api change of this cycle (#61-#85).
  - **App: all of it on `feat/account-app` `1253532`** (worktree `../remonta-pr57`, where the local servers run).
    It contains PR #57 (`feat/edit-profile-app` `6b4a9bd`) and the whole stack: services-app (#68, #71, #73, #75) <-
    U5a `feat/retire-old-profile-pages` <- U5b `feat/compliance-frame` <- U5c `feat/dashboard-home` <- U5d + the
    2026-10-16 fixes (photo, street optional, Services menu and Account tab, shared query cache, flicker, navigation
    bar and fade, Complete -> Service Area -> dashboard, Compliance Next into the trainings, First Aid & CPR on one
    step). Checked: every branch's content is in `feat/account-app` (only merge commits differ).
  - **PR #57 alone is NOT the release**: 65 commits of `feat/account-app` are not in it (U5a-U5d and the fixes).
  - Preview (staging api): https://remonta-app-git-feat-account-app-remontas-projects.vercel.app
  - Still on the app's own server (by design): the jobs (My Jobs, `/api/worker/jobs/apply` apply/withdraw, the
    dashboard's job slider and its `/api/geocode`); sign-in/session (NextAuth) and the api-token route; the sign-up
    phone check `/api/sms/send-verification`; the coordinator, client and admin areas (except the admin lists).

- **Earlier (saved 2026-10-15 end of day; superseded by the block above).** The review covers three worker sections: **My
  Profile** (2026-10-14, `inception/review/my-profile-api-review.md`, F1-F11), **Services** (2026-10-15,
  `inception/review/services-inventory.md`, S1-S9, D1-D4) and **Compliance** (2026-10-15,
  `inception/review/compliance-inventory.md`, C1-C9, DC1-DC4), plus a **performance audit**
  (`inception/review/api-performance-audit.md`, P1-P10). Designs: `u3b-service-documents-design.md`,
  `u4a-compliance-documents-design.md`.

  **On `main` `813107d` (merged; the api on STAGING only, the app parts LIVE):**
  - #66 (merged 2026-10-15): U3a services api (`PUT /v1/worker/services`, `.../:categoryId/registration`; a removed
    service is deleted entirely, D2) + the performance fixes P1-P8 (`perf/api-round-trips`) + U3b service documents
    (ticket -> private bucket `documents/<profileId>/` -> confirm; links; admin link).
  - #67 S1: the per-worker requirement lists `private, no-store` (app, live).
  - #69 C1: the citizenship PATCH accepts the Right to Work answer only (app, live; no use of the hole on the copy).
  - #70 U4a compliance documents api (confirm/delete/citizenship/any-own-document link, `complianceDocuments` in the
    profile), with the null-category fix (`e1a1408`) and the flaky completion test made deterministic (`9ec8bc0`).
  - **Production api: still the old image** (not promoted today). Its rollback revision is `remonta-api-00009-gct`.

  **PR #57** (`feat/edit-profile-app` `6b4a9bd`): held until the api is promoted (the contract client refuses the old
  api's shapes). #68 (U3c, the Services pages) was merged INTO it at `f0ad86a`.

  **`feat/services-app` `e49438a`** (worktree `../remonta-pr57`, where the local servers run): PR #57 + U3c + the
  redirect fix + C1 + U4a + the test fix. Its commits after `f0ad86a` are not yet in PR #57 (they reach it through
  `main`, or a new PR from this branch into `feat/edit-profile-app`).

  **Still open, not merged:** the nine My Profile api branches of 2026-10-14 (none in main: `252f089`, `223736f`
  (#64 open), `405790f`, `bc83ebd`, `07c7740`, `4620077`, `cea8497`, `833f6fa`, `997168a`; all inside PR #57);
  `chore/staging-services-check` `8933b42` (the staging checklist script; PR optional).

  **Go-live order (unchanged):** the My Profile api changes onto main (one combined PR recommended) -> staging ->
  the preview checks -> Actions -> deploy-api -> stage `prod`, imageTag = the FULL 40-character sha -> production
  probes -> merge PR #57 (with U3c) -> production checks.

  **2026-10-16:** DC5 an expiry date already passed is refused (the api's message; nothing saved). The nine My Profile
  api branches stay separate (no combined PR; user). **U4b built**: `feat/compliance-app` `a26ff55` stacked on
  `feat/services-app` (design + Built: `inception/review/u4b-compliance-steps-design.md`); the trainings moved with
  the shared hooks.

  **Later 2026-10-16:** #71 (U4b) merged into `feat/services-app` (`60b6598`). The Services pages taken off the legacy
  routes (user: "change the 3 pages that uses the old api now and make sure they have securities"): api
  `feat/other-documents-api` `4617f34` (from main; Other Documents confirm target + `requirements.additional`) and app
  `feat/services-api-reads` `d77b29f` (stacked on `feat/services-app`, the api merged in). The service-document delete
  bug (always legacy since U3c) fixed there. Merge the api PR first (staging), then test the app PR's preview.

  **U5 (2026-10-16, jobs excluded):** U5a `feat/retire-old-profile-pages` (old account-setup/profile-building pages,
  -8.9k lines), U5b `feat/requirement-details-api` (api) + `feat/compliance-frame`, U5c `feat/dashboard-home`, U5d
  `feat/account-api` (api, migration) + `feat/account-app`. Security hotfix #76 (profile preview leaked bank details)
  merged and verified live in production. App PRs stack: services-app <- retire-old <- compliance-frame <-
  dashboard-home <- account-app. Left on old routes in the worker area: the jobs (excluded), `/api/geocode` (job search),
  the coordinator profile route (coordinator area).

  **2026-10-19 -- the feature: a State filter on the admin dashboard** (audit 2026-10-19, rule R3.12). Built: api
  `feat/admin-state-filter-api` `a9b2ec2` (from `main`, **PR not yet opened**); app `feat/admin-state-filter` `4d62630`,
  fast-forwarded into `feat/account-app` (now `4d62630`, which also carries `667dbe6`: the api on that line compiles
  again). Gates passed locally; the database tests run in CI only.

  **2026-10-19 later -- the user releases the State filter alone** (audit): api PR `feat/admin-state-filter-api` ->
  main; app PR `feat/admin-state-filter-ui` `6e6e316` -> main (only the dropdown); promote the api's merge sha (it
  carries #61-#84 too), then merge the UI PR. `feat/account-app` stays held; merge `main` into it afterwards (the
  cherry-picked commit merges cleanly) and run the api gate there.

  **Released 2026-10-19 (recorded 2026-10-21, audit):** PR #85 (api) and PR #86 (the dropdown) merged; `main`
  `e2d8555`; production api promoted to `b8fe2eb` between them. The user confirms the State filter on production.

  **Resume here (2026-10-21, in this order):**
  1. `git ls-remote origin main feat/account-app`; ask what was merged since.
  2. **Bring `feat/account-app` up to `main`** (`e2d8555`: #85, #86): merge `main` in (the cherry-picked dropdown
     commit should merge cleanly), run the app gate AND the api gate there (the 2026-10-19 break came from a merge),
     push.
  3. **Release, in this order, only when the user says** (CLAUDE.md "Preview before production"). The api step is
     smaller now: production already runs every api change of the cycle, so (b) is needed only if `main` gains api
     commits after `b8fe2eb`:
     a. Preview checklist against staging on the `feat/account-app` preview: sign in (staging-only worker) and open the
        dashboard · api health 200 · suburb search · a photo upload · a document upload (compliance + a service
        document) · a full sign-up with an internal email · duplicate-email notice · production domain unchanged.
        Record it in the construction notes.
     b. **Promote the api first**: Actions -> deploy-api -> Run workflow -> `stage=prod`, `imageTag=` the FULL
        40-character sha that passed (a): the `main` merge commit of the State filter's api PR (it changes the
        api, so `4b41ba18ced9375f2c303c7f00f5058f8fbe093b` is no longer the one to promote). The workflow applies the pending migrations to production first
        (`users.passwordChangedAt`, #78). Re-record the rollback rows (CLAUDE.md) before it.
     c. Production api checks: `/v1/health` 200, the logs clean.
     d. **Then the app**: one PR `feat/account-app` -> `main` (contains PR #57; close #57 as superseded), or PR #57
        then the stack in order -- the user chooses. "Merge pull request", never squash. The app before the api
        shows "temporarily unavailable" (the contract client refuses the old api's shapes).
     e. Production checks on `app.remontaservices.com.au`: the same as (a).
  4. Open items: CodeQL's HaveIBeenPwned SHA-1 alert (false positive; the user dismisses it); "Previous" on the first
     training does not go back to the last mandatory step (offered, not asked); the answers owed from 2026-10-14; the
     2026-10-15 staging checks if still wanted.
  5. Local: `bash scripts/local/run-api.sh` and `run-app.sh` from `../remonta-pr57` (stop the api before a gate:
     EPERM; rebuild after an api change; uploads fail locally). Browser smoke: a local NextAuth session for a dev-copy
     worker; playwright-core in `2bee6707-.../scratchpad/pw`. Run the app gate and **check its exit before pushing**.
