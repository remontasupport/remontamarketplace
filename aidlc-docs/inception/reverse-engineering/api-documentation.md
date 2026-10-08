# API Documentation (refresh, 2026-10-08)

## REST APIs: `apps/api` (every entry of `packages/api-contract`, `openapi.json` is the full document)

Error envelope on every entry: `{error: {code, message, requestId, fields?}}` with codes 400 INVALID_REQUEST,
401 UNAUTHENTICATED, 403 FORBIDDEN, 404 NOT_FOUND, 409 CONFLICT, 413 PAYLOAD_TOO_LARGE, 415 UNSUPPORTED_MEDIA_TYPE,
429 RATE_LIMITED (+ `retry-after`), 500 INTERNAL, 503 UNAVAILABLE (+ `retry-after`). Messages are generic; `fields`
only on 400.

| Operation | Method / path | Purpose | Request | Response | Security (`meta`) |
|---|---|---|---|---|---|
| `platform.health` | GET `/v1/health` | Liveness: process up and `SELECT 1` answers | none | 200 `{status:'ok'}`; 503 if the db is unreachable | public, no bot, ip 60/1m, `probe` (never shed, plain HTTP allowed) |
| `registration.listServiceCategories` | GET `/v1/service-categories` | The catalogue for the services step, fixed order | none | 200 `{categories: [{id, name, requiresQualification, subcategories[{id, name, requiresRegistration}]}]}` | public, ip 60/1m, global 3000/1m, cache 300 s |
| `registration.searchLocalities` | GET `/v1/localities?q=` | Suburb autocomplete: prefix, later word, "suburb postcode", digits = postcode; current rows; 10 max | `q` 2-60 chars after trimming | 200 `{localities: [{id, suburb, state, postcode, label}]}` | public, ip 120/1m, global 6000/1m, cache 3600 s |
| `registration.checkEmailAvailability` | POST `/v1/registrations/worker/email-availability` | Whether the address can sign up (reveals existence by design) | `{email}` | 200 `{available}` | public, ip 60/1h, global 6000/1h |
| `registration.requestEmailCode` | POST `.../email-codes` | Emails a 6-digit code; answers a signed ticket; stores nothing | `{email, captchaToken}` | 202 `{token, expiresAt}` (same for any address); 503 + retry-after 30 if Resend is down | captcha `worker_email_code`, ip 10/1h, global 1000/1h, 4 KB |
| `registration.verifyEmailCode` | POST `.../email-codes/verify` | Checks a code against its ticket (10 min; multi-use until expiry) | `{email, code, token, expiresAt}` | 200 `{verified:true}`; 400 `fields.code` | public, ip 30/1h, global 5000/1h |
| `registration.createPhotoUploadTicket` | POST `.../photo-tickets` | A V4 signed POST policy for one key, one type, 5 MB, 10 min | `{contentType, sizeBytes}` | 201 `{photoUploadId, upload{url, method:'POST', fields, fileField:'file'}, expiresAt}`; 503 if the bucket is unavailable | public, ip 10/1h, global 300/1h |
| `registration.confirmPhotoUpload` | POST `.../photo-confirmations` | Inspects the object (size, first bytes) and records the row; idempotent | `{photoUploadId}` | 200 `{photoUploadId}`; 409 not uploaded; 413 too large (object deleted); 415 not an accepted image | public, ip 30/1h, global 1000/1h |
| `registration.submitWorkerRegistration` | POST `/v1/registrations/worker` | The sign-up transaction | `workerRegistrationSchema` (names, mobile, email + code proof, password, `localityId`, services, `photoUploadId`, consent, `zohoLeadId?`) + `captchaToken` | 202 `{status:'accepted', message}` for a new and an existing email; 400 with `fields` (code, password breached, services, locality, photo) | captcha `worker_register`, ip 5/1h, global 500/1h, 16 KB, audit `ACCOUNT_REGISTERED` |

**What does not exist on the api yet (and this cycle adds):** any entry with `access: {roles: [...]}`; any
authenticator other than `DenyAll`; any admin area; any PostGIS query.

**Known documentation drift:** `openapi.ts` lists error statuses by rule (400 if input, 401/403 if not public, 413
if body, 415 multipart, 429/500 always, 503 if captcha), so the confirm entry's 409/404 and the captcha 403 on public
entries are not in `openapi.json`.

## REST APIs: the `apps/app` routes this cycle replaces (Next.js route handlers, NextAuth session, `ADMIN`)

| Route | Query | Response | Notes |
|---|---|---|---|
| GET `/api/admin/contractors` | `page`, `pageSize` (<= 100), `sortBy` (createdAt/firstName/lastName/city/state), `sortOrder`, `search`, `location`, `within` (none/5/10/20/50), `typeOfSupport`, `gender`, `hasVehicle`, `workerType`, `age`, `languages[]`, `therapeuticSubcategories[]`, `documentCategories[]`, `documentStatuses[]`, `requirementTypes[]`, `experienceWith[]` | `{success, data: Worker[], pagination{total, page, pageSize, totalPages, hasNext, hasPrev}, appliedFilters}`; `Worker` = profile columns + `email`, `age` (computed), `languages`, `services[]`, `isActive`, `distance?` | base condition `user.status = ACTIVE`; Redis cache 60 s; distance path = Google geocode + bbox + Haversine in JS (inventory section 2) |
| GET `/api/admin/filters` | none | `{success, data{documentCategories[{value,label}], documentStatuses, requirementTypes[{value,label,category}], documentSubmissionFilters[{value,label,count}], stats}}` | one raw SQL for the five counts |
| GET `/api/admin/users` | `search` (>= 2 chars), `role` | `{success, users[{id, email, role, status, createdAt, firstName, lastName, mobile}]}` (50) | `contains` on email and the three profile names |
| GET `/api/admin/contractors/inactive` | `page`, `pageSize` | `{success, data, pagination}` | `user.status = SUSPENDED`; checks the phantom `SUPER_ADMIN` too |

## Internal APIs

### `packages/api-contract`
- `defineContract(area, entries)` -> `{area, entries}`; `EntryDef {method, path, summary, pathParams?, query?, body?
  ({kind:'json', schema} | {kind:'multipart', files}), responses, meta}`.
- `meta({access, bot, rateLimit, maxBodyKb, audit?, cacheSeconds?, probe?})`: strict, throws at load.
  `access: 'public' | {roles: Role[]}`, `Role = WORKER | CLIENT | COORDINATOR | ADMIN`; `rateLimit[].per: ip | user |
  global` (`user` refused on public entries); windows 1m/10m/1h/1d.
- `checkContracts(contracts, allowList)`: 17 checks (see code-structure.md); run in tests and at boot.
- `createClient(contract, {baseUrl, fetch?, headers?})` -> `client.<entry>({params?, query?, body?}, {signal?,
  headers?})` -> `{ok:true, status, body} | {ok:false, status, body: ErrorResponse|null, retryAfterSeconds?}`;
  throws on a success body that does not match the contract.
- `toOpenApi(contracts, info)`; `routeOf(entry)`; `allEntries(contracts)`; `ERROR_CODES`, `errorResponseSchema`.

### `apps/api` platform
- `defineHandlers(contract, handlers)`; `Handler<E> = (req: RequestOutput<E> & {files}, ctx: HandlerContext) =>
  Promise<SuccessResponse<E>>`; `HandlerContext {requestId, ip, principal: Principal | null, rawBody, log, audit}`.
- `Authenticator.authenticate(headers) -> Principal {userId, role} | null`.
- `RateLimiter.hit(key, limit, windowS) -> {allowed, retryAfterS}`; `CaptchaVerifier.verify(token, action, ip)`.
- `enqueue(tx, name, payload)`, `queuedSince(tx, name, field, value, since)`; `OutboxHandler = (event, signal) =>
  Promise<void>`; `Job {name, everyMs, timeoutMs, run({watermark, now, signal})}`.
- `unitOfWork(db, work)`; `AuditRecorder.record(tx, {action, metadata})`, `.skip(reason)`.
- `SafeHttpClient.fetchJson(url, schema, init)` (allow-listed hosts only).

### `apps/api` modules
- `placeHome(locality, source, travelRadiusKm = 50)` -> `{ok, home, legacy} | {ok:false, error}`;
  `localityLabel(l, ', ' | ' ')`.
- `matchLegacyLocation(row, candidatesFor)` -> matched | ambiguous | unmatched (never guesses).
- `searchLocalities(entries, q)` (pure ranking) and `LocalityDirectory.search(q)` (in-memory, hourly reload).
- `deriveStage(facts)`, `changeOf(from, to)`, `initialMarker(legacy, now)`.
- `registerWorker(deps, body, ctx)`, `confirmPhotoUpload`, `createPhotoTicket`, `processPhoto`.

### `packages/form-engine`
- `defineForm(def)` (throws on keys outside the contract body); `formSchemaFor`, `toRequestBody`, `keysOfStep`,
  `stepOfKey`, `neverSavedKeys`, `resetsOf`.
- `submitToApi(def, backend, values, deps)` -> `{ok:true} | {kind:'invalid', fields} | {kind:'failed', message}`.
- `withRetry(attempt, {maxAttempts 5, base 1 s, max 8 s, maxRetryAfterMs 30 s, isOnline, waitUntilOnline, onRetry})`.
- `saveDraft/loadDraft/clearDraft(store, def, ...)`; `checkEmailAvailability`, `requestEmailCode`,
  `confirmEmailCode`; `stagePhoto(...)`.

## Data Models (the tables this cycle reads; full schema in `packages/db/prisma/schema.prisma`)

### `worker_profiles` (Prisma `WorkerProfile`)
- **Fields read by the admin search:** `id`, `userId`, `firstName`, `lastName`, `mobile`, `gender`, `age`,
  `dateOfBirth` (string), `languages[]`, `experience`, `introduction`, `photos` (one URL), `abn` (JSON:
  `workerEngagementType.type` tfn/abn), `city`, `state`, `postalCode`, `latitude`, `longitude` (legacy, dual-written
  from the locality by the api), `createdAt`, `updatedAt`, `isPublished`, `verificationStatus`.
- **Relations:** `user` (email, status ACTIVE/SUSPENDED), `workerServices` (`categoryId`, `categoryName`,
  `subcategoryIds[]`), `workerAdditionalInfo.languages[]`, `verificationRequirements` (`documentCategory`, `status`,
  `requirementType`), `careExperience` (`domain`), `locations` (WorkerLocation[]), `onboarding`.
- **Indexes:** `(latitude, longitude)`, `city`, `state`, `postalCode`, `gender`, `age`, `dateOfBirth`, names,
  `mobile`, GIN on `languages`, `(isPublished, …)`, `createdAt`, `updatedAt`.

### `worker_locations` (`WorkerLocation`)
- `id`, `workerProfileId` (FK, cascade), `kind` HOME | SERVICE_AREA, `localityId` (FK restrict), `latitude`,
  `longitude`, `point geography(Point,4326)` **generated**, `travelRadiusKm` (1-500, NOT NULL iff HOME),
  `precision` LOCALITY | ADDRESS, `source` REGISTRATION | ONBOARDING | ADMIN | RECONCILER | BACKFILL.
- **Constraints:** one HOME per worker (partial unique), coordinates inside Australia; **GiST on `point`**.
- **Validation:** `placeHome` (radius range, no retired locality).

### `au_localities` (`AuLocality`)
- `id`, `localityPid`, `suburb`, `searchName` (lower-case, single-spaced), `state` (9 values), `postcode` (4 chars),
  `latitude`, `longitude`, `point` generated, `sourceVersion`, `retiredAt`, `supersededById`.
- **Unique** `(localityPid, postcode)`; indexes on `searchName`, `postcode`, GiST on `point`. 15,467 rows.

### Supporting tables the api owns
- `rate_limit_buckets(key, windowStart, count)`; `outbox_events(id, name, payload, status, attempts, nextAttemptAt,
  lockedUntil, lastError, processedAt)`; `scheduled_jobs(name, lockedUntil, lastStartedAt, lastResult, watermark)`;
  `audit_logs(action: AuditAction, userId, metadata, …)`; `registration_photo_uploads`; `worker_onboarding(+version)`
  and `worker_onboarding_transitions`.

### Session (apps/app, NextAuth JWT; what a token for the api would be minted from)
- Cookie `__Secure-next-auth.session-token` (`SameSite=Lax`, `domain` = the app host), claims `id`, `role`, `email`,
  `exp` (24 h, or 7 d with remember-me), `impersonatedBy?`; secret `NEXTAUTH_SECRET`.
