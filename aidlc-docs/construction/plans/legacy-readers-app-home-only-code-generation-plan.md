# Code generation plan: U4 `legacy-readers-app`, home only (2026-10-29)

Requirements: FR-7r (apps/app), FR-11r. Branch `feat/legacy-readers-app` from `main`. Replaces the superseded
fallback plan. Preconditions met: U3 placed every worker with usable text (8 left: 4 empty, 4 overseas).

The api still double-writes until U5, so for every placed worker the HOME locality equals today's columns: no visible
change except that the 8 unplaced show the empty case ("Not specified" / no suburb).

## Reuse vs add (CS-1..CS-5)

| Reused | Added |
|---|---|
| `WorkerProfile.locations` + `AuLocality` (already in the app's auth client; no regeneration) | `packages/schemas/src/data/locality.ts`: `localityLabel` ("Suburb, ST 1234"), moved from api `locations/domain/home.ts` (U5 points the api at it) + test |
| the screens' field names (`city`, `state`, `postalCode`, `location`): components unchanged | `apps/app/src/lib/workerPlace.ts`: `HOME_PLACE_SELECT` (the one Prisma fragment: HOME row, take 1, locality suburb/state/postcode) and `homePlaceOf(row)` -> `{ city, state, postalCode, location }` (nulls when no HOME) |

## Steps

1. [ ] `localityLabel` in `packages/schemas` (pure, P-5) + subpath export + test.
2. [ ] `lib/workerPlace.ts` + test (placed; unplaced -> nulls).
3. [ ] Readers: replace `city/state/postalCode/location` in the select with `...HOME_PLACE_SELECT`; map with `homePlaceOf`:
   `app/api/client/workers/by-ids/route.ts`, `services/worker/profilePreview.service.ts`, `lib/profileData.ts`,
   `app/api/admin/contractors/[id]/route.ts`, `.../pdf/route.ts`.
4. [ ] Guard test: no file under `apps/app/src` (outside `generated`) selects any of the six legacy columns of
   `workerProfile` (proved to fail on a reverted reader).
5. [ ] Gates: schemas, app quality, `turbo run build`.
6. [ ] PR, CI, preview: a staging client's assigned workers, a profile preview, an admin contractor page + PDF.
7. [ ] Merge (user) -> production check -> U5.
