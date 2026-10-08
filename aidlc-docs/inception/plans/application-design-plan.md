# Application Design Plan -- admin worker search on `apps/api`

**Inputs:** `../requirements/requirements.md` (approved 2026-10-08 with its amendment: D12 one query, D13 no schema
change, D14 three entries), `../user-stories/stories.md` (17 stories), `../requirements/admin-search-inventory.md`,
`../reverse-engineering/` (the pipeline, `Authenticator`, `defineHandlers`, `meta()`, `createClient`, the stage
table), and the four open items the requirements left for design (OI-1, OI-2, OI-3, OI-5; OI-4 goes to NFR
Requirements).

Four decisions shape the components. Each is pre-filled with a proposal; leave it to accept or change the letter,
then say "approved" (or "done").

## Question 1
How the search statement is built (requirements OI-1). Today's route composes a Prisma `where` from a registry of
filter functions; the new search needs a geography predicate, a distance sort, a count and a page in **one**
statement (FR-GEO-03), which Prisma's query builder cannot express.

A) **One SQL statement from typed fragments.** The filter registry is ported as data: each filter is `{ param,
parse, sql(value) => Prisma.Sql }` returning a parameterised fragment (`Prisma.sql` tagged templates; `$queryRaw`
only). The search service joins the fragments with AND, adds the location term, the `ST_Distance` sort, `LIMIT /
OFFSET`, and a window count (`COUNT(*) OVER()`) plus the unplaced count in the same round trip. One statement,
one plan, the GiST index used. Recommended: it is what FR-GEO-03 and NFR-01 ask for; the registry stays a table
(one row per filter), which is this codebase's "declare it once" preference.

B) **Two round trips.** Keep the Prisma `where` registry as it is for the non-location filters, run `findMany` for
the matching ids, then one raw statement for the geo filter, distance sort, count and page over `id IN (...)`.
Smaller port of the registry; the id list travels to the database and back (today about 2,000 ids at most), and the
total is computed in the second statement.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 2
The token library and where the claims live (requirements OI-2). Both sides must agree on the claims, the
algorithm and the checks.

A) **`jose` on both sides, claims schema in `packages/api-contract`.** `jose` is a standard, audited JWT library
already in `apps/app`'s dependency tree (NextAuth uses it); `apps/api` adds it as a direct dependency. The claims
(`sub`, `role`, `act` for the impersonator, `iss`, `aud`, `iat`, `exp`, `jti`) are a Zod schema in a new
`packages/api-contract/src/auth.ts` with the constants (issuer, audience, lifetime), so the app's minter and the
api's verifier import one definition and the contract package stays dependency-free (P-6: Zod only; `jose` is used
by the two sides, not by the package). HS256 with a 32-byte secret per stage. Recommended.

B) **Node `crypto` HMAC with a small encoder/decoder in `packages/api-contract`.** No new dependency, but a
hand-written JWT (base64url, header, signature) that the package must then test for every corner `jose` already
handles; and `node:crypto` is forbidden in the package (P-6), so the signing part would live twice anyway.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 3
Entry names, paths and how array filters travel (requirements OI-3).

A) **Paths under `/v1/admin/`:** `searchWorkers` GET `/v1/admin/workers`, `listUsers` GET `/v1/admin/users`,
`listSuspendedWorkers` GET `/v1/admin/workers/suspended`. **Arrays as one comma-separated parameter**
(`languages=English,Mandarin`), which is exactly what the page's URL state sends today; the contract's strict query
schema splits and trims it. Recommended: no change to the page's URL shape, the parity script can replay today's
URLs verbatim.

B) **Repeated parameters** (`languages=English&languages=Mandarin`), the HTTP-conventional form; the page's URL
builder and parser change accordingly.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 4
What `withinKm` accepts (requirements OI-5).

A) **Any integer from 1 to 500.** The dropdown keeps its four values (5, 10, 20, 50) and can gain one later
without an api change; 500 is the cap the database schema already uses for a worker's travel radius, so nothing
ever scans the continent. Recommended.

B) **Only the four values the dropdown shows** (an enum in the contract); a new dropdown value needs a contract
change and an api release.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Design decisions that are not questions (stated so they can be objected to)

- **One new module, `apps/api/src/modules/admin/`:** `admin.handlers.ts` (three handlers bound with
  `defineHandlers(adminContract, ...)`), `application/search-workers.ts` (the service), `application/filters.ts`
  (the registry as data), `application/list-users.ts`, `application/list-suspended.ts`,
  `persistence/worker-search-sql.ts` (the statement and its fragments), `domain/search-query.ts` (pure: parse,
  normalise and validate the query the way today's `parseFilterParams` and the registry do; the age-range to
  birth-date rule; Title Case). Entries in `packages/api-contract/src/admin.contract.ts`; `contracts` gains it.
- **The authenticator is one file,** `apps/api/src/platform/auth/jwt-authenticator.ts`, implementing the existing
  `Authenticator` port; `DenyAllAuthenticator` stays for tests; `main.ts` wires the JWT one; `config.ts` adds
  `API_TOKEN_SECRET` (required, 32+ bytes). `Principal` gains an optional `impersonatorId`.
- **The app's side is two small files plus the page changes:** `apps/app/src/app/api/auth/api-token/route.ts`
  (reads the NextAuth session with the existing helpers, mints with `jose`, answers `{token, expiresAt}`), and
  `apps/app/src/lib/api/` with `token.ts` (fetch, cache, refresh-before-expiry, one retry on 401) and `admin.ts`
  (`createClient(adminContract, ...)` with the token header). The admin dashboard and the impersonate page call
  `admin.ts`; no `fetch` to the api anywhere else (Semgrep).
- **The locality resolver reuses what exists:** the search service reads the `au_localities` row by id through
  Prisma (`findUnique`), as `register-worker.ts` does; the statement then takes the row's coordinates as parameters
  and builds the search point in SQL (`ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography`), so the GiST index on
  `worker_locations.point` serves the predicate.
- **Sorting by `city`/`state`** joins the HOME locality (`au_localities.suburb`, `state`) with `COALESCE` to the
  legacy columns for unplaced workers (requirements amendment).
- **The parity script** lives at `apps/api/scripts/parity-admin-search.ts`: a list of URLs, the old route's base
  URL and session cookie, the new entry's base URL and token, a report of id sets and totals; run by hand on
  staging, its output pasted into the construction notes.
- **The auth-failure alert** is `infra/cloudrun/monitoring/auth-failed.json` on a new log metric
  (`remonta-api-auth-failed`, counting warn lines with `auth: 'rejected'`), applied by `apply-alerts.sh`; its
  threshold is an NFR Requirements decision (OI-4).
- **Per-user and per-IP limits** on the three entries are values decided at NFR Requirements; the mechanism is the
  existing `meta().rateLimit` with `per: 'user'`.

## Execution checklist

- [x] 1. Confirm the four answers above; resolve any ambiguity in a clarification file
- [x] 2. `aidlc-docs/inception/application-design/components.md`: each component's purpose, responsibilities and
  interface, across contract, api, app, infra
- [x] 3. `component-methods.md`: method signatures with input and output types (rules deferred to Functional
  Design)
- [x] 4. `services.md`: the orchestration of mint, verify, search (parse, resolve, build, run, shape), the two
  lists, and the sequence per PR (1, 2, 3, 4)
- [x] 5. `component-dependency.md`: dependency matrix, communication patterns, data flow for a search request and
  for a token refresh; the boundary rules P-6 and P-7 respected
- [x] 6. `application-design.md`: the consolidated document
- [x] 7. Present for approval
