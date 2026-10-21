# worker-profile-api: parked 2026-10-14

Parked by the user ("reset the ai dlc", 2026-10-14) with work still open; the new cycle `api-review` starts from here.
Inception and construction documents are in this folder; the audit trail stays in `aidlc-docs/audit.md`.

## Open when parked (carry forward)

- **PR #57** `feat/edit-profile-app` (head `652c414`): the new worker sidebar and My Profile pages. Held open by the
  user; merging it releases them to production. Needs a go-live decision.
- **Production api promotion**: deploy-api, stage `prod`, imageTag `182f94f757551997d5c75843e01524b221db5281`
  (PRs #58, #59, #60: about-me split, any number of experience areas, the personal-info split). On staging, verified
  by probes 2026-10-14; the preview checks of PR #57's pages not yet done. Must run before PR #57 merges. Production
  today: revision `remonta-api-00009-gct` (image `67fef1d...`), which is also the rollback.
- **Column tests** `test/my-profile-columns` (`e23df59`, 24 database cases of the My Profile writes): PR to open/merge;
  CI's API Quality runs them.
- **Services, Compliance, Account testing** (follow-ups 21-26 below): deferred by the user ("we can do this on the
  later part").
- U2 PR 4 (clean-up) and U3 (the remaining legacy writes) not started.

## State at parking (verbatim from aidlc-state.md)

- **Current Cycle**: worker-profile-api -- started 2026-10-09. Goal (user, verbatim in `audit.md`): migrate every legacy
  api of the worker profile to `apps/api`, starting with Edit Profile; reorder the sidebar navigation; the api to serve
  many requests at once ("10,000+ users at the same time", "worker servers"); easy to maintain; review the current api
  structure first. Record branch `aidlc/worker-profile-api` (from `main` `c51d430`).
- **Current Stage**: CONSTRUCTION, U2 `edit-profile` PR 3 **on hold by the user** (since 2026-10-12; still on hold
  2026-10-13). End of 2026-10-13:
  - **PR #57** `feat/edit-profile-app`, head `503932d`, open, **not to merge until the user sets a go-live**; all 13
    checks green, preview https://remonta-24a2umxum-remontas-projects.vercel.app (staging api + data). Today's 19
    commits (the menu and page changes the user asked for): `construction/edit-profile/code/PR3-summary.md`
    "Changes after review, 2026-10-13", with the final sidebar.
  - **2026-10-14: the personal-info write split** (user request): branch `feat/personal-info-split-api` (`bdff4d5`, from
    `main`) replaces `putPersonalInfo` with `putDateOfBirth` / `putGender` / `putVehicle`; merged into PR #57 (`652c414`:
    one field per page, the `carried` mechanism removed) and into `test/my-profile-columns` (`e23df59`). **PR #57's
    Date of Birth, Gender and Vehicle Access pages 404 on the preview until this api branch is merged and on staging.**
    The production promotion therefore becomes the merge commit of this api PR (it contains `be8c66a`), not `be8c66a`.
    Order: api PR (or the column PR, which carries it) -> staging -> preview checks -> promote that sha -> PR #57.
  - **Two api changes PR #57 depends on, both merged to `main` and on staging, NOT yet on production:** PR #58
    (`abd73c5`: the about-me group split into `support-activities` + `fun-fact`) and PR #59 (`be8c66a`: a care area
    takes any of its own specific areas, was 3). **One promotion covers both:** Actions -> deploy-api -> Run workflow,
    stage `prod`, imageTag `be8c66a3fac6c80bd909bf708357955e634cf523`. It must run BEFORE PR #57 merges (the new pages
    use the two new groups and 4+ areas; production's api still has `about-me`). Production today: U1 + U2 PR 2 (api
    revision `remonta-api-00009-gct`, image `67fef1d…`).
  - **Branch `test/my-profile-columns`** (`6fc4354`, from `main`, test-only): `apps/api/test/worker/columns.int.test.ts`,
    22 database cases, every My Profile write checked in its table and columns (and nothing else moved, the audit row,
    the other worker untouched). It has **not run yet** (skips locally, no Docker): the user opens the PR
    https://github.com/remontasupport/remontamarketplace/compare/main...test%2Fmy-profile-columns?expand=1 and CI's API
    Quality runs it; fix whatever fails, then merge (test-only; it redeploys staging, nothing else).
  - **Open question to the user (2026-10-13, unanswered: they asked to clarify, then to save the day):** how to test
    Services, Compliance and Account. Their saves are not on `apps/api` but ~20 `apps/app` server actions and route
    handlers (inventory in audit.md 2026-10-13; follow-ups 21-26). Options put: (a) an app database harness in CI (a
    PostGIS service in ci-app, faked session / Blob / Next cache / Upstash) with the My Profile style checks; (b) move
    those writes to `apps/api` first (the U3 unit) and test them with the api harness; (c) a written report only.
  - **Resume here:** 1. `git ls-remote origin main feat/edit-profile-app test/my-profile-columns`; if `main` moved,
    merge it into the branches and re-run the gates. 2. Ask about the column-test PR (opened? CI result?) and answer
    the Services/Compliance/Account testing question. 3. Ask whether the go-live is set; when it is: the preview
    checklist (PR3-summary "Still to do"), the promotion of `be8c66a…` to prod, production api checks, then merge
    PR #57 ("Merge pull request"), production app checks, CLAUDE.md rollback rows, then PR 4 (clean-up).
  - Developer-machine rules learned today: never `git add apps/app/src` or `commit -a` on an app branch (the locally
    regenerated Prisma client is modified and must not be committed: `be410e8` did, `fdbff45` reverted it); edit
    the record only in `../remonta-record`, never chained after a push that can fail. Untracked
    `apps/api/scripts/_u2-staging-writes.ts`: never commit it.

## Stage progress at parking (moved from aidlc-state.md on 2026-10-21)

### INCEPTION
- [x] Workspace Detection (2026-10-09): `aidlc-state.md` said no cycle open; `main` = `c51d430` (PR #49), clean tree;
  brownfield, unchanged layout; no reverse-engineering artifacts under `aidlc-docs/inception/` (the admin-search
  archive's 2026-10-08 pass is the latest; the decision full pass vs targeted inventory is deferred until the goal is known)
- [x] Goal named (`inception/cycle-start-questions.md`, 2026-10-09: Other, verbatim in the audit) -> branch `aidlc/worker-profile-api`
- [x] Targeted inventory (2026-10-09): `inception/requirements/worker-profile-inventory.md` (the dashboard's 13 pages
  and their data paths; the sidebar's current order; the api structure and concurrency model; the capacity arithmetic)
  and `worker-profile-routes.md` (33 route files, one row each). Key fact: the dashboard's writes are 53 server actions
  (6,962 lines) on Prisma, not routes; no worker entry exists in the api
- [x] Requirements Analysis (2026-10-09): 17 verification + 6 clarification questions answered (all recorded in the
  audit); `inception/requirements/requirements.md` written (D1-D16, FR-WRK/PI/EP/SVC/DOC/UPL/HOME/JOB/NAV/PLT, NFR-01..14,
  the extension compliance tables, 7 open items) -- **approved 2026-10-09**
- [ ] User Stories: assessment (execute); plan approved 2026-10-09 (Q1-Q3 A); `user-stories/personas.md` (P1/P2/S1/S4/S5
  by reference + W1/W2/W3) and `user-stories/stories.md` (33 stories, E1-E8, FR map, verification map) -- **approved 2026-10-09**
  with one change: ABN only, no TFN (requirements amendment D17 / FR-PI-07; US-WP-05 rewritten)
- [x] Workflow Planning (2026-10-09): `plans/execution-plan.md` -- risk High; four units fixed (U1 worker-area +
  capacity gate, U2 edit-profile, U3 services-documents, U4 dashboard-jobs); 10 PRs, api promoted before each app PR,
  a clean-up PR per unit after production verification -- approved 2026-10-09
- [ ] Application Design -- EXECUTE (concise): `plans/application-design-plan.md` written (Q1 entry per section; Q2 a
  `storageKey` column + an admin link entry; Q3 a `section` mode and new kinds in the engine; Q4 completion as a domain
  function with today's function as the oracle; Q5 uploads lifted to `platform/storage` with a kind table; Q6 one profile
  query and a typed client; Q7 the sidebar as a typed array) -- plan approved 2026-10-09 ("No2, let us proceed with
  the plan", read as: no change to documents' store; all seven as proposed); artifacts written -- **approved 2026-10-09**
- [ ] Units Generation -- SKIP (the four units are fixed in the execution plan)

### CONSTRUCTION (per unit; stages per the execution plan)
- [x] U1 `worker-area`: Functional Design · NFR Requirements · NFR Design · Infrastructure Design (all approved 2026-10-09) · Code Generation (2026-10-12, PRs #50-#52) · Build and Test (2026-10-12: staging checklist, promotion `b9ff6f4`, production checks and backfill) -- **live**; clean-up PR pending
- [ ] U2 `edit-profile`: Functional Design (plan approved 2026-10-12, Q1-Q10 A; **approved 2026-10-12**) · Code Generation (plan approved 2026-10-12, option A; **PR 2 generated** on `feat/edit-profile-api` `8a66496`, `code/PR2-summary.md`; PRs 3-4 next) · Build and Test (**PR 2 live** 2026-10-12: #56 merged `67fef1d`, migrated and promoted, prod revision `00009-gct`; staging 18+12 checks, load test with writes recorded; **PR 3 generated** on `feat/edit-profile-app` `2965ec3`, `code/PR3-summary.md`; PR #57 green at `3735cd8` after the user's menu changes; **held open by the user** 2026-10-12; next: the preview checklist, merge when the user says, the load-test re-run, promotion)
- [ ] U3 `services-documents`: Functional Design (full) · NFR Requirements · NFR Design · Code Generation (PRs 5-7) · Build and Test
- [ ] U4 `dashboard-jobs`: Functional Design (short) · Infrastructure Design · Code Generation (PRs 8-10) · Build and Test


## Execution plan summary at parking (moved from aidlc-state.md on 2026-10-21)
- **Stages to execute**: Application Design (concise); per unit as listed above; Code Generation and Build and Test always
- **Stages to skip**: Units Generation (units fixed in the plan); NFR Requirements/Design for U2 and U4 (inherit U1's and
  U3's); Infrastructure Design for U2 (a migration only) and U3 (the sign-up bucket reused)
