# worker-activation: requirements (2026-10-23)

## Intent analysis

- **User request (verbatim):** "In the admin dashboard, I want to change the Active and Inactive status on how they
  works. The worker can be active if the admin only set it to active so by default they are not active"
- **Request type:** Enhancement (the admin dashboard's Active switch gets a new meaning) with a data change
- **Scope:** Multiple components: `packages/db` (a column + a migration that sets everyone inactive),
  `packages/api-contract` + `apps/api` (the switch's write, the admin search's status and filter), `apps/app` (the
  card switch, the status filter, a suspend action on the worker's admin page, the client search, the public list,
  the worker's dashboard note)
- **Complexity:** Moderate: one new flag, but it changes who appears in the client and public lists, and it splits
  today's switch into two separate admin actions
- **Answers:** chat (a new admin-set flag, separate from login; reset everyone), `requirement-verification-questions.md`
  (Q1 a, Q2 "Just set them to Inactive, the workers can still sign in, admins can still search but they need to tick
  the worker whether they are active or not.", Q3 a, Q4 a, Q5 a, Q6 a, Q7 b, Q8 c, Q9 a; Security A, Resiliency A,
  PBT A) and chat follow-up F1 (inactive workers apply to jobs as now).

## Today (inventory)

- The card's **Active** switch writes `users.status` ACTIVE <-> SUSPENDED (`PATCH /api/admin/contractors/[id]/status`).
  SUSPENDED blocks sign-in, the api token, password set-up and impersonation.
- The admin search (`apps/api`, `filters.ts` `ACTIVE`), the client search (`/api/client/workers`) and the public list
  (`/api/public/workers`) show only `users.status = 'ACTIVE'`. "Show Inactive Workers" lists SUSPENDED accounts
  (`GET /v1/admin/workers/suspended`).
- Verify Compliance writes `worker_profiles.isPublished` (unchanged by this cycle).

## Functional requirements

**FR-1 A new activation flag.** Each worker has an admin-set activation flag, separate from `users.status` and from
`isPublished`. It never affects sign-in, the api token, password set-up, impersonation, the worker's dashboard or
their job applications (F1).

**FR-2 Inactive by default.** Every new worker (the `apps/api` sign-up and any other path that creates a worker
profile) starts **inactive**. Only an admin switching them on makes them active.

**FR-3 Reset at release (chat, Q2).** When the change goes live, **every existing worker becomes inactive**, the 1,765
included, whatever their compliance state. No bulk activation; admins switch workers on one by one from the cards.
Accepted consequence: the client search and the public list show **no workers** until admins activate some.

**FR-4 The card switch (Q2, Q9 a).** The Active switch on each admin search card sets the new flag on or off, for ADMIN
and SUPER_ADMIN. The card shows the worker's state (switched off = greyed as today) and stays in the results after a
change (the search no longer drops it).

**FR-5 Where inactive hides a worker (Q1 a).** An inactive worker is hidden from the **client worker search** and the
**public worker list**; both show only workers who are active (new flag) **and** not suspended (`users.status =
'ACTIVE'`, as today).

**FR-6 Admin search: everyone, with a filter (Q3 a).** The admin search returns active and inactive workers (still not
suspended accounts, as today), each with its state, and takes a filter **Status: All / Active / Inactive**, default
**All**, kept in the URL like the other filters. The unplaced-workers note keeps counting non-suspended workers.

**FR-7 Suspension stays, as its own action (Q4 a).** The worker's admin page gets **Suspend account / Restore account**,
writing `users.status` SUSPENDED <-> ACTIVE exactly as the switch does today (ADMIN and SUPER_ADMIN). The dashboard's
"Show Inactive Workers" becomes **"Suspended accounts"** (same list, same Restore). Suspending does not change the
activation flag, and restoring does not activate.

**FR-8 Today's suspended accounts (Q5 a).** Stay suspended (cannot sign in) and also become inactive under FR-3.

**FR-9 Independent of Verify Compliance (Q6 a).** Activation and `isPublished` are separate decisions; neither sets,
requires or clears the other.

**FR-10 The worker's note (Q7 b).** While inactive, the worker's dashboard shows a note: "Your profile is awaiting
approval by Remonta" (wording to confirm in design). It disappears once active. No email.

**FR-11 No stored record (Q8 c).** No who/when columns and no audit table row for the switch. The api's structured
request log (SECURITY-03) still records each call with the admin's id.

## Non-functional requirements

- **NFR-1 Security (baseline A, blocking):** the write is admin-only, checked server-side on every request (the bearer
  token minted from the session; ADMIN or SUPER_ADMIN); the flag is never settable by a worker (not in any worker or
  sign-up body); rate-limited per admin like the other admin entries; no PII in logs.
- **NFR-2 Dynamic by default:** the switch is a contract entry in `packages/api-contract` with one handler in
  `apps/api`, called through `createClient`; the status filter is one filter row. No new hand-written Next route for
  the switch.
- **NFR-3 Release order and rollback (Resiliency A; SLA 99.9 %, RTO ≤ 30 min, RPO ≤ 5 min carried):** the migration is
  expand-only (a new column, default inactive) so the previous api and app keep working on it; the api is promoted
  before the app PR merges (follow-up 32); rollback = previous api image + Vercel promote, the column stays. The reset
  is part of that migration (a one-time statement on existing rows), reviewed against the staging copy first.
- **NFR-4 Testing (PBT A, full):** properties for the status filter combined with the existing filters (All = Active ∪
  Inactive, disjoint) and for list visibility (a worker appears in the client/public list iff active and not
  suspended); database tests in CI for the write, the filter and the migration's reset.
- **NFR-5 Caching:** the admin list's 60 s private cache and ETag must not show a stale state to the admin who just
  switched a card (the card updates from the write's answer); the client job/worker caches are noted in design.

## Out of scope

Bulk activation; an email on activation; a who/when record; changing Verify Compliance; blocking job applications.

## Risks

- **R-1 Empty client and public lists at release** (accepted by the user, FR-3). Releasing at a time when admins can
  start activating straight away limits the gap.
- **R-2 Admins lose the one-click suspend from the card**; it moves to the worker's admin page (FR-7).
