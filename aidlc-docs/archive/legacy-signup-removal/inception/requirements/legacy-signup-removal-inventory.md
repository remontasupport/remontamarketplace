# Inventory -- removing the legacy worker sign-up path

**Request (2026-10-02):** "delete the legacy api in sign up workflow and the connected codes of it since the new
backend api is already deployed. Make sure to be careful when deleting". This is follow-up 3 of the state file
(cut-over clean-up). **Nothing has been deleted yet.** Every item below was found by reading the code and counting
its importers; the lists are what a deletion PR would touch.

Production facts: `switch:registration` = `api` since 2026-10-02 10:20Z; the api serves every production sign-up;
the legacy page is reachable only if that key is set back to `legacy`.

## A. Delete -- used by the legacy path only

| Item | What it is | Other users |
|---|---|---|
| `apps/app/src/features/forms/legacy/worker/` (7 files) | The pre-S1 page: `LegacyWorkerRegistration`, Step1Location, Step1PersonalInfo, Step3Services, Step7Photos, Step7Verification, SupportWorkerDialog | Only `app/registration/worker/page.tsx` |
| `apps/app/src/app/api/auth/register-async/route.ts` | The legacy submit route (rate limit, reCAPTCHA, `processWorkerRegistration`, then the n8n webhook) | Only the legacy page and the definition's legacy adapter |
| `apps/app/src/app/api/auth/check-email/route.ts` | The legacy early "email exists" check (reveals whether an address is registered) | Only the legacy page and the legacy adapter |
| `apps/app/src/lib/workers/workerRegistrationProcessor.ts` | Writes the user/profile for the legacy route | Only `register-async` |
| `apps/app/src/types/workerRegistration.ts` | `WorkerRegistrationJobData` | Only the processor and `register-async` |
| `apps/app/src/lib/location-parser.ts` | `geocodeWorkerLocation` (Google geocoding of the typed suburb) | Only the processor and `register-async` |
| `apps/app/src/schema/contractorFormSchema.ts` | The pre-S1 validation rules | Only the legacy page and the legacy adapter |
| `apps/app/src/utils/apiRetry.ts` | `fetchWithRetry` | Only the legacy page and the legacy adapter (the engine has its own retry) |
| The `legacy` adapter in `features/forms/definitions/workerRegistration.ts` (lines 95-152) and its two imports | Old rules, the check-email guard, the exact old request | -- |
| `lib/registration-switch.ts` + `getRegistrationBackend` in `app/registration/worker/page.tsx` | The Upstash/env switch; the page's `legacy` branch | Tests in `features/forms/forms.test.ts` |
| Tests | `forms.test.ts`: "keeps legacy's rules in legacy mode", "legacy mode posts exactly the pre-S1 request", the three `resolveBackend` tests | -- |
| `lib/auth-prisma.ts` `omit` of `consentProfileShareAt`, `consentWordingVersion`, `zohoLeadId` | Pre-migration guard; the S1 migrations are on production | Safe to remove (state file follow-up 3) |

## B. Keep -- shared with other flows (must NOT be deleted)

| Item | Why it stays |
|---|---|
| `GET /api/suburbs` | Used by the admin dashboard, client and coordinator request-service pages, account setup, the worker search bar, the api-mode locality adapter and `apps/web` |
| `POST /api/upload/worker-photo` | Used by profile preview, account setup, photo modals, the admin picker |
| `components/forms/fields/PhotoUpload` | The api-mode photo field renders it too (`form-wizard/fields.tsx`); only its default upload path is legacy |
| `components/forms/workerRegistration/CategorySubcategoriesDialog`, `hooks/queries/useCategories` | Client registration, services setup, admin, the api-mode services field |
| `lib/recaptcha.ts` (server verify) | Client and coordinator registration routes |
| `lib/ratelimit.ts`, `lib/password.ts`, `lib/auth-prisma.ts` | 16, 7 and 96 other importers |
| `/api/auth/register/client`, `/api/auth/register/coordinator` | Client and coordinator sign-up, not part of this request |
| `app/registration/worker/success/page.tsx` | The api-mode wizard redirects to it |
| apps/api's dual write of `worker_profiles.latitude/longitude` (`locations/domain/home.ts`) | The search readers still read those columns (follow-up 1); removing it now would break search |
| `packages/form-engine` legacy-mode capability (`Backend`, `Mode`, `LegacyAdapter`, the `legacy` branches in `kinds.ts`, `form.ts`, `draft.ts`; `useFormWizard`/`FormWizard` legacy branches) | **Decision Q1.** CLAUDE.md names a `legacy` adapter as the way the other 11 hand-built forms move onto the engine with a true rollback. Keeping the capability keeps that path; removing it is a larger refactor of the engine and its tests |

## C. Consequences to accept

1. **No rollback for the api sign-up.** Today the key `legacy` restores the pre-S1 page on the next request. After
   deletion the rollback is a Vercel promote of the previous deployment (CLAUDE.md "Rollback"), and the api itself
   rolls back by revision. The state file suggested waiting about a week of real sign-ups; the api went live today.
2. **The CRM notification path is gone for good until rebuilt.** `register-async` was the only code posting a new
   worker to the n8n webhook (Zoho). Api-mode sign-ups have never sent it (follow-up 2). Deleting the route makes
   that explicit; new workers are read from the admin list.
3. **The page needs the api configuration.** Today a missing `NEXT_PUBLIC_API_URL` or site key falls back to the
   legacy page. After deletion something else must happen (Decision Q2). Production has both variables (it runs api
   mode now). Local dev has no `NEXT_PUBLIC_API_URL`, so the local sign-up page changes behaviour (Q2).
4. **Operational clean-up after the merge** (manual, user): delete the Upstash key `switch:registration`; remove
   `REGISTRATION_BACKEND` from Vercel's Preview scope; `RECAPTCHA_SECRET_KEY` stays (client/coordinator routes).

## D. Documentation to update in the same PR

- `CLAUDE.md`: "Preview before production" (the switch, the three locks, the rollback drill), the Cloud Run block's
  `Switch:` line, the local-run command (`REGISTRATION_BACKEND=api`), "Moving a legacy form over" (kept if Q1 = keep).
- `docs/signup/01-flow.md` (backend switch section, the legacy row), `03-data-model.md` §5 "Legacy sign-up",
  `04-enums.md` (the `LOGIN_SUCCESS` note and the backend-mode row), `README.md` (two rows).
- `aidlc-docs/aidlc-state.md` "What is live" and follow-up 3.

## E. Verification before merge (preview) and after (production)

1. CI green (App Quality type/lint baselines, tests; form-engine gate; Vercel preview build).
2. Preview: sign-up page renders the api wizard; a full sign-up with an internal email succeeds; `/api/suburbs` and
   the photo upload still work from a dashboard flow; `GET /api/auth/register-async` and `/api/auth/check-email`
   return 404.
3. Production after merge: the sign-up page unchanged for users (api mode); one internal sign-up if desired.
