# U2 `tools-app`: frontend components

| Component | Where | Props / state | Calls |
|---|---|---|---|
| `ServiceToolsStep` (new) | `components/services-setup/steps/ServiceToolsStep.tsx` | props: `categoryId`, `serviceTitle`, `value`, `onChange`, `state: 'loading' \| 'ready' \| 'failed'`, `onRetry`, `error?`. Presentational: heading "Your tools", hint "Tick the tools you have and can bring to a job. Add any that aren't listed (up to 5).", `MultiSelectField` unchanged (UR-2) with `acceptChange` on its `onChange` and the refusal as its `error` (UR-3), the failed line with Retry (UR-6) | none (the page loads and saves) |
| Setup page | `app/dashboard/worker/services/setup/page.tsx` | adds `view === 'tools'`; holds `toolsValue`, `toolsState`; loads on entering the view; Next saves (UR-5); Previous, `shouldShowPrevious`, `getNextButtonText` and the redirect learn the new view (UR-7) | `workerApi.getServiceTools`, `putServiceTools` |
| Admin filter panel | `app/admin/AdminDashboardClient.tsx` | a "Tools" block after "Experience with": two headed groups of toggle buttons from the shared list; `pendingFilters.tools` (UR-8) | via `toQuery` |
| `WorkerToolsLine` (new) | `app/admin/contractors/[id]/WorkerToolsLine.tsx` | props: `service: AdminWorkerServices['services'][number]`; renders UR-9's line; nothing for other services | -- |
| Admin worker page | `app/admin/contractors/[id]/page.tsx` | one read of `getWorkerServices` alongside today's; `WorkerToolsLine` under the two services | `lib/api/admin.ts getWorkerServices` |
| `ServicesField` | `components/ui/form-wizard/fields.tsx` | + `notes?: { whenAny: string[]; text: string }[]`; renders the blue (i) box (UR-10) | -- |

Accessibility: the tags are buttons with `aria-pressed` (as today); the failed line is `role="alert"`; the note is a
`role="note"` region; the tools screen's heading is the page's step heading.

Tests (vitest, node, as the existing `features/` tests): `features/worker/serviceTools.test.ts` (PU1-PU3 and the
scenarios), `features/admin-search/query.test.ts` (PU4), `fields` tests for the note's condition, and the setup page's
view sequence as a pure function (documents → tools → next) if it can be extracted without touching the rest.
