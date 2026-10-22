# U2 `tools-app`: code summary (2026-10-22)

Branch `feat/worker-tools-app` (pushed, head `ccae8ef`), 8 commits on `main` `c523f53`; 29 files, +693 / -37.
Plan: `construction/plans/tools-app-code-generation-plan.md`. **Held until U1 is promoted.**

| Step | Commit | Files |
|---|---|---|
| 1 Logic | `54d45b8` | `apps/app/src/features/worker/serviceTools.ts` (+ test: PU1-PU3) |
| 2 Client | `62301de` | `features/worker/api.ts` (`getServiceTools`, `putServiceTools`) + `serviceTools.api.test.ts` |
| 3 | -- | removed (user: "do not touch the Languages field"); `MultiSelectField` unchanged |
| 4 Screen | `bd9fb7e` | `components/services-setup/steps/ServiceToolsStep.tsx`; `app/dashboard/worker/services/setup/page.tsx` (the `tools` view, load, Next saves, Previous, button text) |
| 5 Admin | `6bf70f1`, `7f173e8` | `features/admin-search/query.ts` (+ PU4), `app/admin/AdminDashboardClient.tsx` (Tools block), `lib/api/admin.ts` (`getWorkerServices`) + test, `app/admin/contractors/[id]/{WorkerToolsLine.tsx,page.tsx}` + test |
| 6 Sign-up note | `9969037` | `packages/form-engine/src/types.ts` (`notes` on the services kind), `workerRegistration.ts`, `FormWizard.tsx`, `fields.tsx` (`ServicesField` + `notesFor`), `forms.test.ts` |
| 7 Client + docs | `4f3dbd7`, `ccae8ef` | the auth client (7 files, content only); `docs/worker`, `docs/admin`, `docs/signup/01-flow.md` |

## Gates (this machine)

app: types 56 known, lint 277 known (1 improved, the H1 leftover), 303 tests; form-engine 76; web lint 70 known;
`turbo run build` 3/3. The regenerated non-auth clients (machine paths only) restored, not committed.

## Deviations and findings, stated

- **The admin worker page is the downloadable profile card.** The tools line is left out of the JPEG (user, 2026-10-22:
  "No need to include it to the download for now").
- **Finding on U1's reasoning:** Vercel's build runs `prisma generate` from `packages/db`'s schema, so production's app
  rebuilt at U1's merge (`c523f53`) already has a client that knows the two columns, while production's database
  lacks them until the promotion. Checked: every `apps/app` query on `worker_services` has an explicit `select`, and the
  app never creates, updates or deletes those rows (no relation `include` either), so no query names the columns.
  Production unaffected; the U1 regression check on a preview still stands.
- The view order was not extracted into a pure function (the page's view logic is spread across five handlers); the
  tests cover the logic module; the preview checks cover the navigation.
- `notes` on the form-engine type is covered by the app's definition test (`defineForm` runs at import), not by a
  separate form-engine test.
