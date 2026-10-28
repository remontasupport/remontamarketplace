# Execution plan: admin clients and coordinators (2026-10-28)

Requirements: `inception/requirements/requirements.md` (approved 2026-10-28).

## Stages

| Stage | Decision | Why |
|---|---|---|
| User Stories | SKIP | one actor (admin), behaviour fixed by FR-1..FR-10 |
| Application Design | SKIP | fits the existing layers (contract -> pipeline -> handler; app glue -> UI) |
| Units Generation | SKIP | two units, below |
| Functional Design | EXECUTE, per unit | the list SQL and filters, the unlock grant, the status change + outbox event, the page structure |
| NFR Requirements | SKIP | in the requirements (NFR-1..NFR-6) |
| NFR Design | EXECUTE, shared | the unlock (shared-password hash, attempt limit, grant lifetime), audit, freshness, no live n8n on staging |
| Infrastructure Design | SKIP | two Secret Manager values per stage added to `infra/lib/stages.ts`, in U1's code plan |
| Code Generation | EXECUTE, per unit | |
| Build and Test | EXECUTE | gates, staging check script, preview checklist, production checks |

## Units

**U1 `clients-api`** (`apps/api`, `packages/api-contract`, `packages/db`, `infra`)
- Contract entries in the admin area: the two lists, the detail (profile + owned participants + their requests,
  sensitive fields absent), the unlock (shared password -> a short-lived grant), the sensitive read of one
  participant (needs the grant), the request status change (`audit` declared).
- Persistence: one list query serving both roles; one detail read.
- The status change writes the row, the audit row and an outbox event in one transaction; a new outbox handler posts
  to the n8n webhook (retries and dead-lettering by the existing dispatcher).
- Migration (expand-only): new `AuditAction` values. Config: the password hash and the n8n URL, per stage.
- Order: merge -> staging check script -> promote -> then U2 may merge.

**U2 `clients-app`** (`apps/app`)
- `features/admin-clients/`: the api client calls, the list and the detail page, written once and used by both the
  Clients and the Support Coordinators tabs (role as a parameter); the two placeholders removed.
- The unlock dialog and the status control on the detail page.
- Merges only after U1's promotion (the order that held for worker-activation).

## Code structure principles (user, 2026-10-28: "a good code and file structure, avoid repetitive code and abstraction")

Read as: no repeated code, **and** no abstraction beyond what removes real repetition.

- **CS-1 One implementation for both roles.** Clients and coordinators differ by role and one column (organisation):
  one query, one handler factory or one parameterised entry, one list component, one detail component. No
  `ClientsList` beside a `CoordinatorsList`.
- **CS-2 Reuse what exists before writing new.** `adminRead` limits, the pipeline's audit (`platform/audit.ts`), the
  outbox (`platform/outbox`), the paging schema, `createClient(contract)`, the admin search's list/paging UI where it
  fits, the n8n URL config pattern (`N8N_REGISTRATION_WEBHOOK_URL`). The client dashboard's request rendering is
  reused for `details` if it is presentational; otherwise extracted once and shared.
- **CS-3 Rules live once.** The status values from the Prisma enum / one Zod enum in `packages/schemas`; the sensitive
  field list declared once and used by both the api (what to withhold) and the app (what to show locked).
- **CS-4 No speculative layers.** No generic "admin entity" framework, no repository interfaces with one
  implementation, no options nobody asked for. A helper exists when two callers need it.
- **CS-5 Follow the module layout** (`modules/admin/{application,domain,persistence}`, `features/<area>/`); files named
  for what they do; the existing comment density.
- Each code plan lists what it reuses and what it adds; the code summary checks for duplicates before the PR.
