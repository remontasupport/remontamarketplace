# Business Rules -- unit `edit-profile` (U2)

Numbered so code and tests can cite them. Decisions: the plan's Q1-Q10, all A (approved 2026-10-12). U1's rules
stay in force (`../../worker-area/functional-design/business-rules.md`: R1 ownership, R2 the read, R3
completion, R4 groups, R8 contract hygiene); the numbers here start at R1 again under the unit's own prefix, cited
as **U2-R#** where both units are in play. "Envelope" = the contract's error body; "fields" = its `fields` map,
keyed by the body field's path.

## R1 The section write (C7, S2; FR-WRK-05, FR-WRK-08)

| # | Rule |
|---|---|
| R1.1 | Every write is a **whole-section replacement**: the body carries the section's full new value; nothing is merged with what is stored. A column section updates its columns; a list section deletes the rows and inserts the body's, `sortOrder` from array position. |
| R1.2 | One transaction per write (`unitOfWork`, ReadCommitted, a 5 s statement timeout set as in U1's `readTransaction`); the response is the section as stored, re-read inside the same transaction, never the body echoed. |
| R1.3 | **Idempotent**: the same body twice leaves the same rows (list rows get new ids; their content and order are equal) and the same response. |
| R1.4 | Writes that can change a completion flag or the percent run `persistCompletion` in the same transaction after the write: name, bio, personal info, ABN, photos, service area, hours, experience, work history, education, the `languages`, `about-me` and `personality` groups, the bank account is **not** one (no flag reads it). The read's rows are reloaded for the computation (U1's `readProfileRows` inside the transaction: one more statement set). |
| R1.5 | Every write entry carries an audit action (`WORKER_<SECTION>_CHANGED`); the audit row records the profile id and the section, never a field value; the pipeline carries `impersonatorId`. |
| R1.6 | Schema failures are 400 with `fields`; domain failures (overlap, an unknown locality, an area outside its domain, the checksum) are 400 with `fields` naming the offending path (`slots.3.startMinute`, `localityId`, `domains.1.specificAreas.0`, `abn`). An ownership failure is 404 (U1 R1.3). |
| R1.7 | Writes are `no-store`; after a successful save the client reloads the profile read with `cache: 'reload'` (NFR-12). |
| R1.8 | Limits (U1 R8.1 `workerWrite`): 60 per minute per user, 120 per IP; `maxBodyKb` 16 (the lists), 4 for column sections, 1 for the photo bodies. |

## R2 Field rules per section (Q1-Q6; FR-PI, FR-EP)

| # | Section, entry | Rule |
|---|---|---|
| R2.1 | **Name** `PUT /v1/worker/profile/name` | `firstName`, `lastName`: trimmed, 1-100 characters, letters (any script), spaces, hyphens, apostrophes (`/^[\p{L}][\p{L}\p{M} '-]*$/u`); `middleName` the same or `null`; stored in the three columns. |
| R2.2 | **Bio** `/bio` | `bio`: trimmed, 1-2,000 characters, plain text (control characters other than newline refused); stored in `introduction`. The percent's "bio" section still needs 50+ (U1 R3.10). |
| R2.3 | **Personal info** `/personal-info` | `dateOfBirth`: an ISO date `YYYY-MM-DD`, a real calendar date, the person 16 to 100 years old on the day of the write (the api's clock); `gender`: `Male` \| `Female`; `hasVehicle`: `Yes` \| `No`, required. Stored in `dateOfBirth` (the string), `gender`, `hasVehicle`; `age` is **not** written (the readers compute from the date; U1's read returns both). Languages are not here (Q2). |
| R2.4 | **ABN** `/abn` | R5. |
| R2.5 | **Home address** `/home-address` | R3.1-R3.3. |
| R2.6 | **Service area** `/service-area` | R3.4-R3.8. |
| R2.7 | **Preferred hours** `PUT /v1/worker/availability` | `slots[]`, 0-28 items of `{day, startMinute, endMinute}`: `day` one of the seven; minutes integers 0-1440; `startMinute < endMinute`; **per day at most 4 slots and no two overlapping** (a slot's start ≥ the previous slot's end after sorting by start); duplicates refused as overlaps. Stored as `worker_availability` rows, `sortOrder` = position in the body after sorting by day order then start. |
| R2.8 | **Experience** `PUT /v1/worker/experience` | `domains[]`, 0-5 items, one per `CareDomain` at most: `{domain, isProfessional, isPersonal, specificAreas[], otherAreas[], description}`; `specificAreas` 0-3 values from `experienceAreasOf(domain)` (the shared vocabulary), no repeats; `otherAreas` 0-10 free labels 1-60 characters (today's "other" ticks are free labels too); `description` null or 1-1,000 trimmed; at least one of `isProfessional`/`isPersonal` true. Stored as `worker_experience` rows (unique per domain). |
| R2.9 | **Work history** `PUT /v1/worker/job-history` | `entries[]`, 0-20 of `{jobTitle, company, startMonth, startYear, endMonth, endYear, currentlyWorking}`: titles and companies trimmed 1-100; months one of the 12 English names; years integers 1950..the current year; `currentlyWorking` true ⇒ `endMonth` and `endYear` absent/null; false ⇒ both present and (endYear, endMonth) ≥ (startYear, startMonth). `sortOrder` from position. |
| R2.10 | **Education** `PUT /v1/worker/education` | the same with `institution`, `qualification`, `currentlyStudying`. |
| R2.11 | **Additional info** `PUT /v1/worker/additional-info/{group}` | R7 (the groups and their lists); every list value from its list, no repeats, 0-20 values; `funFact` trimmed 50-1,000; `uniqueService` 1-10 values; `personality` one of its two values; the three booleans required in their groups. |
| R2.12 | **Bank account** `PUT /v1/worker/bank-account` | R6. |
| R2.13 | **Photos** | R4. |
| R2.14 | Strings are trimmed before validation and stored trimmed; empty optional strings are stored as `null`, never `""`. |

## R3 The two addresses (C8, S3; D8, FR-PI-04, FR-PI-05)

| # | Rule |
|---|---|
| R3.1 | **Home address** body `{streetLine, localityId}`: `streetLine` trimmed 1-120 characters, printable; `localityId` a positive integer naming an `au_localities` row that is **not retired** (else 400 `fields.localityId: "Unknown suburb"`). |
| R3.2 | The write sets `worker_profiles.homeStreetLine` and `homeLocalityId` and **nothing else**: never `location`, `city`, `state`, `postalCode`, `latitude`, `longitude`, never `worker_locations`. The response is `{streetLine, localityId, suburb, state, postcode}` from the locality row. |
| R3.3 | The home address is returned to the worker (the profile read) and on the admin worker page through the admin path; **never** in the client search, the public contractor list, the share page or the search cards (a negative test per client-facing route: no `homeStreetLine` in any selected column, no street line in any body). |
| R3.4 | **Service area** body `{localityId, travelRadiusKm}`: the locality as R3.1 (not retired); `travelRadiusKm` an integer 1-500. |
| R3.5 | The write runs `placeHome(locality, 'ONBOARDING', travelRadiusKm)` (the locations module, unchanged) and in one transaction: upserts the HOME `worker_locations` row (`localityId`, `latitude`/`longitude` the suburb's centroid, `precision LOCALITY`, `source ONBOARDING`, `travelRadiusKm`; the `point` column is generated), writes the legacy columns exactly as the sign-up does (`location` "Suburb, ST postcode", `city`, `state`, `postalCode`, `latitude`, `longitude`), and persists completion. |
| R3.6 | An unplaced worker (no HOME row) who saves becomes placed; the admin's unplaced count falls by one; the reconciler never touches a row whose `source` is not `RECONCILER`/`BACKFILL` (the existing rule, re-asserted by a test). |
| R3.7 | The response is `{localityId, label, travelRadiusKm, precision}` (U1's `serviceArea` shape). |
| R3.8 | The home address and the service area are independent: saving one never changes the other. |

## R4 Photos (C7a, S4; FR-PI-02, Q7)

| # | Rule |
|---|---|
| R4.1 | **Ticket** `POST /v1/worker/photos/tickets` `{contentType, sizeBytes}`: the sign-up's rules (JPEG/PNG/WebP, ≤ 5 MB), the staged key under the sign-up's `staging/` prefix, the row in `registration_photo_uploads` with the worker's profile id as the owner (`workerProfileId` set at ticket time, so confirm and purge work as today); limit 10 tickets per minute per user. |
| R4.2 | **Confirm** `POST /v1/worker/photos` `{uploadId, slot}`: the upload must be this profile's ticket (404 otherwise), the object inspected as the sign-up does (exists, allowed type by signature, ≤ 5 MB; 400 with the sign-up's messages otherwise); `slot: 'main'` replaces `photos`; `slot: 'additional'` appends to `additionalPhotos` and is refused with 400 `fields.slot` when two are stored. The row is attached to the profile and `PhotoUploaded` enqueued in the same transaction; the existing handler writes the clean copy and thumbnail to Vercel Blob and repoints the column (unchanged). The response is the photos section `{main, additional[]}` as stored now (the staged public URL until the handler runs, as the sign-up). |
| R4.3 | **Make main** `POST /v1/worker/photos/main` `{url}`: `url` must equal one of the stored additional photos (400 `fields.url` otherwise); the main and that photo swap; the arrays keep their order otherwise. |
| R4.4 | **Remove** `POST /v1/worker/photos/remove` `{url}`: `url` must be the main or an additional photo; an additional one is removed from the array; the main is removed only when no additional photo exists (400 `fields.url: "Make another photo the main photo first"` otherwise), leaving `photos` null. The removed object (and its thumbnail when it is a processed copy) is deleted from Blob **after** the transaction commits, best-effort, logged on failure. |
| R4.5 | `photos` and `additionalPhotos` keep today's formats (a URL; a JSON array of URLs) so every reader is unchanged (admin, client search, share page). |
| R4.6 | Photo writes persist completion (`accountDetails` reads `photos.main`). |

## R5 The ABN (Q8; D17, FR-PI-07)

| # | Rule |
|---|---|
| R5.1 | Body `{abn}`: digits with optional spaces, normalised by removing spaces; exactly 11 digits; the **ATO checksum**: subtract 1 from the first digit, multiply the digits by the weights 10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19, sum, modulo 89 = 0. The rule lives in the contract schema (the form refuses before sending) and is re-run by the api on the normalised value. |
| R5.2 | Stored in `worker_profiles.abn` as `{workerEngagementType: {type: 'abn', value: <11 digits>, signed: <kept>}}`: `signed` is the stored value when the stored type is `abn`, `false` otherwise (a TFN record is replaced; D17). No other key is written or kept. |
| R5.3 | The response is `{type: 'abn', value, signed}`; the profile read's `abn` field shows the value (U1 E1). The agreement signing (`signed: true`) stays the contract page's action until U3 moves the documents. |
| R5.4 | The completion rule (U1 R3.4, R3.10) is satisfied by the stored 11-digit value or `signed`; no change to it. |

## R6 The bank account (Q9; FR-EP-05, OI-3)

| # | Rule |
|---|---|
| R6.1 | Body `{accountName, bankName, bsb, accountNumber}`, all required: names trimmed 1-100; `bsb` 6 digits (a dash between the third and fourth digit allowed on input, stripped); `accountNumber` 6-10 digits. A partial body is a schema failure (400). |
| R6.2 | Stored in `worker_additional_info.bankAccount` as today's JSON (`{accountName, bankName, bsb, accountNumber}`), the row created if absent. |
| R6.3 | The response and every read show the masked shape only (U1 R2.3: the two names, `bsbLast3`, `accountNumberLast3`); the full value appears in no log line (U1's redaction paths `bankAccount`, `bsb`, `accountNumber`), no audit row, no draft (the form fields are `neverSaved`). |
| R6.4 | The column stays plain JSON this unit; application-level encryption is carried as a follow-up with its key question (OI-3). |

## R7 The option lists (Q3, Q4; FR-EP-04, NFR-04)

| # | Rule |
|---|---|
| R7.1 | `packages/schemas/src/data/profileOptions.ts` holds, as `as const` arrays with today's exact stored strings: `LANGUAGES` (today's 31 + Auslan), `CULTURAL_BACKGROUNDS` (21), `RELIGIONS` (15), `INTERESTS`, `WORK_PREFERENCES` (5), `UNIQUE_SERVICES` (from `constants/uniqueServices`), `PERSONALITIES` (`Outgoing and engaging`, `Calm and relaxed`), `GENDERS` (`Male`, `Female`), `MONTHS` (the 12 names), `DAYS` (the seven). The contract's bodies use them as enumerations; the definitions take their options from them; the app's inline copies are deleted in PR 4. |
| R7.2 | The additional-info groups and their bodies: `good-to-know` `{lgbtqiaSupport: boolean}`; `languages` `{languages: LANGUAGES[]}`; `cultural-background` `{culturalBackground: CULTURAL_BACKGROUNDS[]}`; `religion` `{religion: RELIGIONS[]}`; `interests` `{interests: INTERESTS[]}`; `about-me` `{uniqueService: UNIQUE_SERVICES[] (1-10), funFact: string 50-1,000}`; `preferences` `{workPreferences: WORK_PREFERENCES[]}`; `personality` `{personality: PERSONALITIES, nonSmoker: boolean, petFriendly: boolean}`. The body is a discriminated union on `group`, which is also the path parameter (both must agree: 400 otherwise). |
| R7.3 | A write to a group changes only that group's columns of `worker_additional_info` (the row created if absent); the response is that group's fields as stored. |
| R7.4 | A stored value not in its list (legacy data) is returned as-is by the read; a write must use list values only, so the page shows such a value as "no longer offered -- pick again" and the user replaces it. |

## R8 The sidebar (C19; D11, FR-NAV)

| # | Rule |
|---|---|
| R8.1 | `WORKER_MENU` is one typed array in D11's order: Dashboard; Edit Profile (children); Edit Services; Mandatory (children); Trainings (children); My Services (children); Additional Credentials; My Jobs; Account. |
| R8.2 | Edit Profile's children, in order: Your name, Profile photo, Your bio, Address, Other personal info, Preferred hours, Experience, then the additional-details group's eight entries (Good to know, Languages, Cultural background, Religion, Interests, About me, Preferences, Personality) and Bank account. Each child's `href` is the section page (`/dashboard/worker/profile/<section>`). |
| R8.3 | The Edit Profile badge: the percent from the profile read when it is below 80 (U1 R3.10); plus the unplaced reminder dot when `serviceArea` is null (Q10). |
| R8.4 | Mandatory, Trainings and My Services children come from the profile read's `requirements.mandatory`, `requirements.trainings` and `services` (the hrefs unchanged until U3). |
| R8.5 | A test asserts the order of R8.1/R8.2 and that every static `href` resolves to a page file; the sidebar component renders the array and holds no item of its own. |

## R9 The engine's section mode (C14; D5, NFR-07)

| # | Rule |
|---|---|
| R9.1 | A section definition names the contract, the read entry and the key it `pick`s from the read body, the write entry and its fields; `defineSection` refuses at import a field not in the write body, a `pick` not in the read body, or a field named twice (the `defineForm` checks reused). |
| R9.2 | `seed(readBody)` fills the values from `readBody[pick]` through each kind's `fromRead`; a missing or null section seeds the kind's defaults. |
| R9.3 | The draft is keyed `section:<name>` per device, written on every change, cleared on a successful save; `neverSaved` fields are never written to it (the bank account's four fields). A restored draft is announced. |
| R9.4 | A save sends one PUT with the body from `sectionBody(values)`; the engine's retry with back-off honouring `Retry-After`, the offline pause and the server field-error mapping apply unchanged; no CAPTCHA. |
| R9.5 | After a successful save the page shows the returned section (not the typed values) and reloads the profile read with `cache: 'reload'`; the sidebar updates from it. |
