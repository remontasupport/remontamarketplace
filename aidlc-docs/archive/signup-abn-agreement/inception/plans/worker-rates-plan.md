# Worker rates (added to signup-abn-agreement, 2026-11-20)

## Decisions (user, 2026-11-20)
- One set of rates per worker (not per service).
- Weekdays, Saturdays, Sundays, Public Holidays, Evenings: $ per hour. Inactive Sleepovers: $ per night (flat).
- Weekdays required before Next; the other five optional (blank = not offered / not set).
- Shown to the admin (worker's Show profile) only. Not to clients, not on the public list, not in completion.

## Findings
- No column or table holds a rate today (`packages/db/prisma/schema.prisma`).
- The profile read `GET /v1/worker/profile` is a strict object the deployed app parses strictly; a new field there
  breaks production's app. Rates get their own read, as `getServiceTools` / `getTour` did.
- The admin worker page reads through the app's Next route with Prisma; an admin api entry (as
  `/v1/admin/workers/:workerId/services`) keeps the app's Prisma client unchanged.

## Design
- **Table `worker_rates`** (migration `2026112012..._worker_rates`): `workerProfileId` PK/FK (cascade), six
  `numeric(7,2)` nullable columns (`weekday`, `saturday`, `sunday`, `publicHoliday`, `evening`, `inactiveSleepover`),
  `createdAt`, `updatedAt`. Typed numbers, not JSON: an admin filter or sort by rate later needs no reshaping.
  Additive only (no destructive step; n8n unaffected).
- **Contract** (`worker.sections.ts` + `worker.contract.ts`): `ratesSchema` (strict; each a money value 0.01-9,999.99,
  two decimals, `weekday` required, others nullable); `getRates` `GET /v1/worker/rates` (null fields until saved,
  never cached), `putRates` `PUT /v1/worker/rates` (replace all six). Admin: `getWorkerRates`
  `GET /v1/admin/workers/:workerId/rates`.
- **api**: one handler each in `worker.handlers.ts` / admin handlers, a `sections/rates.ts` writer through the existing
  `replaceSection` (completion: false). Unit + database tests.
- **App** (`feat/signup-agreement-app`): a `rates` section definition (kind `money` if no numeric kind exists, else the
  existing one), its own read; "Rates" link in the Services group after Service Area; `requiredBeforeNext` on
  Weekdays; Service Area's Next/Save goes on to Rates, Rates' to the dashboard. Admin profile view: a "Rates"
  section, hidden when empty (as the other sections).

## Delivery
1. `feat/worker-rates-api` from `main`: migration + contract + api. PR -> CI -> staging deploy (the migration runs on
   the staging copy) -> checked on staging.
2. The app changes on `feat/signup-agreement-app` (rebased on `main` after step 1 for the new contract entries).
3. The U2 preview checklist + rates (save, reload, Weekdays required, admin sees them).
4. Promote **one** image: the merge sha of step 1 (it contains `9a01efd`). Then merge U2.
