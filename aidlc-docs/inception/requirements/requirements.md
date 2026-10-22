# worker-tools: requirements (2026-10-22)

## Intent analysis

- **User request (verbatim):** "I want to add a lists of a cleaning tools and yard and maintenance tools to the worker's
  dashboard if their services have cleaning and yard and maintenance"
- **Request type:** New feature (enhancement of the worker's Services pages and the admin search)
- **Scope:** Multiple components: `packages/schemas` (the lists), `packages/db` (a migration), `packages/api-contract`
  + `apps/api` (the write, the profile read, the admin filter), `apps/app` (the Services step, the admin search and the
  worker's admin page, a sign-up note)
- **Complexity:** Simple to moderate: one new write following existing patterns; the filter follows `experienceAreas`
- **Answers:** `requirement-verification-questions.md` (Q1 a, Q2 a, Q3 b, Q4 b, Q5 c, Q6 a, Q7 a, Q8 b, superseded by
  F4) and `requirement-clarification-questions.md` (F1 a, F2 a, F3 a, F4 "Do not show it, it's on the dashboard only but
  add a note ...").

## Functional requirements

**FR-1 The two tool lists.** One declaration in `packages/schemas` (like `experienceAreas.ts`), read by the app and the
api: 14 tools for Cleaning Services and 15 for Home and Yard Maintenance, exactly as approved in F1. Each tool has a
stable id (e.g. `vacuum-cleaner`) and a label; the database stores ids, so a label can be reworded without a data
change. The list is keyed by the catalogue's category id (`cleaning-services`, `home-yard-maintenance`); another
service can get a list later by adding an entry.

**FR-2 The worker's checklist (Q1 a, Q2 a).** On the dashboard, in Services → *Cleaning Services* and Services → *Home and
Yard Maintenance* (the existing step per chosen service), a "Your tools" checklist of that service's list, below the
optional certificate upload. Ticking and saving stores the worker's tools for that service. Shown only for a service the
worker has chosen and that has a list; other services' steps are unchanged.

**FR-3 Other tools (Q4 b, F2 a).** Under the checklist, up to **5** free-text tools per service, **60 characters**
each: trimmed, blanks dropped, duplicates (ignoring case, and any that equal a listed label) removed.

**FR-4 Saving.** One save per service replaces that service's ticked ids and other tools together. Refused with a field
message when the service is not chosen (404, as `putServiceRegistration`), an id is not on that service's list, or an
Other entry breaks FR-3. Saving an empty selection is allowed (clears it).

**FR-5 Read back.** The api returns each service's tools (by its own read, not the profile read: U1 BR-11, 2026-10-22) (ids and other tools), so the step shows
what was saved after a reload.

**FR-6 Removed with the service (Q7 a).** Removing the service deletes its tools; choosing it again starts empty.

**FR-7 Admins see them (Q5 c).** The worker's admin page shows, per service, the ticked tools (labels) and the other
tools.

**FR-8 Admin search filter (Q5 c, F3 a).** The admin worker search (`GET /v1/admin/workers`) takes a `tools` filter: ids
from the two lists; a worker matches only if they have **all** the chosen tools. Other (free-text) tools are never
searched. The dashboard offers the two lists to pick from. Combines with the existing filters (AND).

**FR-9 Not part of completion (Q6 a).** Tools never change the completion percent, the Services group's done state or
the reminder dot.

**FR-10 The sign-up note (F4).** The sign-up form asks nothing about tools. When Cleaning Services or Home and Yard
Maintenance is ticked on "What services can you offer?", a note shows under the services question. Your wording was
"Some of the jobs required your personal tools, please be ready"; proposed with the grammar fixed: **"Some jobs require
your own tools, so please be ready to bring them."** (confirm at approval). Nothing is sent or stored for it.

## Non-functional requirements

- **NFR-1 Security (baseline on, blocking).** Only the signed-in worker writes their own tools (the existing worker
  token and `workerWrite` meta: rate limit, body limit, audit); ids checked against the fixed list on the server; Other
  text length-limited, control characters refused, and rendered as plain text everywhere (no HTML); the admin filter
  takes only listed ids. Admin reads stay admin-only.
- **NFR-2 Resiliency (baseline on).** The migration is expand-only (new columns with empty defaults on `worker_services`),
  so a rollback of the api or the app leaves the data valid; a failed tools save shows a message and keeps the
  worker's ticks on screen to retry, and never blocks the rest of the step; the admin filter adds no more than an
  indexed array test to the one search statement (p95 unchanged within noise).
- **NFR-3 Property-based testing (full).** Properties at least: the Other normalisation is idempotent and never yields
  more than 5 entries of more than 60 characters; ids survive a save/read round trip unchanged and in list order; the
  all-of filter matches exactly the workers whose tools contain the chosen set (checked against a reference
  implementation); the declaration has unique ids per service.
- **NFR-4 Delivery.** The api and its migration ship first (staging, the preview checklist, then promotion); the app
  after, per CLAUDE.md. The sign-up note is app-only and can ship with the app PR.
- **NFR-5 Docs.** `docs/admin/README.md` (the filter) and `docs/worker/README.md` (the write and the read) updated in the
  same PRs.

## Proposed shape (for Workflow Planning; not yet a decision)

- Storage: two columns on the `worker_services` row, `toolIds text[]` and `otherTools text[]`, default empty, the all-of filter
  per service through the existing unique index (U1 BR-12: no GIN index). On the service's own row, FR-6 is automatic. (The
  `metadata` Json holds the registrations; it was considered: harder to validate and to index.)
- Contract: `PUT /v1/worker/services/:categoryId/tools` (one entry, one handler); `tools` on `workerServiceSchema`;
  `tools` query param on the admin workers entry.
- Two units: **U1 `tools-api`** (schemas list, migration, entry, read, admin filter and the admin page's read);
  **U2 `tools-app`** (the checklist on the Services step, the admin filter UI and page, the sign-up note).

## Out of scope

Tools at sign-up beyond the note; tools for other services; clients seeing tools (public or shared profile); tools in
the client search; any requirement that a tool be held.
