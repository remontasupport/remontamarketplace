# U1 `tools-api`: business rules

| # | Rule | From |
|---|---|---|
| BR-1 | **One declaration.** The lists live only in `SERVICE_TOOLS`; ids are kebab-case, unique across all lists (so the admin `tools` filter needs no service prefix), never reused for another tool; labels may be reworded freely. A test asserts uniqueness and the counts 14 / 15. | FR-1, F1 |
| BR-2 | **Only a listed service.** `:categoryId` must be a `ToolService`; anything else is 400 from the path schema ("Not a service with tools"). | FR-2 |
| BR-3 | **Only a chosen service.** The worker must have a `worker_services` row for `:categoryId`; otherwise 404 (as `putServiceRegistration`). | FR-4 |
| BR-4 | **Only that service's tools.** Every `toolIds` entry must belong to `:categoryId`'s list; one that belongs to the other list is 400 on field `toolIds` ("<label> is not a <service> tool"). | FR-4 |
| BR-5 | **Stored in list order, deduplicated.** The saved `toolIds` = the list's ids filtered by the body's set. Tick order is not kept. | FR-4 |
| BR-6 | **Other tools normalised** (`normaliseOtherTools`, shared with the app): trim; collapse inner whitespace to one space; drop empties; drop an entry equal (case-insensitive) to a label of the service's list; drop case-insensitive duplicates keeping the first spelling. Then: more than 5 left → 400 on `otherTools` ("Up to 5 other tools"); any longer than 60 → 400 on `otherTools` ("Keep each tool under 60 characters"). Control characters are refused by the body schema (`plainText`). | FR-3, F2 |
| BR-7 | **Replace, not merge.** One save replaces both columns of that row together; `{ toolIds: [], otherTools: [] }` clears them. | FR-4 |
| BR-8 | **The answer is the stored state** (BR-5, BR-6 applied), in `serviceToolsSchema`, from the values written (no re-read). | FR-5 |
| BR-9 | **Stale ids on read.** An id stored but no longer in the list (a later list edit) is left out of every read; the next save drops it from the row. Never an error. | FR-1 |
| BR-10 | **Removed with the service.** `PUT /v1/worker/services` deletes a removed service's row, and with it both columns; a kept service keeps its tools. No change to `writeServices`. | FR-6, Q7 |
| BR-11 | **The profile read is unchanged.** Today's production app parses `GET /v1/worker/profile` strictly (`createClient` + `z.strictObject`); a new field would break it before U2. The tools are read by `getServiceTools` instead (onboarding-tour U1 BR-8's rule). | NFR-2 |
| BR-12 | **The admin filter is all-of.** `tools` (ids) are grouped by `toolServiceOf`; per service, one condition `EXISTS (SELECT 1 FROM worker_services ws WHERE ws."workerProfileId" = p.id AND ws."categoryId" = $service AND ws."toolIds" @> $ids::text[])`; the conditions ANDed, and with every other filter. Other tools are never searched. An unknown id is 400 from the query schema. | FR-8, F3 |
| BR-13 | **The search response is unchanged** (Q2 A). | Q2 |
| BR-14 | **The admin read of one worker** (`getWorkerServices`, Q1 B): every chosen service in the read's order (createdAt, id) with names, sub-category names and, for listed services, the tools (BR-9 applied); services without a list answer empty arrays. 404 when no worker profile has that id. Logged with the worker profile id, as `getDocumentLink`. | FR-7, Q1 |
| BR-15 | **Not completion.** `putServiceTools` runs through `replaceSection` with `completion: false`; no completion item reads the columns. | FR-9 |
| BR-16 | **Audit.** One audit row per save, section `putServiceTools.<categoryId>`, as every worker write; an impersonating admin's save is allowed and carries the actor, as the other section writes. | NFR-1 |
| BR-17 | **getServiceTools** returns one entry per chosen service that has a list, in the services' order; none chosen → `{ services: [] }`. Never cached (the worker saves and reloads at once). | FR-5 |
