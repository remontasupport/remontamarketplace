# The worker api

How a signed-in worker's own screens talk to `apps/api`. Written from the code; when an entry, a rule or a
limit changes, update this file in the same PR. Design record: `aidlc-docs/construction/worker-area/`
(unit U1 of the worker-profile-api cycle); the token is the same as the admin screens' (`docs/admin/README.md`).

## 1. The token and the ownership rule

Every worker entry needs `Authorization: Bearer <token>`: the JWT `apps/app` mints at `GET /api/auth/api-token`
from the worker's session (`sub` = the user id, `role` = `WORKER`, five minutes; `docs/admin/README.md` §1 has the
claims, the rejections and how to mint one by hand for the staging checklist).

**Ownership (R1).** Every worker entry acts on the profile whose `userId` is the token's subject. No entry takes
a user id or a profile id in its path, query or body, so there is no request value that can name another worker.
A child row named by id (a document, a photo, an application: later units) that is not the caller's is **404,
never 403**. A `WORKER` token whose account has no `worker_profiles` row is 404 too, with one warn line
`{reason: 'WORKER_PROFILE_NOT_FOUND', userId}` in the log (a data fault, not a client error). Any other role is
403 from the pipeline before a handler runs. An impersonating admin's token carries the worker as `sub` and the
admin as `act`; the log lines carry both ids; nothing else differs.

## 2. Entries

Declared in `packages/api-contract/src/worker.contract.ts`; handled in `apps/api/src/modules/worker/`. Every
entry is built with `workerRead()` or `workerWrite(audit)`: reads are `access: WORKER`, no CAPTCHA,
120 per minute per user and 300 per minute per IP, `maxBodyKb 1`, privately cacheable for 60 s (§3); writes
(U2 on) are 60 / 120 per minute, `maxBodyKb 16` and carry a mandatory audit action. Errors use the contract's
envelope: 400, 401, 403, 404, 429 (`Retry-After`), 500, 503 (`Retry-After`: shedding, a full pool, a statement
timeout, the limiter unreachable).

### `GET /v1/worker/profile` -- the worker's own profile (U1)

No parameters (any query parameter is 400). One read inside one transaction (ReadCommitted, statement timeout
5 s): the profile columns, the sections, the HOME suburb, the catalogue rows for the worker's services; then the
completion flags and the requirement groups are computed from those rows. Nothing is written (§4 says who
persists the flags).

Response: the `Profile` object (`profileSchema`, strict: nothing unlisted leaves):

| Field | Source | Note |
|---|---|---|
| `id` | `worker_profiles.id` | used by no request (ownership is the token) |
| `names { firstName, middleName, lastName }`, `mobile` | columns | |
| `photos { main }` | `photos` | one photo per worker (2026-10-14); `additionalPhotos` is kept as stored and read only by the admin pages |
| `bio` | `introduction` | |
| `personalInfo { dateOfBirth, age, gender, hasVehicle, languages }` | columns | `hasVehicle` is `Yes`, `No` or null |
| `abn { type, value, signed }` or null | the `abn` JSON (`workerEngagementType`) | `type` is `abn` or `tfn`; `value` only for an ABN that stored its number (a few legacy rows); a TFN never reports a number |
| `homeAddress` or null | `homeStreetLine` + `homeLocalityId` (the suburb joined) | the private home address (U2); returned to its owner and the admin page only |
| `serviceArea { localityId, label, travelRadiusKm, precision }` or null | the HOME `worker_locations` row + `au_localities` | `label` is "Suburb, ST postcode"; null when the worker is unplaced |
| `displayRole` | `worker_services` | the first service by creation; a therapeutic one shows its sub-categories joined by " / "; none: "Support Worker" |
| `verificationStatus` | column | `NOT_STARTED`, `IN_PROGRESS`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`; the column is free text and one legacy row reads `Verified`, so the field is a string |
| `isPublished` | column | |
| `completion` | computed (§4) | `{ accountDetails, compliance, trainings, services, profileCompleted, percent }` |
| `requirements { mandatory[], trainings[] }` | catalogue + `verification_requirements` (§5) | `{ id, name, requirementType, documentType, status }` each |
| `services[]` | `worker_services` | `{ categoryId, categoryName, subcategoryIds, subcategoryNames }`, creation order |
| `sections.availability[]` | `worker_availability` | `{ day, startMinute, endMinute }`, sort order |
| `sections.experience[]` | `worker_experience` | the five care domains |
| `sections.jobHistory[]`, `sections.education[]` | `worker_job_history`, `worker_education` | sort order |
| `sections.additionalInfo` or null | `worker_additional_info` | languages, cultural background, religion, interests, work preferences, the three booleans, personality, unique service, fun fact |
| `sections.bankAccount` or null | `worker_additional_info.bankAccount` | **masked**: `{ accountName, bankName, bsbLast3, accountNumberLast3 }`; the stored BSB and account number never leave |
| `updatedAt` | column | the ETag is of the body, not of this |

### The section writes (U2 edit-profile)

Every write replaces a whole section (PUT semantics: the body is the section's full new value), runs in one
transaction with a 5 s statement timeout, is idempotent, and answers the section as stored. Limits 60 / 120 per
minute (the photo ticket 10 per minute per worker). Errors: 400 with `fields` naming the path
(`slots.3.startMinute`, `domains.0.specificAreas.1`, `localityId`, `abn`), 401, 403, 404 (a WORKER account with no
profile; a photo upload that is not the caller's), 429, 503. Each write records one `PROFILE_UPDATE` audit row with
the section and the profile id (never a value; the impersonator when there is one), and the writes that can change a
completion flag recompute and persist it in the same transaction. After a save the client reloads the profile read.

| Entry | Body | Rules |
|---|---|---|
| `PUT /v1/worker/profile/name` | `{firstName, middleName | null, lastName}` | 1-100 characters, letters of any script, spaces, hyphens, apostrophes |
| `PUT /v1/worker/profile/bio` | `{bio}` | 1-2,000 characters, plain text (newlines allowed) |
| `PUT /v1/worker/profile/date-of-birth` | `{dateOfBirth}` | a real `YYYY-MM-DD` date, 16-100 years old on the api's clock. `age` is not written |
| `PUT /v1/worker/profile/gender` | `{gender}` | `Male`/`Female` |
| `PUT /v1/worker/profile/vehicle` | `{hasVehicle}` | `Yes`/`No`; decides whether the licence documents are required. Each of these three writes its own column only (split from one `personal-info` write, 2026-10-14). Languages are the Languages group |
| `PUT /v1/worker/profile/abn` | `{abn}` | 11 digits (spaces allowed) passing the ATO checksum; stored `{workerEngagementType: {type: 'abn', value, signed}}`, `signed` kept from an ABN record, false after a TFN one (D17) |
| `PUT /v1/worker/profile/home-address` | `{streetLine, localityId}` | one line of 1-120 characters; a current suburb of ours. Writes `homeStreetLine`/`homeLocalityId` only: never the legacy location columns, never `worker_locations`; never in a client-facing response |
| `PUT /v1/worker/profile/service-area` | `{localityId, travelRadiusKm}` | a current suburb; 1-500 km. Upserts the HOME `worker_locations` row (`source ONBOARDING`) and writes the legacy columns as the sign-up does, so the admin and client searches follow; an unplaced worker becomes placed |
| `POST /v1/worker/photos/tickets` | `{contentType, sizeBytes}` | the sign-up's ticket (JPEG/PNG/WebP, 5 MB) |
| `POST /v1/worker/photos` | `{uploadId}` | the sign-up's confirm (the object inspected), then the upload claimed by this profile as its photo, replacing the current one; `PhotoUploaded` makes the clean copy and repoints the column. 201 with `{main}` |
| `POST /v1/worker/photos/remove` | `{url}` | the photo, when the URL is the worker's own (else 400); the processed Blob copy and its thumbnail are deleted after the commit, only when the file is in the caller's own folder (`workers/<their profile id>/<upload id>.<ext>`); any other URL is cleared from the column and the file left |
| `PUT /v1/worker/availability` | `{slots: [{day, startMinute, endMinute}]}` | minutes 0-1440, start < end, at most 4 a day, no overlap; stored in week order |
| `PUT /v1/worker/experience` | `{domains: [...]}` | one entry per care area, professional or personal or both, any of that area's specific areas (its own list; the limit of 3 went on 2026-10-13), 10 other areas |
| `PUT /v1/worker/job-history`, `/education` | `{entries: [...]}` | 0-20 entries, month names, years 1950-now, "currently" means no end date, otherwise the end not before the start; the order kept |
| `PUT /v1/worker/additional-info/:group` | `{group, ...}` | nine groups (`good-to-know`, `languages`, `cultural-background`, `religion`, `interests`, `support-activities`, `fun-fact`, `preferences`, `personality`; `about-me` was split into the two on 2026-10-13 so each saves alone); the path and the body's `group` agree; values from `packages/schemas/src/data/profileOptions.ts` (languages and interests also accept a worker's own label); a group write changes only its own columns |
| `PUT /v1/worker/bank-account` | `{accountName, bankName, bsb, accountNumber}` | all four; BSB 6 digits (one dash allowed), number 6-10 digits; stored as today's JSON; the answer and every read are masked to the last three digits |

## 3. Caching

Each 200 carries `Cache-Control: private, max-age=60`, `Vary: Authorization` and a strong `ETag` (a hash of the
body). The browser answers an identical request within a minute from its own cache; afterwards it revalidates
with `If-None-Match` and gets a **304** with no body when nothing changed. The body is per user, so the api's
response memo is not used (a 304 saves bandwidth and client work, not statements). Errors are never cached.

## 4. The completion flags

`completion` is computed on every read by `apps/api/src/modules/worker/domain/completion.ts` from the rows the
read fetched: pure, no clock, no second query. The rules are `aidlc-docs/construction/worker-area/functional-
design/business-rules.md` R3; today's app function is kept as the test oracle, and the property test proves the
two agree everywhere except where the rules below say **[fix]**.

- **accountDetails**: first name, last name, main photo, bio, city, state, postcode and gender all non-empty,
  and an age or a date of birth. Whitespace-only counts as empty **[fix]**; a date of birth counts like an age
  **[fix]**.
- **compliance**: false without services. Required = the catalogue documents of category IDENTITY, BUSINESS or
  COMPLIANCE linked to the worker's categories where the link is `REQUIRED` (a conditional link is honoured when
  the profile answers the condition, e.g. `hasVehicle`, and ignored otherwise) **[fix]** and to the chosen
  sub-categories (always required), plus the two code-of-conduct parts. Presence per document:
  `identity-points-100` needs a PRIMARY and a SECONDARY row; `abn-contractor` is satisfied by a signed ABN
  engagement (or a stored ABN number) **[fix]** or a `contract-of-agreement` row; part 1 is always present;
  part 2 needs a `code-of-conduct` row; `ndis-screening-check` accepts `worker-screening-check` and
  `ndis-worker-screening`; `right-to-work` accepts `identity-working-rights`; anything else its own id (the base
  type after the last `:` of a composite key). Then every row that stands for a required document -- including the
  contract, code-of-conduct and composite rows **[fix]** -- must be `SUBMITTED` or `APPROVED`, and at least one
  such row must exist.
- **trainings**: false without services or without a required TRAINING document (`REQUIRED` links **[fix]**);
  `ndis-worker-orientation` and `ndis-training` are one and the same; a training is present when a row of that
  type is `SUBMITTED` or `APPROVED` **[fix: status, not `documentUrl`]**.
- **services**: false without services. Per service, the required and optional types from the table in
  `domain/service-requirements.ts` (today's eleven rows; the sub-category decides the therapeutic row; a service
  without sub-categories uses its "no sub-category" row instead of making everything false **[fix]**). Uploads
  are the `SERVICE_QUALIFICATION` rows keyed `<Service title>:<type>` whose title matches the service
  case-insensitively **[fix]** and whose status is `SUBMITTED` or `APPROVED` **[fix]**. Required types all
  uploaded, else at least one upload when only optional types exist, else passes.
- **profileCompleted** = all four **[fix: computed and persisted; nothing set it before]**.
- **percent** = round(100 × filled / 13) over: name, main photo, bio of 50+ characters, a HOME suburb, personal
  info (date of birth or age, gender, vehicle, a language), a valid ABN, a service, an availability slot, an
  experience row, a job, an education entry, the additional-info languages, a personality. The badge highlight
  stays below 80.

**Persistence.** `persistCompletion(tx, profileId, completion)` (`domain/persist-completion.ts`) writes
`worker_profiles.setupProgress` (the four flags) and `profileCompleted` only when they differ from the stored
values, and moves `verificationStatus` from `NOT_STARTED` to `IN_PROGRESS` when any flag becomes true. The read
never calls it; every write that can change a flag (U2-U4) does. U1 ships the backfill (§7).

## 5. The requirement groups

`requirements.mandatory` = the IDENTITY/BUSINESS/COMPLIANCE documents linked to the worker's services,
deduplicated in catalogue order, with "Code of Conduct (Part 1)" spliced after `abn-contractor` (or appended) and
part 2 omitted. `requirements.trainings` = the TRAINING documents minus the three NDIS modules folded into
`ndis-worker-orientation`, in the sidebar's order (`TRAINING_STEP_ORDER`, unknown ids last). Each item carries
`documentType` (`REQUIRED`/`OPTIONAL`, the link's) and a `status`: `approved`, `submitted`, `rejected`, `expired`
or `missing` (no row, or `PENDING` only), using the same presence aliases as §4. **Without services both groups
are empty** (the sidebar says "choose your services first"; the old route listed every category's documents).

## 6. Limits, shedding and the health check

| | |
|---|---|
| Rate limits | 120 / min per worker, 300 / min per IP on reads; 60 / 120 on writes (U2 on); 429 + `Retry-After` |
| Shedding | 503 + `Retry-After: 2` before any work when the instance holds `MAX_IN_FLIGHT` requests (64 on both stages, below Cloud Run's concurrency of 80) or its event-loop p99 is over 200 ms |
| Pool | 5 connections per instance, 5 s wait; a wait past it is 503 (`reason: pool`); a statement past 5 s is 503 (`reason: timeout`) |
| Health | `GET /v1/health` answers 200 without a query while any transaction committed within 30 s; otherwise `SELECT 1` under a 2 s timeout, 503 on failure. Probes never pay the limiter and are never shed. |
| Log line | one per request: `reqId`, `userId` (and `impersonatorId`), `entry`, `status`, `durationMs`; every 503 carries `reason` (`shed`, `pool`, `timeout`, `limiter`, `captcha`, `db`); never a name, a number or a row |

Saved queries (Cloud Logging, replace the service name for staging):

```
resource.type="cloud_run_revision" AND resource.labels.service_name="remonta-api" AND jsonPayload.entry="worker.getProfile"
resource.type="cloud_run_revision" AND resource.labels.service_name="remonta-api" AND jsonPayload.reason=("shed" OR "pool" OR "timeout" OR "limiter")
```

The 5xx-ratio alert counts 503s: a burst that sheds shows there first, which is the intended signal.

## 7. The load test, the drills and the backfill

- **Load test** (`apps/api/scripts/load-worker.ts`, `pnpm --filter @remonta/api load:worker -- --base-url <staging url>
  --workers 200 --rate 25 --minutes 10 --burst 5 --report <file>`): staging only (the base URL host must contain
  `staging`, the database host must not be production's; exit 2 otherwise); reads `STAGING_API_TOKEN_SECRET` and
  `STAGING_AUTH_DATABASE_URL`; the generator's IP must first be listed in staging's `RATE_LIMIT_EXEMPT_IPS`
  (`infra/README.md`, "Drills": the 300/min per-IP rule would otherwise refuse most of the run); a 60 s warm-up, the sustained phase, a 60 s burst at rate × burst, a 60 s
  recovery; 70 % reads (half conditional), the 30 % write share becomes section writes in U2 (reads only in U1,
  stated in the report); per-worker back-off on 429/503 honouring `Retry-After`; the thresholds table
  (sustained: p95 ≤ 300 ms, p99 ≤ 800 ms, no 429/5xx; burst: 503 allowed, no other 5xx, p95 of admitted ≤ 1 s;
  recovery: no 503 after 30 s); exit 0 only when every row passes; the JSON report goes to
  `aidlc-docs/construction/worker-area/code/`. Runbook: `infra/README.md`, "Drills". The script's latencies
  include the round trip from the machine it runs on (about 250 ms from outside Australia) and its "p95" is
  autocannon's p97.5; the api's own figures come from Cloud Logging (`jsonPayload.responseTime` on the
  "request completed" lines), which is what the thresholds were written for.
- **Drills**: the burst phase on one staging instance with revision events watched (no liveness restart
  expected), and five minutes at the sustained rate with `MAX_EVENT_LOOP_DELAY_MS=50` set on staging by hand then
  restored (the table's values back, or the same image redeployed with its full sha). Never on prod. Run on
  2026-10-12: no restart; the event-loop signal shed 25 requests and recovered within the minute.
- **What one instance carries** (run 2, 2026-10-12): about 55 reads a second; above that latency climbs because
  the 5-connection pool fills (a read holds a connection ~80 ms) while in-flight stays far below
  `MAX_IN_FLIGHT` and the event loop stays quiet -- the pool is the first limit, the shedder the second. The
  125 req/s burst needs three instances; prod scales to ten.
- **Backfill** (`pnpm --filter @remonta/api backfill:completion [-- --apply --allow-production --report=<file>]`):
  every profile through the rules of §4 (a page of workers per transaction, so a run from a machine far from
  the database takes seconds per page rather than seconds per worker), then `persistCompletion`; dry run by
  default; idempotent. The database: `STAGING_AUTH_DATABASE_URL` when set, else `DIRECT_DATABASE_URL` /
  `AUTH_DATABASE_URL` from the shell or `apps/api/.env` (which points at the LOCAL database on a developer
  machine, so for production export the URL from Secret Manager:
  `DIRECT_DATABASE_URL="$(gcloud secrets versions access latest --secret=remonta-api-AUTH_DATABASE_URL)"`).
  Any run on a production host, dry or not, needs `--allow-production`. Run on staging before a promotion and
  on prod right after, as checklist lines; the 2026-10-12 runs (1,790 and 1,843 profiles, 414 and 422 changed,
  a second apply changing nothing on both) are in the cycle's construction notes.
- **The checklist runner** (`pnpm --filter @remonta/api check:worker [-- --stage=prod]`): the 14 api checks of
  PR 1's verification against staging (default) or production -- health, a worker's read in the contract shape,
  masked bank data, the cache headers and 304, 401/403/404/400, the admin search, the other stage's health --
  with tokens minted from the stage's secrets in Secret Manager; read-only; prints results, never a token.

## 8. Reading the tables

`worker_profiles` (columns above, plus `setupProgress`, `profileCompleted`, `verificationStatus`),
`worker_services`, `verification_requirements` (`requirementType`, `status`, `documentCategory`, `documentUrl`),
`worker_availability`, `worker_experience`, `worker_job_history`, `worker_education`, `worker_additional_info`,
`worker_locations` (kind `HOME`) + `au_localities`, and the catalogue `Category` → `CategoryDocument` → `Document`
and `Subcategory` → `SubcategoryDocument` → `Document`. One transaction issues one statement per relation (17 for
a worker with services: the profile, its nine relations, the catalogue and its five), none per row; a test holds
the count at 20 at most. The statement timeout is set with `set_config('statement_timeout', $1, true)`, a bound
parameter, so no raw SQL is built from a value anywhere in the service. The old Next.js routes and server actions
keep working until each unit moves them.
