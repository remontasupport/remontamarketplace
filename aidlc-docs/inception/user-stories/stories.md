# User Stories — Remonta Backend, first release

**Sources:** `requirements.md` (approved 2026-09-25); `story-generation-plan.md` → *Resolved decisions*; personas in `personas.md`.
**Format (Q3 A):** "As a / I want / so that" + Given/When/Then. Each story is tagged with its persona, MoSCoW priority (taken from its FRs) and FR IDs.
**Acceptance-criteria depth (Q4 A):** happy path, business-rule failures, and the security negatives the requirements call out. **PBT** names the property-based-testing property where one applies.

**Shared rules that hold for every story** (stated once, not repeated in each):
- **R-AUTH:** every request is checked for a valid, unrevoked token and the right role **before any record is read** (FR-ID-02, FR-ID-03, `.brd` §2.4 #2).
- **R-403:** a signed-in user without permission gets **403**, not 500 (`.brd` §2.4 #3).
- **R-AUDIT:** every change to a sensitive record writes an audit record (E7). Where a story says "is audited", it means US-AUD-01 or US-AUD-02 applies.
- **R-QUEUE:** every email and outbound call goes through the queue, with retries, a dead-letter queue and recorded delivery status (US-NOT-03).

**Epics**

| Epic | Title | FR groups | `.brd` | Stories |
|---|---|---|---|---|
| E1 | Identity & Sessions | FR-ID | §4.1, J7.4, J7.7 | 7 |
| E2 | Registration | FR-REG, FR-INT | J1 | 6 |
| E3 | Onboarding | FR-ONB | J2 | 10 |
| E4 | Compliance Verification | FR-CMP | J3 | 12 |
| E5 | Account & Access | FR-ACC | J8 | 6 |
| E6 | Notifications | FR-NOT | phase-5 §5.3–5.4 | 4 |
| E7 | Audit | FR-AUD | phase-2 §2.6 | 3 |
| E8 | Migration & Cut-over | FR-MIG | — | 7 |
| | | | **Total** | **55** |

---

## E1 — Identity & Sessions

### US-ID-01 — Call the backend on behalf of a signed-in user
**Persona:** S1 `apps/app` · **Priority:** M · **FRs:** FR-ID-01, FR-ID-02

As `apps/app`, I want to exchange a user's NextAuth sign-in for a short-lived signed backend token, so that the backend knows exactly who is calling and in which role.

- **Given** a user signed in to `apps/app`, **when** `apps/app` requests a backend token, **then** it gets one carrying the subject, role, audience, issuer, expiry and session ID, with a lifetime set in NFR Requirements.
- **Given** a valid token, **when** it is sent with a backend request, **then** the backend accepts it and treats the caller as that user and role.
- **Given** a token that is expired, has the wrong audience or issuer, or has a bad signature, **when** it is sent, **then** the request is refused with 401 and no data is read.
- **Given** any account, **then** it holds exactly one role: Worker, Client, Coordinator or Admin.
- **PBT:** for any token with any one claim altered (signature, `aud`, `iss`, `exp`, `sid`), validation rejects it; only the untouched token is accepted.

### US-ID-02 — Signing out really signs me out
**Persona:** P3 Account holder · **Priority:** M · **FRs:** FR-ID-03, FR-ID-04

As an account holder, I want signing out or changing my password to end my session everywhere at once, so that nobody can keep using my account.

- **Given** I'm signed in on two devices, **when** I sign out on one, **then** only that session ends; **when** I change my password, **then** every session of mine ends.
- **Given** a session has ended, **when** any request uses a token from it, **then** the backend **and** `apps/app` refuse it on that request. The old 60-minute stale login cache no longer exists.
- **Given** a session reaches the lifetime set in NFR Requirements, **then** it expires server-side, whatever the cookie says.
- Session ended by sign-out or password change is audited (US-AUD-01).

### US-ID-03 — Suspend an account
**Persona:** P2 Administrator · **Priority:** M · **FRs:** FR-ID-05, FR-ID-06, FR-CMP-10, FR-NOT-06

As an administrator, I want to suspend an account, so that its holder can no longer use Remonta straight away.

- **Given** an `ACTIVE` account, **when** I suspend it with a reason, **then** it becomes `SUSPENDED`, all its sessions end, and its next request is refused.
- **Given** the account is suspended, **then** its holder is emailed (R-QUEUE) and the action is audited with my reason.
- **Given** an account that is already `SUSPENDED`, **when** I suspend it again, **then** nothing changes and I'm told it's already suspended.
- **Given** I'm not an admin, **when** I try to suspend any account, **then** I get 403 (R-403).
- **PBT (account-status state machine):** from any reachable status, only the transitions allowed by Functional Design succeed; every other attempt is refused and leaves the status unchanged.

### US-ID-04 — Reactivate an account
**Persona:** P2 Administrator · **Priority:** M · **FRs:** FR-ID-05, FR-ID-06, FR-NOT-06

As an administrator, I want to reactivate a suspended account, so that its holder can sign in again.

- **Given** a `SUSPENDED` account, **when** I reactivate it, **then** it becomes `ACTIVE` and the holder can sign in again. Old sessions stay ended.
- **Given** the account is reactivated, **then** the holder is emailed and the action is audited.
- **Given** an `ACTIVE` account, **when** I try to reactivate it, **then** nothing changes.

### US-ID-05 — Impersonate a user to troubleshoot
**Persona:** P2 Administrator · **Priority:** M · **FRs:** FR-ID-07

As an administrator, I want to sign in as a user, so that I can see and fix their problem as they see it.

- **Given** I'm an admin, **when** I start impersonating an `ACTIVE` user, **then** backend tokens issued during impersonation name **both** me and that user.
- **Given** I'm impersonating, **when** I change anything, **then** the audit record names both me (impersonator) and the user.
- **Given** the target account is `SUSPENDED`, **when** I try to impersonate it, **then** I'm refused.
- **Given** I'm not an admin, **when** I try to impersonate, **then** I get 403.

### US-ID-06 — One admin tier with honest permission errors
**Persona:** P2 Administrator · **Priority:** M · **FRs:** FR-ID-08

As an administrator, I want every admin action to be available to every admin, and a refusal to say "not allowed" rather than "server error", so that permission problems are never mistaken for outages.

- **Given** any admin, **then** every first-release admin action is available to them; no check refers to `SUPER_ADMIN`.
- **Given** a non-admin calls any admin endpoint, **then** they get 403 and the event is logged as an authorisation failure, not an error.
- **Given** an unauthorised call, **then** no record was read before the refusal (R-AUTH).

### US-ID-07 — Create admins and change roles through a controlled path
**Persona:** P2 Administrator · **Priority:** S · **FRs:** FR-ID-09

As an administrator, I want admin accounts and role changes to go through one controlled, audited path, so that nobody gains admin rights by running a script.

- **Given** the mechanism chosen in design, **when** an admin account is created or a role changes, **then** it is audited with who did it and why.
- **Given** the old scripts (`create-admin-user.ts`, `promote-to-admin.ts`), **then** they are retired or wrapped by the same audited path.
- **Given** a non-admin, **when** they attempt a role change, **then** they get 403.

---

## E2 — Registration (J1)

### US-REG-01 — Register as a worker
**Persona:** S3 Anonymous visitor → P1 Worker · **Priority:** M · **FRs:** FR-REG-01, FR-REG-02, FR-REG-04, FR-REG-06

As someone who wants to work through Remonta, I want to register in four steps (location, personal info, services and specialisations, photo and consent), so that I can start onboarding.

- **Given** valid input for all four steps, **when** I submit, **then** an `ACTIVE`, unpublished worker account is created and the response says truthfully what happens next. It never says "check your email to verify".
- **Given** the password doesn't meet the policy (≥ 8 characters, upper case, lower case and a digit, and not in the breached-password list), **when** I submit, **then** I'm told which rule failed and nothing is created.
- **Given** a mobile that isn't a valid Australian format, or an email that is invalid, **then** registration is refused with a field error. Emails are normalised (trimmed, lower case) before the uniqueness check.
- **Given** I consent to profile sharing, **then** the consent is stored with its timestamp and the version of the wording I was shown.
- **Given** I choose Home Modifications or Fitness and Rehabilitation, **then** my selection is kept and mapped per the catalogue (V3; US-CMP-12).
- **PBT:** the server-side validator and the `apps/app` form validator (shared `packages/schemas`) accept and reject exactly the same inputs; for any valid input, email normalisation is idempotent.

### US-REG-02 — Registration requires a CAPTCHA
**Persona:** S3 Anonymous visitor · **Priority:** M · **FRs:** FR-REG-03

As Remonta, I want every registration to pass a CAPTCHA, so that bots can't create accounts.

- **Given** a request with a valid CAPTCHA token, **then** registration proceeds.
- **Given** a request with **no** token, or an invalid or reused token, **then** it is refused, not waved through.
- **Given** the CAPTCHA provider is unreachable, **then** registration is refused with a retry-later message. The check fails closed.
- Registration endpoints are rate-limited per IP (limit set in NFR Requirements).

### US-REG-03 — Signing up doesn't reveal who is already registered
**Persona:** S3 Anonymous visitor · **Priority:** M · **FRs:** FR-REG-08

As Remonta, I want the email checks during signup to give nothing away, so that nobody can find out which people have accounts.

- **Given** an email that is already registered, **when** someone registers with it, **then** the visible response is the same as for a new email (e.g. "if this is new, check your inbox"). The existing owner is emailed instead.
- **Given** any number of probes, **then** response content and timing don't distinguish a registered email from an unregistered one, within a tolerance set in NFR Requirements.
- The old public "check email" endpoint is not carried over in a form that answers yes/no.

### US-REG-04 — Record where a recruit came from
**Persona:** S3 Anonymous visitor · **Priority:** S · **FRs:** FR-REG-05

As Remonta, I want a recruitment-lead ID on a signup link to be stored with the new account, so that recruitment can be attributed later.

- **Given** a signup arriving with a `zohoLeadId`, **then** it is stored on the worker record.
- **Given** a malformed ID, **then** registration still succeeds; the ID is dropped and a warning is logged.
- No call to Zoho is made (C6 B).

### US-REG-05 — Locate the worker in the background
**Persona:** S2 Scheduler / queue worker · **Priority:** M · **FRs:** FR-REG-07

As the queue worker, I want to geocode a new worker's location after registration, so that a geocoding problem never blocks a signup.

- **Given** registration succeeds, **then** a geocoding job is queued and the worker gets their response without waiting for it.
- **Given** geocoding fails, **then** it is retried; after the last retry it goes to the dead-letter queue and the worker's registration is unaffected.
- **Given** geocoding succeeds on a retry, **then** the location is stored once. Retries don't create duplicates.

### US-REG-06 — New registrations still reach the CRM
**Persona:** S2 Scheduler / queue worker · **Priority:** M · **FRs:** FR-INT-01, FR-INT-02

As Remonta, I want every new worker registration to keep reaching the CRM through the existing n8n webhook, so that recruitment sees new workers exactly as it does today.

- **Given** a registration succeeds, **then** the same n8n notification payload as today is sent through the queue, with a timeout.
- **Given** n8n is down, **then** delivery is retried; after the last retry it goes to the dead-letter queue and an alert is raised. The registration itself is unaffected.
- **Given** the webhook URL, **then** it comes from configuration/secrets, not source code.
- No new Zoho integration is added (C6 B, OI-05).

---

## E3 — Onboarding (J2)

### US-ONB-01 — Set up my account details
**Persona:** P1 Worker · **Priority:** M · **FRs:** FR-ONB-01, FR-ONB-02, FR-ONB-03

As a worker, I want to enter my name, photo, bio, address, date of birth and other personal details, so that my profile is complete and accurate.

- **Given** I save my details, **then** every rule in `.brd` §4.2 is enforced on the server, e.g. bio 200–2000 characters, age ≥ 18, Australian postcode format, photo type and size limits.
- **Given** I enter a date of birth, **then** it's stored as a real date. An impossible date (e.g. 31/02) or an age under 18 is refused.
- **Given** the gender field, **then** it is **optional**, with the options Female, Male, Non-binary, Prefer to self-describe (free text) and Prefer not to say. Leaving it blank is accepted (OI-03).
- **Given** I try to edit another worker's details, **then** I get 403.
- **PBT:** for any input, the server-side validator's accept/reject decision matches the shared schema in `packages/schemas`; a saved profile read back equals what was saved.

### US-ONB-02 — Build my profile and set my availability
**Persona:** P1 Worker · **Priority:** M · **FRs:** FR-ONB-01, FR-ONB-02, FR-ONB-10

As a worker, I want to fill in my work history, education, languages, cultural background, religion, interests, about me, personality, good-to-know, locations, preferences, experience, NDIS screening details, availability and preferred hours, so that clients can find the right match.

- **Given** I save any section, **then** its `.brd` §4.2 rules are enforced on the server (e.g. fun fact 50–1000 characters; one record per service category).
- **Given** I set availability and preferred hours, **then** overlapping or reversed time ranges are refused.
- **Given** I save a section, **then** my onboarding progress updates (US-ONB-08).
- Indicative rates (J2.3) are **not** offered (FR-ONB-14).

### US-ONB-03 — See exactly which documents I owe
**Persona:** P1 Worker · **Priority:** M · **FRs:** FR-ONB-04, FR-ONB-08, FR-CMP-12, FR-ONB-13

As a worker, I want the system to list exactly which documents my chosen services and specialisations require, grouped as base compliance, trainings, qualifications, insurance and transport, so that I know what's left to do.

- **Given** I've chosen one service line, **then** I see that line's documents from the current catalogue version (`categories.json`, OI-01), each marked mandatory or optional.
- **Given** I've chosen several lines (V2), **then** each document appears **once** and is mandatory if **any** chosen line requires it.
- **Given** I chose Home Modifications (V3), **then** I see the Home and Yard Maintenance list; Fitness and Rehabilitation shows the Personal Trainer list.
- **Given** I'm a Support Worker who provides transport (V4), **then** driver's licence, car registration and car insurance are added.
- **Given** a service needs qualifications (e.g. Nursing, or the AHPRA specialisations under Therapeutic Supports), **then** a qualification step is generated for each such service (FR-ONB-08).
- **Given** a service line whose skill or offering taxonomy is missing, **then** the gap is visible in the catalogue data rather than silently empty (FR-ONB-13, S).
- **PBT (requirements engine):** for any set of chosen services, (a) the output contains no duplicate document type; (b) the output equals the union of each service's own list; (c) adding a service never removes an obligation; (d) the result is independent of the order the services were chosen in.

### US-ONB-04 — Upload a compliance document safely
**Persona:** P1 Worker · **Priority:** M · **FRs:** FR-ONB-05, FR-CMP-04, FR-CMP-08

As a worker, I want to upload a document for one of my requirements, so that an admin can review it.

- **Given** a PDF, JPEG, PNG, WebP or HEIC/HEIF file of up to 50 MB, **when** I upload it, **then** it's stored in Australian-region **private** storage and the requirement becomes `SUBMITTED`.
- **Given** a file whose content signature doesn't match its declared type (e.g. an `.exe` renamed `.pdf`), or one over 50 MB, **then** it's refused.
- **Given** the document, **then** there is no public URL; it can be opened only through a short-lived authorised link.
- **Given** I upload twice at the same moment for the same requirement, **then** exactly one requirement row exists (database unique constraint).
- **Given** I'm a Client or Coordinator, **when** I call the upload endpoint, **then** I get 403 (`.brd` §2.4 #5).
- **PBT:** for any byte sequence and declared type, the upload is accepted only when the declared type, the detected signature and the allow-list all agree.

### US-ONB-05 — Replace or remove a document
**Persona:** P1 Worker · **Priority:** M · **FRs:** FR-CMP-04, FR-CMP-09

As a worker, I want to replace a rejected or expiring document, or remove one I uploaded by mistake, so that my records are right.

- **Given** a document in any state, **when** I upload a replacement, **then** it returns to `SUBMITTED` and the previous review (approval date, rejection date and reason, reviewer) is cleared.
- **Given** I replace or delete a document, **then** the old file is removed or retired and no link to it works any more.
- **Given** a document is `APPROVED` and I replace it, **then** the new file needs review. If it's always-required and my profile is published, the rule in US-CMP-09 applies.

### US-ONB-06 — Prove my identity with 100 points
**Persona:** P1 Worker · **Priority:** M · **FRs:** FR-ONB-06

As a worker, I want to upload identity documents classed as primary, secondary or working-rights evidence, so that I can meet the 100-point check.

- **Given** I upload a passport or birth certificate, **then** it's classed as PRIMARY; a driver's licence, Medicare card, utility bill or bank statement is SECONDARY.
- **Given** a document already uploaded elsewhere in onboarding (e.g. my driver's licence for transport), **when** I choose to reuse it, **then** a reference is recorded instead of a second copy.
- **Given** my documents, **then** I can see my running points total and what is still missing.

### US-ONB-07 — Elect ABN or TFN, confirm right to work and accept the Code of Conduct
**Persona:** P1 Worker · **Priority:** M · **FRs:** FR-ONB-07

As a worker, I want to choose how I'm engaged, give right-to-work evidence and sign the Code of Conduct, so that I can be engaged legally.

- **Given** I choose ABN or TFN (V1) and sign, **then** my election and a signed flag are stored, but **not** the ABN or TFN value itself.
- **Given** I accept Code of Conduct parts 1 and 2, **then** each acceptance is stored with its timestamp and document version.
- **Given** a right-to-work document, **then** it follows the normal document flow (US-ONB-04).

### US-ONB-08 — Trust my onboarding progress
**Persona:** P1 Worker · **Priority:** M · **FRs:** FR-ONB-11

As a worker, I want my progress bar and section ticks to be right every time, so that I know what's left.

- **Given** I complete a section, upload a document, or a document is approved, rejected or expires, **then** the five section flags and the completion percentage update at the same time as that change.
- **Given** my requirements change (e.g. I add a service), **then** progress drops if new obligations appear.
- **Given** I load my dashboard, **then** progress is read from its stored value, not recomputed from scratch.
- **PBT:** for any sequence of profile, document and requirement changes, the stored progress equals a from-scratch recomputation at the end.

### US-ONB-09 — Enter my bank details privately
**Persona:** P1 Worker · **Priority:** M · **FRs:** FR-ONB-09

As a worker, I want to enter my bank details once and know nobody can read them, so that I can be paid later without my details being exposed.

- **Given** a valid BSB (6 digits), account number (6–10 digits), names (≤ 100 characters) and acknowledgement, **when** I save, **then** the details are stored encrypted at field level.
- **Given** my bank details are saved, **when** I view them, **then** I see only a masked version (e.g. `BSB ***-123, account ****5678`) and can replace them.
- **Given** anyone else, admins included, **then** no screen or endpoint in the first release returns the unmasked details (OI-04, F3 C, F3.2 A).
- **Given** I replace my details, **then** the change is audited without the values being written to the audit record or logs.
- **PBT:** encrypt → decrypt round-trips for any valid input; the mask never reveals more than the last 3 BSB digits and last 4 account digits.

### US-ONB-10 — Preview how clients see me
**Persona:** P1 Worker · **Priority:** S · **FRs:** FR-ONB-12

As a worker, I want to preview my public profile, so that I can check how clients will see me.

- **Given** I open the preview, **then** I see exactly the fields a client would see, and nothing private (bank details, documents, date of birth).
- **Given** I'm not published yet, **then** the preview says so.

---

## E4 — Compliance Verification (J3)

### US-CMP-01 — See who is waiting for verification
**Persona:** P2 Administrator · **Priority:** M · **FRs:** FR-CMP-01

As an administrator, I want a paginated list of workers waiting for review, filterable by status, service line and date, so that I can work through the queue.

- **Given** workers with submitted documents, **then** they appear in the list with a page size set in design; I can page and filter.
- **Given** a large queue, **then** the list responds within the NFR-PERF target (it is never an unbounded fetch).
- **Given** I'm not an admin, **then** I get 403.

### US-CMP-02 — Review a worker's documents
**Persona:** P2 Administrator · **Priority:** M · **FRs:** FR-CMP-02, FR-AUD-02

As an administrator, I want to see a worker's full compliance picture and open each document, so that I can make a decision.

- **Given** I open a worker, **then** I see every requirement, its status, expiry date and review history, and which documents are always-required (F2a).
- **Given** I open a document, **then** I get a short-lived authorised link that stops working after its expiry.
- **Given** I view a document, **then** the view is audited (who, when, which document).
- **Given** I'm not an admin, **then** I get 403 and **no** document data is returned (`.brd` §2.4 #2).

### US-CMP-03 — Approve a document
**Persona:** P2 Administrator · **Priority:** M · **FRs:** FR-CMP-03, FR-CMP-04, FR-CMP-10, FR-NOT-02

As an administrator, I want to approve a document, so that the worker moves closer to being published.

- **Given** a `SUBMITTED` document, **when** I approve it, **then** it becomes `APPROVED` with my name and the date, the worker is emailed, and the decision is audited.
- **Given** a document whose type carries an expiry, **when** I approve it without an expiry date, **then** I'm asked for one (the rule is set in Functional Design).
- **Given** a document that isn't `SUBMITTED`, **when** I try to approve it, **then** it's refused as an illegal transition.
- **PBT (document state machine):** for any sequence of upload, approve, reject, reset, re-date and expiry events, the document is always in a valid state, and every refused event leaves it unchanged.

### US-CMP-04 — Reject a document with a reason
**Persona:** P2 Administrator · **Priority:** M · **FRs:** FR-CMP-03, FR-CMP-04, FR-CMP-10, FR-NOT-01

As an administrator, I want to reject a document and say why, so that the worker knows what to fix.

- **Given** a `SUBMITTED` document, **when** I reject it with a reason, **then** it becomes `REJECTED`, the worker is emailed the reason, and the decision is audited.
- **Given** no reason, or only whitespace, **when** I reject, **then** it's refused.
- **Given** the rejected document is always-required and the worker is published, **then** the US-CMP-09 rule applies.

### US-CMP-05 — Send a document back to review
**Persona:** P2 Administrator · **Priority:** M · **FRs:** FR-CMP-03, FR-CMP-04

As an administrator, I want to reset a decided document to review, so that I can correct a mistake.

- **Given** an `APPROVED` or `REJECTED` document, **when** I reset it, **then** it returns to `SUBMITTED`, and a timestamped note naming me is added.
- **Given** a `PENDING` document (nothing uploaded), **when** I reset it, **then** it's refused.
- The reset is audited with before and after values.

### US-CMP-06 — Set or clear a document's expiry date
**Persona:** P2 Administrator · **Priority:** M · **FRs:** FR-CMP-03, FR-CMP-10

As an administrator, I want to set or correct a document's expiry date, so that expiry warnings and checks are right.

- **Given** a document, **when** I set an expiry date, **then** it's saved and the expiry warnings (US-NOT-02) are scheduled from it.
- **Given** a date in the past, **when** I set it, **then** I'm warned that the document becomes `EXPIRED` straight away, and must confirm.
- **Given** I clear the date, **then** pending warnings for that document are cancelled.
- Every change is audited with the old and new dates.

### US-CMP-07 — Publish a worker profile
**Persona:** P2 Administrator · **Priority:** M · **FRs:** FR-CMP-07, FR-CMP-10, FR-NOT-03

As an administrator, I want to publish a worker's profile when they meet the legal minimum, so that clients can find them.

- **Given** every **always-required** document (100 points of ID, NDIS Worker Screening Check, police check, right to work, and the Working with Children Check where the catalogue requires it) is `APPROVED` and not expired, **and** every other mandatory document is too, **when** I publish, **then** the profile goes live, the worker is emailed, and it's audited.
- **Given** an always-required document is missing, not approved, or expired, **when** I try to publish, **then** it's **refused** and I see which documents block it. No override is possible (F2a A).
- **Given** all always-required documents are fine but **other** mandatory documents are outstanding, **when** I publish, **then** I see the list and must give a reason to continue; the override, the reason and the outstanding list are audited (Q11 C).
- **Given** the account is `SUSPENDED`, **then** it can't be published.
- **PBT (publication rule):** for any combination of document states, publication succeeds without an override **only if** every mandatory document is approved and current; it succeeds with an override **only if** every always-required document is approved and current. It never succeeds for a suspended account.

### US-CMP-08 — Unpublish a worker profile
**Persona:** P2 Administrator · **Priority:** M · **FRs:** FR-CMP-07, FR-CMP-10, FR-NOT-03

As an administrator, I want to take a profile offline, so that a worker who shouldn't be visible isn't.

- **Given** a published profile, **when** I unpublish it with a reason, **then** it goes offline, the worker is emailed, and it's audited.
- **Given** an unpublished profile, **when** I unpublish it, **then** nothing changes.

### US-CMP-09 — Expire documents automatically
**Persona:** S2 Scheduler · **Priority:** M · **FRs:** FR-CMP-05, FR-NOT-04

As the scheduler, I want to mark documents past their expiry date as expired every day, so that expiry actually means something.

- **Given** an `APPROVED` document whose expiry date has passed, **when** the daily job runs, **then** it becomes `EXPIRED`, the worker is emailed, and the change is audited with the scheduler as actor.
- **Given** the expired document is **not** always-required and the worker is published, **then** the profile stays live and is **flagged**, and the worker appears on the expired-documents list (US-CMP-10) (F2b A).
- **Given** the expired document **is** always-required and the worker is published, **then** the profile is **taken offline automatically** until the document is replaced and approved; the worker is told why (F2b A).
- **Given** the job runs twice on the same day, or is retried after a crash, **then** each document is expired once, and each email is sent once.
- **PBT:** the expiry job is idempotent. Running it any number of times over the same data and date gives the same result as running it once.

### US-CMP-10 — Work the expired-documents list
**Persona:** P2 Administrator · **Priority:** M · **FRs:** FR-CMP-05, FR-CMP-07, FR-CMP-10

As an administrator, I want a list of workers with expired or soon-to-expire documents, so that I can decide what to do about each one.

- **Given** workers with expired documents, **then** they're listed with the document, its expiry date, whether it's always-required, and whether the profile is live, flagged or offline.
- **Given** a worker on the list, **when** I decide (leave live, unpublish, or chase), **then** my decision is audited.
- **Given** the worker uploads a replacement that I approve, **then** the flag clears and they leave the list. If the profile was taken offline automatically, I can republish it (US-CMP-07).

### US-CMP-11 — Worker verification status is always valid
**Persona:** S2 Scheduler / P2 Administrator · **Priority:** M · **FRs:** FR-CMP-06

As Remonta, I want each worker's overall verification status to use one valid set of values and to follow from their documents and publication, so that admins and reports can trust it.

- **Given** any worker, **then** their verification status is one of the values set in Functional Design. `'Verified'` (outside the enum) no longer exists.
- **Given** a document or publication change, **then** the worker's status is recalculated in the same transaction.
- **Given** a status value that nothing can reach, **then** it's either given a meaning or removed (expand/contract).
- **PBT:** for any set of document states and publication state, the derived verification status is deterministic and always a valid enum value.

### US-CMP-12 — One versioned document catalogue
**Persona:** P2 Administrator · **Priority:** M · **FRs:** FR-CMP-12, FR-ONB-04

As an administrator, I want a single, versioned list of documents and which services require them, so that every worker is held to the same rules and changes are traceable.

- **Given** the first release, **then** the catalogue is loaded from the recovered `categories.json` (24 documents, 8 document sets, 7 service categories) as **version 1**. `serviceDocumentRequirements.ts` no longer decides anything.
- **Given** the live app's 9 service lines, **then** Home Modifications maps to the Home and Yard Maintenance list, and Fitness and Rehabilitation to Personal Trainer; existing selections are kept (F1 A).
- **Given** each document, **then** it records whether it's **always-required** (the F2a list) and whether it carries an expiry (16 of 24 do).
- **Given** a new catalogue version is released (through a reviewed deploy, not live editing), **then** every affected worker's obligations are recalculated; new obligations appear as `PENDING` and **don't** unpublish anyone by themselves (Q10 A).
- **PBT:** for any worker, recalculating against the same catalogue version twice gives the same obligations; moving to a version that only adds obligations never removes an existing one.

---

## E5 — Account & Access (J8)

### US-ACC-01 — Protect sign-in against password guessing
**Persona:** P3 Account holder · **Priority:** M · **FRs:** FR-ACC-01

As an account holder, I want repeated wrong passwords to lock my account for a while, so that nobody can guess their way in.

- **Given** failed sign-ins reach the threshold set in NFR Requirements, **then** the account locks for the set period and the lockout is audited.
- **Given** many failed attempts arrive at the same moment, **then** each one is counted. There's no race that lets extra guesses through.
- **Given** a locked account, **when** the right password is entered, **then** sign-in is still refused until the lock expires.
- **PBT:** for any interleaving of N concurrent failed attempts, the stored failure count equals N.

### US-ACC-02 — Reset or set my password
**Persona:** P3 Account holder · **Priority:** M · **FRs:** FR-ACC-02, FR-ACC-04

As an account holder, I want to reset a forgotten password, or set my first one, with a link that works once, so that I can get back in safely.

- **Given** I request a reset, **then** the response is the same whether or not the email is registered; a link is sent only if it is.
- **Given** a reset link, **then** it works once, within 1 hour; after use or expiry it's refused.
- **Given** a new password, **then** the password policy (US-REG-01) is enforced and the password is hashed with the single system-wide algorithm and cost.
- **Given** a successful reset, **then** all my sessions end (US-ID-02) and I'm emailed that my password changed (FR-NOT-06).

### US-ACC-03 — Verify my email with a one-time code
**Persona:** P3 Account holder · **Priority:** M · **FRs:** FR-ACC-03

As an account holder, I want to confirm my email with a code, so that my account is really mine.

- **Given** I request a code, **then** it's stored only as a hash, and the email states the **real** expiry time.
- **Given** a wrong code, **then** the attempt is counted; after the limit the code is void.
- **Given** an expired or already-used code, **then** it's refused.
- **Given** OTP requests, **then** they're rate-limited per account and per IP.

### US-ACC-04 — Admins sign in with a second factor
**Persona:** P2 Administrator · **Priority:** M · **FRs:** FR-ACC-06

As an administrator, I want to use a second factor at sign-in, so that a stolen password alone can't open the admin console.

- **Given** an admin account, **then** MFA enrolment is required before any admin action is allowed.
- **Given** an admin signs in without a valid second factor, **then** no admin token is issued.
- **Given** MFA enrolment, reset or failure, **then** it's audited.

### US-ACC-05 — Upgrade old password hashes quietly
**Persona:** P3 Account holder · **Priority:** M · **FRs:** FR-ACC-04

As an account holder, I want my stored password to be moved to the current hashing standard without having to do anything, so that my account is protected like everyone else's.

- **Given** a password hashed with the old cost, **when** I sign in successfully, **then** it's re-hashed with the system-wide algorithm and cost.
- **Given** any password hash, **then** it's never logged or returned by any endpoint.

### US-ACC-06 — See and correct my personal data
**Persona:** P3 Account holder · **Priority:** S · **FRs:** FR-ACC-07

As an account holder, I want to ask for a copy of my personal data, correct it, or ask for my account to be deleted, so that my privacy rights are respected.

- **Given** I request my data, **then** I receive an export of what Remonta holds about me, within the time set in NFR Requirements; the request is audited.
- **Given** I request deletion, **then** my account is handled under the retention rules set in NFR Requirements (records Remonta must keep, such as audit records, are kept).
- **Given** I ask to correct a field I can't edit myself, **then** the request reaches an admin.

---

## E6 — Notifications

Approval, rejection, publication, suspension and password-change emails are acceptance criteria on their own stories (US-CMP-03/04/07/08/09, US-ID-03/04, US-ACC-02).

### US-NOT-01 — Get a truthful registration confirmation
**Persona:** P1 Worker · **Priority:** M · **FRs:** FR-NOT-05, FR-REG-06

As a new worker, I want a confirmation email that describes what really happens next, so that I'm not left waiting for something that won't come.

- **Given** I register, **then** I receive a confirmation email that describes the real next step (sign in and start onboarding).
- **Given** the email wording, **then** it matches the on-screen message (US-REG-01).

### US-NOT-02 — Be warned before a document expires
**Persona:** P1 Worker · **Priority:** M · **FRs:** FR-NOT-04

As a worker, I want to be warned before a document expires, so that I can replace it in time.

- **Given** an approved document with an expiry date, **then** I'm emailed **30 days** and **7 days** before it expires, and again **on the expiry date** (Q9 A).
- **Given** I replace the document and it's approved before a warning is due, **then** remaining warnings for the old document are cancelled.
- **Given** the expiry date changes (US-CMP-06), **then** warnings are rescheduled from the new date.
- **Given** the warning job is retried, **then** each warning is sent once.

### US-NOT-03 — Notifications are delivered reliably
**Persona:** S2 Scheduler / queue worker · **Priority:** M · **FRs:** FR-NOT-01..07, FR-INT-03

As Remonta, I want every notification to go through the queue with retries, so that nobody misses one because a provider blipped.

- **Given** any notification, **then** it's queued, sent through the email provider interface (Resend today, replaceable), and its delivery status is recorded.
- **Given** the provider fails, **then** it's retried with back-off; after the last retry it goes to the dead-letter queue and an alert is raised.
- **Given** a retry after a partial failure, **then** the recipient receives the email once (idempotency key).
- **Given** a notification's content, **then** logs and the observability SaaS receive no personal data beyond an ID (C8 A).

### US-NOT-04 — Remind me to finish onboarding
**Persona:** P1 Worker · **Priority:** C · **FRs:** FR-NOT-07

As a worker who stopped part-way through onboarding, I want a reminder, so that I remember to finish.

- **Given** my onboarding has been incomplete and untouched for a period set in design, **then** I get one reminder listing what's left.
- **Given** I've finished or I'm published, **then** no reminder is sent.

---

## E7 — Audit

### US-AUD-01 — Every change to sensitive data is on record
**Persona:** S4 Auditor · **Priority:** M · **FRs:** FR-AUD-01, FR-ACC-05, FR-CMP-10

As an auditor, I want every change to identity, compliance documents, bank details, account status, role and publication to be recorded, so that any decision can be reconstructed later.

- **Given** any such change, **then** an audit record holds the actor, the impersonator (if any), timestamp, action, target, before and after values, reason (where one applies) and request/correlation ID.
- **Given** a bank-details change, **then** the record says the details changed without holding the values (US-ONB-09).
- **Given** sign-out, password change, email change, role change, lock/unlock or suspension, **then** each writes its audit action. None of these is left declared but unwritten any more.
- **Given** the change fails, **then** no audit record claims it happened. Record and change commit together.

### US-AUD-02 — Every look at sensitive data is on record
**Persona:** S4 Auditor · **Priority:** M · **FRs:** FR-AUD-02

As an auditor, I want every view of a compliance document file or identity document by someone other than its owner to be recorded, so that misuse can be found.

- **Given** an admin opens a document link (US-CMP-02), **then** a view record is written with who, when and which document.
- **Given** the owner views their own document, **then** no view record is needed.
- **Given** the view record can't be written, **then** the link isn't issued. The check fails closed.

### US-AUD-03 — The audit trail can't be altered
**Persona:** S4 Auditor · **Priority:** M · **FRs:** FR-AUD-03, FR-AUD-04

As an auditor, I want audit records to be append-only and kept for the full retention period, so that they can be trusted as evidence.

- **Given** the application's database role, **then** it can insert audit records but **not** update or delete them (enforced by the database, not only by the code).
- **Given** the retention period set in NFR Requirements (at least 90 days for logs; likely longer for NDIS), **then** audit records are kept for at least that long.
- **Given** an attempt to alter an audit record, **then** it fails and the attempt is logged.

---

## E8 — Migration & Cut-over

### US-MIG-01 — Switch a domain over, and back if needed
**Persona:** S1 `apps/app` · **Priority:** M · **FRs:** FR-MIG-01

As `apps/app`, I want a per-domain setting that sends that domain's calls to the backend or to the old code path, so that a domain can move over, and back, without a deploy.

- **Given** a domain's setting is "backend", **then** all of that domain's calls go to the backend; "legacy" sends them to the old path.
- **Given** the setting is flipped back, **then** it takes effect without a deploy, and no data written through the backend is lost or unreadable by the old path.
- **Given** a domain is declared complete, **then** its legacy path is removed in a later reviewed change.

### US-MIG-02 — Keep my progress when my domain switches over
**Persona:** P1 Worker (V6) · **Priority:** M · **FRs:** FR-MIG-01, FR-MIG-02

As a worker who is half-way through onboarding, I want everything I've done to still be there after the switch-over, so that I don't start again.

- **Given** my profile sections, documents and statuses before switch-over, **then** I see exactly the same after it, including my progress percentage.
- **Given** I'm published, **then** I stay published, unless the always-required rule would now take me offline; in that case an admin reviews it first (no automatic unpublish at switch-over).
- **Given** a document I uploaded under the old path, **then** it opens through the new authorised link, and its old public URL no longer works once migration of that file completes.

### US-MIG-03 — See the same queue before and after switch-over
**Persona:** P2 Administrator · **Priority:** M · **FRs:** FR-MIG-01, FR-MIG-03

As an administrator, I want the pending list, worker details and document decisions to look the same after switch-over, so that I can keep working without disruption.

- **Given** the pending queue just before switch-over, **then** the same workers appear just after it.
- **Given** decisions I made under the old path, **then** they're visible with their dates and reviewers.

### US-MIG-04 — Legacy data is corrected safely
**Persona:** S1 `apps/app` / P2 Administrator · **Priority:** M · **FRs:** FR-MIG-02, FR-MIG-04, FR-ONB-03, FR-CMP-06, FR-CMP-08

As Remonta, I want known bad data fixed by versioned, tested scripts, so that the new rules hold for every existing record.

- **Given** workers with `'Verified'` status, **then** they get a valid status derived by the US-CMP-11 rule.
- **Given** dates of birth stored as text, **then** they're converted to real dates; values that can't be parsed are listed for manual correction, not silently dropped.
- **Given** duplicate requirement rows for one worker and document type, **then** they're merged into one, keeping the most advanced state and its file, before the unique constraint is added.
- **Given** every step, **then** it's expand/contract: both the old `apps/app` code and the backend keep working against the schema at every point; the contract step ships separately, after a backup.
- **PBT:** each script is idempotent (running it twice equals running it once) and preserves the row count of workers.

### US-MIG-05 — Existing workers get the new catalogue fairly
**Persona:** P1 Worker (V6) · **Priority:** M · **FRs:** FR-CMP-12, FR-MIG-04

As an existing worker, I want new document obligations to be added without losing anything I've already done, so that the stricter catalogue doesn't wipe out my progress.

- **Given** catalogue version 1 goes live, **then** each existing worker's obligations are recalculated; documents they already have keep their status; new ones appear as `PENDING`.
- **Given** I'm published and new obligations appear, **then** I'm **not** unpublished for that reason (Q10 A); I'm told what's newly needed.
- **Given** I chose Home Modifications or Fitness and Rehabilitation, **then** the mapping in US-CMP-12 applies and my selection is unchanged.

### US-MIG-06 — Out-of-scope areas keep working
**Persona:** P3 Account holder · **Priority:** M · **FRs:** FR-MIG-03

As a client, coordinator or admin using the areas that aren't moving yet (worker search, service requests, recruitment, reports), I want them to work exactly as before, so that the backend project doesn't break my work.

- **Given** each domain switch-over, **then** the out-of-scope flows are checked on the preview and in production (CLAUDE.md step 5): sign in, a database-backed dashboard, a form submit.
- **Given** a schema change for an in-scope domain, **then** no out-of-scope query fails.

### US-MIG-07 — Retired and unsafe endpoints are gone
**Persona:** S3 Anonymous visitor · **Priority:** M · **FRs:** FR-ONB-14, FR-CMP-11

As Remonta, I want dead and unsafe endpoints removed as their domain moves over, so that they can't be misused.

- **Given** the move of the compliance domain, **then** `POST /api/admin/fix-qualifications` and the abandoned whole-profile verification flow are removed, and calls to them return 404.
- **Given** the move of the onboarding domain, **then** indicative rates and the unused upload-token route are removed.
- **Given** any removed endpoint, **then** a test proves it's no longer reachable.

---

## Traceability — requirements → stories

Every **M** requirement maps to at least one story. S and C requirements are marked.

| FR | Pri | Stories |
|---|---|---|
| FR-ID-01 | M | US-ID-01 |
| FR-ID-02 | M | US-ID-01 |
| FR-ID-03 | M | US-ID-02, US-ID-03 |
| FR-ID-04 | M | US-ID-02 |
| FR-ID-05 | M | US-ID-03, US-ID-04 |
| FR-ID-06 | M | US-ID-03, US-ID-04 |
| FR-ID-07 | M | US-ID-05 |
| FR-ID-08 | M | US-ID-06 |
| FR-ID-09 | S | US-ID-07 — covered |
| FR-REG-01 | M | US-REG-01 |
| FR-REG-02 | M | US-REG-01 |
| FR-REG-03 | M | US-REG-02 |
| FR-REG-04 | M | US-REG-01 |
| FR-REG-05 | S | US-REG-04 — covered |
| FR-REG-06 | M | US-REG-01, US-NOT-01 |
| FR-REG-07 | M | US-REG-05 |
| FR-REG-08 | M | US-REG-03 |
| FR-ONB-01 | M | US-ONB-01, US-ONB-02 |
| FR-ONB-02 | M | US-ONB-01, US-ONB-02 |
| FR-ONB-03 | M | US-ONB-01, US-MIG-04 |
| FR-ONB-04 | M | US-ONB-03, US-CMP-12 |
| FR-ONB-05 | M | US-ONB-04 |
| FR-ONB-06 | M | US-ONB-06 |
| FR-ONB-07 | M | US-ONB-07 |
| FR-ONB-08 | M | US-ONB-03 |
| FR-ONB-09 | M | US-ONB-09 |
| FR-ONB-10 | M | US-ONB-02 |
| FR-ONB-11 | M | US-ONB-08 |
| FR-ONB-12 | S | US-ONB-10 — covered |
| FR-ONB-13 | S | US-ONB-03 (gaps made visible) — covered |
| FR-ONB-14 | M | US-ONB-02, US-MIG-07 |
| FR-CMP-01 | M | US-CMP-01 |
| FR-CMP-02 | M | US-CMP-02 |
| FR-CMP-03 | M | US-CMP-03, 04, 05, 06 |
| FR-CMP-04 | M | US-CMP-03, 04, 05, US-ONB-04, 05 |
| FR-CMP-05 | M | US-CMP-09, US-CMP-10 |
| FR-CMP-06 | M | US-CMP-11, US-MIG-04 |
| FR-CMP-07 | M | US-CMP-07, 08, 10 |
| FR-CMP-08 | M | US-ONB-04, US-MIG-04 |
| FR-CMP-09 | M | US-ONB-05 |
| FR-CMP-10 | M | US-CMP-03..08, 10, US-ID-03, US-AUD-01 |
| FR-CMP-11 | M | US-MIG-07 |
| FR-CMP-12 | M | US-CMP-12, US-ONB-03, US-MIG-05 |
| FR-ACC-01 | M | US-ACC-01 |
| FR-ACC-02 | M | US-ACC-02 |
| FR-ACC-03 | M | US-ACC-03 |
| FR-ACC-04 | M | US-ACC-02, US-ACC-05 |
| FR-ACC-05 | M | US-AUD-01 |
| FR-ACC-06 | M | US-ACC-04 |
| FR-ACC-07 | S | US-ACC-06 — covered |
| FR-ACC-08 | — | Out of scope (stays on `apps/app`) |
| FR-NOT-01 | M | US-CMP-04, US-NOT-03 |
| FR-NOT-02 | M | US-CMP-03, US-NOT-03 |
| FR-NOT-03 | M | US-CMP-07, US-CMP-08, US-CMP-09 |
| FR-NOT-04 | M | US-NOT-02, US-CMP-09 |
| FR-NOT-05 | M | US-NOT-01 |
| FR-NOT-06 | S | US-ID-03, US-ID-04, US-ACC-02 — covered |
| FR-NOT-07 | C | US-NOT-04 — covered |
| FR-AUD-01 | M | US-AUD-01 |
| FR-AUD-02 | M | US-AUD-02, US-CMP-02 |
| FR-AUD-03 | M | US-AUD-03 |
| FR-AUD-04 | M | US-AUD-03 |
| FR-MIG-01 | M | US-MIG-01, 02, 03 |
| FR-MIG-02 | M | US-MIG-02, US-MIG-04 |
| FR-MIG-03 | M | US-MIG-03, US-MIG-06 |
| FR-MIG-04 | M | US-MIG-04, US-MIG-05 |
| FR-INT-01 | M | US-REG-06 |
| FR-INT-02 | M | US-REG-06 |
| FR-INT-03 | M | US-NOT-03 |

NFRs are not turned into stories (Q5 A). Where a story depends on an NFR value (session lifetime, rate limits, lockout threshold, retention period, page size), it says "set in NFR Requirements" or "set in design".

---

## Persona ↔ story map

| Persona | Stories |
|---|---|
| **P1 Worker** | US-REG-01 (after sign-up), US-ONB-01..10, US-NOT-01, 02, 04, US-MIG-02, US-MIG-05 |
| **P2 Administrator** | US-ID-03..07, US-CMP-01..08, 10, 12, US-ACC-04, US-MIG-03, US-MIG-04 |
| **P3 Account holder** | US-ID-02, US-ACC-01, 02, 03, 05, 06, US-MIG-06 |
| **S1 `apps/app`** | US-ID-01, US-MIG-01, US-MIG-04 |
| **S2 Scheduler / queue worker** | US-REG-05, US-REG-06, US-CMP-09, US-CMP-11, US-NOT-03 |
| **S3 Anonymous visitor** | US-REG-01..04, US-MIG-07 |
| **S4 Auditor** | US-AUD-01..03 |

## INVEST check

| Criterion | How it was applied |
|---|---|
| **Independent** | Each story delivers on its own once E1 (tokens, R-AUTH) exists; E1 is the only hard prerequisite, and cross-references are to shared rules, not ordering |
| **Negotiable** | Values still to be set (lifetimes, thresholds, page sizes, retention) are left to NFR/Functional Design and marked so |
| **Valuable** | Each story names a persona and a "so that" outcome; system stories name a system actor and an externally visible result |
| **Estimable** | Each story is bounded to one outcome and 1–4 FRs |
| **Small** | The larger candidates were split: document review into approve / reject / reset / re-date; expiry into the job (US-CMP-09), the admin list (US-CMP-10) and warnings (US-NOT-02); the catalogue into versioning (US-CMP-12) and existing-worker migration (US-MIG-05) |
| **Testable** | Every story has Given/When/Then criteria; 15 stories name a PBT property |
