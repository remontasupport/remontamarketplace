# Application Design Plan -- the worker profile on `apps/api`

**Inputs:** `../requirements/requirements.md` (approved 2026-10-09, amendment D17 ABN only),
`../user-stories/stories.md` (33 stories), `../requirements/worker-profile-inventory.md` and `worker-profile-routes.md`,
the archived reverse-engineering pass (the pipeline, `defineHandlers`, `meta()`, `createClient`, the form engine's
`defineForm`/`KINDS`, the registration module's `PhotoStore` port and ticket/confirm/process code, the stage table),
`../plans/execution-plan.md` (units U1-U4), and the open items the requirements left for design (OI-1, OI-2, OI-5;
OI-3 the bank account; OI-4 goes to NFR Requirements).

Seven decisions shape the components. Each is pre-filled with a proposal; leave it to accept or change the letter,
then say "approved" (or "done").

## Question 1
Entry granularity for the worker area (requirements OI-1).

A) **One read, one write entry per section.** `GET /v1/worker/profile` returns everything the dashboard needs
(FR-WRK-04). Writes are `PUT` per section with whole-section replace: `/v1/worker/profile/name`, `/bio`,
`/home-address`, `/service-area`, `/personal-info`, `/abn`; `/v1/worker/photos` (confirm, make-main, remove);
`/v1/worker/availability`, `/experience`, `/job-history`, `/education`, `/bank-account`,
`/additional-info/{group}` (the group an enumerated path parameter: good-to-know, languages, cultural-background,
religion, interests, about-me, preferences, personality); later units add `/services`, `/documents...`,
`/uploads/tickets`, `/uploads/confirmations`, `/jobs`, `/job-applications`. Each PUT has its own strict body
schema and audit action and returns the section. About 16 entries in U2. Recommended: a section is a form
definition is an entry is a handler, one row each; strict schemas stay small; audit rows name the section.

B) **Few coarse entries**: `PATCH /v1/worker/profile` taking any subset of the profile's fields, plus one entry per
child table. Fewer entries, but a patch body cannot be strict about which fields travel together, the audit
action is "profile changed", and the form definitions would all submit to one entry with a body mapping each.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 2
How a document's location holds both stores (requirements OI-2). Pre-cycle documents are Vercel Blob URLs in
`verification_requirements.documentUrl`; new uploads are private bucket objects that need a signed URL to read,
and the admin's existing review routes (in `apps/app`, which has no bucket credentials) must keep opening both.

A) **A new column and an admin entry for the link.** `verification_requirements.storageKey` (nullable) holds the
bucket object key for new uploads; `documentUrl` stays for the old rows and is null for new ones. Reads: the
worker entry returns a short-lived signed URL made by the api; for the admin, one new entry
`GET /v1/admin/documents/{id}/link` (ADMIN, audited) returns a signed URL, and the app's admin document views call
it when `documentUrl` is null. Nothing in `apps/app` ever holds bucket credentials. Recommended: two columns
mean two meanings, no prefix parsing, and the admin's read is attributed.

B) **Overload `documentUrl`** with a prefixed key for new rows (`gs:` + key) and a resolver on every reader.
No migration, but every reader of the column must learn the prefix, and the app would still need the api to
sign.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 3
The form engine's second mode and the field kinds the sections need (requirements OI-5). Today a definition is a
multi-step wizard submitted once to a POST entry with a CAPTCHA action.

A) **A `section` form mode in the engine** (`packages/form-engine`): `defineSection({ contract, readEntry,
writeEntry, pick, fields })` where `pick` names the part of the read response that seeds the fields; submit is
the PUT with the section body; no CAPTCHA (the entries are authenticated); the draft keyed by section and cleared
on success; the same retry/offline/field-error machinery. New kinds in `kinds.ts`, each with one presentational
component in `fields.tsx`: `select` (one of a list), `multiSelect` (many of a list), `date`, `monthYear`,
`number` (bounded), `textarea` (bounded, with a counter), `timeRanges` (per-day slots), `orderedList` (a list of
sub-fields with reorder), `maskedSecret` (shown masked, entered in full), `abn` (digits with the checksum), the
existing `locality` and `photo` reused. Recommended: the registration wizard keeps working unchanged; every
section is one definition file; validation stays the contract's.

B) **Sections as one-step wizards of the existing mode**, with the PUT entry declared as the `submitEntry` and a
seed hook outside the engine. Fewer engine changes, but CAPTCHA, the draft's lifetime and the seed would be
special-cased per page.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 4
Where the completion status is computed (FR-WRK-06). Today `setupProgress.service.ts` (1,300+ lines in the app)
recomputes flags from the rows and writes `setupProgress`/`profileCompleted`.

A) **A pure domain function in the api**, `modules/worker/domain/completion.ts`: rows in, flags and percentage out;
called by the profile read and after every write that can change a flag, which then persists the flags. Today's
app function is copied into the api's test folder as the oracle for a property test over generated profiles, and
deleted from the app in PR 4. Recommended: one place, testable, the same answer for the sidebar, the admin and
the client search.

B) **Compute in SQL** inside the profile read statement. One round trip fewer for reads, but the rules (which
documents count, per service) become a large CASE expression that is hard to test against the oracle.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 5
The upload code's home (FR-UPL-01). The registration module owns `PhotoStore` (the bucket port), `GcsPhotoStore`,
the ticket, confirm, process (sharp) and purge code, all photo-specific (`ImageType`, `PHOTO_MAX_BYTES`, staging
keys under one prefix).

A) **Lift it into `platform/storage/`** as a generic object store port (`ObjectStore`: ticket, inspect, readPrefix,
read, write, delete, signedReadUrl) with the GCS adapter, plus a generic `uploads` application service
(`createTicket(kind, owner)`, `confirmUpload(ticket, owner)`, `purgeUnclaimed`) parameterised by an **upload
kind table** (`profile-photo`, `document`: content types, max bytes, key prefix, post-confirm job). The
registration module becomes a caller with the `registration-photo` kind; the worker module uses `profile-photo`
and `document`. The sign-up's behaviour and tests are unchanged. Recommended: one upload path, three kinds.

B) **Copy the photo code into the worker module** and adapt it for documents. Faster for U2, but two ticket
implementations, two purges and two bucket adapters to keep in step.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 6
The app's data layer for the worker dashboard (FR-WRK-07, FR-HOME-01).

A) **One profile query and a typed client.** `lib/api/worker.ts` builds `createClient(workerContract)` with the
existing token source; `features/worker/` holds `useWorkerProfile()` (React Query key `['worker','profile']`,
the browser's private cache + ETag doing the caching; `cache: 'reload'` after any write) and the section
definitions; the nested `QueryClient`s and the two colliding `['worker-profile']` hooks go; the sidebar, the home
page and every section seed from the one query. Server components become client pages (`"use client"` wrappers,
as the registration page does). Recommended.

B) **A query per section** (availability, experience, ...) each with its own key and invalidation. More requests
per page, more keys to keep consistent; the one-read design of FR-WRK-04 would go unused.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 7
The sidebar declaration (FR-NAV-01).

A) **A typed array in `features/navigation/workerMenu.ts`**: `MenuItem = { id, label, icon, href } | { id, label,
icon, children: (profile) => SubItem[] }`, the badge rule as a function of the profile read; `Sidebar.tsx` maps
it and keeps only rendering; a test asserts the order from D11 and that every static href is an existing route
(by the app's route manifest or a list of known pages). Recommended.

B) **JSON configuration** read at build time. Harder to type the dynamic groups (children need the profile).

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Execution checklist

- [ ] 1. Confirm the seven answers above; resolve any ambiguity in a clarification file
- [ ] 2. Write `aidlc-docs/inception/application-design/components.md`: the contract area (entries by unit), the
  api's worker module (handlers, application services, domain, persistence), `platform/storage` and the uploads
  service (Q5), the completion domain (Q4), the outbox CRM handler, the health exemption; the form engine's section
  mode and kinds (Q3); the app's client, profile query, section definitions, sidebar declaration (Q6, Q7), the
  admin document link (Q2); the migration (home address + `storageKey`)
- [ ] 3. Write `component-methods.md`: signatures and input/output types per component (business rules deferred
  to Functional Design)
- [ ] 4. Write `services.md`: the orchestration per use case (profile read, a section write, the service-area
  write via `placeHome`, photo and document upload, a job application and its CRM event, the admin link)
- [ ] 5. Write `component-dependency.md`: the dependency matrix, communication patterns, the data flows (a section
  save; an upload; an application), the unit and PR mapping
- [ ] 6. Write `application-design.md` consolidating the four
- [ ] 7. Validate: every FR maps to a component; every story's actor finds its component; P-6/P-7 boundaries
  respected (the engine stays DOM-free; the contract Zod-only); no component spans two units' PRs without a stated
  seam
- [ ] 8. Present for approval
