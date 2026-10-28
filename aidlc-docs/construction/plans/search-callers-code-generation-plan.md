# U2 `search-callers`: Code Generation plan (2026-10-28)

Requirements FR-1, FR-5 (no visible change); execution plan U2. U1 is live (prod `remonta-api-00025-8b9` = `6886e09`), so
the order rule holds. Branch `feat/search-callers` from `main` `6886e09` (already holds the batched parity script).
One PR; it moves both pages at once and deletes the two routes they leave. Rollback: Vercel promote of the previous
`remonta-app` and `remontamarketplace` deployments (the api stays as it is).

## Steps

1. [ ] **The app's search client** (`apps/app/src/lib/api/search.ts`): `searchWorkersForClient(query)` →
   `ApiOutcome<ClientWorkerResponse>` over `createClient(searchContract)`, the bearer token from the existing
   `apiToken` source, one retry on 401, the canonical query (so the browser cache and the api memo see one URL).
   **Reuse (CS-2):** the token-and-retry loop is written three times today (`admin.ts`, `account.ts`,
   `features/worker/api.ts`). The new client does not add a fourth: the loop moves into one helper
   (`lib/api/call.ts`: token, bearer header, 401 retry, `failure()`), used by the search client and by
   `account.ts` (same shape). `admin.ts` and the worker client keep theirs in this PR (they add canonical queries,
   abort signals and cache modes; moving them is a separate refactor with its own tests) — listed as a follow-up.
2. [ ] **The hook** (`apps/app/src/hooks/queries/useWorkers.ts`): `fetchWorkers` calls the search client; an outcome
   other than `ok` throws as today (React Query's retry and error state unchanged); `Worker`/`WorkersResponse` become
   the contract's types (`ClientWorkerCard`, the response); the `cached` field goes (no reader: checked).
   `NEXT_PUBLIC_API_URL` missing → the same "unavailable" error the admin lists show.
3. [ ] **The marketing page** (`apps/web/src/app/search/page.tsx`): `createClient(searchContract)` against
   `NEXT_PUBLIC_API_URL`, server side, `next: { revalidate: 60 }` instead of `no-store` (NFR design); `Worker` from
   the contract. `apps/web/package.json` gains `@remonta/api-contract` (allowed: P-1 names exactly this path) + the
   lockfile. The web's other uses of `REMONTA_API_URL` (`/api/suburbs` → the app) are unchanged.
4. [ ] **Remove what nothing calls any more**, each checked by a search for its path, run-time URLs included
   (`environment-traps`): `apps/app/src/app/api/client/workers/route.ts`, `apps/app/src/app/api/public/workers/route.ts`
   and the web proxy `apps/web/src/app/api/public/workers/route.ts` (Question 2). `client/workers/by-ids` stays
   (assigned workers, not a search). The app's copy of the slug map and keyword rules go with the routes.
5. [ ] **Parity script** (already on the branch): `explain()` batched, the no-place label first.
6. [ ] **Tests**: the search client (ok, 401 retry, unavailable without a base URL, canonical URL); the hook's
   mapping (ok → data, failure → thrown); the web page's fetch (contract client, revalidate). Gates: app, web,
   api-contract, `turbo build` (both apps).
7. [ ] **Docs**: `docs/search/README.md` (callers moved, routes gone); CLAUDE.md "Reach" unchanged (already names the
   entries); the code summary with the duplicate check.

## Before the merge (the user)

- **Vercel, project `remontamarketplace`**: add `NEXT_PUBLIC_API_URL` = the staging api URL in **Preview** and the
  prod api URL in **Production** (the same values `remonta-app` has). Without it the marketing `/search` shows no
  workers (it already shows none in production today: 0 activated workers).
- **Preview checklist** (CLAUDE.md): sign in as a staging client and a staging coordinator; search with and without
  a suburb, with keywords and a service; the marketing preview's `/search` with a suburb and radius; production
  checked unchanged at the same time.

## Questions

### Question 1: The marketing site's api URL variable
A) `NEXT_PUBLIC_API_URL`, the same name and per-scope values as `remonta-app` (one name to remember; used server
   side only, the value is public anyway)
B) A server-only name, e.g. `REMONTA_SERVICE_API_URL`
X) Other

[Answer]: A

### Question 2: The marketing site's own `/api/public/workers` proxy (www.…/api/public/workers)
Nothing in `apps/web` calls it (the page calls the app directly). Something outside the repository might (a bookmark,
an old embed).
A) Remove it with the two app routes
B) Keep it, pointed at the new api entry
X) Other

[Answer]: A
