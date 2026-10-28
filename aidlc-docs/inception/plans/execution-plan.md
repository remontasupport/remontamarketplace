# Execution plan: worker search on worker_locations (2026-10-28)

Requirements: `inception/requirements/requirements.md` (approved 2026-10-28). Scope: the two searches only (Q5 A;
the rest is follow-up 39).

## Impact

| Area | Change |
|---|---|
| `packages/api-contract` | two entries: `GET /v1/client/workers` (CLIENT, COORDINATOR), `GET /v1/public/workers` (public) |
| `apps/api` | a `search` area (or inside `worker`/`localities`, decided in Functional Design): handlers, one SQL builder for both, the place match |
| `apps/app` | `useWorkers` calls the api through `createClient` with the bearer token; `/api/client/workers` and `/api/public/workers` removed |
| `apps/web` | `/search` and its `/api/public/workers` proxy call the api's public entry; a new env value (the api URL) in both Vercel scopes |
| Database | none (`worker_locations.point`, `au_localities.point` and their GiST indexes exist) |
| `infra` | none expected; the api's CORS already admits the app's origins (the client entry is called from the browser) |

Risks: behaviour drift in the keyword rules when ported (mitigated by porting the tests with them and NFR-2's
comparison); the public entry is the api's first unauthenticated read of worker data (NFR-5); release order (NFR-1).

## Stages

| Stage | Decision | Why |
|---|---|---|
| User Stories | SKIP | no new behaviour; FR-5 fixes it as today's |
| Application Design | SKIP | fits contract → pipeline → handler, and the app's `createClient` glue |
| Units Generation | SKIP | two units, below |
| Functional Design | EXECUTE, U1 | the SQL (eligibility per entry, keyword tokens, services, place, order, paging), the place match, the card mapping, the response shapes kept |
| NFR Requirements | SKIP | in the requirements (NFR-1..NFR-7) |
| NFR Design | EXECUTE, short, with U1's Functional Design | rate limits and cache headers per entry, what the public entry may return, the degrade path, the equivalence check method |
| Infrastructure Design | SKIP | one Vercel env value for `apps/web`, in U2's code plan |
| Code Generation | EXECUTE, per unit | |
| Build and Test | EXECUTE | gates; the staging equivalence check; preview checklist; production checks |

```
INCEPTION   Workspace Detection ✓ → Inventory ✓ → Requirements ✓ → Workflow Planning (this)
CONSTRUCTION U1 search-api:  Functional + NFR Design → Code → merge → staging check (NFR-2) → promote
             U2 search-callers: Code → preview checklist → merge (after U1's promotion)
             Build and Test → close
```

## Units

**U1 `search-api`** (`packages/api-contract`, `apps/api`)
- The two entries; one handler each over one shared search (CS-1): the entries differ only by eligibility
  (`isActivated` for public), defaults (50 / 500 km, page sizes), the keyword search (client only) and the card fields.
- The place: `location` text → one `au_localities` row, reusing the reconciler's matcher
  (`locations/domain/legacy-match.ts`: exact, never a guess) on the autocomplete's "Suburb STATE postcode"; no match →
  the search without a place (FR-2).
- SQL: the admin search's `worker_locations` HOME + `au_localities` join and `ST_DWithin` / `ST_Distance` terms reused,
  not copied; count and page in SQL.
- The keyword rules (stop words, ≤ 5 tokens, service vs text tokens from `categories`/`subcategories`) moved from the
  app route with their tests; written once in the api.
- A staging script comparing the old routes and the new entries (NFR-2).
- Order: merge → staging deploy → comparison → promote → then U2 may merge.

**U2 `search-callers`** (`apps/app`, `apps/web`)
- The client dashboard (`hooks/queries/useWorkers.ts`) through `createClient(contract)` and the api token; the web
  `/search` page and its proxy through the api's public entry; the web's env value set in Preview (staging) and
  Production (prod) before the merge.
- The two Next routes removed in the same PR, once nothing calls them (checked by search, including `apps/web`).
- Preview checklist: a client and a coordinator search with and without a place; the public `/search` with a suburb
  and radius; an old free-text link; production checked unchanged at the same time.

## Code structure principles (carried, user 2026-10-28)

- **CS-1 One implementation for both entries:** one search, parameterised; no `searchClient` beside `searchPublic`.
- **CS-2 Reuse before writing:** the legacy matcher, the admin search's location SQL, `adminRead`-style limits, the
  paging schema, `createClient`, the token hook the worker profile already uses.
- **CS-3 Rules live once:** the keyword rules in the api only; the service slug map in `packages/schemas` if both the
  web and the api need it.
- **CS-4 No speculative layers.** **CS-5 Follow the module layout.** Each code plan lists what it reuses and adds.
