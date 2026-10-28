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
- **FR-9 Sensitive participant data behind a password.** A participant's date of birth, conditions and funding type
  are hidden on the detail page until the admin enters the **shared sensitive-data password** (one secret per
  environment, all admins know it). An unlock lasts a limited time for that admin's session (15 minutes proposed).
  The rest of the participant (name, location, relationship, notes) shows without it.
  *The funding-type filter (FR-2) matches without showing anyone's funding type; to confirm at Functional Design.*
- **FR-10 Audit.** Every detail-page view, every unlock (success and failure) and every status change is written to
  the audit log with the admin's user id, the client / coordinator id and, for a change, the old and new status.

## Non-functional / security

- **NFR-1 On `apps/api`.** New admin contract entries (P-6), bound one handler each; the bearer token from
  `/api/auth/api-token`; ADMIN role only; proven on staging and promoted before the app's page merges.
- **NFR-2 Limits.** Rate limits per admin on every entry; the unlock entry tighter (e.g. 5 failures per 15 minutes,
  then refused), so the shared password cannot be guessed.
- **NFR-3 The shared password** is stored as a hash in Secret Manager (`remonta-api[-staging]-...`), compared in
  constant time, never logged, never sent back. Staging has its own value.
- **NFR-4 No personal data in logs**: ids only.
- **NFR-5 Freshness**: lists and the detail page are not cached across a status change.
- **NFR-6 Previews never call the live n8n webhook**: staging's webhook value is a staging URL or empty.
- **Security baseline**: applies with no exception (user, Security A).

## Risk noted

A shared password proves "someone who knows it", not which admin. The audit still records which signed-in admin
unlocked. Rotation when an admin leaves is manual (a new Secret Manager version, then a redeploy).

## Out of scope

Editing request details, participants or profiles; suspending clients / coordinators; a global requests list;
unowned participants; the client's own dashboard.
