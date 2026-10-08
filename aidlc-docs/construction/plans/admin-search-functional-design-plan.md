# Functional Design Plan -- unit `admin-search` (U2)

**Inputs:** requirements FR-ADM-01..08 (as amended: three entries, the per-filter table), FR-GEO-01..07,
FR-UI-01..05, FR-PLT-03..05, FR-CACHE-01..04, NFR-01/02/05/08/10/11/15..17; stories US-AS-01..07, 11..13, 15..20;
application design C2, C5-C10, C13, C14, C16, C17, C18, S3-S7; U1's design (the principal, the outcomes); and
the screen as it is today (`AdminDashboardClient.tsx`), whose exact values the contract must accept:

| Filter | What the screen sends today | Reads in the database |
|---|---|---|
| gender | `all`, `male`, `female` | `worker_profiles.gender` = `Male` / `Female` (Title Case applied by the route) |
| hasVehicle | `all`, `Yes`, `No` | `worker_profiles.hasVehicle` |
| workerType | `all`, `Employee`, `Contractor` | `abn -> workerEngagementType -> type` = `tfn` / `abn` |
| age | `all`, `20-30`, `31-45`, `46-60`, `60+` | `dateOfBirth` text between `<year>-01-01` and `<year>-12-31`, else `age` integer |
| typeOfSupport | the category **name** (`Therapeutic Supports`), from `useCategories` | `worker_services.categoryName` |
| therapeuticSubcategories | sub-category ids | `worker_services.subcategoryIds` where `categoryId = therapeutic-supports` |
| languages | names from a page-side list of 49 (`English`, `Mandarin`, ...) | `worker_additional_info.languages`, else `worker_profiles.languages` |
| experienceWith | display names (`Aged Care`, `Disability`, ...) mapped to `CareDomain` by the route | `worker_experience.domain` |
| search | free text | first/last name, mobile |
| location, within | the label string; `none`, `5`, `10`, `20`, `50` | (replaced by `localityId`, `withinKm`) |
| sortBy, sortOrder | `createdAt`, `firstName`, `lastName`, `city`, `state`; `asc`/`desc` | |

The `/api/suburbs` id is null only when `au_localities` is missing on the database (a pre-S1 fallback), never in
production; the page still guards it.

Three decisions are open. Each is pre-filled with a proposal; leave or change the letter and say "approved" (or
"done").

## Question 1
Canonical filter values. The contract can accept the screen's display values as they are, or canonical values
with the page mapping its display values before the call.

A) **Canonical values in the contract, the page maps.** `typeOfSupport` = the category **id** (`support-worker`,
`therapeutic-supports`, ...; the page already has `category.id`); `experienceWith[]` = `CareDomain` values
(`AGED_CARE`, ...; the page maps its five display names once); `gender` = `Male` / `Female`; `hasVehicle` =
`Yes` / `No`; `workerType` = `Employee` / `Contractor`; `age` = one of the four ranges; `languages[]` = strings of
at most 40 characters (the list stays page-side; the database values are free text). `all` is never sent: an
absent parameter means no filter. The parity script maps today's URL values to the new ones. Recommended: the api
stops knowing about display names and kebab-case maps; the id is the indexed, stable key (requirements table).

B) **Today's values as they are** (`male`, the category name, the experience display names, `all` sentinels);
the api keeps the Title Case and name maps. No page mapping; the api carries presentation knowledge.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 2
The search statement's timeout (NFR-10; the api's `unitOfWork` uses 10 s for writes).

A) **5 seconds** (`SET LOCAL statement_timeout = 5000` inside the search transaction). Ten times the p95 target;
a slow plan or a lock answers 503 with `Retry-After: 2` instead of holding a pool connection. Recommended.

B) **3 seconds**: tighter; a cold first query after a deploy on a busy database might trip it.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 3
The parity case list (NFR-02, US-AS-16). The script replays cases through today's route (on a preview) and the
new entry (on staging) against the same data.

A) **A hand-written matrix in the repository** (`apps/api/scripts/parity-cases.json`): every filter alone (about
12), each filter combined with gender and with a suburb at 10 km (about 24), the name search in both word orders,
every sort field in both directions, three page sizes, the unplaced list; about 45 cases. Checked into the repo so
it runs the same way on every later change. Recommended.

B) **A smaller smoke set** (about 10 cases) plus a manual comparison of a few screens.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Design decisions that are not questions (stated so they can be objected to)

- **The statement** (C7): one `SELECT` over `worker_profiles p JOIN users u ON u.id = p."userId" LEFT JOIN
  worker_locations wl ON wl."workerProfileId" = p.id AND wl.kind = 'HOME' LEFT JOIN au_localities al ON al.id =
  wl."localityId"`, with the search point as a scalar subquery `(SELECT point FROM au_localities WHERE id = $1)`
  (the row is read by Prisma first for the 400 and the label), `ST_DWithin(wl.point, <point>, $metres)` when a
  radius is given, `ST_Distance(wl.point, <point>) AS distance_m` when a locality is given, `COUNT(*) OVER() AS
  total`, `ORDER BY <sort> , p.id`, `LIMIT $pageSize OFFSET $skip`. The unplaced count is a second statement in
  the same transaction with the same filters and `wl.id IS NULL`. Relation filters use `EXISTS (...)` subqueries
  on `worker_services`, `worker_experience`, `worker_additional_info`.
- **Age** keeps today's rule exactly (year-granular date-of-birth window with the integer `age` fallback), as D13
  requires for parity; the known imprecision is in the normalisation follow-up.
- **Languages**: `EXISTS` on `worker_additional_info` with `languages && $arr` when the row has any language, else
  `p.languages && $arr` (today's "primary, then fallback" expressed as one `OR`), values Title-Cased.
- **Experience**: one `EXISTS` per selected domain (all of).
- **Sorting**: `createdAt` (default, desc), `firstName`, `lastName`, `city` = `COALESCE(al.suburb, p.city)`,
  `state` = `COALESCE(al.state, p.state)`, `distance` (only with a locality; default then); ties by `p.id`.
- **The row** (C8): today's fields plus `distanceKm` (one decimal, from `distance_m / 1000`) and
  `location {localityLabel: "Suburb ST 1234", precision, travelRadiusKm}` for placed workers; `age` computed from
  the date of birth as today, with the integer fallback; `languages` with today's fallback; `services` =
  distinct category names (display) and `serviceIds`; `isActive`.
- **`appliedFilters`**: the parsed, canonical query echoed (absent filters omitted), plus `locality {id, label}`
  when given.
- **The caches** (C17, C18): `privateCacheSeconds` added to `Meta` (int 1..3600) and to `checks.ts` (only on a
  non-public GET, never with `cacheSeconds`); the pipeline, after the response schema check, computes
  `ETag: "sha256-<base64url of the body>"`, sets `Cache-Control: private, max-age=N` and `Vary: Authorization`,
  and answers 304 when `If-None-Match` matches; the memo (`ResponseMemo`, LRU 500, 60 s, per instance) is keyed
  by `<entry id>|<canonical query string>` and consulted before the handler for entries bound with `memo:
  true`; `Cache-Control: no-cache` on the request skips the lookup; only 200 bodies are stored.
- **The two lists** (C9): Prisma `findMany` with today's `where`; the users list's `role` filter takes `ROLES`
  values; both entries carry `privateCacheSeconds: 60` too.
- **The page** (C14): the suburb pick keeps `{id, label}` (id null = no locality); "Within" disabled without a
  locality; URL state `localityId`, `localityLabel`, `withinKm`; `unplaced` mode; the freshness line and the
  refresh button; the notices per U1's outcome contract; the document-filter state and the options fetch removed.
- **The parity script** (C16): reads the cases file; for each case calls both sides; compares sorted id lists and
  totals; prints a table; exit 1 on any difference without a suburb, and on an unexplained one with a suburb.

## Execution checklist

- [x] 1. Confirm the three answers above; resolve any ambiguity in a clarification file
- [x] 2. `aidlc-docs/construction/admin-search/functional-design/business-logic-model.md`: the search algorithm
  end to end (normalise, resolve, build, run, shape), the two lists, the cache step and the memo, the page's
  flows; sequence diagrams
- [x] 3. `business-rules.md`: numbered rules per filter (the SQL fragment each contributes), the location rules,
  sorting and paging, the row shaping, `appliedFilters`, the caches, the page; the property list (PBT-01)
- [x] 4. `domain-entities.md`: the search query, the filter spec, the raw row and the shaped row, the memo entry,
  the page's filter state; no persistence
- [x] 5. `frontend-components.md`: the dashboard, impersonation and suspended screens on the new client; state,
  interactions, URL state, notices
- [x] 6. Present for approval
