# Personas — Remonta Backend, first release

**Sources:** `requirements.md` §4 (Actors); `.brd/phase-2` §2.1–2.4; `story-generation-plan.md` (Resolved decisions: Q7 A one worker persona with variations, Q8 A one administrator persona).

The first release covers **identity, worker registration, onboarding, compliance verification, account and access, and worker-lifecycle notifications**. Everything else stays on `apps/app`, unchanged.

---

## Human personas

### P1 — Worker (supply side)

> *"I want to get verified and visible to clients quickly, and I need to know exactly what's still missing."*

| | |
|---|---|
| **Who** | A disability support worker, cleaner, gardener, nurse, therapist or personal trainer offering services through Remonta. Signs up without help, often on a phone |
| **Goals** | Finish registration without friction; know exactly which documents each chosen service needs; get documents reviewed and the profile published; be warned before anything expires |
| **Frustrations today** (`.brd`) | Told to "check your email to verify" when no email is coming (J1.10); no word when a document is approved or rejected (§5.4 #1); expiry dates change nothing and nobody warns them (§4.3); the progress bar can disagree with reality (§4.10) |
| **Touches in the first release** | Registration (J1), all onboarding sections (J2), document upload and replacement, their own document statuses, a masked view of their own bank details, notifications, sign-in / password / OTP (J8) |
| **Does not touch** | Other workers, clients, participants, service requests; publishing themselves; approving their own documents; reading their full stored bank details |

**Variations called out in acceptance criteria (Q7 A):**

| Variation | Why it matters |
|---|---|
| **V1 — ABN vs TFN engagement** | Different engagement election and signature; the ABN/TFN value itself is never stored (FR-ONB-07) |
| **V2 — Single vs multiple service lines** | The requirements engine removes duplicates across lines; e.g. Support Worker + Nursing need the union of both lists, each document once (FR-ONB-04) |
| **V3 — Service line with a mapped catalogue entry** | Home Modifications uses the Home and Yard Maintenance list; Fitness and Rehabilitation is Personal Trainer (F1 A) |
| **V4 — Transport provider** | Support Workers who provide transport also owe driver's licence, car registration and car insurance (catalogue: conditional `transportDocuments`) |
| **V5 — Returning after expiry** | Published, then a document expires; they must replace it, and the profile goes offline if it's always-required (F2b A) |
| **V6 — Existing worker at switch-over** | Registered on the old code path; mid-onboarding or already published when their domain moves to the backend (Q6 A) |

---

### P2 — Administrator (Remonta staff)

> *"I need to see who's waiting, check documents safely, and make decisions I can stand behind later."*

| | |
|---|---|
| **Who** | Remonta staff who review compliance documents, publish worker profiles, and suspend or reactivate accounts. One tier: every admin can do every admin action (FR-ID-08, Q8 A) |
| **Goals** | A reliable queue of pending workers; open documents safely; approve, reject, reset and date documents; publish only workers who meet the legal minimum; see expiring and expired documents; impersonate a user to troubleshoot; know every decision is recorded |
| **Frustrations today** (`.brd`) | Publication checks nothing (§4.3); expiry has no effect (§4.3); permission failures look like outages (HTTP 500, §2.4 #3); admin accounts exist only by running scripts (§2.1); no record of who changed what (§2.6) |
| **Touches in the first release** | Compliance console (J3), publish/unpublish, the expired-documents list, suspend/reactivate (J7.4), impersonation (J7.7), MFA sign-in |
| **Does not touch** | Workers' stored bank details: **no one reads them in the first release** (OI-04, F3.2 A); editing a worker's profile content; the out-of-scope admin areas (reports, AI search, share links), which stay on `apps/app` |

---

### P3 — Account holder: Client / Coordinator (demand side)

> *"When I sign out or change my password, my account should really be closed off."*

| | |
|---|---|
| **Who** | Clients arranging support for themselves or a relative, and support coordinators acting for several participants |
| **Goals** in scope | Their session ends everywhere when they sign out or change password; a suspension or reactivation is immediate and they're told about it; password reset and OTP work without exposing their account |
| **Touches in the first release** | Identity only: sessions, account status, password and OTP flows (FR-ID, FR-ACC) |
| **Does not touch** | Everything else. Participants, service requests, worker search and profile edits stay on `apps/app` (FR-ACC-08, FR-MIG-03) |

> **Note:** stories that apply to *every* signed-in user (P1, P2 and P3) name the persona **"Account holder"**.

---

## System actors (Q5 A)

| ID | Actor | What it does in stories |
|---|---|---|
| **S1** | **`apps/app`** | The Next.js application. Swaps a NextAuth sign-in for a short-lived backend token and calls the backend for the user; switches each domain between its old path and the backend (FR-ID-02, FR-MIG-01) |
| **S2** | **Scheduler / queue worker** | Runs the daily expiry check, sends notifications, geocodes, delivers the n8n registration webhook; retries and dead-letters failures (Q12 A) |
| **S3** | **Anonymous visitor** | Someone not signed in. May only reach worker registration and the public account flows (password reset request, OTP), rate-limited and CAPTCHA-protected (`.brd/phase-2` §2.2) |
| **S4** | **Auditor / compliance reviewer** | Whoever relies on the audit trail later: Remonta management, an NDIS or privacy investigation. They read the record; they don't act in the system (C7 A) |

---

## Persona ↔ epic map

| Epic | P1 Worker | P2 Admin | P3 Account holder | S1 `apps/app` | S2 Scheduler | S3 Anonymous | S4 Auditor |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| E1 Identity & Sessions | ● | ● | ● | ● | | | |
| E2 Registration (J1) | | | | | ● | ● | |
| E3 Onboarding (J2) | ● | | | | | | |
| E4 Compliance Verification (J3) | ● | ● | | | ● | | |
| E5 Account & Access (J8) | ● | ● | ● | | | ● | |
| E6 Notifications | ● | | | | ● | | |
| E7 Audit | | | | | | | ● |
| E8 Migration & Cut-over | ● | ● | ● | ● | | | |

The per-story map is at the end of `stories.md`.
