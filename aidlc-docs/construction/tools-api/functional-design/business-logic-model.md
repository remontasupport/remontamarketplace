# U1 `tools-api`: business logic model

## Flow 1: the worker saves a service's tools (`putServiceTools`)

```
PUT /v1/worker/services/:categoryId/tools  { toolIds, otherTools }
 └ pipeline (contract): WORKER role · limits · strict path + body (BR-2, control chars) · body ≤ 4 KB
   └ handler → replaceSection(section "putServiceTools.<id>", completion: false)   (BR-15, BR-16)
       tx:
        1 row = worker_services by (profileId, categoryId)        → none: 404           (BR-3)
        2 foreign = toolIds not in SERVICE_TOOLS[categoryId]      → any: 400 toolIds    (BR-4)
        3 ids    = list ids ∩ body set, list order                                      (BR-5)
        4 others = normaliseOtherTools(body.otherTools, categoryId) → too many/long: 400 otherTools (BR-6)
        5 UPDATE worker_services SET "toolIds" = ids, "otherTools" = others WHERE id = row.id   (BR-7)
        6 audit row
     → 200 { categoryId, toolIds: ids, otherTools: others }                            (BR-8)
```

Retry-safe: the same body twice stores the same row (a replace).

## Flow 2: the worker's page reads its tools (`getServiceTools`)

```
GET /v1/worker/services/tools
 └ rows = worker_services of the profile, ordered (createdAt, id), categoryId ∈ TOOL_SERVICES
   → { services: rows.map(r => { categoryId, toolIds: r.toolIds ∩ list (BR-9), otherTools: r.otherTools }) }   (BR-17)
```

## Flow 3: the admin search with tools (`searchWorkers`, `tools=a,b,c`)

```
query.tools → group by toolServiceOf → { 'cleaning-services': [...], 'home-yard-maintenance': [...] }
FILTERS += { name: 'tools', applies: tools.length > 0,
             sql: AND over services of EXISTS(... "categoryId" = s AND "toolIds" @> ids) }   (BR-12)
```

One registry row; the statement, the paging, the radius and the response are untouched (BR-13).

## Flow 4: the admin reads one worker's services (`getWorkerServices`)

```
GET /v1/admin/workers/:workerId/services
 └ profile exists? no → 404
   rows ordered (createdAt, id) → services[] with names, subcategoryNames, tools (BR-9; empty for unlisted)   (BR-14)
```

## Scenarios and edge cases

| Scenario | Result |
|---|---|
| Ticks Mop, Vacuum (in that order) | stored `[vacuum-cleaner, mop-and-bucket]` (list order) |
| Cleaning save with `push-mower` | 400 `toolIds` |
| Saves tools for Home and Yard without having chosen it | 404 |
| `PUT .../support-worker/tools` | 400 (path) |
| Others `["  Pressure  washer ", "pressure washer", "Vacuum cleaner", ""]` on Cleaning | `["Pressure washer"]` (collapsed, duplicate dropped, listed label dropped, empty dropped) |
| 6 distinct others | 400 `otherTools` |
| Removes Cleaning then re-adds it | tools empty (BR-10) |
| Edits Support Worker's sub-categories | Cleaning's tools untouched (row kept) |
| Admin filter `tools=ladder,vacuum-cleaner` | workers with Ladder on Home & Yard **and** Vacuum on Cleaning |
| Admin filter `tools=hammer` | 400 (unknown id) |
| A label later renamed | stored ids unaffected; the new label shows |
| An id later removed from the list | not in reads; dropped at the next save |

## Properties for NFR Design (PBT, full)

- P1 `normaliseOtherTools` is idempotent; its output has no empties, no case-insensitive duplicates, no listed label;
  each kept entry equals the trimmed, collapsed form of an input entry.
- P2 For any subset of a list in any order with repeats, the stored ids = that subset in list order (BR-5).
- P3 Save then `getServiceTools` returns exactly the save's answer (round trip).
- P4 The all-of filter: for random workers' tool sets and a random query set, the SQL result equals the reference
  `query ⊆ union of the worker's ids, each id on its own service's row` (database-gated, CI).
- P5 The declaration: ids unique; every id maps back to its service with `toolServiceOf`.
