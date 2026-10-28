# Requirements: admin clients and coordinators (cycle admin-clients, 2026-10-28)

**Request (user, verbatim):** "in the admin dashboard, I want to have a list of the clients and coordinators and a display
with their participants and requests"

Answers: `requirement-verification-questions.md` (Q1 C, Q2 A without sign-up date, Q3 B, Q4 A, Q5 B, Q6 A, Q7 A, Q8 A,
Q9 B + a password, Security A) and the follow-ups of 2026-10-28 (audit).

## Today (inventory, `main` `2f418e2`)

- The admin sidebar's **Clients** and **Support Coordinators** tabs render "coming soon" placeholders
  (`apps/app/src/app/admin/manage/page.tsx`).
- `users` (role CLIENT / COORDINATOR, status) + `client_profiles` (name, mobile, `isSelfManaged`) /
  `coordinator_profiles` (name, mobile, `organization`, `clientTypes`).
- `participants`: owner `userId` (nullable: set to null when the owner removes one); name, `dateOfBirth`, location,
  gender, `conditions`, `fundingType`, `relationshipToClient`, `servicesRequested`, `additionalInfo`.
- `service_requests`: `requesterId` (no foreign key), one `participantId`, `services`/`details` (JSON), location,
  status (7 values), `selectedWorkers`, `assignedWorker`, `zohoRecordId`.
- The client's own status changes post to the n8n `Cancel_Archive_Webhook` (feeds Zoho) with `after()`
  (`apps/app/src/app/api/client/service-request/[id]/route.ts`).

## Functional requirements

- **FR-1 Lists.** The Clients tab lists CLIENT users and the Support Coordinators tab lists COORDINATOR users, each
  with a profile. Columns: name, email, mobile, organisation (coordinators only), number of participants, number of
  requests. No sign-up date. Newest first, paged.
- **FR-2 Search and filters.** A name / email search box; filters: **request status** (has at least one request in
  the chosen status) and **funding type** (has at least one owned participant with that funding type). No date filter.
- **FR-3 Detail page.** One page per client / coordinator (`/admin/clients/<id>`, `/admin/coordinators/<id>`): the
  profile, then each participant they own, with that participant's requests under it.
- **FR-4 Requests in full.** Each request shows services, location, status, created and updated dates, the assigned
  worker's name if any, and everything the client entered in `details` (schedule, preferences, notes).
- **FR-5 Owned participants only.** Participants whose `userId` is empty are not shown (and not counted).
- **FR-6 No global requests list** in this cycle.
- **FR-7 Request status change.** An admin can set any request to any of the seven statuses (ACTIVE included,
  which the client cannot edit). No other admin edits in this cycle (details, participants and profiles stay read-only).
- **FR-8 n8n on a status change.** An admin's status change notifies the same n8n webhook as the client's change, with
  the payload marking it as made by an admin, so Zoho stays in step. Delivery is retried (not a bare request).
- **FR-9 All participant data shown at once** (changed by the user 2026-10-28: "do not apply the password for now,
  admin can see the details instantly"). Date of birth, conditions, funding type and the request's NDIS details show
  on the detail page with no password; the funding-type filter needs none. A password may come back later.
- **FR-10 Audit.** Every detail-page view and every status change is written to the audit log with the admin's user
  id, the client / coordinator id and, for a change, the old and new status.

## Non-functional / security

- **NFR-1 On `apps/api`.** New admin contract entries (P-6), bound one handler each; the bearer token from
  `/api/auth/api-token`; ADMIN role only; proven on staging and promoted before the app's page merges.
- **NFR-2 Limits.** Rate limits per admin on every entry.
- **NFR-3** (withdrawn with the password, 2026-10-28.)
- **NFR-4 No personal data in logs**: ids only.
- **NFR-5 Freshness**: lists and the detail page are not cached across a status change.
- **NFR-6 Previews never call the live n8n webhook**: staging's webhook value is a staging URL or empty.
- **Security baseline**: applies with no exception (user, Security A).

## Risk noted

Health information (date of birth, conditions, NDIS details) is visible to every admin with no second step; the
view audit (FR-10) is the only control beyond admin sign-in. Accepted by the user for now (2026-10-28).

## Out of scope

Editing request details, participants or profiles; suspending clients / coordinators; a global requests list;
unowned participants; the client's own dashboard.
