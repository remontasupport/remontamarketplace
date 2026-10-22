# U1 `tools-api`: functional design plan (2026-10-22)

Inputs: `inception/requirements/requirements.md` (FR-1..FR-10, NFR-1..5), `inception/plans/execution-plan.md`.

## Steps
- [ ] The tool declaration (`packages/schemas`): ids, labels, keyed by category id; the Other normalisation
- [ ] Domain entities: the two `worker_services` columns; the view on the profile read
- [ ] The write `putServiceTools`: inputs, rules, errors, audit, completion untouched
- [ ] The read: tools per service on `GET /v1/worker/profile`; stale ids
- [ ] The admin filter `tools` (all-of) in the filter registry; its validation
- [ ] The admin page's read of a worker's tools (Q1)
- [ ] Business scenarios and edge cases; PBT properties named for NFR Design

## What I found that shapes the design
- `PUT /v1/worker/services` **keeps** a kept service's row (it updates only names/sub-categories) and deletes a removed
  one: tools on that row survive edits and go with removal (FR-6) with no extra code.
- `worker_services.metadata` holds the nursing/therapeutic registration: tools get their own columns.
- The admin filters are one registry row each (`apps/api/src/modules/admin/application/filters.ts`); `experienceAreas`
  is the model (`&&` there; all-of here is `@>`).
- The worker's admin page reads `/api/admin/contractors/[id]`, a Next route on Prisma in the app; there is no admin
  api read of one worker today.

## Questions

### Q1: The admin page's read of a worker's tools
A) Add the tools to the existing app route `/api/admin/contractors/[id]` (a field more in its Prisma select; done in U2;
   smallest)
B) A new api entry `GET /v1/admin/workers/:workerId/services` (admin-only, on the api pipeline; done in U1; the start of
   moving that page to the api, follow-up 21)
X) Other (please describe after [Answer]: tag below)

[Answer]: 

### Q2: The admin search's result cards
A) Unchanged: the tools filter narrows the list; tools are seen on the worker's page
B) When the tools filter is used, each card also lists the matched tools
X) Other (please describe after [Answer]: tag below)

[Answer]: 

## Decided without a question (say if any is wrong)
- **Stored in list order, not tick order**; ids are deduplicated. The answer of a save is what the read returns.
- **A tool later removed from the list**: its id is skipped on read and dropped by the worker's next save; never an error.
- **Other entries**: trimmed, inner spaces collapsed, empty dropped, case-insensitive duplicates and copies of a listed
  label (which is ticked instead) removed; then at most 5 of at most 60 characters, else 400 with a field message.
  Control characters refused.
- **A service with no list** (e.g. Support Worker): the write answers 404 like a service not chosen; the read returns
  empty tools for it.
- **Completion untouched** (FR-9): the write does not recompute completion.
- **Audit**: one audit row per save (`putServiceTools.<categoryId>`), as every worker write.
