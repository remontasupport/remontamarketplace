# Code Generation Plan -- unit `edit-profile` (U2): PRs 2, 3, 4

**Single source of truth for this unit.** Design: `../edit-profile/functional-design/` (R1-R9, L1-L7, E1-E6,
the properties P1-P11, the front-end document). NFR requirements and design inherited from U1
(`../worker-area/nfr-*/`); no infrastructure stage (one expand-only migration). Stories US-WP-01..16, 25, 27 (write
half), 33. Three PRs, in order, each on its own branch from `main`; the AI-DLC documents stay on
`aidlc/worker-profile-api`.

**Before PR 2's branch is cut:** merge `chore/u1-cleanup` (the U1 clean-up PR; it touches `docs/worker/README.md`,
which PR 2 extends).

## Guiding rules

- Modify in place; existing tests keep passing; every file under 300 lines or the reason stated in the summary
  (NFR-14): the contract's section schemas get their own file, the api's sections one file each.
- No raw SQL; the statement timeout through U1's `readTransaction` pattern (tagged template); `unitOfWork` for
  writes (U1's `maxWait`).
- Every rule cited (U2-R#), every property (P#) has a test; the option lists are copied exactly and proven equal
  to the app's arrays until PR 4 deletes those.
- Secrets never in code or tests; the bank account never in a log line, a draft or an audit row.
- U1's seams reused: `workerHandlers({db, clock, read})`, `testApp({logs})`, `workerHarness`, the generators.

---

## PR 2 -- the migration and the entries (`feat/edit-profile-api`)

### Part 0 -- branch
- [ ] **0.1** `git checkout main && git pull && git checkout -b feat/edit-profile-api` (after `chore/u1-cleanup` merged).

### Part A -- `packages/db` (E1)
- [ ] **A1** `prisma/schema.prisma`: `WorkerProfile.homeStreetLine String?`, `homeLocalityId Int?`, the relation
  `homeLocality AuLocality? @relation("WorkerHomeLocality", fields: [homeLocalityId], references: [id],
  onDelete: Restrict)`, `@@index([homeLocalityId])`; `AuLocality.workerHomes WorkerProfile[]
  @relation("WorkerHomeLocality")`.
- [ ] **A2** `prisma/migrations/20261012_worker_home_address/migration.sql` written by hand in the repository's
  style (`ALTER TABLE ... ADD COLUMN`, the FK with `ON DELETE RESTRICT`, the index); a note in the migration's
  header: expand-only, no down migration (NFR-09/10).
- [ ] **A3** `pnpm --filter @remonta/db run quality` (the migration applies in CI's PostGIS; locally skipped).

### Part B -- `packages/schemas`
- [ ] **B1** `src/data/profileOptions.ts`: `LANGUAGES`, `CULTURAL_BACKGROUNDS`, `RELIGIONS`, `INTERESTS`,
  `WORK_PREFERENCES`, `UNIQUE_SERVICES`, `PERSONALITIES`, `GENDERS`, `MONTHS`, `DAYS`, `ADDITIONAL_INFO_GROUPS`
  as `as const` arrays copied from the app's components (E4); a test that each is non-empty and duplicate-free.
- [ ] **B2** `src/rules/abn.ts`: `normaliseAbn(input)` (strip spaces), `abnChecksum(digits)` (L6), `isValidAbn`;
  `test/abn.test.ts` with known-valid ABNs (the ATO's example 51 824 753 556), every single-digit change refused,
  a `fast-check` property that a generated valid ABN passes and a mutated one fails (P8).
- [ ] **B3** `apps/app/src/features/worker/profileOptions.test.ts` (added now, deleted with the components in
  PR 4): each shared list equals the array in the component it came from.
- [ ] **B4** `pnpm --filter @remonta/schemas run quality`.

### Part C -- `packages/api-contract` (E2, E3)
- [ ] **C1** `src/worker.sections.ts` (new): the bodies of E3 (`nameSchema`, `bioSchema`, `personalInfoSchema`,
  `abnBodySchema`/`abnViewSchema`, `homeAddressInputSchema`/`homeAddressSchema`, `serviceAreaInputSchema`,
  `photosSchema`, `confirmPhotoSchema`, `photoUrlSchema`, `availabilityBodySchema` (with the overlap/cap refine
  of R2.7), `experienceBodySchema` (areas ⊆ the domain's list, R2.8), `jobHistoryBodySchema`,
  `educationBodySchema` (R2.9/R2.10 refines), `additionalInfoBodySchema` (the union on `group`, R7.2),
  `bankAccountBodySchema`); every string trimmed and bounded; the option lists from `@remonta/schemas`.
- [ ] **C2** `src/worker.contract.ts`: the 16 entries of E2 added with `workerWrite(audit, { maxBodyKb, limit? })`
  (`workerWrite` gains an optional per-user `limit` for the ticket entry); `getProfile` unchanged; the header
  comment lists U2's entries.
- [ ] **C3** `openapi.json` regenerated; `test/worker.test.ts` extended: every non-GET entry has an audit action
  (R8.1), body limits as E2, the ticket's 10/min rule; `test/worker.sections.test.ts`: one accept/refuse case per
  rule of R2-R7 (overlap, cap, dates, areas, checksum, group mismatch, masked shape, list membership); a
  `fast-check` property per body that a generated valid body parses and an extra key is rejected.
- [ ] **C4** `pnpm --filter @remonta/api-contract run quality`.

### Part D -- `apps/api`
- [ ] **D1** `platform/persistence/db.ts`: `writeTransaction(db, work)` = `unitOfWork` + the statement timeout
  (`set_config`) as the first statement (R1.2) -- or `unitOfWork` gains the timeout; one helper, used by every
  section write.
- [ ] **D2** `modules/worker/application/replace-section.ts`: L1 (`replaceSection(deps, principal, action,
  work, { completion })`: ownership lookup in the transaction, the work, the completion reload and persist,
  commit, the audit record, the log line).
- [ ] **D3** `application/sections/profile.ts`: `putName`, `putBio`, `putPersonalInfo` (age check with the
  api's clock), `putAbn` (L2, R5); `sections/availability.ts` (L3, R2.7 re-checked); `sections/experience.ts`
  (R2.8); `sections/history.ts` (`putJobHistory`, `putEducation`, R2.9/R2.10); `sections/additional-info.ts`
  (R7.2/R7.3, the upsert per group); `sections/bank-account.ts` (R6, `toStored`, the masked response through U1's
  `maskBankAccount`).
- [ ] **D4** `application/addresses.ts`: `putHomeAddress` (L4; the locality check; R3.2), `putServiceArea` (L4;
  `placeHome` reused; the HOME row found-or-created inside the transaction; the legacy columns; completion).
- [ ] **D5** `application/photos.ts`: `createPhotoTicket` reusing `modules/registration/application/photo-ticket`
  (which gains an optional `ownerProfileId` written to `registration_photo_uploads.workerProfileId`),
  `confirmPhoto` (ownership of the ticket, the registration's `confirmPhotoUpload`, the slot rule, `attachPhoto`,
  the `PhotoUploaded` event with `slot`), `makeMainPhoto`, `removePhoto` (L5; the Blob deletes after commit
  through the existing `VercelBlobPhotoStore`). `photo-process.ts`: the handler repoints the column holding the
  staged URL (`photos` or an `additionalPhotos` element) instead of always `photos`; its tests extended.
- [ ] **D6** `worker.handlers.ts`: the 16 handlers, each `replaceSection` or the photo function; `WorkerModuleDeps`
  gains `blob`, `bucket`, `publicBaseUrl`, `ipHashSecret` (the photo path's needs) -- wired in `main.ts` from
  the registration module's instances.
- [ ] **D7** `platform/logging.ts`: `abn` in the redaction list (E6).
- [ ] **D8** Tests, unit: `test/worker/sections.test.ts` (the pure rules: overlap sort, date comparison, the
  ABN, `toStored`/mask round-trip, the group column selection), `test/worker/photos.test.ts` (the slot and swap
  rules on in-memory columns).
- [ ] **D9** Tests, database-gated (`test/worker/sections.int.test.ts`, the `workerHarness`): for every entry a
  round-trip (P1) and an idempotency (P2) property over the generators of `test/worker/generators.ts` (extended
  with body arbitraries per section); P3 (overlap refused, cap); P4 (no response and no captured log line holds
  the BSB or number); P5 (the home-address write leaves the six legacy columns and `worker_locations`
  untouched); P6 (the service-area write: the HOME row, the legacy columns, `source ONBOARDING`, the reconciler
  leaves it -- `onboardingReconcilerJob` run once); P7 (group isolation); P9 (ownership: another profile's
  ticket is 404; no-profile principal 404 on every entry); the completion flags change after the writes that
  should change them (name, service area, personal info, ABN) and not after the bank account; the read's ETag
  changes after a write.
- [ ] **D10** `test/route-security.test.ts` enumerates the new entries automatically (it iterates `contracts`);
  the HTTPS test's `url()` gains a path-param case for `/:group`; `test/worker/profile.http.test.ts`: a write
  with a bad body is 400 with `fields`, a write on the fake read's missing profile is 404.
- [ ] **D11** `scripts/worker-check.ts` gains `--writes`: for each section, PUT the current value back (idempotent)
  and assert 200 with an equal body, plus one home-address write and revert on a staging worker; the production
  run stays read-only (`--writes` refused with `--stage=prod` unless `--allow-production-writes`).
- [ ] **D12** `pnpm --filter @remonta/api run quality` (the int suites in CI).

### Part E -- documentation
- [ ] **E1** `docs/worker/README.md`: §2 gains every U2 entry (parameters, bodies, rules, errors), §4 the
  completion note on which writes persist it, a §9 "Section writes" with the replace/idempotency/audit rules and
  the photo flow; `docs/admin/README.md` notes the home-address and masked-bank reads on the admin page (PR 3).
- [ ] **E2** `aidlc-docs/construction/edit-profile/code/PR2-summary.md`: files, rules and properties covered,
  deviations, the gates.

### Part F -- gates, PR, staging, promotion
- [ ] **F1** Local gates: db, schemas, api-contract, api, app (typecheck against the new contract), form-engine,
  `turbo run build`; the regenerated app/web Prisma clients reverted.
- [ ] **F2** PR 2 opened by the user; CI (the migration runs in API Quality's PostGIS); merge → staging.
- [ ] **F3** Staging checklist (Build and Test): `check:worker --writes` on a staging worker; the admin search
  within 10 km of the new suburb finds the worker (US-WP-09) and the unplaced count moves (US-WP-10); a photo
  through ticket/confirm appears, the clean copy within a minute; the load test re-run with the write share
  (`load-worker.ts` gains the 30 % section PUT mix now that the entries exist: `putBio` with the current bio) --
  record; **promote** (full sha); production checks read-only; the production migration applied by the deploy
  (the api's `prisma migrate deploy` step -- confirm it exists in `deploy-api.yml`, else the migration is applied
  by `pnpm --filter @remonta/db run migrate:deploy` against production from this machine, recorded).

---

## PR 3 -- the engine and the pages (`feat/edit-profile-app`)

### Part G -- `packages/form-engine` (R9, front-end §1)
- [ ] **G1** `src/section.ts`: `defineSection`, `seedSection`, `sectionBody` with the import-time checks.
- [ ] **G2** `src/kinds.ts` + `src/types.ts`: the ten kinds of front-end §1 with `defaults`, `schemas` (from
  the contract shape), `toBody`, `fromRead`, `sanitise` where typed (`abn`); `photoSlots` reusing
  `photo-upload.ts`.
- [ ] **G3** `src/submit.ts`: `submitSection` (PUT/POST with path params, no CAPTCHA, the shared retry/offline/
  field-error logic); `src/draft.ts`: the `section:<name>` key and `neverSaved`.
- [ ] **G4** `test/section.test.ts`: the import-time checks reject; seed/body inverses (property); `test/
  kinds.test.ts` per kind; the agreement test over every definition in `apps/app` (P11; the registration's
  existing test pattern).
- [ ] **G5** `pnpm --filter @remonta/form-engine run quality` (P-7 boundary intact: no React, no Node built-ins).

### Part H -- `apps/app` (front-end §2)
- [ ] **H1** `src/features/worker/api.ts` (`createWorkerApi`, the outcome mapping from `lib/api/admin.ts` lifted
  into `lib/api/client.ts` and shared), `profile.ts` (`useWorkerProfile`, `WorkerProfileProvider`), `useSection.ts`.
- [ ] **H2** `src/features/worker/definitions/*.ts`: the 18 definitions of front-end §2; `SectionPage.tsx`.
- [ ] **H3** `src/components/ui/form-wizard/fields.tsx`: one presentational component per new kind; `FieldSlot`
  cases in `FormWizard.tsx`.
- [ ] **H4** Pages: `app/dashboard/worker/profile/page.tsx` (the index) and `profile/[section]/page.tsx`
  (server page passing the slug; a client wrapper imports the definition -- the Server/Client trap); the
  dashboard layout gains the provider; `next.config` redirects from `/account/setup?step=` and
  `/profile-building?section=` to the new slugs.
- [ ] **H5** `src/features/navigation/workerMenu.ts` + `Sidebar.tsx` rendering it; `workerMenu.test.ts` (P10).
- [ ] **H6** The admin page: the route `/api/admin/contractors/[id]` selects the home address with its locality
  and masks the bank account (`lib/bankAccount.ts` = the api's mask, with an equality test on fixtures); the
  page's "Home address (private)" block and the masked bank fields.
- [ ] **H7** The negative tests for P5: a test that greps the client-facing routes and pages (`/api/contractors*`,
  `/api/share/*`, the client search components) for `homeStreetLine`/`homeLocalityId` and finds none; the
  share-page fixture renders without a street line.
- [ ] **H8** `pnpm --filter @remonta/app run quality` (baselines not grown; the Semgrep raw-fetch rule clean);
  `turbo run build`.
- [ ] **H9** Preview checklist (against staging): every section opens with its values, edits, saves, shows
  "Saved" and the sidebar updates; a draft survives a reload; a 503 path shows "Still saving" (the api's shedder
  forced? no: the engine's unit test covers it; on the preview, offline mode in devtools pauses and resumes); the
  photo flow; the address page's two forms and the unplaced reminder; the admin page block; the old URLs
  redirect. Merge → the app deploys. Production verification by an internal worker (the same list on the live
  app, read-only where possible); CLAUDE.md's Vercel rollback rows re-recorded.

---

## PR 4 -- the clean-up (`chore/edit-profile-cleanup`)

- [ ] **J1** Delete what front-end §3 lists; `profileOptions.test.ts` (B3) goes with the components.
- [ ] **J2** Grep: no import of a deleted module; no `['worker-profile']` key left in the moved pages' scope;
  `s-maxage` unchanged (U3's); the Upstash keys `worker_profile`, `worker_profile_base` and their invalidations
  gone; `update-step` gone.
- [ ] **J3** Gates: app typecheck/lint baselines **shrink** (recorded), tests; `turbo run build`.
- [ ] **J4** `aidlc-docs/construction/edit-profile/code/U2-summary.md`; state follow-ups updated (17: the worker
  can self-place; 13: the normalisation still open; OI-3 encryption as a follow-up).

## Story traceability

| Story | Steps |
|---|---|
| US-WP-01, 03, 04, 05 | C1, D3, H2 |
| US-WP-02 | C1, D5, G2 (`photoSlots`), H2, H3 |
| US-WP-06, 07 | G1-G3, H1, H9 |
| US-WP-08, 11 | A1-A2, C1, D4, H2, H6, H7 |
| US-WP-09, 10 | C1, D4, D9 (P6), F3, H2, H5 (the dot) |
| US-WP-12, 13, 14, 15, 16 | C1, D3, D8, D9, H2 |
| US-WP-25 | H5 |
| US-WP-27 (write half) | D1, D2, D9 (P1, P2) |
| US-WP-33 | F3, H9, J1-J4 |

**Scope**: PR 2 about 20 new files (schemas, 6 section files, addresses, photos, tests, the migration) and 10
modified; PR 3 about 30 new (definitions, kinds, pages, menu) and 8 modified; PR 4 deletions only (about 30
files, ~9,000 lines).
