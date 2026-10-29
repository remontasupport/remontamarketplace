# U1 `search-api`: business logic model (2026-10-28)

## Flow (both entries)

```
request ──► pipeline (contract schema, access, rate limit, cache headers)
        ──► handler: E1/E2 → SearchSpec { eligibility, keyword tokens?, services?, place?, within, page }
              1. place   = resolvePlace(location)            BR-P1..P5 (no place on any failure)
              2. tokens  = classify(tokenize(search), names) BR-K1..K5 (client only)
              3. rows    = runWorkerSearch(spec)             one statement, statement timeout
              4. cards   = rows → E4 (client) | E5 (public)
        ◄── { success, data, pagination }
```

`SearchSpec` is the one parameterised search (CS-1): the client and the public handler differ only in how they fill
it and which card they map to.

## Where the code goes (CS-2, CS-5)

| Piece | Place | New or reused |
|---|---|---|
| Two contract entries + schemas | `packages/api-contract/src/search.contract.ts` (a new area: the callers are not admins nor workers) | new |
| Service slug map | `packages/schemas/src/data/` (used by the api and `apps/web`) | moved from the app route |
| Handlers | `apps/api/src/modules/search/search.handlers.ts` | new |
| `resolvePlace` | `modules/locations/domain/place.ts` (pure, over a lookup port) + its reader in `locations/` | new; BR-P1 calls `matchLegacyLocation` and `localityCandidates` |
| Tokenizer + classifier | `modules/search/domain/keywords.ts` (pure) | ported from `apps/app/.../client/workers/route.ts` |
| Service names cache | `modules/search/application/` (1 h in memory) | new, small |
| The statement | `modules/search/persistence/worker-search-sql.ts` | new |
| HOME join, `ST_DWithin`, `ST_Distance` terms | `modules/locations/persistence/home-sql.ts`, taking a point expression | **moved** out of `admin/persistence/worker-search-sql.ts`; the admin search uses it too (no copy) |
| Statement timeout + one transaction | the admin search's `runSearch` pattern | reused as a shared helper if both need the same lines; otherwise kept local |

## The statement (sketch)

```sql
SELECT p.id, p."firstName", p."lastName", p.photos, p.introduction, p."createdAt",
       COALESCE(al.suburb, p.city) AS city, COALESCE(al.state, p.state) AS state,
       <services: names, up to 5 with sub-category names>,
       <client: EXISTS approved verification requirement>,
       <place ? ST_Distance(wl.point, :place) : NULL> AS distance_m,
       COUNT(*) OVER()::int AS total
  FROM worker_profiles p JOIN users u ... <HOME join> LEFT JOIN worker_additional_info wai ...
 WHERE <BR-E1|E2> <BR-E3> <BR-K3/K4 per token> <BR-S1>
       <place ? AND wl.point IS NOT NULL AND ST_DWithin(wl.point, :place, :within_m)>
 ORDER BY <place ? distance_m ASC,> p."createdAt" DESC, p.id ASC
 LIMIT :pageSize OFFSET :offset
```

`:place` is `ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography`; every value bound. The GiST index on
`worker_locations.point` serves `ST_DWithin`.

## Short NFR design

- **Limits:** client 120/min per user and 300/min per IP (`WORKER_SEARCH_LIMITS`, the admin search's figures).
  Public: the marketing `/search` page fetches **server side** (`cache: 'no-store'`), so every visitor arrives from
  Vercel's egress addresses and a per-IP limit is effectively one shared bucket. Hence 600/min per IP and 3000/min
  global (the other public reads' global figure), and U2 changes the page's fetch to `next: { revalidate: 60 }` so
  repeats are served by Vercel's data cache. Body none.
- **Caching:** public `cacheSeconds: 60` (today `s-maxage=60`); client `privateCacheSeconds: 60` (today
  `private, max-age=60`). No Redis on the api; the response memo where the admin search uses it.
- **Public data (NFR-5):** E5 only. No coordinates, suburb ids, postcodes, contact data or flags. The public entry is
  listed in `public-endpoints.json`.
- **Degrade (NFR-6):** BR-K5, BR-P5. Statement timeout 5 s → 503 with `Retry-After` (the pipeline's), as the admin search.
- **Audit:** none per search. These are listings of public-facing card data, not personal records (the admin detail
  views are audited; listings are not, as for `/v1/admin/workers`).
- **Comparison (NFR-2):** `apps/api/scripts/search-compare.ts` on staging: 20 suburbs (metro, regional, NT with a
  3-digit postcode) × radii 5/20/50/500 × both entries, with and without a service, plus postcode-alone and name-alone
  texts; reports per case the old route's ids and the new entry's ids, the difference explained by FR-4 (workers
  without HOME rows) or by a legacy point differing from the HOME point, and anything else as a failure.

## Property-based tests (NFR-7)

- P1 `resolvePlace`: a suggestion built from any current locality resolves to that locality's centre; text pinning
  zero or several localities resolves to none; never throws.
- P2 `tokenize`: at most 5 tokens, none under 2 characters or a stop word, never empty.
- P3 paging (database-gated): for random filters and page sizes, the union of all pages equals the unpaged result,
  with no repeat.
- P4 order: with a place, distances never decrease down the list.
