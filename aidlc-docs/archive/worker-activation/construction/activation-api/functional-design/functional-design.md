# U1 `activation-api`: functional design (2026-10-23)

Inputs: `inception/requirements/requirements.md` (approved), `inception/plans/execution-plan.md` (approved with the
user's "go with your plan", 2026-10-23). U1 changes no user-facing behaviour: every new field and entry is unused
until U2.

## Finding that corrects the plan

The plan said "a **new** response field" on `GET /v1/admin/workers`. The app on production parses every api response
**strictly** (`createClient` + `z.strictObject`; worker-tools BR-11). A new key on each row would make today's admin
search fail from the moment U1 is promoted until U2 merges, and again after any Vercel rollback of U2. So:

- the search returns the new field **only when the query asks for it** (`withActivation`, BR-6); today's app never
  asks, so its responses are byte-for-byte unchanged;
- the worker's note reads its own new entry (BR-9), not a new field on `GET /v1/worker/profile`.

## Domain entities

| Entity | Change |
|---|---|
| `worker_profiles` | **new** `"isActivated" BOOLEAN NOT NULL DEFAULT false`. The name avoids `isActive`, which the search response already uses for "not suspended". |
| `users.status` | unchanged enum (ACTIVE, SUSPENDED, LOCKED, PENDING_VERIFICATION); now written by the api's suspension entry (BR-7) as well as the old app route until U2 removes it. |

**Migration** `20261023120000_worker_profiles_is_activated` (expand-only):
`ALTER TABLE "worker_profiles" ADD COLUMN "isActivated" BOOLEAN NOT NULL DEFAULT false;`
Postgres stores a constant default without rewriting the table, so it is instant on 1,765 rows. **The default is the
reset (FR-3)**: every existing row reads false the moment the column exists, and every new profile (the api sign-up
and any other path) gets false (FR-2) with no code change. No index: 1,765 rows; the lists already filter on
`users.status`; NFR Design checks the plans. `down.sql` drops the column, tested on a Neon branch.

## Contract changes (`packages/api-contract`)

| Entry | Method, path | Body / query | Response | Meta |
|---|---|---|---|---|
| **`setWorkerActivation`** (new) | `PUT /v1/admin/workers/:workerId/activation` | `{ activated: boolean }` | `200 { workerId, activated }` | ADMIN; per user 120/1m, per ip 300/1m; 1 KB; no cache; no audit (Q8 c) |
| **`setWorkerSuspension`** (new) | `PUT /v1/admin/workers/:workerId/suspension` | `{ suspended: boolean }` | `200 { workerId, suspended }` | ADMIN; per user 30/1m, per ip 120/1m; 1 KB; no cache; no audit (Q8 c) |
| `searchWorkers` | `GET /v1/admin/workers` | **+** `activation: 'active' \| 'inactive'` (absent = all, the contract's no-sentinel rule); **+** `withActivation: flag` | rows **+** `activated?: boolean`, present iff `withActivation` | unchanged |
| **`getActivation`** (new) | `GET /v1/worker/activation` | -- | `200 { activated: boolean }` | WORKER read, `noCache` |

`workerId` is the worker **profile** id, as `getWorkerServices` and the card's switch today. Both writes are `PUT`
with the target state in the body, so a repeat (a double click, a retry) is harmless.

## Business rules

| Id | Rule | Traces |
|---|---|---|
| BR-1 | **Only an admin activates.** `isActivated` is written by `setWorkerActivation` alone; no worker, sign-up or profile body carries it (their strict schemas reject an unknown key). | FR-1, FR-2, NFR-1 |
| BR-2 | **Activation sets the flag only.** It never touches `users.status`, `isPublished`, `verificationStatus` or anything else; the row's `updatedAt` moves (Prisma `@updatedAt`). | FR-1, FR-9 |
| BR-3 | **Any worker can be switched, suspended or not.** A suspended worker can be activated or deactivated (it decides how they appear once restored). | FR-7, FR-8 |
| BR-4 | **404** when no worker profile has `workerId` (both writes), message "worker not found"; nothing written. | -- |
| BR-5 | **Status filter.** `activation=active` adds `p."isActivated" = true`, `inactive` adds `= false`, as one row of the filter registry, ANDed with every filter and with the base `u.status = 'ACTIVE'` (suspended accounts stay out of the search, FR-6). Absent: no condition. Combines with `unplaced`, and the unplaced count respects it. | FR-6 |
| BR-6 | **The field on request.** With `withActivation`, every row carries `activated` (the column). Without it, the row is exactly today's. The memo key includes the parameter, so the two shapes never mix. To be removed (made always present) in a later clean-up once no pre-U2 build can be promoted; recorded as a follow-up. | FR-4, NFR-3 |
| BR-7 | **Suspension writes `users.status` as today's route.** `suspended: true` sets SUSPENDED; `false` sets ACTIVE. The target must be a WORKER account (the profile's user); otherwise 404 as BR-4 (an admin account is never reached through this entry). Restoring never changes `isActivated`, and suspending never clears it (FR-7). | FR-7, FR-8 |
| BR-8 | **Restore from other states.** `suspended: false` on an account that is LOCKED or PENDING_VERIFICATION sets ACTIVE (today's route behaves so); on ACTIVE it is a no-op 200. | FR-7 |
| BR-9 | **The worker's own state.** `getActivation` answers the caller's `isActivated`; a WORKER without a profile is 404 as the other worker reads. Never cached, so the note goes as soon as the worker reloads after activation. Impersonating admins read the impersonated worker's, as the other worker reads. | FR-10 |
| BR-10 | **Logs, not audit rows (Q8 c, SECURITY-03).** Each write logs one line: entry, the caller's id (the pipeline's), `workerProfileId`, the new state. No names, emails or bodies. | FR-11, NFR-1 |
| BR-11 | **After a write the memo is cleared** of `searchWorkers` and `listSuspendedWorkers` answers on that instance. Other instances and the admin's browser can serve the old answer for up to 60 s (the existing window); the card shows the write's answer at once (U2). NFR Design checks this. | NFR-5 |
| BR-12 | **Suspended list.** `listSuspendedWorkers` unchanged (U2 renames its button only). | FR-7 |

## Business logic model

```
setWorkerActivation(workerId, activated)
  profile = workerProfile.update({ where: { id }, data: { isActivated }, select: id })   -- P2025 -> 404
  memo.clearAdminLists(); log(entry, workerProfileId, activated)
  -> { workerId, activated }

setWorkerSuspension(workerId, suspended)
  profile = workerProfile.findUnique({ id }, select: userId, user.role)    -- none, or role != WORKER -> 404
  user.update({ id: userId }, { status: suspended ? 'SUSPENDED' : 'ACTIVE' })  (skipped when already that value)
  memo.clearAdminLists(); log(...)
  -> { workerId, suspended }

searchWorkers(q)        -- existing statement
  WHERE ... AND (activation filter row, BR-5)
  SELECT ... , p."isActivated" AS activated
  shapeRow: include activated iff q.withActivation (BR-6)

getActivation(caller)   -- workerProfile.findUnique({ userId }, select isActivated) -> { activated }
```

## Tests (PBT full, per NFR-4; detailed in NFR Design)

- Properties: for any query, `results(active) ∪ results(inactive) = results(none)` and they are disjoint; any row has
  `activated` iff `withActivation`; without it a row equals today's shape (strict parse with the old row schema).
- Database tests (CI): the migration's default on existing and new rows; each write's 404s, idempotency, and that it
  changes only its own column; the filter with `unplaced` and the count.
- Contract: N1-style checks; `openapi.json` additions only; the strict old row schema still parses a response without
  `withActivation`.

## Docs

`docs/admin/README.md` (the two writes, the filter, `withActivation`), `docs/worker/README.md` (`getActivation`),
`docs/signup/` (a new profile starts inactive).
