# U2 `tools-app`: code generation plan (2026-10-22)

**Single source of truth for U2's code.** Branch `feat/worker-tools-app` from `main` `c523f53` (U1 merged). One PR;
its preview talks to staging (U1 live there). **Merged only after U1 is promoted** (UR-12). "Merge pull request".
Design: `construction/tools-app/functional-design/` (UR-1..UR-12, A1-A5, flows W/A1/A2/S, PU1-PU4); NFR N6.

## Steps

### Step 1 -- The page logic (`apps/app/src/features/worker/serviceTools.ts`) [A1, UR-3, UR-4]
- [ ] `toolLabelsOf`, `fieldValueOf`, `bodyOf`, `acceptChange`, `hasToolsScreen`; messages from the shared limits.
- [ ] `serviceTools.test.ts`: the scenario table, PU1-PU3 (fast-check).

### Step 2 -- The worker client (`features/worker/api.ts`) [A1]
- [ ] `getServiceTools()` and `putServiceTools(categoryId, body)` on `WorkerApi` (the same token / 401-retry / outcome
      path as `putServiceRegistration`); a test beside `tour.api.test.ts`'s pattern.

### Step 3 -- (removed, user 2026-10-22) `MultiSelectField` is not edited
- [x] Nothing to do: the tools screen uses it unchanged; the limits are `acceptChange` (Step 1).

### Step 4 -- The tools screen [UR-1, UR-2, UR-5..UR-7]
- [ ] `components/services-setup/steps/ServiceToolsStep.tsx` (presentational).
- [ ] `app/dashboard/worker/services/setup/page.tsx`: the `tools` view (URL param, render), loading on entry, Next saves
      then moves on, Previous to documents, `shouldShowPrevious`, `getNextButtonText`; Next on `documents` goes to
      `tools` for the two services. The view order as a small pure function in `serviceTools.ts` if it extracts cleanly
      (tested).

### Step 5 -- Admin [UR-8, UR-9, A3, A4]
- [ ] `features/admin-search/query.ts`: `tools` in `AdminFilters`, defaults, `toQuery`, the URL; `query.test.ts` PU4.
- [ ] `app/admin/AdminDashboardClient.tsx`: the "Tools" block after "Experience with"; included in Clear.
- [ ] `lib/api/admin.ts`: `getWorkerServices(workerId)` (path params through the existing `call`).
- [ ] `app/admin/contractors/[id]/WorkerToolsLine.tsx` + the page: the read and the lines.

### Step 6 -- The sign-up note [UR-10, A5]
- [ ] `packages/form-engine/src/types.ts`: `notes?: { whenAny: string[]; text: string }[]` on the services kind (data
      only; P-7 holds); a form-engine test that `defineForm` accepts it and the body is unchanged.
- [ ] `features/forms/definitions/workerRegistration.ts`: the note; `FormWizard`'s `ServicesSlot` passes `notes`;
      `ServicesField` renders the (i) box; a test of the condition.

### Step 7 -- Prisma clients and docs [UR-12, NFR-5]
- [ ] `pnpm --filter @remonta/db run generate` for the app's committed clients; commit only files with content changes
      (`git diff --ignore-all-space --numstat`), restore line-ending-only ones.
- [ ] `docs/worker/README.md` (the Services pages' tools screen); `docs/admin/README.md` §5 (the Tools filter, the line);
      `docs/signup/` (the note) where the services step is described.

### Step 8 -- Gates, then the PR
- [ ] `@remonta/app` quality (types, lint baseline, tests), `@remonta/form-engine`, `@remonta/web`, `npx turbo run build`.
- [ ] Commit by step; push; the compare link and a PR body with the preview checks (below). No merge before U1's
      promotion.
- [ ] Code summary `construction/tools-app/code/U2-summary.md`.

## The preview checks (in the PR body)
Worker on staging with Cleaning + Home and Yard: the tools screen after the certificate, toggle, add own (limit 5,
a listed label ticks it), Next saves, reload shows it, Previous; a worker without them sees no tools screen; the
sign-up note appears and goes; admin: the Tools filter narrows and survives a reload of the URL; the worker's page shows
the line; the production domain unchanged.
