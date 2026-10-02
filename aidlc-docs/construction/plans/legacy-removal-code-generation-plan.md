# Code Generation Plan -- unit `legacy-removal`

**Single source of truth for this unit.** Branch `feat/remove-legacy-signup` from `main` at `b7ccc80`.
Requirements: `aidlc-docs/inception/requirements/requirements.md` (FR-01..08, §5 protocol). Nothing is deleted until
this plan is approved.

## Guiding rule

The api path must send the same requests to the same endpoints with the same validation after the change. Every
edit to a shared file removes a `legacy` branch and keeps the `api` branch's code verbatim. Two existing tests pin
that: "api mode sends the contract's body" (`forms.test.ts`) and "what the form accepts, the contract accepts"
(`engine.test.ts`). They are not edited except for the removed `mode` argument.

## Part A -- `packages/form-engine` (legacy mode removed)

- [x] **A1 `src/types.ts`**: `Backend = { apiBaseUrl: string; recaptchaSiteKey: string }`; delete `LegacyAdapter` and
  `FormDefinition.legacy`; reword the comments that say "api mode" / "legacy has no such step".
- [x] **A2 `src/kinds.ts`**: delete `Mode`, `KindContext.mode`, `KindContext.legacyShape`; `ruleFor` reads the contract
  shape only; the locality rule always requires an id (`v?.id != null`); the emailCode rule is always the contract's.
- [x] **A3 `src/form.ts`**: `formSchemaFor(def)` (no mode); build the context without `mode`/`legacyShape`; comment.
- [x] **A4 `src/draft.ts`**: delete `Draft.mode`; `saveDraft(store, formId, { step, values }, neverSaved, now?)`;
  `loadDraft(store, formId, neverSaved, now?)`. A draft written by the current release carries `mode: "api"`; the
  extra key is ignored, so a visitor mid sign-up at deploy time keeps their draft.
- [x] **A5 `src/submit.ts`**: delete `ApiBackend` (use `Backend`).
- [x] **A6 tests**: `test/engine.test.ts` -- drop the fixture's `legacy`, the `mode` arguments, the legacy
  expectations ("accepts a filled form in both modes" becomes api only; "stricter name rule in api mode only" becomes
  "applies the contract's name rule"; the locality test asserts the id-less fallback is rejected); the draft tests and
  the two property-based tests lose `mode`. `test/verification.test.ts` -- drop the `legacy` assertion and the mode
  argument. `test/input.test.ts` -- mode argument if present. Boundary test unchanged.

## Part B -- `apps/app` deletions (inventory section A)

- [x] **B1** `git rm -r src/features/forms/legacy/` (7 files).
- [x] **B2** `git rm src/app/api/auth/register-async/route.ts src/app/api/auth/check-email/route.ts` (the two folders
  disappear with them).
- [x] **B3** `git rm src/lib/workers/workerRegistrationProcessor.ts src/types/workerRegistration.ts
  src/lib/location-parser.ts src/schema/contractorFormSchema.ts src/utils/apiRetry.ts src/lib/registration-switch.ts`
  (check `src/lib/workers/` and `src/schema/` for other files first; remove only these).

## Part C -- `apps/app` edits

- [x] **C1 `features/forms/definitions/workerRegistration.ts`**: delete the `legacy:` block and the two imports
  (`contractorFormSchema`, `fetchWithRetry`); rewrite the header comment.
- [x] **C2 new `lib/registration-backend.ts`**: pure `resolveBackend(env): Backend | null` -- both variables present
  → the backend; otherwise `null` after `console.error("[registration] NEXT_PUBLIC_API_URL ... missing; sign-up unavailable")`.
  New `lib/registration-backend.test.ts` (3 tests).
- [x] **C3 `app/registration/worker/page.tsx`**: `const backend = resolveBackend(process.env)`; `null` → render
  `SignupUnavailable`; else the wizard in `Suspense`. Keep `dynamic = "force-dynamic"` (the env is read on the server
  per request, so a fix to the variables needs no rebuild); rewrite the comment.
- [x] **C4 new `components/ui/form-wizard/SignupUnavailable.tsx`**: a Card with "Sign-up is temporarily unavailable"
  and one sentence ("Please try again in a little while."); presentational, no props.
- [x] **C5 `features/forms/definitions/WorkerRegistrationWizard.tsx`**: comment (the definition carries the
  contract's Zod schemas, which cannot cross the Server/Client boundary).
- [x] **C6 `features/forms/useFormWizard.ts`**: `uploaderFor` always returns the api uploader; `next` loses the
  `afterStep` guard; `submit` loses the legacy branch; comments.
- [x] **C7 `features/forms/FormWizard.tsx`**: `EmailCodeSlot` always rendered; `PhotoSlot` `previewUrl = f.value ?
  thumbnail : undefined`, `alreadyUploaded = !!f.value`; `ApiBackend` → `Backend`; comments.
- [x] **C8 `features/forms/useEmailCode.ts`**: `ApiBackend` → `Backend`.
- [x] **C9 `features/forms/adapters/useLocalitySearch.ts`**: delete `fromApp`; `backend.apiBaseUrl` directly; comment.
  **`useServiceCategories.ts`**: delete the app branch and the `fetchCategories` import; `queryKey` keeps the base url.
- [x] **C10 `components/ui/form-wizard/fields.tsx`**: comments on `PhotoFieldProps` only (`upload` stays optional
  because `PhotoUpload` has its own default for other callers; the wizard always passes it).
- [x] **C11 `lib/auth-prisma.ts`**: delete the `omit` block and its comment (FR-07).
- [x] **C12 `features/forms/forms.test.ts`**: delete "keeps legacy's rules...", the "legacy mode posts exactly..."
  block and "the backend switch" block; drop `mode` arguments; drop unused imports (`afterEach`, `vi` if unused,
  `resolveBackend`).

## Part D -- documentation

- [x] **D1 `CLAUDE.md`**: rewrite "Preview before production" (no switch; previews point at staging through the two
  public variables; rollback = Vercel promote / api revision); Cloud Run block `Switch:` line removed; local-run
  command drops `REGISTRATION_BACKEND=api`; "Moving a legacy form over" paragraph replaced by one sentence (the
  engine is api-only; a form moves over when its api entry exists).
- [x] **D2 `docs/signup/01-flow.md`** (backend section → the two variables and the unavailable card; the badge
  paragraph's "legacy page" clause), **`03-data-model.md`** §5 (now historical, one paragraph), **`04-enums.md`**
  (the `LOGIN_SUCCESS` note; the backend-mode row removed), **`README.md`** (the two rows).
- [x] **D3 `aidlc-docs/aidlc-state.md`**: "What is live" (switch gone; rollback = Vercel promote), follow-up 3 closed.

## Part E -- verification (Build and Test)

- [x] **E1 gates** *(2026-10-02: form-engine 51, app 83 with lint baseline 508→488, api-contract 34, api 249 pass; turbo build left to CI -- the dev server holds the Prisma engine)*: `pnpm --filter @remonta/form-engine run quality`, `pnpm --filter @remonta/app run quality`,
  `pnpm --filter @remonta/api-contract run quality`; `npx turbo run build` if the Prisma engine is free, else CI.
- [x] **E2 static proof** *(2026-10-02: clean; it also caught `apps/api/test/locations/home.test.ts` importing the deleted parser -- rewritten)* (`rg`, outside `aidlc-docs/`): `features/forms/legacy`, `register-async`, `check-email`,
  `workerRegistrationProcessor`, `types/workerRegistration`, `location-parser`, `contractorFormSchema`, `apiRetry`,
  `registration-switch`, `REGISTRATION_BACKEND`, `switch:registration`, `mode === "legacy"`, `LegacyAdapter`,
  `legacyShape`, `ApiBackend` → zero hits.
- [x] **E3 summary** `aidlc-docs/construction/legacy-removal/code/legacy-removal-summary.md`; push; PR link.
- [ ] **E4 preview protocol** (user, `requirements.md` §5 step 4) and **E5 production check** (§5 step 5), then the
  manual Upstash key deletion and Vercel `REGISTRATION_BACKEND` removal.

## Extension checks

- **Security**: two endpoints removed (one of them an email-existence oracle); no new endpoint; the resolver logs
  variable *names*, never values. No finding.
- **Resiliency**: graceful degradation card for misconfiguration; rollback by Vercel promote; api untouched. No finding.
