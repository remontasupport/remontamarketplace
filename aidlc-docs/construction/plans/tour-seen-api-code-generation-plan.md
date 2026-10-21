# U1 `tour-seen-api`: code generation plan (2026-10-21)

**The single source of truth for U1's code generation.** Design: `construction/tour-seen-api/functional-design/`
(E1-E3, BR-1..BR-10, L1-L2) and `construction/shared/nfr-design/` (P2, P5, P8). Requirements FR-SEEN-01..03,
NFR-02..05, NFR-08, NFR-10.

- **Branch:** `feat/tour-seen-api` from `main` `b4d48c1` (#87), in the main checkout
  (`remontamarketplace`). Code only; nothing under `aidlc-docs/`.
- **Depends on:** nothing new. **Depended on by:** U2 (`workerApi.getTour` / `putTourSeen`).
- **Owns:** the column `worker_profiles."tourSeenAt"`; the entries `worker.getTour`, `worker.putTourSeen`.
- **Not touched:** `GET /v1/worker/profile`, `profileSchema`, every existing entry (BR-8, NFR-02).

## Steps

- [ ] **Step 1 -- Branch.** `git checkout -b feat/tour-seen-api origin/main` (the untracked
  `apps/api/scripts/_u2-staging-writes.ts` stays untracked, not committed).

- [ ] **Step 2 -- Database migration (E1).**
  - `packages/db/prisma/schema.prisma`: `tourSeenAt DateTime?` on `WorkerProfile`, with a one-line comment.
  - `packages/db/prisma/migrations/20261021120000_tour_worker_profiles_tour_seen_at/migration.sql`: the header comment
    (what, why, expand-only, rollback) + `ALTER TABLE "worker_profiles" ADD COLUMN "tourSeenAt" TIMESTAMP(3);`
  - `.../down.sql`: `ALTER TABLE "worker_profiles" DROP COLUMN "tourSeenAt";`
  - **Test the pair on the developer's own Neon branch** (`DEV_DATABASE_URL`, never production; migrations README:
    "a tested down.sql"): apply forward, down, forward again; record the result in the construction notes.
  - Regenerated Prisma clients are **not** committed (CLAUDE.md trap; `git diff --ignore-all-space --numstat`).

- [ ] **Step 3 -- Contract (E2, the entries).**
  - `packages/api-contract/src/worker.sections.ts`: `tourViewSchema = z.strictObject({ seenAt: isoDate.nullable() })`
    and its type `TourView`.
  - `packages/api-contract/src/worker.contract.ts`: `workerRead` gains an option for **no private cache** (BR-7; the
    pipeline then answers `no-store`); the entries `getTour` (`GET /v1/worker/tour`, `responses: { 200: tourViewSchema }`)
    and `putTourSeen` (`PUT /v1/worker/tour/seen`, no body, `responses: { 200: tourViewSchema }`,
    `workerWrite(PROFILE_UPDATE, { maxBodyKb: 1 })`).
  - `pnpm --filter @remonta/api-contract openapi` regenerates `openapi.json`.

- [ ] **Step 4 -- Contract tests.** In `packages/api-contract`'s tests: the two entries exist with WORKER access, the
  read has no `privateCacheSeconds`, the save has an audit action and no body; **property** (P8 U1-3): for any instant
  or null, `{ seenAt }` serialised as the api does parses with `tourViewSchema` and round-trips the instant.

- [ ] **Step 5 -- Api business logic (L1, L2, BR-3, BR-4, BR-10).**
  - `apps/api/src/modules/worker/application/sections/tour.ts`: `readTour(db, userId)` (one `SELECT`, 404 via
    `profileNotFound` when no row) and `markTourSeen(tx, profileId, now)` (the `COALESCE` update with `RETURNING`).
  - `apps/api/src/modules/worker/worker.handlers.ts`: `getTour` and `putTourSeen`; the save refuses an impersonating
    principal with 403 and the account area's `NOT_WHILE_IMPERSONATING` message (shared, not copied: moved to a place
    both modules import if the module boundary lint requires it) before `replaceSection(..., { section:
    'putTourSeen', completion: false })`.

- [ ] **Step 6 -- Api unit and HTTP tests** (`apps/api/test/worker/`, the existing harness):
  - handlers: the read maps null and a time; the save passes the injected clock; impersonation → 403 and no write (R6).
  - HTTP: 401 without a token; 403 for an admin token; 200 for a worker; the read sends `cache-control: no-store`; a
    body on the save is refused; the audit row has section `putTourSeen`.

- [ ] **Step 7 -- Api database tests** (`*.int.test.ts`, PostGIS; skipped locally, CI's API Quality runs them):
  - **property** (P8 U1-1): for any 1..n saves at increasing clock values, the stored value is the first clock and every
    response carries it.
  - **property** (P8 U1-2): for any two workers, one's saves never change the other's value; each read returns its own.
  - a worker without a profile row: 404 on both entries.

- [ ] **Step 8 -- Documentation (FR-SEEN-03).** `docs/worker/README.md`: a "Tour seen (onboarding-tour U1)" entry
  section (paths, answers, errors, limits, `no-store`, impersonation) and the column in "Reading the tables".

- [ ] **Step 9 -- Gates.** `pnpm --filter @remonta/db run quality`, `@remonta/api-contract`, `@remonta/api`,
  `@remonta/app` (it imports the contract), `npx turbo run build`. Exit codes checked; baselines unchanged.

- [ ] **Step 10 -- Commit and push.** One commit per layer (migration; contract; api; docs), pushed to
  `origin/feat/tour-seen-api`. The PR is opened by the user from the compare URL
  (`.../compare/main...feat%2Ftour-seen-api?expand=1`); merging is the user's call.

- [ ] **Step 11 -- Construction notes.** `aidlc-docs/construction/tour-seen-api/code/U1-summary.md` (on the record
  branch): files, test counts, the `down.sql` run, the gate results, and the staging checklist to run after the merge
  (requirements §6.2: 401 / 200 twice keeping the first time / 403 admin / 403 impersonating; the audit row; today's
  production app build against staging unchanged).

## Story traceability
FR-SEEN-01 (Step 2) · FR-SEEN-02 (Steps 3, 5, 7) · FR-SEEN-03 (Steps 3, 8) · NFR-02 (Steps 3, 11) · NFR-03 (Step 6) ·
NFR-04 (Steps 5, 6) · NFR-05 (Step 3) · NFR-08 (Step 2) · NFR-10 (Steps 4, 7, 9) · BR-10 (Steps 5, 6).
