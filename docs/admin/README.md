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
| `state` | `ACT`, `NSW`, `NT`, `QLD`, `SA`, `TAS`, `VIC`, `WA` | the home suburb's state; a worker with no mapped suburb by the legacy `worker_profiles.state`, read as the code in any case or the full name (`Victoria`). Combines with `localityId` and with `unplaced` (the unmapped list and its count narrow to the state) |
| `typeOfSupport` | a category id (`support-worker`, `therapeutic-supports`, ...) | has that service |
| `therapeuticSubcategories` | comma-separated sub-category ids | any of, under therapeutic supports |
| `gender` | `Male`, `Female` | |
| `hasVehicle` | `Yes`, `No` | |
| `workerType` | `Employee`, `Contractor` | `tfn` / `abn` in the engagement JSON |
| `age` | `20-30`, `31-45`, `46-60`, `60+` | today's year-granular date-of-birth rule with the integer age fallback |
| `languages` | comma-separated names | any of; the additional-info list first, else the profile's |
| `experienceWith` | comma-separated `DISABILITY`, `AGED_CARE`, `WORKING_WITH_CHILDREN`, `MENTAL_HEALTH`, `CHRONIC_MEDICAL` | **all** of |
| `experienceAreas` | comma-separated `DOMAIN:Area` pairs from the shared vocabulary (`packages/schemas/src/data/experienceAreas.ts`, the labels the edit-profile page offers and `worker_experience.specificAreas` stores), e.g. `AGED_CARE:Dementia` | within a domain **any** of its areas on that worker's domain row; across domains **all** of. Each pair's domain must also be in `experienceWith`, else 400 `fields.experienceAreas` |
| `tools` | comma-separated tool ids from `packages/schemas/src/data/serviceTools.ts` (Cleaning Services and Home and Yard Maintenance), e.g. `ladder,vacuum-cleaner` | **all** of, each on the worker's row of its own service (`worker_services."toolIds" @> ...`, one `EXISTS` per service). The worker's own free-text tools are never searched. An unknown id is 400. Echoed as `appliedFilters.tools` only when given (worker-tools U1) |
| `toolSearch` | plain text, 1-60 characters, e.g. `gurney`, `pressure washer` | the shared matcher (`toolSearchOf` in `packages/schemas/src/data/serviceTools.ts`, also used by the page): lower case, punctuation as spaces, plurals singular, one-letter words dropped, at most 5 words; a listed tool matches when its label or another name (`TOOL_SYNONYMS`, approved 2026-10-22) holds **every** word **anywhere**; a worker matches when, on the type of support's row (both tool services when the type has no list), they ticked a matching tool or have an own tool holding every word of the query or a whole name of a matched tool ("pressure washer" finds an own "Gurney 2000"). Text with no word left is ignored. Echoed as `appliedFilters.toolSearch` (tool search) |
| `nursingType` | `registered`, `enrolled` | the worker's nursing answer ("I am a registered nurse" / "I am an enrolled nurse") on their `nursing-services` row (`worker_services.metadata->>'nursingType'`); a worker who never answered matches neither. **Only with `typeOfSupport=nursing-services`**, else 400 `fields.nursingType`. Echoed as `appliedFilters.nursingType` only when given (2026-10-23) |
| `activation` | `active`, `inactive` | the admin-set flag `worker_profiles."isActivated"` (absent: both). Echoed as `appliedFilters.activation` only when given (worker-activation U1) |
| `withActivation` | `true`, `false` | each row carries `activated` (the flag). **Opt-in** because the app before worker-activation U2 parses rows strictly and would refuse the new key; it becomes unconditional once no such build can be promoted (worker-activation U1, BR-6) |

Every filter combines with the others and with the suburb by AND. Only active accounts are listed.

Response: `{ data: WorkerRow[], pagination: { total, page, pageSize, totalPages, hasNext, hasPrev }, appliedFilters,
unplacedCount }`. A row carries today's columns plus `serviceIds`, `distanceKm` (one decimal; only with a suburb,
measured between suburb centres) and `location { localityLabel, precision, travelRadiusKm }` for placed workers.
`appliedFilters` echoes the canonical query and names the suburb used (`locality { id, label }`). `unplacedCount`
is the number of active workers matching the other filters with no mapped suburb.

### `GET /v1/admin/workers/:workerId/services` -- one worker's services and tools (worker-tools U1)

For the worker's admin page: `{services: [{categoryId, categoryName, subcategoryNames, toolIds, otherTools}]}`, every
chosen service in the worker's order; `toolIds` (list order, ids no longer listed left out) and `otherTools` are empty
for a service without a tool list. `:workerId` is the worker **profile** id (the admin page's `[id]`); 404 when none.
Limits 120 / 300 per minute; privately cacheable for a minute. Logged with the profile id.

### A worker's extra photos (2026-10-23)

| Entry | Body | Rules |
|---|---|---|
| `POST /v1/admin/photos/tickets` | `{contentType, sizeBytes}` | a ticket to upload one photo straight to the bucket (the worker's own direct upload and rules) |
| `GET /v1/admin/workers/:workerId/photos` | -- | `{main, additional}`; 404 when no worker has the id. Never cached |
| `POST /v1/admin/workers/:workerId/photos/additional` | `{uploadId}` | the upload as one of the worker's extra photos, at most 2; **400 when the worker has no main photo** (an admin never sets the main); 404 unknown worker. The clean copy follows by outbox |
| `POST /v1/admin/workers/:workerId/photos/additional/remove` | `{url}` | one extra photo (never the main); the file is deleted only from the worker's own folder |

Limits 30 / 120 per minute (the read 120 / 300); one log line per write with the admin and the worker; no audit row.

### `PUT /v1/admin/workers/:workerId/activation` and `.../suspension` -- the two switches (worker-activation U1)

Two separate admin decisions on one worker (`:workerId` = the worker **profile** id), each writing its own column only;
the target state is in the body, so a repeat answers the same. Never cached; one log line each (`entry`,
`adminUserId`, `workerProfileId`, the new state) is the record: no audit row, by decision (Q8 c).

| Entry | Body | Rules |
|---|---|---|
| `PUT .../activation` | `{activated: boolean}` | sets `worker_profiles."isActivated"` and answers `{workerId, activated}`. Never touches sign-in (`users.status`), Verify Compliance (`isPublished`) or `updatedAt`; a suspended worker can be switched too. 404 when no worker has the id. Limits 120 / 300 per minute |
| `PUT .../suspension` | `{suspended: boolean}` | `users.status` SUSPENDED (no sign-in) or ACTIVE (from any other state, as the app's old `PATCH /api/admin/contractors/[id]/status`), `users.updatedAt` set; no write when already so; answers `{workerId, suspended}`. **Worker accounts only**: 404 when no worker has the id or its account is not a WORKER. Never changes `isActivated`. Limits 30 / 120 per minute |

**The flag** (`isActivated BOOLEAN NOT NULL DEFAULT false`, migration `20261023120000_worker_profiles_is_activated`):
false for every worker that existed on 2026-10-23 (the reset the user asked for) and for every new profile; only
`PUT .../activation` sets it. From worker-activation U2, the public worker list shows only workers with the flag
on and the account ACTIVE; signed-in clients see every unsuspended worker (2026-10-23).

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
| the filter state | `src/features/admin-search/query.ts` | display -> canonical (`toQuery`: `male` -> `Male`, a category id, the "Experience with" labels -> `CareDomain`, the areas chosen under each selected domain -> `DOMAIN:Area` pairs, only for searched domains), the URL state (`urlFromFilters`, `filtersFromURL`: the canonical query plus `localityLabel` for display) |
| the experience areas | the dashboard, under "Experience with" | one section per selected domain listing that domain's specific areas from the shared vocabulary (`@remonta/schemas/data/experienceAreas`, the same list the worker's edit-profile page offers); none chosen = any area; deselecting the domain hides the section and forgets its areas |
| the tools filter (worker-tools U2) | the dashboard, under "Type of support" and above "Experience with" | shown only while "Type of support" is Cleaning Services or Home and Yard Maintenance (as the areas under "Experience with"): that service's tools as toggle buttons from `@remonta/schemas/data/serviceTools`; another type of support hides them and forgets the choice; `AdminFilters.tools` (ids, only the type of support's) -> `tools` in the canonical query and the URL; workers with **all** the chosen tools |
| the tool search box (tool search TS-5) | in the Tools box | "Search tools": narrows the buttons as the admin types with the api's own matcher (`toolSearchView` -> `toolSearchOf`), the ticked tools always shown, "Also matches: ..." for the other names; the text is `AdminFilters.toolSearch`, sent as `toolSearch` on Apply only with a type of support that has a list, kept in the URL, cleared with the type of support and Clear filters |
| the tools line (worker-tools U2) | `src/app/admin/contractors/[id]/page.tsx` + `WorkerToolsLine.tsx` | `adminApi.getWorkerServices(<profile id>)`; under Cleaning Services and Home and Yard Maintenance in the services list: "Tools: ... · Other: ..." ("Tools: none listed" when empty). **Not in the downloaded profile JPEG** (not rendered while it is made); a failed read leaves the line out |
| the dashboard | `src/app/admin/AdminDashboardClient.tsx` | the suburb box keeps `{id, label}` from `/api/suburbs` (a row without an id, a Google fallback, cannot be picked); the State dropdown sits under it (all states, or one: sent as `state`, kept in the unmapped list); "Within" is enabled only with a suburb and resets when it clears; "N active workers have no mapped suburb" with a link to list them; "Results may be up to a minute old" with Refresh; the distance shown as an **estimated driving time** ("about 25 min drive from the suburb centre", `features/admin-search/travel.ts`: straight-line km × 1.3, banded speeds, +3 min, rounded to 5; the km stay in the tooltip; no routing service), the sort still by straight-line distance; every outcome has a notice and the last results stay on screen; `unauthenticated` sends the admin to `/login?callbackUrl=`; the status toggle and Reactivate reload past both caches |
| activation (worker-activation U2) | the dashboard and the worker's admin page | the card's **Active** switch is the admin-set flag (`adminApi.setWorkerActivation`, no confirm; the card shows the answer, then the list reloads past both caches); it never suspends. Every search sends `withActivation=true` (`searchRequestOf`, kept out of the URL bar). Tabs **All · Active · Inactive** above the results, instant, kept in the URL as `activation`. "Suspended accounts" (was "Show Inactive Workers") lists `users.status = SUSPENDED` with **Restore** (`adminApi.setWorkerSuspension(id, false)`). The worker's admin page (`WorkerAccountStatus.tsx`, outside the JPEG card) shows "Account" and "In the public worker list" with **Suspend account** (an in-page confirm) or **Restore account**; `/api/admin/contractors/[id]` returns `account {status, isActivated}` for it |
| the nurse type (2026-10-23) | the dashboard, under "Type of support" | a "Nurse type" select (All / Registered nurse / Enrolled nurse), shown only while Nursing Services is the type of support; applied with the other filters, kept in the URL, forgotten when the type of support changes; sent as `nursingType` |
| the client and public lists | `src/lib/workers/listable.ts` (`LISTABLE_WORKER`) | `/api/public/workers` (the marketing site) shows only `isActivated` workers whose account is ACTIVE; its 60 s cache means a switch shows there within a minute. `/api/client/workers` (the signed-in client's Find Worker) shows every worker whose account is ACTIVE, activated or not (user, 2026-10-23). A client's assigned workers (`/api/client/workers/by-ids`) are not filtered (BR-U4) |
| the user picker | `src/app/admin/impersonate/page.tsx` | `adminApi.listUsers`: a search of at least two characters, the role filter narrowing it (a role alone no longer lists; the entry requires a search) |

What a screen must do with each outcome is fixed by `construction/api-identity/functional-design/frontend-components.md`
(`aidlc-docs`): redirect on `unauthenticated`; keep the last results and show a notice otherwise; retry a
`rateLimited` automatically after its wait.

The old Next.js routes (`/api/admin/contractors`, `/api/admin/users`, `/api/admin/contractors/inactive`,
`/api/admin/filters`) and `src/lib/worker-search.ts` were deleted once no screen called them (the clean-up PR);
the Redis response cache they kept (`admin:contractors:v1:*`) went with them. The per-contractor routes
(`/api/admin/contractors/[id]`) remains for the worker's admin page; `.../status` was deleted by worker-activation U2
(the switch and Restore call the api's `PUT .../activation` and `.../suspension`).

**The worker's private details (U2).** `/api/admin/contractors/[id]` also returns the home address (`homeAddress`:
street line, suburb, state, postcode, or null) and the bank account masked to the last three digits
(`src/lib/bankAccount.ts`, the api's mask, a test proving the two agree). The page shows them in a "Home address
(private)" block **above** the profile card, never inside it: the "Download JPEG Profile" button captures only
`.profile-card`, which is sent to clients. No client-facing route or page reads the home address
(`src/lib/privacy.test.ts` checks every client-facing worker read selects named columns and none names it).
