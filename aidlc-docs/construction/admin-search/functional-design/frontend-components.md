# Frontend Components -- unit `admin-search` (U2)

Three existing screens move onto the contract client (`lib/api/admin.ts`, U1's wrapper). No new screen.

## Component hierarchy

```
app/admin/page.tsx (server, requireRole ADMIN)                    unchanged
  └── AdminDashboardClient.tsx (client)                            changed
        ├── FilterPanel (inline today)                             changed: suburb {id,label}, Within gating, no document filters
        │     ├── SuburbBox  -> GET /api/suburbs?q=                 unchanged source; keeps the id
        │     ├── WithinSelect                                      disabled until a locality is set
        │     ├── TypeOfSupport (useCategories)                     sends category.id
        │     ├── Gender / HasVehicle / WorkerType / Age            canonical values
        │     ├── Languages (page list) / Therapeutic sub-categories / Experience (CareDomain map)
        │     └── Apply / Clear
        ├── FreshnessLine                                           new: "results may be up to a minute old" + Refresh
        ├── UnmappedLine                                            new: "N active workers have no mapped suburb" + link
        ├── Notice                                                  new: outcome notices (U1 contract)
        ├── ResultsTable                                            + distance column (when a locality), sortable headers incl. distance
        ├── Pagination                                              unchanged behaviour
        └── InactiveWorkersPanel                                    -> adminApi.listSuspendedWorkers
app/admin/impersonate/page.tsx                                     -> adminApi.listUsers
```

## `AdminDashboardClient` state and props

| State | Type | Notes |
|---|---|---|
| `filters` | E7 | applied filters, URL-synced (`canonicalQueryOf`, R11.2) |
| `pendingFilters` | E7 | the panel's draft until Apply |
| `suburbSearch`, `suburbs`, `showSuburbDropdown` | string, SuburbMatch[], boolean | as today; a pick sets `pendingFilters.locality = {id, label}` and the text |
| `results` | WorkerSearchResponse \| null | last successful response (kept on errors) |
| `lastFetchedAt` | Date \| null | drives the freshness line |
| `outcome` | ApiOutcome kind \| 'idle' \| 'loading' | drives the notice |
| `unplacedMode` | boolean | `filters.unplaced` |

Removed state: `documentCategories`, `documentStatuses`, `requirementTypes`, `filterOptions`, `isLoadingFilters`.

## Interaction flows

**Pick a suburb and a distance (US-AS-01, 02):** type -> suggestions -> pick -> `{id, label}` stored, "Within"
enabled -> choose 10 km -> Apply -> `toQuery` -> `adminApi.searchWorkers` -> rows nearest first with `distanceKm`,
header "Distance (from suburb centre)".

**Any distance (US-AS-03):** locality set, "Within" = Any distance -> no `withinKm` -> every placed worker, nearest
first.

**Clear the suburb:** locality = undefined, `withinKm` = undefined, "Within" disabled, sort falls back to
`createdAt` if it was `distance`.

**Unmapped workers (US-AS-05):** click the unmapped line -> `filters.unplaced = true`, suburb and Within controls
disabled, the list shows those workers with their legacy suburb text (city, state, postcode columns); a "Back to
search" link clears it.

**Repeat (US-AS-19):** Apply with unchanged filters -> same canonical URL -> the browser cache answers; the
freshness line shows the age; Refresh -> `cache: 'reload'`.

**Errors (US-AS-11):** outcome -> notice; `rateLimited(n)` schedules one automatic retry after n s;
`unauthenticated` -> `router.push('/login?callbackUrl=...')`.

**After an admin action (US-AS-19):** the existing status toggle succeeds -> reload with `cache: 'reload'`.

## Form validation (page-side, before the call)

| Field | Rule |
|---|---|
| Within | only when a locality is set |
| Sort by distance | only when a locality is set |
| Search text | trimmed; <= 100 chars |
| Page size | 20 (unchanged UI); the contract allows up to 100 |

Everything else is validated by the contract; a 400 (`failed` with fields) is shown as a notice naming the field,
which should not happen from the page's own controls.

## API integration points

| Component | Entry | When |
|---|---|---|
| AdminDashboardClient | `searchWorkers` | Apply, page change, sort change, refresh, after an admin action, URL load |
| InactiveWorkersPanel | `listSuspendedWorkers` | opening the panel |
| impersonate page | `listUsers` | search input (debounced as today), role filter |
| SuburbBox | `/api/suburbs` (app route, unchanged) | typing |
| status toggle, publish | existing app routes (unchanged) | admin actions |

## URL state examples

```
/admin?localityId=1234&localityLabel=Parramatta%20NSW%202150&withinKm=10&gender=Female&page=1
/admin?unplaced=true&typeOfSupport=support-worker
/admin?search=Test%20Terson&sortBy=lastName&sortOrder=asc
```

`localityLabel` is for display only; the api receives `localityId` and echoes the label it knows.
