# Unused files: the scan (2026-10-21)

Request (user, verbatim in `audit.md`): "identify the files that needs to be deleted so we can clear the space of the
codebase, scan the files during the ai dlc and delete the unuse including the test scripts and docs". Read on `main`
`cf43d23` (after the release #94). Nothing deleted by this scan.

## Method

1. **Reachability** (`deadscan.cjs`, a read-only import graph): from every file Next.js loads (pages, layouts, routes,
   loading/error/not-found, middleware) for `apps/app` and `apps/web`, and from `src/main.ts` + the scripts for
   `apps/api`; following static, dynamic, `require`, `export ... from` and side-effect imports through the `@/` alias.
   Tests do not count as users. (First run under-counted: Git Bash rewrote `@/` and `/api/...` arguments into Windows
   paths; rerun with `MSYS_NO_PATHCONV=1`.)
2. **Cross-check** of every candidate by its import path across the whole repository (`next.config`, scripts, tests,
   CI, other apps). False positives removed: `apps/app/src/config/profileRedirects.ts` (imported by `next.config.ts`),
   `apps/api/src/platform/security/hash-worker.js` (loaded by path in `password-hasher.ts`),
   `apps/web/src/app/landing/AustraliaMap.tsx` (the home page).
3. **Routes**: each `apps/app` api route searched for its URL in the app, the marketing site, `vercel.json` (crons) and
   `next.config.ts`.
4. **Scripts and docs**: each searched by name in `package.json`, CI, CLAUDE.md and the docs.

## A. Dead source files, `apps/app` (40) -- no user anywhere, or only other dead files
- `apps/app/src/actions/suburbs.ts`
- `apps/app/src/components/account-setup/steps/Step7EmergencyContact.tsx`
- `apps/app/src/components/dashboard/JobsSection.tsx`
- `apps/app/src/components/dashboard/JobsSectionAsync.tsx`
- `apps/app/src/components/dashboard/ProfileCard.tsx`
- `apps/app/src/components/dashboard/client/ParticipantCard.tsx`
- `apps/app/src/components/dashboard/client/index.ts`
- `apps/app/src/components/dashboard/client/request-service/sections/SupportDetailsSection.tsx`
- `apps/app/src/components/forms/clientRegistration/Step3Address.tsx`
- `apps/app/src/components/forms/clientRegistration/Step3ServicesRequested.tsx`
- `apps/app/src/components/forms/clientRegistration/Step4Relationship.tsx`
- `apps/app/src/components/forms/clientRegistration/Step5ClientInfo.tsx`
- `apps/app/src/components/profile-building/sections/IndicativeRatesSection.tsx`
- `apps/app/src/components/profile-building/sections/NdisScreeningSection.tsx`
- `apps/app/src/components/ui/ProgressLink.tsx`
- `apps/app/src/components/ui/command.tsx`
- `apps/app/src/components/ui/form.tsx`
- `apps/app/src/components/ui/language-select.tsx`
- `apps/app/src/components/ui/layout/Footer.tsx`
- `apps/app/src/components/ui/location-dropdown.tsx`
- `apps/app/src/components/ui/radio-group.tsx`
- `apps/app/src/components/ui/searchable-select.tsx`
- `apps/app/src/components/ui/service-select.tsx`
- `apps/app/src/config/serviceOfferings.ts`
- `apps/app/src/config/serviceSkills.ts`
- `apps/app/src/constants/languages.ts`
- `apps/app/src/constants/onboardingQuestions.ts`
- `apps/app/src/constants/services.ts`
- `apps/app/src/hooks/usePhoneVerification.ts`
- `apps/app/src/lib/cache-invalidation.ts`
- `apps/app/src/lib/constants/onboardingQuestions.ts`
- `apps/app/src/lib/data/australianPostcodes.ts`
- `apps/app/src/lib/feature-access.ts`
- `apps/app/src/lib/logger.ts`
- `apps/app/src/lib/validations/contractor.ts`
- `apps/app/src/store/onboardingStore.ts`
- `apps/app/src/types/index.ts`
- `apps/app/src/types/serviceRequest.ts`
- `apps/app/src/utils/phoneVerificationUtils.ts`
- `apps/app/src/utils/registrationUtils.ts`

## B. Dead source files, `apps/web` (22)
- `apps/web/src/components/ArticleMetaTags.tsx`
- `apps/web/src/components/ui/checkbox.tsx`
- `apps/web/src/components/ui/command.tsx`
- `apps/web/src/components/ui/dialog.tsx`
- `apps/web/src/components/ui/form.tsx`
- `apps/web/src/components/ui/input.tsx`
- `apps/web/src/components/ui/label.tsx`
- `apps/web/src/components/ui/location-dropdown.tsx`
- `apps/web/src/components/ui/popover.tsx`
- `apps/web/src/components/ui/progress.tsx`
- `apps/web/src/components/ui/radio-group.tsx`
- `apps/web/src/components/ui/searchable-select.tsx`
- `apps/web/src/components/ui/select.tsx`
- `apps/web/src/components/ui/textarea.tsx`
- `apps/web/src/lib/constants/onboardingQuestions.ts`
- `apps/web/src/lib/data/australianPostcodes.ts`
- `apps/web/src/lib/logger.ts`
- `apps/web/src/lib/sanity/jobQueries.ts`
- `apps/web/src/lib/schema/sitelinks-search-box.ts`
- `apps/web/src/lib/validations/contractor.ts`
- `apps/web/src/store/onboardingStore.ts`
- `apps/web/src/types/index.ts`

## C. One-off scripts and their route (7) -- referenced nowhere (the route has no caller)
- `apps/app/scripts/debug-document-filters.ts`
- `apps/app/scripts/list-job-services.ts`
- `apps/app/scripts/rename-fake-job-ids.ts`
- `apps/app/scripts/seed-fake-jobs.ts`
- `apps/app/scripts/verify-user-manually.ts`
- `apps/app/src/app/api/admin/fix-qualifications/route.ts`
- `apps/app/src/scripts/fixQualificationNames.ts`

## D. Old docs (21) -- pre-monorepo; several cite files deleted since (state follow-up 7)
- `apps/app/docs/FILE_ORGANIZATION.md`
- `apps/app/docs/README.md`
- `apps/app/docs/Zoho_Jobs_To_DB.md`
- `apps/app/docs/architecture-audit.md`
- `apps/app/docs/business-plan.md`
- `apps/app/docs/business-requirements.md`
- `apps/app/docs/structure.md`
- `apps/web/docs/API_SYNC_CONTRACTORS.md`
- `apps/web/docs/CRON_SETUP.md`
- `apps/web/docs/PERFORMANCE.md`
- `apps/web/docs/PRODUCTION_READINESS.md`
- `apps/web/docs/README.md`
- `apps/web/docs/SETUP_GUIDE_NON_TECHNICAL.md`
- `apps/web/docs/Sync_jobs.md`
- `apps/web/docs/WEBHOOK_PRODUCTION_SETUP.md`
- `apps/web/docs/WEBHOOK_SECURITY_SETUP.md`
- `apps/web/docs/WEBHOOK_TESTING_GUIDE.md`
- `apps/web/docs/ZOHO_JOBS_TO_PROVIDE_SUPPORT.md`
- `apps/web/docs/ZOHO_SYNC_COMPLETE.md`
- `apps/web/docs/apiGuidelines.md`
- `apps/web/docs/structure.md`

## E. Api routes with no caller in the code (6) -- may be called from outside (Zoho, n8n, a scheduled report)
- `/api/admin/chat`
- `/api/admin/reports/daily`
- `/api/admin/reports/weekly`
- `/api/admin/reports/worker-statistics`
- `/api/admin/verification`
- `/api/zoho/leads`

## Kept on purpose

`aidlc-docs/` (the record; `audit.md` is append-only), `.brd/`, `docs/` (current reference docs), the scripts wired into
`package.json`, CI or CLAUDE.md (`clear-jobs-cache`, `create-admin-user`, `promote-to-admin`, the api backfills and
checks, the localities scripts), `apps/api/scripts/_u2-staging-writes.ts` (untracked, the user's).

## Outcome (2026-10-21)

The user chose to delete A, B, C, D and E ("Delete all six" routes). Branch `chore/remove-unused-files` `e4bb098`
(from `main` `cf43d23`): **98 files deleted** -- the 96 above plus `apps/app/src/lib/reports.ts` and
`apps/app/src/lib/verification.ts`, orphaned by the deleted report and verification routes (a rescan reached a fixed
point: 0 unused in `apps/app`; only the known false positive in `apps/web`). Links to the deleted docs remain only in
`.brd/` (dated analysis, kept). **Gates:** schemas 84, api-contract 109, form-engine 76, db 50, api 879, infra 43,
app 56 type / 279 lint known and 286 tests, web 70 lint known, `turbo run build` 3/3. Baselines tightened (app −17 type,
−10 lint; web −5 lint); CLAUDE.md's gate numbers updated. 102 files, −17,813 lines.

**Flagged:** `.brd/phase-0-orient.md` records that the deleted `apps/app/docs/Zoho_Jobs_To_DB.md` contained a live Zoho
OAuth client secret; deleting the file does not remove it from git history (the repository is public): rotate it in
Zoho if not already done (state follow-up 4).

## Correction (2026-10-21): the reports were in use

The user reported that the admin dashboard could not generate reports. `app/admin/manage/ReportsContent.tsx` calls
``fetch(`/api/admin/reports/${reportType}`)`` with `daily`, `weekly` and `worker-statistics`: a URL built at run time,
which step 3's caller check (a search for each literal URL) could not match. Group E's "no caller in the code" was
wrong for those three, and the user's "Delete all six" rested on it. **Restored** on `fix/restore-admin-reports`
`4494940` (the three routes and `lib/reports.ts` from `cf43d23`; the PDF bytes passed as a `Uint8Array` so they add no
baseline finding). **Re-checked:** every run-time-built `/api/` URL in `apps/app` and `apps/web` (40) against every
deleted route: only this one reached a deleted route; `chat`, `verification`, `zoho/leads` and `fix-qualifications`
have no static or run-time caller. Lesson for the next scan: match route prefixes against template URLs too.
