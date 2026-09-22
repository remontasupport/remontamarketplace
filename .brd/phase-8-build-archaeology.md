# Phase 8 — Build archaeology

443 commits, 2025-09-24 → 2026-08-27, **all by a single author**
(`bacatanclentvincent@gmail.com`, 443 of 443). The audit's note that 344 commits show as
`unknown` refers to the commit *name* field; the email is constant. **Effective bus factor
is one.**

## 8.1 Commit volume by month

| Month | Commits | |
|---|---:|---|
| 2025-09 | 20 | project start (24 Sep) |
| 2025-10 | 106 | peak |
| 2025-11 | 36 | |
| 2025-12 | 81 | |
| 2026-01 | 98 | second peak |
| 2026-02 | 41 | |
| 2026-03 | 47 | "finalized the version 2" (26 Mar) |
| 2026-04 | 6 | **the break** |
| 2026-05 | 0 | |
| 2026-06 | 1 | |
| 2026-07 | 3 | |
| 2026-08 | 4 | |

**429 of 443 commits (97%) fall in the first seven months.** The last five months contain
14. The transition is abrupt, not gradual: 47 commits in March, 6 in April, 0 in May.
Whether that is deliberate (feature-complete, moved to another project, funding, staffing)
is not derivable and is the first question in the gap register — it determines whether this
is a system to fix or a system to freeze.

## 8.2 Rough build order of major features, by first commit

| Date | Feature area | Commits | Last touched |
|---|---|---:|---|
| 2025-09-24 | Project start; location capture | — | — |
| 2025-10-01 | **Worker registration** | 29 | 2026-02-18 |
| 2025-10-02 | **CRM contractor directory** (`/api/contractors`, `ContractorProfile`) | 14 | 2025-12-10 |
| 2025-10-10 | Structured logger | 2 | 2025-12-10 |
| 2025-10-20 | SMS phone verification | 2 | 2025-12-10 |
| 2025-10-21 | **Worker dashboard and onboarding** | 75 | 2026-04-22 |
| 2025-10-21 | Client dashboard (scaffolded early, built later) | 30 | 2026-03-19 |
| 2025-10-21 | Whole-profile verification workflow (`src/lib/verification.ts`) | 3 | 2025-12-10 |
| 2025-10-21 | Fourth worker search (`src/lib/worker-search.ts`) | 5 | 2025-12-26 |
| 2025-10-21 | Feature-access gating (`src/lib/feature-access.ts`) | 2 | 2025-12-10 |
| 2025-11-28 | **Document catalogue as `categories.json`** | 2 | deleted 2025-12-04 |
| 2025-12-16 | Admin AI chat | 2 | 2025-12-18 |
| 2025-12-17 | Admin reports | 4 | 2026-04-23 |
| 2025-12-31 | Admin impersonation | 3 | 2026-01-16 |
| 2026-01-07 | Profile share links | 1 | 2026-01-07 |
| 2026-01-21 | Client/coordinator registration validation | 8 | 2026-03-04 |
| 2026-01-24 | **Per-document admin compliance workflow** | 6 | 2026-08-27 |
| 2026-01-27 | **Contract and code-of-conduct content** | 2 | 2026-01-29 |
| 2026-01-30 | **Service requests** | 19 | 2026-03-18 |
| 2026-02-03 | **Coordinator dashboard** (copy of the client one) | 19 | 2026-03-19 |
| 2026-02-19 | **Zoho vacancy sync + job applications** | 3 / 1 | 2026-02-21 / 2026-02-19 |
| 2026-03-19 | Public worker feed | 1 | 2026-03-19 |
| 2026-03-23 | Email OTP verification | — | — |
| 2026-03-26 | **"finalized the version 2"** — upload queue, compliance upload route, apply gate | — | — |
| 2026-04-09 | Admin AI search | 1 | 2026-04-09 |
| 2026-04-23 | Agreement report generator | — | — |
| 2026-07-09 | Standalone recruitment application form | 1 | 2026-07-09 |

**Reading the order as product strategy:** the supply side was built first and almost
exclusively for four months (worker registration, worker dashboard, worker onboarding — 104
of the first ~160 commits). The demand side scaffolded in October and was not actually
built until late January. **Recruitment — the vacancy board and applications — arrived last,
in February 2026, and got four commits in total.** The product's own build order says
worker supply and compliance were the business; demand-side self-service came second; and
recruitment was a late, thin addition.

## 8.3 Features whose commits stop abruptly — the abandoned intentions

Each of these received one or two commits and was never returned to, and each is Dead or
Partial in Phase 3.

| Feature | Commits | Stopped | Phase 3 status |
|---|---:|---|---|
| **Whole-profile verification workflow** (`src/lib/verification.ts` + `/api/admin/verification`) | 3 | 2025-12-10 | **Dead and non-functional** — writes four columns that do not exist. Superseded on 2026-01-24 by the per-document routes |
| **Feature-access gating on verification status** (`src/lib/feature-access.ts`) | 2 | 2025-12-10 | **Dead** — the only module that would have gated features on `verificationStatus === 'APPROVED'` |
| **Structured logging** (`src/lib/logger.ts`) | 2 | 2025-12-10 | **Dead** — every method body emptied on 2025-12-10 by the commit `7c488d3 "deleted all the console logs"` |
| **SMS phone verification** | 2 | 2025-12-10 | **Dead** — `Step7Verification` never mounted; two incompatible in-memory stores |
| **Fourth worker search** (`src/lib/worker-search.ts`) | 5 | 2025-12-26 | **Dead** — and it is the only search that filtered on verification status |
| **CRM contractor directory** (`ContractorProfile`, `/api/contractors`, `/remontaadmin/findsupport`) | 14 | 2025-12-10 | **Partial** — live, unauthenticated, and no code in the repo writes its table |
| **Admin AI chat** | 2 | 2025-12-18 | **Partial** — complete component, mount commented out at `src/app/admin/layout.tsx:57` |
| **Profile share links** | 1 | 2026-01-07 | Live |
| **Job applications** | 1 | 2026-02-19 | Live, but with a two-value status enum and no outcome |
| **Public worker feed** | 1 | 2026-03-19 | Live, unauthenticated, and its `isPublished` filter exists only as a comment |
| **Admin AI search** | 1 | 2026-04-09 | Live, wholly dependent on an external webhook |
| **Standalone recruitment application** | 1 | 2026-07-09 | Partial — a second, parallel application mechanism |
| **Document catalogue as versioned data** | 2 | deleted 2025-12-04 | The rules now exist only in the database, unversioned |
| **Database seeding** (`prisma/seed.ts`) | — | deleted 2025-12-11 | The catalogue can no longer be reproduced from the repository |

Two deletions on consecutive days in December 2025 deserve naming together:
`184aeb9` (2025-12-04, "fixed the admin") removed `categories.json`, and `828ad7b`
(2025-12-11, "deleted the seed.ts") removed the seeder. Between them they removed the
**only versioned, reviewable statement of which documents each service line requires** —
the business's core compliance rule set. It now lives solely as rows in a production
database applied by `prisma db push` with no migration history (audit DB-02). This is
recoverable from git and should be (Phase 4 §4.3 reproduces it).

`7c488d3` (2025-12-10, "deleted all the console logs") is the direct cause of the ~20 empty
`catch` blocks and the emptied logger the audit flags as its highest-leverage finding
(XC-01). It is worth stating as a decision rather than a defect: observability was
deliberately removed, in one commit, and never replaced.

## 8.4 Built during the slowdown — extra scrutiny before classifying as Live

Everything first committed after 2026-04-01 is in this bucket. Fourteen commits, eight
distinct pieces of work:

| Date | Work | Verdict after inspection |
|---|---|---|
| 2026-04-02 | "add the editable feature" — admin editing of contractor profiles | **Live** (`/admin/contractors/[id]`, `PATCH /api/admin/contractors/[id]`) |
| 2026-04-09 | "add the AI search feature" | **Live but externally gated** — the component is misleadingly named `SearchByAIPlaceholder` yet is fully implemented (`admin/manage/page.tsx:114-160`); returns HTTP 500 unless `AI_SEARCH_WEBHOOK` is set |
| 2026-04-22 | "added the new feature to the admin dashboard" + "fixed the upload more photos" | **Live** — additional-photos modal, admin photo picker; last change to `prisma/auth-schema.prisma` |
| 2026-04-23 | "added a generator for the agreement" | **Live** — `GET /api/admin/reports/agreement/[type]` |
| 2026-04-25 | "fixed the compliance-tab" | **Live** |
| 2026-06-11 | "fixed the intro" | trivial |
| 2026-07-06 | "fixed the suburb api" | trivial |
| 2026-07-09 | "created the application form" + "fixed the build error" | **Partial** — `/apply` + `POST /api/apply`. A **second** application mechanism alongside `/api/worker/jobs/apply`, touching no database, wholly dependent on `APPLY_WEBHOOK_URL`. One commit, never revisited. Treat as an unfinished pivot toward Zoho-native recruitment |
| 2026-08-21 / 08-27 | code-of-conduct fixes; "separated the first aid to cpr"; "replaced the link to the hygeine training"; "added the CTP" | **Live** — all content edits to the compliance document set. The **only** work in the last four months, and all of it is compliance-catalogue maintenance |

**The most useful signal in this phase:** the final four commits of the project's life are
all adjustments to *which compliance documents are required and where the training lives*.
Whatever else stopped, the compliance catalogue was still being maintained in August 2026.
That is where the business's attention was.

## 8.5 Where the schema churned most — concepts the team kept re-deciding

`prisma/auth-schema.prisma` is the single most-changed file in the repository: **49 of 443
commits (11%)**, excluding generated code. Reading its commit messages in order isolates
four concepts that were re-decided repeatedly:

**1. How a worker's services are structured — at least four revisions.**
`2026-01-08 "changed the services schema"` → `2026-01-23 "changed the unqiue services
format"`, plus six hand-written SQL files in `prisma/migrations/`
(`migrate_worker_services_to_arrays.sql`, `..._v2.sql`, `backup_worker_services.sql`,
`quick_restore_and_migrate.sql`, `restore_worker_services_from_backup.sql`) and a dated
backup table `worker_services_backup_20260108` still declared in the production schema
(`prisma/auth-schema.prisma:442-454`). A migration that needed a rollback bolted onto it,
twice. **Question for the founders: what does a "service a worker offers" actually need to
express?** The current answer — one row per category with specialisations as parallel string
arrays — is the fourth attempt.

**2. Who the person receiving support is, and their relationship to the account holder.**
`2026-03-05 "fixed the relationship field"`. The repository now contains **three separate
vocabularies** for this one concept: the orphan Prisma enum `RepresentativeType` (SELF,
PARENT, GUARDIAN, FAMILY_MEMBER, LEGAL_REPRESENTATIVE, OTHER — referenced by no model,
`prisma/auth-schema.prisma:510-517`); a free-text `Participant.relationshipToClient`
(`:90`); and a zod enum with different members (PARENT, LEGAL_GUARDIAN, SPOUSE_PARTNER,
CHILDREN, OTHER, MYSELF — `src/schema/registrationSchema.ts:84`). Plus a fourth framing in
the UI's three-way "who is this account for?" fork. **Four models of the same relationship.**

**3. The service-request lifecycle.**
`2026-02-26 "added the webhook url"` → `2026-02-27 "added the archived functionality"` →
`2026-02-27 "fixing the schema"` → `2026-02-28 "changed the flow of the manage Request"` →
`2026-03-19 "fixed the archived"`. Five commits in three weeks on request states. The
outcome is the six-state enum plus a `details._hidden` JSON flag for a *seventh*, soft-deleted
state (`api/client/service-request/[id]/route.ts:299-305`) and raw SQL in five page
components to handle it. **The archived/deleted distinction was clearly contested.**

**4. Worker engagement type.**
`2026-01-15 "added the engagement type"`, followed by the ABN/TFN contract pair on
2026-01-27. The stored shape is deliberately minimal — type plus a signed flag, with the
ABN or TFN value **not** stored (`src/schema/workerProfileSchema.ts:172`). That is a
considered privacy decision and worth confirming as intentional.

Other high-churn files corroborate where the difficulty was: worker registration (29
commits), the admin dashboard client (29), the worker account-setup wizard (28), the admin
contractor route (26), the worker sidebar (25), and the two worker-profile routes (24 each).
The three worker setup wizards carry 22–28 commits apiece — which the audit attributes to
the `setupProgress` race losing users' completion flags (audit DB-07). **The most-worked,
most-rewritten surface in the entire product is worker onboarding.** That is consistent with
it being both the hardest problem and the business's primary funnel.

## 8.6 What the history says that the code alone does not

1. **The product started as an Upwork-style two-sided marketplace with rates, messaging and
   payments** (`docs/structure.md:1-2`, `src/types/index.ts:32-58`) and became a compliance
   and profile system feeding a CRM-operated matching process. That pivot is not recorded
   anywhere except in the residue.
2. **Supply came first and stayed first.** Worker-side work dominates the first four months
   and the last four months.
3. **Verification was redesigned once, from whole-profile to per-document**, in January
   2026 — and the old design was left in place, dead, still referenced by a live route.
4. **Observability was deliberately deleted**, in one commit, in December 2025.
5. **The compliance rule set was de-versioned** in December 2025 and now exists only in a
   production database with no migration history.
6. **A second recruitment-application path was started in July 2026 and abandoned after one
   commit** — the most recent feature attempt, and unfinished.
7. **One person built all of it.** Every estimate, every risk assessment and every
   remediation plan in the audit needs to be read against a team of one.
