# Requirements questions: admin clients and coordinators (2026-10-28)

Your request: "in the admin dashboard, I want to have a list of the clients and coordinators and a display with their
participants and requests"

What exists today (inventory, `main` `2f418e2`):

- The admin sidebar already has **Clients** and **Support Coordinators** tabs (`/admin/manage?tab=clients`,
  `?tab=support-coordinators`). Both render a "coming soon" placeholder (`apps/app/src/app/admin/manage/page.tsx`).
- **Clients**: `users.role = CLIENT` + `client_profiles` (first/last name, mobile, `isSelfManaged`).
- **Coordinators**: `users.role = COORDINATOR` + `coordinator_profiles` (first/last name, mobile, `organization`,
  `clientTypes`).
- **Participants** (`participants`): owned by a client or coordinator through `userId` (set to null when the owner
  removes one); name, date of birth, location, gender, conditions, funding type (NDIS, Aged care, Insurance, Private,
  Other), relationship to the client, `servicesRequested`, notes.
- **Requests** (`service_requests`): `requesterId` (the client's or coordinator's user, no foreign key), one
  `participantId`, `services`/`details` (JSON), location, status (PENDING, MATCHING, MATCHED, ACTIVE, COMPLETED,
  CANCELLED, ARCHIVED), `selectedWorkers`, `assignedWorker`, `zohoRecordId`, created/updated.
- Clients and coordinators manage these today only from their own dashboard (`/api/client/...`, Next routes on the
  app). The admin's other lists (workers, users, suspended) are read from `apps/api` with the admin bearer token.

Fill in each `[Answer]:` with a letter (or X and your words). Answer in the file or in chat, whichever is easier.

---

## Question 1: What can the admin do here?
A) Read only: lists and a detail view; no changes
B) Read, plus account actions (suspend / restore the client or coordinator, as for workers)
C) Read, plus editing participants and requests on their behalf (status changes, cancel, edit)
X) Other (please describe after [Answer]: tag below)

[Answer]:C

## Question 2: The list rows
Which columns on the Clients and Support Coordinators lists?
A) Name, email, mobile, (organisation for coordinators), sign-up date, number of participants, number of requests
B) A plus the newest request's status and date
C) A plus account status (active / suspended) and last sign-in
X) Other (please describe after [Answer]: tag below)

[Answer]: A plus do not include sign up date

## Question 3: Search and filters on the lists
A) A name / email search box only
B) A plus filters: request status (e.g. "has an ACTIVE request"), funding type, sign-up date range
C) None for now: newest first, paged
X) Other (please describe after [Answer]: tag below)

[Answer]: b

## Question 4: The "display" of participants and requests
A) A detail page per client / coordinator (`/admin/clients/<id>`): their profile, then each participant with that
   participant's requests under it
B) An expandable row in the list (no separate page)
C) A side panel that opens beside the list
X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 5: How much of each request?
A) Summary: services, location, status, created date, and the assigned worker's name if any
B) Everything the client entered (`details`: schedule, preferences, notes) plus the summary
C) B plus a link to the assigned or selected worker's admin page
X) Other (please describe after [Answer]: tag below)

[Answer]: b

## Question 6: Participants that no longer have an owner
When a client removes a participant, `userId` becomes empty but its requests remain.
A) Show them nowhere (only participants still owned)
B) Show them under the requester of their requests (found through `service_requests.requesterId`)
C) A separate "Unlinked participants" list
X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 7: A global "all requests" list
A) Not now: requests are seen through their client / coordinator
B) Yes, also a Requests tab: every request, filterable by status, newest first
X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 8: Where the data comes from
A) `apps/api` (Recommended): new admin contract entries, like the worker lists (bearer token, rate limits, audit),
   proven on staging and promoted before the app's page merges
B) Next.js routes in `apps/app` (faster, but against the direction of the admin lists since 2026-10-08)
X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 9: Sensitive participant data
Participants carry date of birth, conditions and funding type (health information).
A) Show everything to every admin
B) Show it, and record each detail-page view in the audit log (who looked at whose record)
C) Hide conditions and date of birth on the admin view
X) Other (please describe after [Answer]: tag below)

[Answer]: b but a apply passwrod to open it

## Security extension
The security baseline applies (admin-only access, rate limits, no data in logs, audit). Any exception?
A) No exception
X) Other (please describe after [Answer]: tag below)

[Answer]:a
