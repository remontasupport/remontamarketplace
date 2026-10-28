# Code generation plan: U3 `legacy-readers-app` (follow-up 39 stage 1) (2026-10-29)

Requirements: FR-7 (apps/app readers), FR-11 (this unit first). Branch `feat/legacy-readers-app` from `main` `331e5e3`.
No api change, no migration, no write change: the api still double-writes, so every screen shows the same place as
today for every placed worker; this unit only makes the app independent of the columns before U4 stops writing them.

## Reuse vs add (CS-1..CS-5)

| Reused | Added |
|---|---|
| `WorkerProfile.locations` relation + `AuLocality` (already in the app's auth client; no regeneration) | `packages/schemas/src/data/workerPlace.ts`: `localityLabel` (moved from api's `locations/domain/home.ts` in U4; copied byte-for-byte here, U4 deletes the api copy and imports this one) and `placeOf(home, legacy)` -> `{ city, state, postalCode, label }` (HOME locality first, legacy columns otherwise) + tests (unit + property: HOME always wins; no HOME = today's values) |
| the screens' existing fields (`city`, `state`, `postalCode`, `location`) and shapes -- the components do not change | `apps/app/src/lib/workerPlace.ts`: `HOME_PLACE_SELECT` (the one Prisma select fragment: `locations` HOME, take 1, locality suburb/state/postcode) and `withPlace(profile)` (spreads `placeOf` back onto the same field names) |

## Steps

1. [ ] `workerPlace.ts` in `packages/schemas` (pure, P-5) + subpath export + tests.
2. [ ] `apps/app/src/lib/workerPlace.ts` (select fragment + `withPlace`).
3. [ ] Readers, each: add `...HOME_PLACE_SELECT` to the select, pass the row through `withPlace`:
   - `app/api/client/workers/by-ids/route.ts` (city, state on the card)
   - `services/worker/profilePreview.service.ts` (city, state, postalCode)
   - `lib/profileData.ts` (city, state, postalCode; `WorkerProfileView` unchanged)
   - `app/api/admin/contractors/[id]/route.ts` and `.../pdf/route.ts` (`location` = the HOME label "Suburb, ST 1234", else the column)
4. [ ] Tests: `withPlace` per reader shape (placed, unplaced, unplaced with empty columns); a scan test that no file
   under `apps/app/src` (outside `generated`) selects `city`/`state`/`postalCode`/`location` of `workerProfile`
   without `HOME_PLACE_SELECT` (proved to fail on a reverted reader).
5. [ ] Gates: schemas, app quality, `turbo run build`.
6. [ ] PR (compare link), CI, preview: sign in as a staging client (assigned workers' cards), a worker's profile
   preview, an admin contractor page + PDF; the same place as before.
7. [ ] Merge (user) -> production check -> U4.

Not touched: `features/worker/preview.ts`, `my-jobs` (not readers, inventory), `WorkerProfileView` (renders the same fields).
