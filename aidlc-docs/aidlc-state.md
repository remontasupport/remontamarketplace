# AI-DLC State Tracking

## Project Information
- **Project**: Remonta marketplace monorepo (`apps/app`, `apps/web`, `apps/api`, `packages/*`, `infra/`)
- **Project Type**: Brownfield
- **Current Cycle**: **search-locations** (opened 2026-10-28, record branch `aidlc/search-locations` from `aidlc/admin-clients`): follow-up 1, the client search and the public list on `worker_locations` + PostGIS, then the dual write and the legacy columns.
- **Current Stage**: **PAUSED 2026-10-28 (resume here).** Live: U1 `search-api` (#147) and U2 `search-callers` (#148), then #149 (public list = every unsuspended worker, user decision): prod api `remonta-api-00026-zm4` = `331e5e3` (rollback `6886e09` / `00025-8b9`), app/web `main` `331e5e3`. Scope extended (user 2026-10-28): follow-up 39 **stage 1** (readers to HOME, the reconciler, stop the double write; the column drop = stage 2, later) in this cycle.
  **Next step (2026-10-29):** scope revised by the user: no fallback, all six legacy columns dropped (requirements "Revision (2026-10-29)": FR-7r..FR-13, units U3 `place-unplaced` -> U4 `legacy-readers-app` -> U5 `legacy-readers-api` -> U6 `drop-columns-schema` -> U7 `drop-columns-migration`). The earlier U3 plan (`legacy-readers-app-code-generation-plan.md`, with fallback) is superseded. **U3 done in production 2026-10-29** (62 HOME rows `source = 'ADMIN'`; 8 left: 4 empty, 4 overseas). **U4 live** (#150, `main` `a39c0b7`). **U5 live 2026-10-29** (#151 `ba12ece`; prod api `remonta-api-00027-rp9` = `ba12ece`, rollback `331e5e3` / `00026-zm4`): the api neither reads nor writes the six columns. Follow-up 42 (photo page retries a 503 shed). **U6 live 2026-10-29** (#152 `6551489`; app on `main`, prod api `remonta-api-00028-bcq` = `6551489`, rollback `ba12ece` / `00027-rp9`): the six fields and five indexes are out of the schema; the columns remain in the database. **Next:** U7 `drop-columns-migration` after a soak (Neon branch of production first; DROP INDEX x5, DROP COLUMN x6), then the close.
  **Loose ends for the close:** undo the 1828 activations on the DEV Neon branch with Neon "Reset from parent" (the ids file was session-temporary; harmless now, nothing reads the flag); delete `apps/api/scripts/_search-*.ts` (untracked); re-record CLAUDE.md rollback rows (api `00026-zm4` = `331e5e3`, previous `00025-8b9` = `6886e09`; app/web `331e5e3` builds); Build and Test summary; archive. The user's own check still open: a signed-in client search in production.

## Previous cycles (archived, read-only)

| Cycle | Archive | Outcome |
|---|---|---|
| Monorepo migration (U1-U8) | `aidlc-docs/archive/monorepo-migration/` | `apps/app`, `apps/web`, `packages/*` on pnpm + Turborepo; live |
| Slice 1 -- worker registration on `apps/api` | `aidlc-docs/archive/s1-worker-registration/` | Live in production since 2026-10-02 10:20Z |
| Sign-up draft + reCAPTCHA badge (2 units) | `aidlc-docs/archive/signup-draft-and-recaptcha-badge/` | PR #30 and PR #32 merged 2026-10-02; verified live |
| Legacy sign-up removal (cut-over clean-up) | `aidlc-docs/archive/legacy-signup-removal/` | PR #34 merged 2026-10-02 (`a30946e`); verified live; Upstash switch key deleted |
| Sign-up photo on Google Cloud Storage (U1 `alert-policy`, U3 `photo-gcs`) | `aidlc-docs/archive/signup-photo-gcs/` | PRs #36-#39 merged and verified live 2026-10-05; api revision `remonta-api-00005-j74` |
| Admin worker search on `apps/api` (U1 `api-identity`, U2 `admin-search`, + experience sub-areas) | `aidlc-docs/archive/admin-search-api/` | PRs #41-#47 merged 2026-10-08/09; api image `024596f` on prod (dispatch 2026-10-09 02:41Z); the app on `main` `48a8a7e`; verified live by the user |
| Worker profile on `apps/api` (U1 `worker-area`, U2 `edit-profile` in part) | `aidlc-docs/archive/worker-profile-api/` | **Parked 2026-10-14** with work open (`PARKED.md`); U1 live 2026-10-12, U2 PR 2 live; PR #57 held |
| API review: the worker dashboard on `apps/api` (U3-U5, the State filter) | `aidlc-docs/archive/api-review/` | **Parked 2026-10-21** (`PARKED.md`); api #61-#85 live (prod `b8fe2eb`, 2026-10-19); the State filter live (#86); `feat/account-app` held |
| Onboarding tour + profile completion (U1 `tour-seen-api`, U2 `tour-app`, C1 `completion-api`; H1/H2) | `aidlc-docs/archive/onboarding-tour/` | Closed 2026-10-22; #88-#103 live (api prod `00014-wdv` = `9fdcf6d`, app `main` `62e24f9`); C2 not built (follow-up 27) |
| Worker tools (U1 `tools-api`, U2 `tools-app`, the tool search) | `aidlc-docs/archive/worker-tools/` | Closed 2026-10-22; #104-#107 live (api prod `bf9b966`, app `main` `8943f93`) |
| Worker activation (U1 `activation-api`, U2 `activation-app`) | `aidlc-docs/archive/worker-activation/` | Closed 2026-10-28; #108-#109 live 2026-10-23 (api `00017-4bz` = `746a60d`, app `main` `8b8a82d`); #110-#131 outside the cycle, api prod `90fdadb` |
| Admin clients and coordinators (U1 `clients-api`, U2 `clients-app`, follow-ups) | `aidlc-docs/archive/admin-clients/` | Closed 2026-10-28; #132-#142 live (api prod `00024-fpj` = `979543a`, app `main` `baf44fb`); #143/#144 (Matching editable, Renew restored) outside the goal |

`aidlc-docs/audit.md` is the single append-only audit trail across cycles; never rewrite it.

## What is live (carry forward -- facts the next cycle builds on)

- **Admin clients and coordinators** (2026-10-28): `GET /v1/admin/requesters` (role, search, requestStatus, fundingType,
  participants), `GET /v1/admin/requesters/:id` (audited per view), `PATCH` a request's status (audited; outbox
  `ServiceRequestStatusChanged` posts Cancel / Archive / Edit with `changedBy: 'admin'` to `N8N_SERVICE_REQUEST_WEBHOOK_URL`,
  staging `off`). The app's Clients / Support Coordinators tabs (`features/admin-clients`), MATCHED not offered. CSV
  download on those tabs and the Contractors tab from one module (`features/admin-export`, `lib/api/allPages`). The
  client's PATCH edits PENDING and MATCHING only and archives COMPLETED and CANCELLED only (`EDITABLE_STATUSES`,
  `ARCHIVABLE_STATUSES` in `features/service-requests/status.ts`, the page's buttons follow them); manage-request offers
  Renew on a cancelled request.
- **Worker tools** (2026-10-22): `packages/schemas/src/data/serviceTools.ts` (the lists, `TOOL_SYNONYMS`, `toolSearchOf`)
  is the one source for the page and the api; `worker_services."toolIds"`/`"otherTools"`; the worker's "Your tools"
  screen (Cleaning, Home and Yard), the admin `tools` (all of) and `toolSearch` filters, `GET /v1/admin/workers/:id/services`.
  Not in completion; clients never see tools. **Vercel regenerates the app's Prisma client from `packages/db` at build**:
  a new column is known to the app from the merge, before production's database has it (keep app queries on explicit
  `select`). Production api `bf9b966`.
- **The worker sign-up has one backend: `apps/api`** (NestJS 11 on Fastify 5, Cloud Run `remonta-api`,
  `australia-southeast1`, project `remonta-api-510206`, URL `remonta-api-154148201608.australia-southeast1.run.app`).
  The app finds it through `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_RECAPTCHA_SITE_KEY`; with either missing the sign-up
  page shows "Sign-up is temporarily unavailable". Rollback of an app change = Vercel promote; of the api = its
  previous revision/image. The sign-up photo goes straight to a private Cloud Storage bucket by signed POST ticket,
  then the outbox handler writes the clean copy and thumbnail to Vercel Blob (`docs/signup/`).
- **The admin dashboard's lists read `apps/api`** (2026-10-08): `GET /v1/admin/workers` (one statement on
  `worker_profiles` + `users` + `worker_locations` HOME + `au_localities` + `worker_additional_info`, with
  `worker_services` and `worker_experience` per filter; PostGIS `ST_DWithin` for the radius; 120/min per admin),
  `/v1/admin/users`, `/v1/admin/workers/suspended`; a bearer JWT the app mints at `GET /api/auth/api-token`
  (`API_TOKEN_SECRET` per stage, Vercel scope <-> Secret Manager); private caching 60 s + ETag; the api's response
  memo. The old Next.js admin routes are gone; `/api/admin/contractors/[id]` and `.../status` remain. Reference:
  `docs/admin/README.md`.
- **Experience sub-areas** (2026-10-09): the five care domains and their 39 specific areas live once in
  `packages/schemas/src/data/experienceAreas.ts`; the edit-profile page offers them, `worker_experience.specificAreas`
  stores them as labels, and the search takes `experienceAreas` (`DOMAIN:Area` pairs, any-of within a domain, all-of
  across; a pair needs its domain in `experienceWith`). Checked on the staging copy: 38 distinct stored values, all in
  the list. `otherAreas` is not read.
- **Unplaced workers**: 69 active workers have no HOME row (the S1 backfill's no-guess leftovers: city names such as
  Sydney, Melbourne, Hervey Bay, Gold Coast with a suburb's postcode; misspelt suburbs; street addresses without a
  suburb; four empty, four overseas). The reconciler (every 5 min) places a worker the moment the legacy columns match
  one suburb. No admin control exists; a direct row with `source = 'ADMIN'` plus the legacy columns is the manual way
  (audit 2026-10-09). "Hervey Bay" is not a locality: 24 suburbs on 4655.
- **Staging** `remonta-api-staging` deploys from every merge to `main` touching the api path (`rehearse-w1` Neon copy,
  host `ep-wandering-shadow`); production moves only by `workflow_dispatch` promotion of an image already built.
  Vercel Preview points at staging. `scripts/local/run-api.sh` + `run-app.sh` run the new code on a developer machine
  against that copy (`REHEARSAL_DATABASE_URL` in `apps/api/.env`). **Still to remove by hand:** `REGISTRATION_BACKEND`
  in Vercel's Preview scope.
- **This machine (2026-10-09):** WSL answers "Class not registered", so Docker Desktop's Linux engine is down and the
  database-gated tests skip locally; CI's API Quality job is the proof. `gcloud` needs a re-login for secrets.
- **The production auth database** (`workerprofiles`, host `ep-delicate-recipe-a7mbt4ef`) carries the S1 migrations,
  PostGIS 3.5, `au_localities` (15,467), `worker_locations`, `worker_onboarding` + transitions, the outbox, rate-limit
  buckets and scheduled jobs. The api still dual-writes `worker_profiles.location/city/state/postalCode/latitude/
  longitude`: the client search and the public list read them (follow-up 1).
- **Secrets** `remonta-api[-staging]-<NAME>`, six per stage, in Secret Manager; add versions with
  `printf '%s' | gcloud secrets versions add --data-file=-` (no trailing newline: follow-up 15).
- **Quality gates (2026-10-09):** schemas 63 tests; api-contract 49; api 368 unit (+143 database-gated, CI); app
  142 type / 471 lint known / 119 tests; form-engine 58; infra 37. CodeQL and Semgrep on every PR.
- **Rollback deployments** re-recorded in CLAUDE.md on 2026-10-09 (the deployment pages of the `main` `48a8a7e` builds).
- **Driving minutes on the worker card** (PR #49 `e8889fa`, merged to `main` `c51d430` on 2026-10-09, outside a cycle):
  the admin search card reads "about N min drive from the suburb centre", estimated in the app from the straight-line km
  the api returns (`apps/app/src/features/admin-search/travel.ts`); the sort is unchanged. Its production verification
  is not recorded in the audit; CLAUDE.md's rollback rows still name the `48a8a7e` builds.

## Follow-ups left open (candidates for the next cycle or housekeeping)

> **PENDING, RECOMMEND AT EVERY AI-DLC START (user 2026-10-29): U7 `drop-columns-migration`.** Not before 2026-10-30
> (soak after U5/U6). Drops `worker_profiles.location, city, state, postalCode, latitude, longitude` and their five
> indexes (`city`, `latitude+longitude`, `postalCode`, `state`, `isPublished+city`). Preconditions: U6 live in app and
> api (yes, `remonta-api-00028-bcq` = `6551489`); a Neon branch of production taken just before (the only way back);
> after it, api rollback only to `6551489` or later. Steps: migration in `packages/db` -> PR -> staging (migrate runs
> there) -> checklist -> promotion (migrate runs on prod). Irreversible.

1. **Search slice, remainder**: done 2026-10-29 (search-locations U1-U6) except the column drop = U7 above.
2. **CRM notification** (n8n -> Zoho) for sign-ups: an outbox handler.
3. **Form engine wording**: a reCAPTCHA token failure reads "We couldn't reach Remonta…".
4. **Rotate exposed credentials**: the production auth db role; the production Blob token; the Prisma Accelerate key;
   the `rehearse-w1` role password. Then Vercel and the local env files.
5. **Repository visibility**: the GitHub repository is public; confirm intended.
6. **Generated Prisma clients**: settle the local-vs-committed difference; decide whether `src/generated/` stays in git.
7. **Stale exports and docs**: `contractorFormSchema.ts`, the stale `UserRole` type, `apps/app/docs/*.md`.
8. Smaller: SERVICE_OPTIONS stale vs the catalogue; two duplicate `users.email` indexes; the other hand-built forms
   onto the form engine; admin users search `contains`; the 10 codes/h per IP decision; the production test accounts
   of 2026-10-02 and 2026-10-05; stale branches (`aidlc/*`, `feat/*` merged, `app/main`); tighten the app lint baseline.
9. **Observations**: the `latency-p95` policy (no email expected without 60+ requests in 5 min); a week of Cloud
   Logging on the photo entries (by 2026-10-12).
10. **Photo-era leftovers**: multipart-era unclaimed rows skipped by the purge; the test sign-up of 2026-10-05.
11. **Dashboard uploads** (`/api/upload/worker-photo`): the ticket/confirm pattern later; out of scope by decision.
12. **MFA for admin accounts** (SECURITY-12): the identity slice.
13. **Profile column normalisation**: `gender`, `hasVehicle`, `dateOfBirth`, the worker type out of the `abn` JSON, one
    language list.
14. **A document-filter screen for the admin search** (category, status, type on one `verification_requirements` row).
15. **Secret versions without a trailing newline**: say so in `infra/README.md`'s rotation runbook and the bootstrap.
16. **The checklist runner and the paced replay** as the standard post-deploy check for the admin entries.
17. **Unplaced workers (69)**: an admin set-suburb control (a contract entry + handler writing a HOME row with
    `source = 'ADMIN'` and the legacy columns + a picker on the worker's admin page); and city-name help in the suburb
    autocomplete (Hervey Bay, Gold Coast, Sunshine Coast, Toowoomba have no locality row: offer their suburbs).
    Recommended as the next cycle.
18. **Experience sub-areas, options**: (the profile page's limit of 3 went on 2026-10-13, PR #59) also match `otherAreas` (a toggle); show the matched areas on the result row;
    the profile page's 3-per-domain limit hides a fourth condition from the search.
19. **This machine**: repair WSL (`wsl --install` as admin, reboot) so the local PostGIS and the database-gated tests
    run again; re-login `gcloud`.
20. **The local client-side error** (2026-10-09, the local app against the staging copy): not reproduced on the preview
    or production; if it returns, the browser console's first line is the lead.

21. **Admin contractor page reads legacy columns** (found 2026-10-13): `/api/admin/contractors/[id]` and its page show
    `worker_profiles.languages` / `hobbies` / `uniqueService`; the worker pages (old and new) write
    `worker_additional_info`, so the admin view can be stale. Read the additional-info row (as the api's read does).
22. **The services setup page's Next saves nothing** (verified 2026-10-13): it sends `update-step` `step: 100 + n` with
    `{qualificationsByService, nursingRegistration}`; the route writes nothing for those steps (101 needs `services`,
    102 `selectedQualifications`, 103+ default) and answers "Step N saved successfully". Check on the preview whether
    the ticked qualifications survive a reload (they may be derived from the uploaded documents).
23. **`verification_requirements` has no unique (workerProfileId, requirementType)**: the find-then-create upserts of
    the compliance and service-document uploads can race into duplicates (subagent finding, to verify).
24. **Two service-document upload paths** (`uploadServiceDocument` and `POST /api/upload/service-documents`) with
    different `requirementType` keys, Blob paths and fields; some deletes (`identity-documents`, the service-document
    ones) leave the Blob file (subagent finding, to verify).
25. **Account**: the password change asks no current password and invalidates no session server-side; the email change
    does not lower-case and needs no re-verification (subagent finding, to verify; SECURITY baseline).
26. **No test covers the `apps/app` writes** of Services, Compliance and Account, and CI (app) has no database: see the
    open question in Current Stage.

27. **C2 `completion-app`** (onboarding-tour's last unit): Functional Design first; then `COMPLETION_MODEL` to `groups` + the backfill.
28. **H3 published-only search** (local `fix/h3-published-workers-only-v2`, 1 ahead / 7 behind `main`): a product decision, 1 of 1,765 workers published.
29. **Rotate the Zoho OAuth secret** committed in the deleted `apps/app/docs/Zoho_Jobs_To_DB.md` (in git history).
30. **Production 403 on `GET /v1/worker/profile`** for one non-WORKER account (`cmj85z8m60000vxr002l9hqqo`, 2026-10-21 07:15Z, 08:22Z): role or impersonation; fix access or the message.
31. **`test/my-profile-columns`** (24 database tests): bring up to date and merge. Also tighten the app lint baseline (H1 removed one finding).
32. **Merge order guard**: #105 merged before its api was promoted. Consider a required check or a PR-template line for
    app PRs that call a not-yet-promoted api entry.
33. **Tools, options**: show matched tools on the admin result cards (Q2 B); tools on the client/shared profile; tools
    for other services; review the synonym list after real use (the own tools workers type).
34. ~~**gcloud re-login**~~ done (2026-10-28: revision names read at the admin-clients close).
35. ~~**Zoho for an admin status change**~~ confirmed by the user (2026-10-28). Was: change one request in production, then check n8n's execution and the Zoho record; if
    Cancel/Archive work but other statuses do not, the n8n workflow must map `status` on `Edit` (a workflow change).
36. ~~**n8n `Renew`**~~ (#144): confirmed by the user (2026-10-28).
37. ~~**Edit on a cancelled request**~~: Edit shown on Pending and Matching only (`fix/edit-pending-matching-only`, 2026-10-28).
41. **The activation switch** (user 2026-10-28): the public worker list no longer reads `isActivated` (every unsuspended worker is listed); the admin dashboard's switch (worker-activation) now changes nothing anyone sees. Remove it, or give it a new meaning.
40. **The admin and worker api clients' token loop** (search-locations U2): `apps/app/src/lib/api/admin.ts` and `features/worker/api.ts` still carry their own copy of the loop `lib/api/call.ts` now holds; move them onto it (with their cache modes and abort signals) in a refactor with its own tests.
39. **Legacy location columns, the remainder of follow-up 1** (user 2026-10-28, Q5 A "TAKE NOTE OF THIS"): after the search-locations cycle's searches have run in production for a while, a later cycle stops the api's dual write (`placeHome` → `LegacyLocationColumns`), moves the display readers (profile preview, profile data, completion, admin lists, the admin search fallback) to the HOME locality, reworks the reconciler (it matches the legacy city/state/postcode), then drops the six columns.
38. **The n8n Cancel/Archive webhook URL** was shown in a session transcript (2026-10-28): rotate if that matters.

## Workspace State
- **Existing Code**: Yes
- **Programming Languages**: TypeScript
- **Build System**: pnpm workspaces + Turborepo
- **Project Structure**: Monorepo -- `apps/app` (Next.js application), `apps/web` (Next.js marketing site),
  `apps/api` (NestJS + Fastify on Cloud Run), `packages/{config,schemas,api-contract,form-engine,db}`, `infra/`
- **Workspace Root**: `C:\Users\floil\OneDrive\Documents\Projects\Remonta\remontamarketplace`
- **Reverse Engineering**: the admin-search archive's `inception/reverse-engineering/` (2026-10-08) is the latest
  whole-repo view; the targeted inventories (`admin-search-inventory.md`, the photo inventory) map their areas. A new
  cycle on another area starts with a targeted inventory of that area.

## Code Location Rules
- **Application Code**: Workspace root (NEVER in aidlc-docs/)
- **Documentation**: aidlc-docs/ only
- **Structure patterns**: CLAUDE.md "Dynamic by default" (contract entries + handlers; form definitions)

## Extension Configuration (carried from worker-activation; admin-clients kept the same)
| Extension | Enabled | Decided At |
|---|---|---|
| Security Baseline | Yes, blocking | worker-activation, Requirements Analysis 2026-10-23 (Security A) |
| Resiliency Baseline | Yes; SLA 99.9 %, RTO ≤ 30 min, RPO ≤ 5 min, single region (carried) | worker-activation, 2026-10-23 (Resiliency A) |
| Property-Based Testing | Yes, full | worker-activation, 2026-10-23 (PBT A) |
