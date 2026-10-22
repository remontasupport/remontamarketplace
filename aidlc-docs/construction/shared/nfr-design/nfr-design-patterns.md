# worker-tools: NFR design patterns, U1 and U2 (2026-10-22)

Inputs: requirements NFR-1..NFR-5; U1 functional design BR-1..BR-17, P1-P5. Extensions: Security (blocking),
Resiliency, PBT (full). No questions were needed: each category below is settled by the existing pipeline or by an
earlier decision, cited. Say if any should change.

## N1 Backward compatibility first (NFR-2; RESILIENCY-03, -04)

The production app parses every api response strictly, and U1 reaches production before U2.

- **Only additive changes.** New entries (`getServiceTools`, `putServiceTools`, `getWorkerServices`); one new optional
  query field (`tools`) on `searchWorkers`. `GET /v1/worker/profile`, `workerServiceSchema`, `servicesViewSchema` and the
  search response are byte-for-byte unchanged (BR-11, BR-13). A contract test asserts those schemas' JSON Schema equals
  `main`'s.
- **Expand-only migration.** Two `NOT NULL DEFAULT '{}'` columns; Postgres adds them without rewriting the table. The
  previous api image ignores them; rollback = the previous image, columns stay.
- **Proof on staging** after U1 merges: today's production app build against the staging api loads the dashboard,
  the Services steps and the admin search (as the tour cycle's P5).

## N2 Input validation and access (NFR-1; SECURITY-05, -08, -11, -15)

| Layer | What |
|---|---|
| Contract (pipeline, before the handler) | role WORKER / ADMIN; strict path, body and query; `categoryId` and every tool id from enums; `otherTools` raw ≤ 20 × 200, `plainText` (no control characters); body ≤ 4 KB |
| Handler | the service chosen by the token's own worker (BR-3); ids of that service's list (BR-4); `normaliseOtherTools` then 5 × 60 (BR-6) |
| Data | parameterised SQL only (`Prisma.sql` in the filter, BR-12); arrays bound as `text[]` |
| Output | strict response schemas (P10); the other tools are plain text, rendered by React as text (U2; no `dangerouslySetInnerHTML`) |

- **Ownership by token subject**, never by an id in the request: the worker entries take no worker id.
  `getWorkerServices` takes one and is ADMIN-only; an unknown id is 404, and the log line carries the profile id.
- **Fail closed:** any error before the write leaves the row as it was (one transaction); 5xx bodies carry no detail
  (the pipeline's error mapper).

## N3 Abuse and limits (SECURITY-11; RESILIENCY-09)

The worker area's limits: writes 60/min per user, 120/min per IP (`WORKER_WRITE_LIMITS`); reads `WORKER_READ_LIMITS`;
the admin entry 120/min per user, 300 per IP (as `getDocumentLink`); the search keeps `WORKER_SEARCH_LIMITS`. A save is
a replace, so repeats change nothing (BR-7).

## N4 Logging and audit (SECURITY-03, -14)

One audit row per save (`putServiceTools.<categoryId>`, with the impersonating actor when there is one, BR-16); the
request log line (request id, entry, status, duration) for every entry; `admin.getWorkerServices` logs the profile id.
The tools are not personal data of a sensitive kind; the other tools' text is not logged. No new alert: the existing
5xx-rate and latency policies cover the new entries.

## N5 Performance (NFR-2)

- `putServiceTools`: the ownership lookup + one `findUnique` on the unique `(workerProfileId, categoryId)` + one
  `UPDATE` by id.
- `getServiceTools`: one `findMany` by `workerProfileId` (indexed), at most 7 rows.
- The filter: per chosen service one `EXISTS` probing the unique index for each candidate worker; at today's
  1,765 workers no GIN index (BR-12). Checked with `EXPLAIN ANALYZE` on the staging copy during Build and Test; a GIN
  index is a later expand-only migration if p95 moves.
- `getWorkerServices`: one `findUnique` + one `findMany`.

## N6 UI resilience (U2, stated now; detail in U2's functional design)

The checklist never blocks the rest of the Services step: a failed read shows the step without the checklist and a
"couldn't load your tools" line with Retry; a failed save keeps the ticks on screen, shows the api's field message
(`messageOf`) and lets the worker save again. The admin page's tools section fails alone (the rest of the page renders).

## N7 Property-based tests (PBT-01..08)

`fast-check`, already in `schemas`, `api-contract`, `apps/api` and `apps/app`. Seeds printed on failure, shrinking on
(the repository's existing setup).

| Property | Kind (rule) | Where | Generator |
|---|---|---|---|
| P1 `normaliseOtherTools` idempotent; no empty, duplicate (case-insensitive) or listed-label entry; each output is the cleaned form of an input | idempotency, invariant (PBT-03, -04) | `packages/schemas` | strings with mixed case, inner/outer whitespace, listed labels, empties, unicode letters |
| P2 stored ids = the body's set in list order, for any order with repeats | invariant (PBT-03) | `apps/api` unit | subsets of a service list, shuffled, with duplicates |
| P3 save then `getServiceTools` returns the save's answer | round trip (PBT-02) | `apps/api`, database-gated (CI) | valid bodies per service |
| P4 the SQL filter equals a reference model `query ⊆ worker's ids, each on its own service row` | oracle (PBT-05) | `apps/api`, database-gated (CI) | 1-20 workers with random services and tool sets; random query sets |
| P5 ids unique; `toolServiceOf` maps every id back; counts 14/15 | invariant (PBT-03) | `packages/schemas` | the declaration (example-based plus a property over all ids) |
| P6 the body schema refuses any control character in other tools | invariant (PBT-03) | `packages/api-contract` | strings with injected `\p{Cc}` |

## N8 Delivery (NFR-4; RESILIENCY-03, -04)

U1: PR → CI (the database-gated tests in API Quality) → merge → staging → the checklist (CLAUDE.md) + the tools checks
(Build and Test) → promote by the full sha. U2 starts on the PR preview against staging once U1 is promoted. Rollback
rows re-recorded before U1's promotion.
