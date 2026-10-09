# The admin api

How `apps/app`'s admin screens talk to `apps/api`. Written from the code; when the token, an entry or a limit
changes, update this file in the same PR. Design record: `aidlc-docs/construction/api-identity/` (the token) and
`aidlc-docs/construction/admin-search/` (the entries).

## 1. The token

Every role-restricted entry of the api needs `Authorization: Bearer <token>`. The token is a JWT the app mints
from the admin's signed-in session; the api verifies it on every request and never touches the database to do so.

| | |
|---|---|
| Minted by | `apps/app`, `GET /api/auth/api-token` (needs the NextAuth session; reads the account's current status and role first; answers 401 for a suspended account or a changed role) |
| Claims | `sub` (user id), `role`, `act` (the impersonating admin's id, during impersonation), `iss = remonta-app`, `aud = remonta-api`, `iat`, `exp`, `jti`. No name, no email. |
| Lifetime | 5 minutes (`API_TOKEN_TTL_S` in `packages/api-contract/src/auth.ts`); the app renews a minute before expiry |
| Algorithm | HS256 with a shared secret per stage: `API_TOKEN_SECRET` in Secret Manager (`remonta-api[-staging]-API_TOKEN_SECRET`) and in Vercel (`remonta-app`: Production = prod's value, Preview = staging's value). A mismatch shows as `bad-signature` rejections and, on production, the `auth-failed` alert. |
| Header | `kid: current` (or `previous` during a rotation: the api accepts both, see `infra/README.md`) |
| Verified by | `apps/api/src/platform/auth/jwt-authenticator.ts`: signature, algorithm, issuer, audience, expiry and not-before (30 s tolerance), then the strict claims schema |
| Transport | the header only; never a cookie, never a query string, never browser storage |

**Rejections.** Every refusal is a plain 401 (`{error: {code: 'UNAUTHENTICATED', ...}}`) and one warn line in the
api's log: `{auth: 'rejected', reason}` with `reason` one of `missing`, `malformed`, `bad-signature`, `expired`,
`not-yet-valid`, `bad-issuer`, `bad-audience`, `bad-claims`. The reason is never in the response.

**Impersonation.** While an admin impersonates a worker, the token's subject is the worker with the worker's role
and `act` names the admin; admin entries answer 403 and the log line carries both ids. Impersonation never widens
rights.

**Lags, stated.** After a suspension, a role change or a sign-out, an already issued token is honoured until its
expiry (at most 5 minutes); no new token is minted for a suspended account from the next renewal on.

### Minting a token by hand (staging checklist)

With the **staging** value of `API_TOKEN_SECRET` in `$SECRET` and an admin's user id in `$SUB`:

```bash
node -e '
const { SignJWT } = require("jose");
const now = Math.floor(Date.now() / 1000);
new SignJWT({ sub: process.env.SUB, role: "ADMIN", iss: "remonta-app", aud: "remonta-api", jti: require("crypto").randomUUID() })
  .setProtectedHeader({ alg: "HS256", typ: "JWT", kid: "current" })
  .setIssuedAt(now).setExpirationTime(now + 300)
  .sign(new TextEncoder().encode(process.env.SECRET)).then(console.log)'
```

Then `curl -H "Authorization: Bearer <token>" https://remonta-api-staging-<project number>.australia-southeast1.run.app/v1/admin/workers?page=1`.
A tampered token (change one character) must answer 401 and leave a `bad-signature` line in Cloud Logging.

### Reading the logs

```
resource.type="cloud_run_revision" AND resource.labels.service_name="remonta-api" AND jsonPayload.auth="rejected"
resource.type="cloud_run_revision" AND resource.labels.service_name="remonta-api" AND jsonPayload.auth="rejected" AND jsonPayload.reason="bad-signature"
resource.type="cloud_run_revision" AND resource.labels.service_name="remonta-api" AND jsonPayload.userId="<user id>"
```

Every request made with a valid token carries `userId` (and `impersonatorId` when impersonating) on its log lines.

### Rotating the secret

`infra/README.md`, "The api token secret": three steps, no downtime, the previous value accepted for one lifetime.

## 2. Entries

Declared in `packages/api-contract/src/admin.contract.ts`; handled in `apps/api/src/modules/admin/`. All three:
`access: ADMIN`, no CAPTCHA, `maxBodyKb 1`, `privateCacheSeconds: 60` (section 3). Errors use the contract's
envelope: 400 (`fields` named), 401, 403, 429 (`Retry-After`), 500, 503 (`Retry-After`, a database or statement
timeout).

### `GET /v1/admin/workers` -- the worker search

Every parameter is optional and canonical: an absent parameter means no filter (no `all` / `none`). Unknown
parameters are refused (400). Limits: 120 per minute per admin, 300 per minute per IP.

| Parameter | Values | Meaning |
|---|---|---|
| `page`, `pageSize` | ints, `pageSize` <= 100 (default 20) | the page |
| `sortBy`, `sortOrder` | `createdAt` (default without a suburb), `firstName`, `lastName`, `city`, `state`, `distance` (default with a suburb); `asc`/`desc` | `city`/`state` sort by the worker's home suburb, falling back to the legacy columns; ties by id |
| `search` | <= 100 chars | first name, last name or mobile contains it; two words match first/last in either order |
| `localityId` | an `au_localities` id (from the suburb autocomplete) | the suburb to measure from; unknown id = 400 `fields.localityId` |
| `withinKm` | 1..500, only with `localityId` | workers whose home suburb centre is within this distance (PostGIS `ST_DWithin` on geography); without it, every placed worker, nearest first |
| `unplaced` | `true` | list active workers with **no** mapped suburb instead (ignores `localityId`/`withinKm`) |
| `typeOfSupport` | a category id (`support-worker`, `therapeutic-supports`, ...) | has that service |
| `therapeuticSubcategories` | comma-separated sub-category ids | any of, under therapeutic supports |
| `gender` | `Male`, `Female` | |
| `hasVehicle` | `Yes`, `No` | |
| `workerType` | `Employee`, `Contractor` | `tfn` / `abn` in the engagement JSON |
| `age` | `20-30`, `31-45`, `46-60`, `60+` | today's year-granular date-of-birth rule with the integer age fallback |
| `languages` | comma-separated names | any of; the additional-info list first, else the profile's |
| `experienceWith` | comma-separated `DISABILITY`, `AGED_CARE`, `WORKING_WITH_CHILDREN`, `MENTAL_HEALTH`, `CHRONIC_MEDICAL` | **all** of |
| `experienceAreas` | comma-separated `DOMAIN:Area` pairs from the shared vocabulary (`packages/schemas/src/data/experienceAreas.ts`, the labels the edit-profile page offers and `worker_experience.specificAreas` stores), e.g. `AGED_CARE:Dementia` | within a domain **any** of its areas on that worker's domain row; across domains **all** of. Each pair's domain must also be in `experienceWith`, else 400 `fields.experienceAreas` |

Every filter combines with the others and with the suburb by AND. Only active accounts are listed.

Response: `{ data: WorkerRow[], pagination: { total, page, pageSize, totalPages, hasNext, hasPrev }, appliedFilters,
unplacedCount }`. A row carries today's columns plus `serviceIds`, `distanceKm` (one decimal; only with a suburb,
measured between suburb centres) and `location { localityLabel, precision, travelRadiusKm }` for placed workers.
`appliedFilters` echoes the canonical query and names the suburb used (`locality { id, label }`). `unplacedCount`
is the number of active workers matching the other filters with no mapped suburb.

### `GET /v1/admin/users?search=<2..100 chars>[&role=WORKER|CLIENT|COORDINATOR|ADMIN]`

The impersonation picker: up to 50 users newest first whose email or any profile name contains the text
(case-insensitive). Limits 60 / 120 per minute.

### `GET /v1/admin/workers/suspended?page=&pageSize=`

Workers whose account is suspended, most recently changed first, the same row shape as the search
(`isActive: false`). Limits 60 / 120 per minute.

## 3. Caching: why a repeat is instant

Each 200 carries `Cache-Control: private, max-age=60`, `Vary: Authorization` and a strong `ETag`. The browser
answers an identical request within a minute from its own cache (no request at all); afterwards it revalidates
with `If-None-Match` and gets a 304 when nothing changed. The api also keeps a per-instance memo of search bodies
for 60 seconds, keyed by the canonical query (never by the caller), so another admin asking the same question runs
no statement. `Cache-Control: no-cache` on a request bypasses both: the dashboard's refresh button and its reload
after an admin action fetch with the browser's `reload` cache mode, which skips the browser cache and makes the
browser add that header itself (so the api's CORS allow-list needs no extra request header). Errors are never
cached. The canonical query (sorted keys, sorted comma-joined arrays, defaults applied) is `canonicalQueryOf` in
`packages/api-contract`; the page builds its URLs with it.

## 4. Parity and timing

`pnpm --filter @remonta/api parity:admin-search -- --old=<preview app url> --cookie="<NextAuth cookie>"
--new=<staging api url> --token=<admin jwt> [--time]` replays `apps/api/scripts/parity-cases.json` (45 cases)
through today's route and the new entry and compares id sets and totals; suburb cases resolve their id through
`GET /v1/localities` and are expected to differ (the old route geocoded the label with Google, capped "any distance"
at 500 km and read legacy coordinates). `--time` repeats each case ten times with `no-cache` and prints p50/p95,
paced at one call per 550 ms (`--pace=`) to stay under the entry's per-admin limit; the target is p95 under 500 ms
measured at the api (Cloud Run's request log carries the server-side latency; a client far from Sydney adds its
own round trip).

`apps/api/scripts/staging-admin-check.ts` is the staging checklist in one command (`node --import tsx
scripts/staging-admin-check.ts` from `apps/api`, with gcloud signed in): it reads the staging secrets, mints an
admin and a worker token, and prints PASS/FAIL per row (the 401/403/200 trio, a tampered token, the private cache
headers and 304, the radius cases, `EXPLAIN (ANALYZE, BUFFERS)` of the 50 km case, the twelve-request drill,
production unchanged, then the timing replay). It prints results only, never a secret or a token.

## 5. The app side (`apps/app`)

| Piece | Where | What it does |
|---|---|---|
| the token route | `src/app/api/auth/api-token/route.ts` -> `src/lib/api/mint.ts` | section 1: session, the account re-read (`withRetry`; a database error is 503 with `Retry-After`, never 401), the strict limiter (30/min per subject), `SignJWT` with `kid: current`, `no-store` |
| the token source | `src/lib/api/token.ts` (`createTokenSource`) | one per page load, in memory only; renews when under 60 s remain; one in-flight fetch shared by concurrent callers; a 401 clears it and surfaces `Unauthenticated`; a 429 waits `Retry-After` (10 s cap) once, a 5xx or network failure waits 1 s once, then `Unavailable` |
| the admin client | `src/lib/api/admin.ts` (`adminApi`, `createAdminApi`) | the bearer header; one retry on a 401 with a fresh token; outcomes `ok`, `unauthenticated`, `forbidden`, `rateLimited(retryAfterSeconds)`, `unavailable`, `failed(status, requestId, fields)`; canonical URLs (one URL per set of filters, so the browser cache and the api memo agree); `cache: 'reload'` for the refresh button and after an admin action |
| the filter state | `src/features/admin-search/query.ts` | display -> canonical (`toQuery`: `male` -> `Male`, a category id, the "Experience with" labels -> `CareDomain`), the URL state (`urlFromFilters`, `filtersFromURL`: the canonical query plus `localityLabel` for display) |
| the dashboard | `src/app/admin/AdminDashboardClient.tsx` | the suburb box keeps `{id, label}` from `/api/suburbs` (a row without an id, a Google fallback, cannot be picked); "Within" is enabled only with a suburb and resets when it clears; "N active workers have no mapped suburb" with a link to list them; "Results may be up to a minute old" with Refresh; the distance shown as kilometres from the suburb centre; every outcome has a notice and the last results stay on screen; `unauthenticated` sends the admin to `/login?callbackUrl=`; the status toggle and Reactivate reload past both caches |
| the user picker | `src/app/admin/impersonate/page.tsx` | `adminApi.listUsers`: a search of at least two characters, the role filter narrowing it (a role alone no longer lists; the entry requires a search) |

What a screen must do with each outcome is fixed by `construction/api-identity/functional-design/frontend-components.md`
(`aidlc-docs`): redirect on `unauthenticated`; keep the last results and show a notice otherwise; retry a
`rateLimited` automatically after its wait.

The old Next.js routes (`/api/admin/contractors`, `/api/admin/users`, `/api/admin/contractors/inactive`,
`/api/admin/filters`) and `src/lib/worker-search.ts` were deleted once no screen called them (the clean-up PR);
the Redis response cache they kept (`admin:contractors:v1:*`) went with them. The per-contractor routes
(`/api/admin/contractors/[id]`, `.../status`) remain: the dashboard's status toggle and Reactivate still use them.
