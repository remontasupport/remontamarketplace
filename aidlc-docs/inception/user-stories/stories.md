# User Stories -- the worker profile on `apps/api`

**Sources:** `../requirements/requirements.md` (approved 2026-10-09); `../plans/story-generation-plan.md`
(Q1 A format, Q2 A personas, Q3 A journey-based with a system epic); `personas.md`.
**Format:** "As a / I want / so that" + Given/When/Then; each story tagged with persona, MoSCoW priority and
requirement ids; **PBT** names the property-based-testing property where one applies.

**Shared rules that hold for every story** (stated once):
- **R-OWN:** every worker entry acts on the profile of the signed-in worker's token; no request names another
  worker; a row of another worker is 404, another role is 403, no token is 401 (FR-WRK-02, NFR-03).
- **R-STRICT:** every body and query is validated by the contract entry's schema; an unknown key or a bad value is
  400 with the field named, and the form shows it next to the field (NFR-04, D5).
- **R-PRIVATE:** the home address and the bank account are never in a client-facing response (the client search,
  the public list, the share page, search cards); the bank account is masked on every read (FR-PI-04, FR-EP-05,
  NFR-05).
- **R-DRAFT:** every section is a form definition: the draft stays on the device until the save succeeds, a save
  retries after 429/503 honouring `Retry-After`, and an offline device pauses and resumes (D5, NFR-07).
- **R-GATE:** nothing in E7 or E8 reaches production before it ran on staging through the checklist, the load test
  included where entries are added (CLAUDE.md, FR-PLT-02).

**Epics**

| Epic | Title | Persona | Requirements | Stories |
|---|---|---|---|---|
| E1 | Tell Remonta who I am | P1 Worker (W1) | FR-PI-01..03, 06..08, FR-UPL-01, NFR-07 | 7 |
| E2 | Where I live and where I work | P1 Worker (W2), P2 Administrator | FR-PI-04/05, NFR-03/05/09 | 4 |
| E3 | My experience and details | P1 Worker (W1) | FR-EP-01..06 | 5 |
| E4 | My services and documents | P1 Worker (W2), P2 Administrator | FR-SVC-01/02, FR-DOC-01/02, FR-UPL-01..03, D1 | 5 |
| E5 | My dashboard and jobs | P1 Worker (W3) | FR-HOME-01/02, FR-JOB-01/02 | 3 |
| E6 | Finding my way | P1 Worker (W1) | FR-NAV-01..03 | 1 |
| E7 | The api behind the profile | S4 `apps/api` | FR-WRK-01..08, FR-UPL-01, FR-JOB-02, FR-PLT-01/02, NFR-01..07, 11, 12 | 6 |
| E8 | Cut over page by page | S5 Operator | D12, FR-PLT-03..06, NFR-08..10, 13, 14 | 2 |
| | | | **Total** | **33** |

---

## E1 -- Tell Remonta who I am

### US-WP-01 -- Edit my name
**Persona:** P1 Worker (W1) · **Priority:** M · **Reqs:** FR-PI-01, FR-WRK-05

As a worker, I want to correct my first, middle and last name, so that clients and Remonta see me as I am.

- **Given** I open Edit Profile › Your name, **then** the fields show my current names.
- **Given** I change them and save, **when** the api answers, **then** the page shows "Saved", the sidebar shows the new name without a reload, and the profile read returns exactly what I typed (trimmed).
- **Given** I clear the last name or type 101 characters, **then** the field shows the rule and nothing is sent.
- **Given** I type a name with a hyphen or an apostrophe, **then** it is accepted.
- **PBT:** a generated valid name round-trips through write-then-read unchanged.

### US-WP-02 -- Change my photo
**Persona:** P1 Worker (W1, W2) · **Priority:** M · **Reqs:** FR-PI-02, FR-UPL-01, FR-UPL-03

As a worker, I want to change my main photo and manage my additional photos, so that my profile shows my face.

- **Given** I pick an image, **when** it is shrunk on the device (as the sign-up does), **then** the app asks the api for a ticket, uploads straight to the bucket, confirms, and my new photo appears on the page and in the sidebar.
- **Given** the clean copy and thumbnail are produced by the outbox, **then** within a minute every reader (admin, client search, share page) shows the clean copy; the `photos` field keeps its format.
- **Given** I pick a file that is not an image or is too large, **then** the app refuses it before any upload, and the api would refuse the ticket too.
- **Given** I have additional photos, **when** I choose "make main", **then** the main and that photo swap and the page shows the result without a reload.
- **Given** the old `/api/upload/worker-photo` route, **then** my dashboard never calls it after this story ships.

### US-WP-03 -- Write my bio
**Persona:** P1 Worker (W1) · **Priority:** M · **Reqs:** FR-PI-03

As a worker, I want to write my introduction, so that clients know who I am.

- **Given** I open Your bio, **then** my current text is there with a counter out of 2,000.
- **Given** I save between 1 and 2,000 characters, **then** it is saved and shown on the profile preview.
- **Given** I paste more than 2,000 characters, **then** the field says so and nothing is sent.

### US-WP-04 -- Other personal info
**Persona:** P1 Worker (W1) · **Priority:** M · **Reqs:** FR-PI-06

As a worker, I want to set my date of birth, gender, whether I have a vehicle and my languages, so that the right jobs find me.

- **Given** the form, **then** gender and languages are chosen from the shared lists; the vehicle is yes/no; the date of birth is a date picker.
- **Given** a date of birth under 16 or over 100 years ago, **then** the field shows the rule.
- **Given** I save, **then** the admin search still finds me by gender, vehicle and age band exactly as before (the stored values are today's).

### US-WP-05 -- ABN or TFN
**Persona:** P1 Worker (W1) · **Priority:** M · **Reqs:** FR-PI-07

As a worker, I want to record how I am engaged (contractor with an ABN, or employee with a TFN), so that my contract page and the admin's worker-type filter are right.

- **Given** I choose contractor and type an ABN, **then** an ABN that fails the checksum is refused at the field; a valid one is saved in the `abn` JSON with today's shape.
- **Given** I choose employee, **then** the TFN handling is exactly today's (what is stored and how, confirmed at design, OI: FR-PI-07) and the contract page for that type opens.
- **Given** I save, **then** the admin search's worker-type filter still finds me.

### US-WP-06 -- Keep what I typed
**Persona:** P1 Worker (W1), S1 `apps/app` · **Priority:** M · **Reqs:** D5, NFR-07, FR-EP-05

As a worker on a phone, I want what I typed to still be there when I come back, so that an interruption costs nothing.

- **Given** I typed in a section and closed the tab before saving, **when** I open the section again on the same device, **then** the fields are as I left them and the page says a draft was restored.
- **Given** the save succeeded, **then** the draft is cleared.
- **Given** the bank account section, **then** its fields are never kept in the draft (`neverSaved`).
- **PBT:** for any sequence of edits and reloads without a save, the restored draft equals the last edit (the engine's draft property, reused).

### US-WP-07 -- Save survives a busy or unreachable api
**Persona:** P1 Worker (W1), S1 `apps/app` · **Priority:** M · **Reqs:** NFR-07, NFR-06

As a worker, I want a save to go through even when the api is busy, so that I never lose work to a 503.

- **Given** the api answers 429 or 503 with `Retry-After`, **then** the form waits that long and retries, showing "Still saving"; after the engine's attempts it shows a clear message and keeps the draft.
- **Given** the device goes offline mid-save, **then** the form pauses and resumes when it is back online.
- **Given** the api is unreachable when I open the dashboard, **then** the page shows a notice and the sections I open still show my draft or nothing, never an error page.
- **Given** a field error from the api, **then** it is shown next to the right field in the right section.

---

## E2 -- Where I live and where I work

### US-WP-08 -- Enter my home address
**Persona:** P1 Worker (W2) · **Priority:** M · **Reqs:** FR-PI-04, D8, NFR-09

As a worker, I want to record where I live, so that Remonta has my home address for contracts and records.

- **Given** Edit Profile › Address, **then** I see two things: **Home address** (street line, suburb) and **Service area** (US-WP-09), each explained in one line.
- **Given** I type a street line and start typing a suburb, **then** suggestions come from Remonta's suburb list (the api's autocomplete); picking one fills suburb, state and postcode, which I cannot edit.
- **Given** I typed a suburb and did not pick, **then** the field says to pick one and nothing is sent.
- **Given** I save, **then** the home address is shown on my profile under "Home address (private)" and the profile read returns it.
- **Given** any client-facing page or search (the client search, the public list, the share link, search cards), **then** my home address is not in it, and the legacy location columns are unchanged.
- **PBT:** for any generated profile with a home address, the client-facing responses contain no part of the street line (invariant).

### US-WP-09 -- Change my service area
**Persona:** P1 Worker (W2) · **Priority:** M · **Reqs:** FR-PI-05, D8

As a worker, I want to say which suburb I work around and how far I travel, so that Remonta finds me where I want to work.

- **Given** Service area, **then** it shows my sign-up suburb and radius (50 km by default).
- **Given** I pick another suburb from the list and a radius between 1 and 500 km and save, **then** the api updates my HOME row in place (`source = 'ONBOARDING'`, precision locality) and the legacy columns follow ("Suburb, ST postcode", city, state, postcode, the suburb's coordinates).
- **Then** the admin search within 10 km of the new suburb finds me with the distance from its centre, and the client search finds me at the new suburb; a search around the old suburb no longer does.
- **Given** the reconciler runs later, **then** it never moves a row I set.
- **Given** a radius of 0 or 501, **then** the field shows the rule.

### US-WP-10 -- Place myself when my suburb is not set
**Persona:** P1 Worker (W2) · **Priority:** M · **Reqs:** FR-PI-05, follow-up 17

As a worker whose sign-up suburb could not be matched, I want to set it myself, so that I appear in searches.

- **Given** I have no HOME row, **when** I open the dashboard, **then** a reminder says "Your suburb isn't set, so clients can't find you" with a link to Service area.
- **Given** I pick a suburb and save, **then** a HOME row is created as in US-WP-09, the reminder disappears, and the admin's unplaced count falls by one.

### US-WP-11 -- The administrator sees the home address, not the client
**Persona:** P2 Administrator · **Priority:** M · **Reqs:** FR-PI-04, NFR-03, NFR-05

As an administrator, I want to see a worker's home address on their page, so that contracts and records are right.

- **Given** a worker's admin page, **then** "Home address (private)" shows the street line, suburb, state and postcode, read through the admin path, never a worker entry.
- **Given** the admin search results and cards, **then** no home address appears; the distance shown is still from the service-area suburb.
- **Given** the share-profile link a client opens, **then** no home address appears.

---

## E3 -- My experience and details

### US-WP-12 -- Preferred hours
**Persona:** P1 Worker (W1) · **Priority:** M · **Reqs:** FR-EP-01

As a worker, I want to set the hours I prefer per day, so that clients book me when I am free.

- **Given** the section, **then** I see each day with its slots (start, end), as stored in `worker_availability`.
- **Given** I add a slot that overlaps another on the same day, or whose end is not after its start, **then** the field shows the rule and nothing is sent.
- **Given** I save, **then** the whole week is replaced in one transaction and reads back identically.
- **PBT:** after any valid write, no two slots of a day overlap (invariant); a generated valid week round-trips.

### US-WP-13 -- Experience
**Persona:** P1 Worker (W1) · **Priority:** M · **Reqs:** FR-EP-02

As a worker, I want to describe my experience per care domain, so that admins find me for the right participants.

- **Given** the section, **then** each domain offers professional/personal, its specific areas from the shared list (`@remonta/schemas`), other areas, and a description.
- **Given** I save, **then** the admin search's `experienceAreas` filter matches me on the areas I ticked.
- **Given** an area that is not in the domain's list, **then** it is refused (400) by the api.

### US-WP-14 -- Work history and education
**Persona:** P1 Worker (W1) · **Priority:** S · **Reqs:** FR-EP-03

As a worker, I want to list my jobs and qualifications in order, so that my profile tells my story.

- **Given** the lists, **then** I can add, remove and reorder entries; each has today's fields with month/year dates.
- **Given** "currently working" or "currently studying" is ticked, **then** the end date is hidden and not sent; an end before a start is refused at the field.
- **Given** I save, **then** the list is replaced in one transaction and comes back in the order I set (`sortOrder` from position).
- **PBT:** a generated ordered list round-trips in the same order.

### US-WP-15 -- The additional details
**Persona:** P1 Worker (W1) · **Priority:** S · **Reqs:** FR-EP-04

As a worker, I want to fill in good-to-know, languages, cultural background, religion, interests, about me, preferences and personality, so that participants can choose someone who fits.

- **Given** each group, **then** list values come from the shared lists and free text is bounded; the groups rendered today are the groups after the move.
- **Given** I save a group, **then** only that group changes; the others read back unchanged.
- **PBT:** writing group A then reading group B leaves B unchanged (invariant).

### US-WP-16 -- Bank account, written in full and read masked
**Persona:** P1 Worker (W1, W2), P2 Administrator · **Priority:** M · **Reqs:** FR-EP-05, NFR-05, OI-3

As a worker, I want to give my bank details once and see only the last digits afterwards, so that nobody reading my profile sees my account.

- **Given** the section, **then** account name, BSB (6 digits) and account number (6-10 digits) are validated at the field.
- **Given** I save, **then** the response and every later read show the BSB and number masked to the last three digits; the full value appears in no log line and no draft.
- **Given** I want to change it, **then** I re-enter all three fields; a partial entry is refused.
- **Given** the admin's worker page, **then** it shows the masked value (whether the admin ever needs the full value is OI-3).
- **PBT:** for any stored account, no read response contains more than the last three digits of the number (invariant).

---

## E4 -- My services and documents

### US-WP-17 -- Edit my services
**Persona:** P1 Worker (W1, W2) · **Priority:** M · **Reqs:** FR-SVC-01

As a worker, I want to add and remove the services I offer, so that I am matched to the right work.

- **Given** Edit Services, **then** the categories and sub-categories come from the api's catalogue (`GET /v1/service-categories`).
- **Given** I tick and untick and save, **then** my services are replaced in one transaction; the My Services dropdown in the sidebar updates without a reload.
- **Given** a nursing or therapeutic service, **then** its registration details are part of that service's section.
- **Given** an unknown category id, **then** the api answers 400.

### US-WP-18 -- See what each service needs
**Persona:** P1 Worker (W1) · **Priority:** M · **Reqs:** FR-SVC-02, D1

As a worker, I want to see which documents each of my services requires and which I have supplied, so that I know what is left.

- **Given** My Services › a service, **then** the required documents and their status come from the api in one read, privately cached in my browser for a minute.
- **Given** this story ships, **then** `/api/worker/requirements` and `/api/worker/other-requirements` (the public-cache routes of D1) have no caller and are deleted in the epic's clean-up PR.

### US-WP-19 -- Upload a document
**Persona:** P1 Worker (W2) · **Priority:** M · **Reqs:** FR-DOC-01, FR-UPL-01

As a worker, I want to upload a police check or a certificate from my phone, so that Remonta can verify me.

- **Given** a document slot (mandatory, training, identity, other, or per service), **when** I pick a PDF, JPEG or PNG under the limit, **then** the app gets a ticket for that document kind, uploads straight to the bucket, confirms, and the row shows "Submitted" with the date; my `verificationStatus` becomes `PENDING_REVIEW` as today.
- **Given** the kind needs details (an expiry date, a citizenship flag, licence fields), **then** they are typed fields, validated, not free JSON.
- **Given** a document type that none of my services or the base set allows, **then** the api answers 400 and nothing is stored.
- **Given** another file type or an oversize file, **then** the app refuses it before upload and the api would refuse the ticket.
- **Given** I never confirm, **then** the object is purged by the existing job.

### US-WP-20 -- Replace or delete a document
**Persona:** P1 Worker (W2) · **Priority:** M · **Reqs:** FR-DOC-01, FR-UPL-02

As a worker, I want to replace an expired document or delete a wrong upload, so that my file is accurate.

- **Given** a submitted document, **when** I upload a new one for the same slot, **then** it replaces the old row's object and the status returns to "Submitted".
- **Given** I delete, **then** the row and its object are gone and the slot shows as not supplied; a document another row still references is never deleted (no shared objects after this cycle).
- **Given** I open a document of mine, **then** it opens through a short-lived signed link from the api.

### US-WP-21 -- The administrator's review is unchanged
**Persona:** P2 Administrator · **Priority:** M · **Reqs:** FR-DOC-02, FR-UPL-02, OI-2

As an administrator, I want to open, approve and reject documents as today, whether they were uploaded before or after the change, so that verification never stalls.

- **Given** a document uploaded before this cycle (a Blob url), **then** the admin page opens it as today.
- **Given** a document uploaded after (a bucket object), **then** the admin page opens it through the signed link, with no change to the approve/reject/expiry routes.
- **Given** a worker's entries, **then** none can set an approved or rejected state.

---

## E5 -- My dashboard and jobs

### US-WP-22 -- My dashboard from one read
**Persona:** P1 Worker (W3) · **Priority:** M · **Reqs:** FR-HOME-01, FR-HOME-02, FR-WRK-04

As a worker, I want the dashboard to show my completion, reminders and jobs near me quickly, so that I know what to do next.

- **Given** I open the dashboard, **then** one profile read supplies the name, photo, completion and reminders; the jobs slider reads the jobs list for my service-area state; no page reads the database itself.
- **Given** the jobs slider, **then** it no longer calls a geocoder: my state comes from my service area.
- **Given** I return within a minute, **then** the profile read is answered from the browser's private cache or a 304.

### US-WP-23 -- Apply to a job and withdraw
**Persona:** P1 Worker (W3) · **Priority:** M · **Reqs:** FR-JOB-01

As a worker, I want to apply to a job and withdraw if I change my mind, so that the office knows my intent.

- **Given** a job, **when** I apply, **then** an application row exists for me (`workerId` = my user id, as today) with status pending; tapping Apply twice leaves one row.
- **Given** My Jobs, **when** I withdraw, **then** the row's status is withdrawn and the list shows it.
- **PBT:** apply is idempotent (two applies equal one); apply then withdraw then apply leaves one row, pending.

### US-WP-24 -- The office knows I applied
**Persona:** P1 Worker (W3), S4 `apps/api` · **Priority:** M · **Reqs:** FR-JOB-02, D14

As a worker, I want Remonta's office to be told when I apply, so that someone calls me.

- **Given** I apply, **then** the api enqueues an outbox event and a handler posts {fullName, userId, zohoId} to the n8n webhook (a secret per stage) through the allow-listed client; my browser never calls n8n.
- **Given** n8n is down, **then** the handler retries with back-off and, after the attempts, dead-letters with the alert; my application is unaffected.
- **Given** a sign-up, **then** the same handler shape posts the registration event (follow-up 2 done).

---

## E6 -- Finding my way

### US-WP-25 -- The sidebar in the agreed order
**Persona:** P1 Worker (W1), S1 `apps/app` · **Priority:** M · **Reqs:** FR-NAV-01..03, D11

As a worker, I want the menu in a sensible order with everything about me under Edit Profile, so that I find things.

- **Given** the sidebar, **then** the order is Dashboard; Edit Profile; Edit Services; Mandatory; Trainings; My Services; Additional Credentials; My Jobs; Account.
- **Given** Edit Profile, **then** it opens to: Your name, Profile photo, Your bio, Address, Other personal info, Preferred hours, Experience, and the additional-details group; the completion badge stays on Edit Profile.
- **Given** a phone, **then** the same menu slides in as a drawer.
- **Given** the code, **then** the menu is one declared array; a test asserts the order and that every link resolves to a page.

---

## E7 -- The api behind the profile

### US-WP-26 -- Only my own profile
**Persona:** S4 `apps/api` · **Priority:** M · **Reqs:** FR-WRK-01, FR-WRK-02, NFR-03, D10

As the api, I act only on the profile of the token's subject, so that no worker can read or change another's data.

- **Given** a worker entry and a valid WORKER token, **then** the handler resolves the profile from `sub`; a worker without a profile row gets 404.
- **Given** a child row id (a document, a job-history entry) that belongs to another worker, **then** 404; **given** an ADMIN or CLIENT token, **then** 403; **given** no token, **then** 401; all before any handler runs.
- **Given** an admin impersonating a worker, **then** the request succeeds as the worker and the log line and audit row carry `impersonatorId`.
- **PBT:** for any two generated workers A and B and any entry, a request by A naming B's rows is never 200 (invariant).

### US-WP-27 -- Whole-section writes and one-statement reads
**Persona:** S4 `apps/api` · **Priority:** M · **Reqs:** FR-WRK-04, FR-WRK-05, NFR-02, NFR-04, NFR-11

As the api, I replace a section in one transaction and read the profile in one statement, so that every page costs one query.

- **Given** a section write with a strict body, **then** an unknown key or a bad value is 400 naming the field; a valid body replaces the section in one transaction with a 5 s statement timeout and returns the section.
- **Given** the profile read, **then** one statement (or one transaction) returns everything FR-WRK-04 lists, with `Cache-Control: private, max-age=60`, `Vary: Authorization` and an ETag; a matching `If-None-Match` gets 304.
- **Given** the same body twice, **then** the row is the same after each (idempotent).
- **PBT:** write-then-read round-trips for every section; writing twice equals writing once.

### US-WP-28 -- Completion status computed in one place
**Persona:** S4 `apps/api` · **Priority:** M · **Reqs:** FR-WRK-06

As the api, I compute the completion flags and percentage from the rows, so that the sidebar, the admin and the client search agree.

- **Given** any profile, **then** the flags `accountDetails`, `compliance`, `trainings`, `services` and `profileCompleted` equal what today's app function computes for the same rows (an oracle on fixtures), and they are written to `setupProgress`/`profileCompleted` after each write that can change them.
- **Given** the sidebar badge, **then** its percentage comes from the profile read, not from a second computation in the app.
- **PBT:** for generated profiles, the api's flags equal the ported oracle's (oracle).

### US-WP-29 -- Tickets, confirmations, purge
**Persona:** S4 `apps/api` · **Priority:** M · **Reqs:** FR-UPL-01, FR-UPL-02, NFR-06

As the api, I issue upload tickets bound to the worker and the kind and confirm only what exists, so that uploads are safe and bounded.

- **Given** a ticket request with a kind, **then** the signed POST is bound to a per-worker prefix, the kind's content types and size limit, and expires in minutes.
- **Given** a confirmation, **then** the api checks the object exists with an allowed type and size, records the row, and enqueues the clean copy (photos); a confirmation for a ticket of another worker is 404; a second confirmation of the same ticket is idempotent.
- **Given** an unconfirmed object past its ticket's life, **then** the existing purge job deletes it.
- **Given** a read of a document, **then** the api returns a short-lived signed URL, never the bucket object directly.
- **PBT:** a stateful model of ticket → upload → confirm → delete never leaves an object without a row or a row without an object after the purge (PBT-06).

### US-WP-30 -- Limits, shedding and the load test
**Persona:** S4 `apps/api`, S5 Operator · **Priority:** M · **Reqs:** FR-PLT-01, FR-PLT-02, NFR-01, NFR-06, NFR-12, D6, D7

As the api, I serve 10,000 active workers an hour and shed cleanly beyond that, so that a busy day never becomes an outage.

- **Given** the stages table, **then** prod's instance ceiling is raised, `MAX_IN_FLIGHT` is below the per-instance concurrency so shedding can fire, and the pool and Neon's pooler are sized for max instances × pool; the pooled URL's transaction mode is verified on both stages.
- **Given** the load script against staging at the per-instance share of the D6 rate for 10 minutes, **then** p95 is under 300 ms for the profile read and 500 ms for writes, with zero 503s and zero pool timeouts.
- **Given** 3× that rate, **then** excess requests get 503 with `Retry-After` and nothing else fails; within 30 s after the burst the api answers normally.
- **Given** per-user limits (design: 60 writes/min, 10 tickets/min), **then** a worker beyond them gets 429 with `Retry-After`, consistent across instances.
- **Given** the run, **then** its numbers are recorded in the construction notes before the promotion.

### US-WP-31 -- Audit and logs
**Persona:** S4 `apps/api` · **Priority:** M · **Reqs:** FR-WRK-08, NFR-05

As the api, I record who changed what and never log what is private, so that changes are traceable and data stays safe.

- **Given** any write entry, **then** it declares an audit action and the pipeline refuses a handler that does not satisfy it; the audit row carries the principal and the impersonator.
- **Given** log lines, **then** `authorization`, write bodies, document urls, the home address and the bank account never appear; every line carries the request id and the user id.
- **Given** any authenticated response, **then** its `Cache-Control` is `private` or `no-store`; the contract check rejects a public cache on a non-public entry.

---

## E8 -- Cut over page by page

### US-WP-32 -- The entries ship first
**Persona:** S5 Operator · **Priority:** M · **Reqs:** D12, FR-PLT-03, FR-PLT-04, R-GATE

As the operator, I want the api entries live on production before any page uses them, so that a page switch is only a client change.

- **Given** a unit's entry PR, **then** it merges to `main`, deploys staging, and the staging checklist (section 6 of the requirements: the token, ownership answers, each section round-trip, a photo and a document by ticket, the home address absent from client paths, the service area moving the worker, the load test, health) is run and recorded.
- **Given** the n8n secret and any stages-table change, **then** they are in place on the stage before the promotion.
- **Given** the promotion, **then** production health is 200, the new entries answer 401 without a token, and nothing changes for users.
- **Given** the docs, **then** `docs/worker/README.md` and CLAUDE.md's reach line change in the same PRs.

### US-WP-33 -- The page switches, then the old code goes
**Persona:** S5 Operator · **Priority:** M · **Reqs:** D12, FR-PLT-05, FR-PLT-06, NFR-09, NFR-10, NFR-13, NFR-14

As the operator, I want each page group to switch in its own PR with a promote-only rollback, so that no step is a leap.

- **Given** a page PR, **then** its Vercel preview (against staging) is checked end to end; after the merge an internal worker edits each section on production; the rollback deployment id is re-recorded in CLAUDE.md.
- **Given** a rollback at any step, **then** a Vercel promote restores the previous pages while their actions and routes still exist, and the api's previous image restores the previous entries; the home-address migration is expand-only, so no down migration is ever needed.
- **Given** the clean-up PR, **then** the unit's server actions, routes, hooks, Upstash keys and `revalidatePath` calls are deleted; a grep for `s-maxage` on authenticated routes is empty; every quality gate stays green and no baseline grows; the state file's follow-ups are updated.
- **Given** the maintainability items touched along the way, **then** `DenyAllAuthenticator` is gone, OpenAPI lists 304/503, the health entry is exempt from the limiter, and the Semgrep raw-SQL rule covers `Prisma.raw`.

---

## Requirement to story map

| Requirement | Stories |
|---|---|
| FR-WRK-01, 02, 03 | US-WP-26 (03 with 32) |
| FR-WRK-04 | US-WP-22, 27 |
| FR-WRK-05 | US-WP-01, 12, 14, 27 |
| FR-WRK-06 | US-WP-28 |
| FR-WRK-07 | US-WP-07, 22 |
| FR-WRK-08 | US-WP-31 |
| FR-PI-01..03 | US-WP-01, 02, 03 |
| FR-PI-04 | US-WP-08, 11 |
| FR-PI-05 | US-WP-09, 10 |
| FR-PI-06, 07 | US-WP-04, 05 |
| FR-PI-08 | US-WP-01..05, 33 |
| FR-EP-01..05 | US-WP-12, 13, 14, 15, 16 |
| FR-EP-06 | US-WP-15, 33 |
| FR-SVC-01, 02 | US-WP-17, 18 |
| FR-DOC-01, 02 | US-WP-19, 20, 21 |
| FR-UPL-01..03 | US-WP-02, 19, 20, 21, 29 |
| FR-HOME-01, 02 | US-WP-22 |
| FR-JOB-01, 02 | US-WP-23, 24 |
| FR-NAV-01..03 | US-WP-25 |
| FR-PLT-01, 02 | US-WP-30 |
| FR-PLT-03, 04 | US-WP-32 |
| FR-PLT-05, 06 | US-WP-33 |
| NFR-01, 06, 12 | US-WP-30 |
| NFR-02, 04, 11 | US-WP-27 |
| NFR-03 | US-WP-11, 26 |
| NFR-05 | US-WP-08, 16, 31 |
| NFR-07 | US-WP-06, 07 |
| NFR-08, 09, 10, 13, 14 | US-WP-33 |

**Verification protocol (requirements section 6) to stories:** gates → US-WP-33; the staging checklist → US-WP-32
(its items are US-WP-26, 27, 02, 19, 08, 09, 30); production promotion → US-WP-32; the page PR and production
check → US-WP-33; the clean-up PR → US-WP-33.
