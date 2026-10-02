# Code Generation Summary -- unit `legacy-removal`

**Branch:** `feat/remove-legacy-signup` (from `main` at `b7ccc80`). **Plan:**
`aidlc-docs/construction/plans/legacy-removal-code-generation-plan.md`. **Requirements:**
`aidlc-docs/inception/requirements/requirements.md` (§5 is the verification protocol).

## Deleted (15 files, inventory section A)

`apps/app/src/features/forms/legacy/worker/` (7 files) · `app/api/auth/register-async/route.ts` ·
`app/api/auth/check-email/route.ts` · `lib/workers/workerRegistrationProcessor.ts` · `types/workerRegistration.ts` ·
`lib/location-parser.ts` · `schema/contractorFormSchema.ts` · `utils/apiRetry.ts` · `lib/registration-switch.ts`.

## Created

| File | Purpose |
|---|---|
| `apps/app/src/lib/registration-backend.ts` | Pure `resolveBackend(env)`: both public variables → the backend; else `null` after logging the missing variable **names** |
| `apps/app/src/lib/registration-backend.test.ts` | 3 tests: resolves; unavailable with names logged and never a value; ignores `REGISTRATION_BACKEND`/`VERCEL_ENV` |
| `apps/app/src/components/ui/form-wizard/SignupUnavailable.tsx` | The "Sign-up is temporarily unavailable" card |

## Modified

| Area | Files | What |
|---|---|---|
| Engine | `types.ts`, `kinds.ts`, `form.ts`, `draft.ts`, `submit.ts`, `verification.ts` | `Backend` api-only; `Mode`, `LegacyAdapter`, `legacyShape`, `ApiBackend` and every legacy branch removed; `formSchemaFor(def)`; draft without `mode` (an old draft's `mode` key is ignored, tested). **The api branch's code is unchanged in every edit** |
| Engine tests | `engine.test.ts`, `verification.test.ts` | Single mode; the request-equality tests untouched beyond the dropped argument |
| App | `page.tsx`, `workerRegistration.ts`, `WorkerRegistrationWizard.tsx`, `useFormWizard.ts`, `FormWizard.tsx`, `useEmailCode.ts`, `useLocalitySearch.ts`, `useServiceCategories.ts`, `fields.tsx`, `auth-prisma.ts` | Resolver + card on the page (`force-dynamic` kept); legacy adapter, step guard, legacy submit, legacy photo/email branches and the two adapters' app fallbacks removed; the S1 column omit removed |
| App tests | `forms.test.ts`, `adapters/browser.test.ts` | Legacy and switch tests removed; signatures updated |
| apps/api | `test/locations/home.test.ts`, `src/modules/locations/domain/home.ts` | **Found by the static proof:** the api's parity test imported the deleted app parser as an oracle. Rewritten to assert the legacy columns directly (location string, city, state, postcode, coordinates) over all 15,467 suburbs; a comment updated. The dual write itself is untouched (search still reads the columns) |
| Docs | `CLAUDE.md`, `docs/signup/01-flow.md`, `03-data-model.md`, `04-enums.md`, `README.md`, `aidlc-docs/aidlc-state.md` | No switch, one backend, the unavailable card, rollback by Vercel promote; §5 of the data model kept as history |

## Gates (2026-10-02)

| Gate | Result |
|---|---|
| `@remonta/form-engine` quality | Pass: lint, strict tsc, 51 tests |
| `@remonta/app` quality | Pass: type baseline 144 known (10 signatures improved); **lint baseline 488 known, down from 508** (deleted files took 20 known findings with them); 83 tests |
| `@remonta/api-contract` quality | Pass: 34 tests |
| `@remonta/api` quality | Pass: lint, strict tsc, 249 tests (124 database tests skipped locally, as always without `TEST_DATABASE_URL`; CI runs them). `home.test.ts` 6/6 |
| `npx turbo run build` | Not run locally: the user's `next dev` holds the Prisma engine (EPERM at `prisma generate`, CLAUDE.md trap). CI and the Vercel preview build the branch |
| Static proof (`rg` over live code, CLAUDE.md, docs/signup) | Only intentional mentions remain: the resolver test asserting `REGISTRATION_BACKEND` is ignored, and the historical sentences in CLAUDE.md, 01-flow and 03 §5 |
| Generated Prisma files | Not staged (pre-existing local modifications) |

**Not changed, noted for follow-up:** `packages/schemas/src/schema/contractorFormSchema.ts` is still exported from the
schemas package but nothing imports it; `apps/app/docs/*.md` (the 2026-09 business analysis) cite the deleted routes by
line number and are historical. The lint baseline file was not tightened to 488 (the gate accepts the drop; tightening is
a deliberate separate step per the script's own message).

## Extension compliance

- **Security**: two endpoints removed (one an email-existence oracle); the resolver logs variable names only (tested);
  no new endpoint or dependency. No finding.
- **Resiliency**: graceful "unavailable" card on misconfiguration; rollback by Vercel promote; the api is untouched.
  No finding.

## Build and Test -- what the user does next

1. **Note the current production deployment id** of `remonta-app` in Vercel (the rollback target).
2. Open the PR, wait for CI (App Quality, API Quality with its PostGIS container, Web Quality, previews).
3. **Preview, against the staging api** (`requirements.md` §5 step 4): the wizard renders; suburb search returns rows
   with ids; send and verify an email code; stage a photo; complete a sign-up with an internal address → success page;
   `/api/auth/register-async` and `/api/auth/check-email` return 404; one dashboard flow that uses `/api/suburbs`
   (e.g. the client request-service page) and one that uses `/api/upload/worker-photo` (profile preview) still work.
4. Merge with "Merge pull request".
5. **Production** (§5 step 5): the sign-up page renders the wizard; suburb search works; the two routes return 404;
   optionally one internal sign-up. If anything is wrong: Vercel → promote the deployment noted in step 1.
6. **Manual clean-up**: delete the Upstash key `switch:registration`; remove `REGISTRATION_BACKEND` from Vercel's
   Preview scope. Both are unread now; this is housekeeping, not a prerequisite.

## Rollback

Vercel promote of the previous `remonta-app` deployment (seconds). The api needs nothing: it was not changed.
