# Primary service: schema analysis (2026-11-19, before any build)

## Today
- `worker_services` (one row per worker and service): id, workerProfileId, categoryId, categoryName, subcategoryIds/Names,
  metadata, toolIds, otherTools, createdAt, updatedAt; unique (workerProfileId, categoryId). **Nothing marks a primary.**
- The order is `createdAt, id`; several places already treat **the first service as the primary** implicitly:
  `api/client/workers/by-ids` (role), `dashboard/worker/my-jobs` (role), `trainings/setup` (primaryService), `lib/reports.ts`.
- Writers: sign-up (`registerWorker`), `PUT /v1/worker/services` (`writeServices`: deletes removed rows with their documents,
  creates new rows after the kept ones). Readers: the profile read, admin lists (`typeOfSupport`, therapeutic, tools,
  nursing filters: `EXISTS` on worker_services), admin worker services, the client/public search (category names), the
  app's own Prisma routes above, and possibly n8n (it reads the production database).
- The worker profile read, `servicesViewSchema`, the admin list rows and `adminWorkerServicesSchema` are **strict** and the
  live app parses them strictly: a new field in those responses breaks the app until it is updated (worker-tools hit the
  same: BR-11, its own read).

## Recommendation
- Schema: `worker_services."isPrimary" boolean NOT NULL DEFAULT false` + a partial unique index
  `(workerProfileId) WHERE "isPrimary"` (at most one primary per worker, enforced by the database). Additive; old images
  ignore it. Preferred over `worker_profiles.primaryServiceId` (a pointer that can dangle when the service is removed).
- Backfill (one-off, dry-run first): for every worker with services, the first by `createdAt, id` becomes primary — what
  the app already shows as the role today, so nothing visible changes.
- Rules in the api: exactly one primary whenever a worker has a service; the sign-up's one service is primary; adding
  services keeps the primary; removing the primary makes the next (createdAt order) primary.
- Api: `PUT /v1/worker/services/primary { categoryId }` (new entry) and the primary in a new read, not in the strict
  existing responses, until the app that reads them is live (then optionally folded in).
- Admin: a filter on the primary service (e.g. `primaryService=<categoryId>`, or "Type of support: primary only") and a
  "Primary" mark on the worker's admin services; the list rows' `services` gain the primary through a new field only
  with the admin app that reads it.
