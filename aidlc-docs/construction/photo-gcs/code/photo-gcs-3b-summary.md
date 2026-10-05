# Code summary -- unit `photo-gcs`, PR 3b (the wizard switch)

**Branch** `feat/photo-gcs-wizard` from `main` `fbc6705` (3a merged and promoted), three commits
`7bf30e5` (engine), `3dd7ee8` (app), `0d5e478` (docs), pushed 2026-10-05.
**PR**: https://github.com/remontasupport/remontamarketplace/compare/main...feat%2Fphoto-gcs-wizard?expand=1
(20 files, +663 / -56). Plan: `../../plans/photo-gcs-code-generation-plan.md`, parts G-I.

## What changed

| Area | Files | Change |
|---|---|---|
| `packages/form-engine` types, definition | `src/types.ts`, `src/form.ts` | The photo kind names `ticketEntry` and `confirmEntry` (both checked at `defineForm`); the transport port `Uploader` with `UploadTarget`, `UploadProgress`, `UploadError` (`status`, `policyRefused`) |
| `packages/form-engine` upload | `src/photo-upload.ts` (new), `src/submit.ts`, `src/index.ts`, `package.json` | `stagePhoto`: ticket → `Uploader` → confirm, per R6 (2 retries on the same ticket for a dropped transfer or a 409; one fresh ticket after a policy refusal or expiry; then `UPLOAD_FAILED_MESSAGE`; 413/415 final with the api's field message; abort stops everything); `declaredTypeOf` from the header; `isHeicHeader`; `uploadToApi` deleted; `messageFor` 413/415 texts; `@remonta/schemas` moved to runtime dependencies (the sniffer) |
| `packages/form-engine` tests | `test/engine.test.ts`, `test/verification.test.ts` | Fixtures on the new kind; a `stagePhoto` suite on a modelled api and a scripted uploader: happy path with progress, same-ticket retries, fresh ticket on 403 and on expiry, the budget, 413 final, abort makes no further request, a `fast-check` property over any failure sequence (at most 3 transfers per ticket, 2 tickets, success iff the model succeeds), header detection |
| `apps/app` adapters | `features/forms/adapters/xhrUploader.ts` (new), `xhrUploader.test.ts` (new), `readHeader.ts` (new) | XMLHttpRequest transport: signed fields first, the file last under `fileField`, progress events, abort via the signal, 403 → `policyRefused`; tested with a fake XMLHttpRequest. `readHeader` reads the first 16 bytes |
| `apps/app` glue | `features/forms/useFormWizard.ts`, `FormWizard.tsx`, `definitions/workerRegistration.ts` | `uploaderFor`: shrink → header → HEIC stop (`console.warn("[photo] heic-rejected")`, the message, nothing sent) → `stagePhoto` with `xhrUploader`, a per-field `AbortController` (new pick, unmount); `PhotoSlot` holds the progress; the definition points at `createPhotoUploadTicket` / `confirmPhotoUpload` |
| `apps/app` UI | `components/ui/form-wizard/fields.tsx`, `components/forms/fields/PhotoUpload.tsx` | `PhotoField` passes the sign-up's accept list (JPEG, PNG, WebP; no HEIC), its type message and the progress; `PhotoUpload` gains the optional props with today's defaults (dashboard screens untouched), skips the type check on an empty `file.type` (a `.heic` on Windows), renders a `role="progressbar"` bar (`data-testid="photo-upload-progress"`, indeterminate while the ticket or the confirm is in flight, "N% uploaded" during the transfer) |
| docs | `docs/signup/01-flow.md`, `02-api-reference.md`, `03-data-model.md` | Step 4 is the three calls; what the client does with a ticket (retry budget, HEIC on the device, progress, abort); 4.6c marked idle until 3c |

Not done, deliberately:

- **H8** (`next.config.ts` host for `storage.googleapis.com`): not needed since option 2 -- the bucket is private
  and upload-only, the clean copies are served from Vercel Blob as before, and the wizard's preview is the on-device
  data URL. Nothing is ever rendered from the bucket.
- **H9's hook and component tests** (the HEIC stop inside `useFormWizard`, `PhotoUpload` prop defaults): the app's
  vitest runs in Node without a DOM by a recorded decision (`apps/app/vitest.config.mts`: "Node, not jsdom"), so a
  hook or a component cannot be rendered there. The HEIC decision is covered at the engine (`isHeicHeader`,
  `declaredTypeOf`) and the transport is covered with a fake XMLHttpRequest; the hook's wiring and the component's
  bar are proven on the preview (checklist below). `forms.test.ts` already asserts the definition's photo field.

## Gates (2026-10-05, this machine)

| Gate | Result |
|---|---|
| `@remonta/form-engine` quality | lint, strict tsc, **58 passed** (the new suite included; one fixture fix on the way: the fake's error code must be one of the contract's, or the client drops the body) |
| `@remonta/app` quality | 144 type baseline unchanged; eslint **488 findings, all known** (10 signatures improved, baseline not tightened in this PR); **86 passed, 12 skipped** (database suites) |
| `npx turbo run build` | app and web compiled |
| `pnpm install --frozen-lockfile --offline` | accepts the lockfile (only the engine's `@remonta/schemas` block moved from dev to runtime) |
| generated Prisma clients | reverted after each postinstall; none staged |

## Before merging (deployment architecture, PR 3b)

The preview checklist of requirements §6.2, on the PR's Vercel preview (which calls the **staging** api, where 3a
runs). Record each line in `preview-checklist-3b.md`.

1. Sign in with a staging-only user and open a dashboard; an **old Blob photo still displays**.
2. The sign-up page on the preview: a photo picked **from a phone on mobile data**, the progress bar visible
   ("Preparing...", then "N% uploaded", then "Preparing..." again for the confirm), the preview circle filled.
3. **HEIC**: on an iPhone, pick a HEIC photo (expect the browser to hand over a JPEG and the upload to succeed);
   on Android or a desktop, pick a `.heic` file (expect the message "This photo is in HEIC format..." and no
   network call: the Network tab shows no `photo-tickets` request).
4. A **full sign-up** with `clent.b@remontaservices.com.au` (code arrives, account created, outbox `DONE` for
   `PhotoUploaded`); within seconds the profile's `photos` is a Blob URL under `workers/<profileId>/`, the
   `-256.jpg` thumbnail exists beside it, the staging object `staging/<id>` is gone from `remonta-api-photos-staging`,
   and the downloaded copy carries no EXIF or GPS (an EXIF reader).
5. The **duplicate-email notice** on a second attempt with the same address.
6. The **production domain unchanged** meanwhile (the live sign-up still uploads through the multipart entry).

Then merge with "Merge pull request" (Vercel deploys the app; production's api already serves the entries), and on
production: one internal sign-up from a phone; the processed copy appears; the Cloud Run request log shows ticket and
confirm under 300 ms; no photo route above 1.5 s.

## Rollback

Vercel promote of the previous `remonta-app` deployment (seconds). The api keeps the multipart entry until 3c, so
the previous wizard works again at once.
