# Functional Design Plan -- unit `edit-profile` (U2)

**Unit** (execution plan): the home-address migration; the section entries (name, photo, bio, home address,
service area, personal info, ABN; preferred hours, experience, work history, education, the additional-details
groups, the bank account); the form definitions and the field kinds they need; the sidebar declaration; the admin
page's two reads; the clean-up of the profile actions and `update-step`. Stories US-WP-01..16, 25, 27 (write half),
33. Requirements FR-PI-01..08 (D8, D17), FR-EP-01..06, FR-NAV-01..03, FR-WRK-05/07/08, NFR-02..07, NFR-09, NFR-12..14.
PRs: **2** (db + api, promoted), **3** (form-engine + app), **4** (clean-up). NFR stages inherit U1's; no
infrastructure stage (one expand-only migration).

**What U1 already fixed** (`../worker-area/functional-design/`): ownership (R1), the profile read's shape (E1:
`homeAddress` and `sections.bankAccount` already declared), completion and `persistCompletion` (R3), the
requirement groups (R4), the contract helpers `workerRead`/`workerWrite` (R8). U2 adds the writes.

**Read for this plan** (2026-10-12): the application design (C7-C10, C14-C16, C19-C21, S2-S4, S7), today's
schemas (`packages/schemas/src/schema/workerProfileSchema.ts`), today's services (`availability`, `experience`,
`additionalInfo`, `profile`, `compliance`), the section components under `components/profile-building/sections/`,
the registration photo path (`modules/registration/application/photo-*.ts`), the form engine's kinds.

## Questions

Each question is pre-filled with the recommended answer. Say "approved" to keep them all, or change a letter.

### Q1 -- Today's field rules differ from the requirements. Which wins?

| Field | Today (app schema) | Requirement | Recommended |
|---|---|---|---|
| name parts | 1-50 chars, letters/space/hyphen/apostrophe | 1-100 (FR-PI-01) | **1-100** (a stored 51+ name exists? the migration risk is nil: longer is accepted) |
| bio | **200**-2,000 chars (trimmed) | 1-2,000 (FR-PI-03) | **1-2,000** trimmed; the badge's "bio" section still counts at 50+ (U1 R3.10); the page shows a counter and a hint that a fuller bio reads better |
| date of birth | 18-120 years | 16-100 (FR-PI-06) | **16-100** |
| gender | `Male` \| `Female` | "an enumerated list" | **today's two values** (the admin filter is built on them; follow-up 13 is the normalisation) |
| has vehicle | `Yes` \| `No`, optional | yes/no | **required** on save (the completion rule reads it) |

A. The requirements' bounds as in the "Recommended" column.
B. Today's bounds everywhere (the move changes no rule).

[Answer]: A

### Q2 -- Languages: FR-PI-06 lists them under "other personal info", but today they are an additional-details group on `worker_additional_info.languages`, and `worker_profiles.languages` is only written by the sign-up.

A. **One place**: the Languages group (additional details) stays the editor of `worker_additional_info.languages`;
   "Other personal info" holds date of birth, gender, vehicle only. The read keeps returning both columns (the
   admin search prefers the additional-info list, as today). A deviation from FR-PI-06's wording, stated.
B. Personal info also edits `worker_profiles.languages` (two lists to keep in step).

[Answer]: A

### Q3 -- The option lists (languages 31 + Auslan, cultural backgrounds 21, religions 15, interests, preferences 5,
unique services, personality 2) live inline in each section component today.

A. **Lift them into `packages/schemas/src/data/profileOptions.ts`** (one named list each, values exactly as stored
   today); the contract's bodies use them as enumerations (NFR-04: "enumerations for every list value"); the
   definitions read the same lists for their options; a stored value not in the list is returned as-is by the
   read but refused on write (the page shows "no longer offered; pick again").
B. Free strings bounded in length (no enumeration).

[Answer]: A

### Q4 -- The additional-details entries: one entry per group (`PUT /v1/worker/additional-info/{group}`) with today's
eight groups as the `group` values, each group a strict body of its own fields?

| group | fields (today's section) |
|---|---|
| `good-to-know` | `lgbtqiaSupport` |
| `languages` | `languages[]` |
| `cultural-background` | `culturalBackground[]` |
| `religion` | `religion[]` |
| `interests` | `interests[]` |
| `about-me` | `uniqueService[]` (≥ 1), `funFact` (50-1,000, trimmed) |
| `preferences` | `workPreferences[]` |
| `personality` | `personality` (2 values), `nonSmoker`, `petFriendly` |

A. **Yes**: eight groups, a discriminated body by `group`; saving one leaves the others untouched (US-WP-15's
   property); the bank account is its own entry (`PUT /v1/worker/bank-account`), never a group.
B. Fewer, merged groups (e.g. one "about you" entry).

[Answer]: A

### Q5 -- Preferred hours (`worker_availability`): today the UI adds any number of slots with any minute, checks
start < end only; the table's unique key collapses exact duplicates.

A. **Rules**: a slot is `{day, startMinute, endMinute}` with integer minutes 0-1440, `start < end`; **no two slots
   of a day overlap or touch-and-overlap** (end ≤ next start allowed); **at most 4 slots a day**; the whole week is
   one body (0-28 slots), replaced in one transaction, `sortOrder` by day then start. The page keeps today's time
   pickers (5-minute steps from the engine's `timeRanges` kind).
B. Today's rules only (start < end), no cap, no overlap check.

[Answer]: A

### Q6 -- Work history and education: today the lists require at least one entry, months are stored as names
(`"January"`), years as integers, and an end date is required unless "currently".

A. **The contract takes `startMonth`/`endMonth` as the 12 month names (today's stored values) and `startYear`/
   `endYear` as integers 1950..current year**; `currentlyWorking`/`currentlyStudying` true ⇒ end fields must be
   absent; false ⇒ both end fields present and the end not before the start; **0-20 entries** (an empty list clears
   the section: today's "at least one" was a UI rule, not a data one); `sortOrder` from position; titles, companies,
   institutions, qualifications 1-100 characters, trimmed.
B. Numeric months (1-12) in the contract, mapped to names on write and back on read.

[Answer]: A

### Q7 -- Photos: today `photos` holds one URL and `additionalPhotos` a JSON array of up to 2 URLs (Vercel Blob);
"make main" and "remove" work on URLs; there is no photo id or photo table.

A. **Keep the two columns and work by URL**: `confirmPhoto {uploadId, slot: 'main' | 'additional'}` (the ticket
   and confirm of the sign-up path reused with owner key = profile id; the outbox clean copy and thumbnail as
   today; an additional photo refused when two exist); `makeMainPhoto {url}` (POST `/v1/worker/photos/main`: swaps
   with the current main; the URL must be one of the worker's); `removePhoto {url}` (POST
   `/v1/worker/photos/remove`: removes an additional photo, or the main when no additional exists -- the main is
   never left empty while additional photos exist, the first additional becomes main). The old Blob objects are
   deleted best-effort after the row commits. The two POST-with-body shapes replace the design's `{id}` path
   params (a URL cannot be a path segment).
B. A new `worker_photos` table with ids (a second migration; every reader of `photos`/`additionalPhotos` changes).

[Answer]: A

### Q8 -- The ABN (D17): today the step stores `{type, signed}` only (no number, no checksum), and the contract page
sets `signed: true` after the agreement; the step lives under Mandatory (`abn-contractor`).

A. **`putAbn {abn}`**: 11 digits, spaces allowed on input and stripped, the **ATO checksum** (subtract 1 from the
   first digit, weights 10,1,3,5,7,9,11,13,15,17,19, sum mod 89 = 0) checked in the contract schema (so the form
   refuses it before sending) and again in the api; stored as `{workerEngagementType: {type: 'abn', value,
   signed}}` where `signed` is **kept as stored** (false when absent) -- the agreement's signing stays the contract
   page's job (its action moves with the documents in U3); a TFN record is overwritten by the first save (D17);
   the response is `{type: 'abn', value, signed}`; the completion rule "a valid ABN" (U1 R3.4) now sees the value.
   The step keeps its place in the Mandatory list (`abn-contractor` links to the new ABN section page, PR 3).
B. Also move the agreement signing into this unit.

[Answer]: A

### Q9 -- The bank account (FR-EP-05, OI-3): today's JSON holds `accountName`, `bankName`, `bsb`, `accountNumber`.

A. **Keep `bankName`** (the field exists and the admin page shows it): the body is all four, each required; BSB
   6 digits (a dash allowed on input, stripped), account number 6-10 digits; the response and every read are the
   masked shape (`bsbLast3`, `accountNumberLast3`, the two names); **the column stays plain JSON** this unit, OI-3
   (application-level encryption) carried as a follow-up with the key-management question; the form's fields are
   `neverSaved` (no draft); a partial body is refused by the schema.
B. Drop `bankName`; or encrypt now.

[Answer]: A

### Q10 -- Where the unplaced reminder lives (US-WP-10): the dashboard home page moves in U4.

A. **In U2**: the Address section shows the reminder ("Your suburb isn't set, so clients can't find you") and the
   sidebar's Edit Profile badge carries it; the home-page banner comes with U4's dashboard page.
B. Touch the home page in U2 as well.

[Answer]: A

## Plan

- [ ] 1. Business rules (`business-rules.md`): R1 the section write (replace, one transaction, idempotent,
  completion persisted where a flag can change: name, bio, personal info, ABN, service area, photo); R2 per
  section the field rules of Q1-Q9 and the error mapping to `fields`; R3 the two addresses (home: the columns, the
  locality check, never the legacy columns; service area: `placeHome` with `ONBOARDING`, the HOME row upserted,
  the legacy columns, the reconciler never moves it); R4 photos (Q7); R5 the ABN (Q8); R6 the bank account (Q9);
  R7 the option lists (Q3); R8 the sidebar order and badge (D11); R9 the engine's section mode (seed, pick, draft,
  retries, field errors).
- [ ] 2. Business logic model (`business-logic-model.md`): L1 `replaceSection`; L2 each `put*` step by step; L3
  `putHomeAddress` / `putServiceArea`; L4 the photo flows (ticket → confirm → attach; make main; remove); L5 the
  ABN checksum; L6 `seedSection`/`sectionBody`; L7 the client's save flow (`useSection` → write → `reload()`); the
  properties for PBT-01 (round-trip per section, idempotency, no overlap, the masked invariant, the home-address
  invariant on client paths, the group-isolation invariant, the sidebar order).
- [ ] 3. Domain entities (`domain-entities.md`): the 15 bodies with every field, type, bound and source column; the
  migration (two columns, the FK, the index); the `group` enum; the photo slots; the option lists' names.
- [ ] 4. Frontend components (`frontend-components.md`): the section definitions (one per entry, fields and kinds),
  the new kinds (`select`, `multiSelect`, `date`, `monthYear`, `number`, `textarea`, `timeRanges`, `orderedList`,
  `maskedSecret`, `abn`, `photoSlots`), `SectionPage`, `useWorkerProfile`/`useSection`, `WORKER_MENU` with D11's
  order and `children(profile)`, the admin page's home-address block and masked bank account, the pages that
  switch in PR 3 and what PR 4 deletes.
- [ ] 5. Completion message and approval.
