# U1 `tour-seen-api`: business logic model (2026-10-21)

## The two entries (Q2 A), in `packages/api-contract/src/worker.contract.ts`

| Entry | Method and path | Body | 200 response | Meta |
|---|---|---|---|---|
| `getTour` | `GET /v1/worker/tour` | -- | `TourView` | worker read limits, **no private cache** (BR-6, BR-7) |
| `putTourSeen` | `PUT /v1/worker/tour/seen` | none | `TourView` | `workerWrite(PROFILE_UPDATE, { maxBodyKb: 1 })` |

`workerRead()` always sets a 60 s private cache, so `getTour` needs the same rules without it: a `workerRead({ noCache:
true })` option (or a sibling helper) decided at code generation; the read's limits stay `WORKER_READ_LIMITS`.

## Flows

**L1 read (`getTour`)**
1. The pipeline: token, role WORKER, rate limits.
2. One statement: `SELECT "tourSeenAt" FROM worker_profiles WHERE "userId" = $principal`.
3. No row: 404 (BR-1). A row: `{ seenAt: tourSeenAt?.toISOString() ?? null }`.

**L2 save (`putTourSeen`)**
1. The pipeline: token, role WORKER, rate limits, the 1 KB body limit.
2. `replaceSection(deps, ctx, { section: 'putTourSeen', completion: false }, work)`: one transaction; the ownership
   lookup (404 without a profile, BR-1); then `work`:
   `UPDATE worker_profiles SET "tourSeenAt" = COALESCE("tourSeenAt", $now) WHERE id = $profileId RETURNING "tourSeenAt"`
   (BR-3, BR-4).
3. The audit row in the same transaction (BR-5); the log line `worker.putTourSeen`.
4. `{ seenAt: <the stored value> }`.

## Where the code goes (the worker area's layout)

- `packages/db/prisma/schema.prisma` (`tourSeenAt DateTime?` on `WorkerProfile`) + the migration (E1).
- `packages/api-contract`: `tourViewSchema` in `worker.sections.ts`; the two entries; `openapi.json` regenerated.
- `apps/api/src/modules/worker/application/sections/tour.ts`: `readTour(db, userId)` and `markTourSeen(tx, profileId,
  now)`; two lines in `worker.handlers.ts`.
- `docs/worker/README.md`: the two entries, their answers and errors (FR-SEEN-03).

## Property candidates (for NFR Design, PBT-01)

- **Idempotency:** for any sequence of 1..n saves at any clock values, the stored value equals the clock at the first
  save, and every response carries it (database test).
- **Ownership:** for any two workers A and B, B's saves never change A's value; A's read never returns B's (database test).
- **Shape:** for any stored timestamp or null, the read's body parses with `TourView` and round-trips the instant.
