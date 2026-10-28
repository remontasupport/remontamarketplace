# Targeted inventory: the legacy location columns (follow-up 39, stage 1) (2026-10-28, `main` `331e5e3`)

Scope change (user 2026-10-28: "do not close this, you can do it here"): follow-up 39 stage 1 joins the
search-locations cycle. Stage 1 = every reader moved to the HOME location, the reconciler made safe, the api's double
write stopped. Stage 2 (dropping the six columns) stays a separate, later step.

Columns: `worker_profiles.location, city, state, postalCode, latitude, longitude`.

## Writers

| Where | What |
|---|---|
| `apps/api` `registration/application/register-worker.ts:130` | `...placed.legacy` with the HOME row at sign-up |
| `apps/api` `worker/application/addresses.ts:39` | `workerProfile.update({ data: legacy })` when the worker saves their suburb |
| `apps/app` | **none** (checked: every `workerProfile.update/create` in `app`, `lib`, `services`, `features`) |
| reconciler, backfill | write `worker_locations` only, not the legacy columns |

## Readers

| Where | Reads | Shown as |
|---|---|---|
| api `worker/persistence/profile-read.ts` + `application/get-profile.ts:45` | city, state, postalCode | `GET /v1/worker/profile` → the worker's own profile page |
| api `worker/domain/completion.ts:208` | city, state, postalCode non-empty | the "location" item of profile completion |
| api `admin/application/lists.ts:78` | city, state, postalCode (beside the HOME locality) | admin users / suspended lists |
| api `admin/persistence/worker-search-sql.ts` + `application/search-workers.ts:57` | `COALESCE(al.*, p.*)` sort; raw city/state/postalCode in the row | admin worker search |
| api `onboarding/reconciler.ts` (every 5 min) | location, city, state, postalCode | **places or MOVES the HOME row to whatever the legacy columns match** ("the source of truth") |
| api `locations/backfill.ts` | the same | one-off S1 backfill script |
| app `app/api/client/workers/by-ids/route.ts:48` | city, state | a client's assigned workers' cards |
| app `services/worker/profilePreview.service.ts:142` | city, state, postalCode | the worker profile preview |
| app `lib/profileData.ts:72` | city, state, postalCode | the shared/public profile page data |
| app `components/profile/WorkerProfileView.tsx:242` | renders the above | "City, ST 1234" or "Not specified" |
| app `app/api/admin/contractors/[id]/route.ts:35`, `.../pdf/route.ts:37` | location | the admin contractor page and its PDF |

Not readers: `features/worker/preview.ts` (parses a label), `dashboard/worker/my-jobs` (the jobs table's city),
`contractor_profiles` (jobs database).

## Findings

- **F1 The reconciler would undo address changes.** It runs for every worker whose profile changed and moves the HOME
  row to match the legacy columns. With the double write stopped, a worker who changes suburb would be moved back to
  the stale legacy value within 5 minutes. The reconciler must stop moving HOME rows **before** the write stops.
- **F2 The ~69 unplaced workers** have only the legacy columns. Readers moved to HOME alone show them without a place;
  the reconciler is the only automatic way to place them, from those same columns.
- **F3 Readers outside the repository** (n8n workflows, Zoho syncs, reports reading the database) cannot be seen from
  the code. Stage 1 keeps the columns, so they keep working (frozen at today's values for workers who move); stage 2
  needs them confirmed.
- **F4 Order matters:** the app's readers read the database directly; they must move before the api stops writing,
  or they show stale suburbs for workers who move.
