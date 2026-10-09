# Business Logic Model -- unit `worker-area` (U1)

Algorithms step by step; rules cited as R# (`business-rules.md`). Technology-agnostic except where a port is named.

## L1 `profileIdOf(db, principal)` (C4)

```
1. row = db.workerProfile.findUnique({ where: { userId: principal.userId }, select: { id } })
2. none -> throw ApiError(404, 'WORKER_PROFILE_NOT_FOUND'); log.warn({ userId })            (R1.2)
3. return row.id
```
Called by every handler first; cheap (unique index on `userId`); no cache in U1 (one indexed read per request;
NFR Requirements may add a per-request memo if the load test shows it).

## L2 `getProfile(deps, profileId)` (C5)

```
1. rows = readProfileRows(db, profileId)                                                   (R2.1)
   in one transaction (ReadCommitted, SET LOCAL statement_timeout = 5000):
   a. profile columns (names, mobile, photos, additionalPhotos, introduction, age, dateOfBirth, gender, hasVehicle,
      languages, abn, setupProgress, profileCompleted, verificationStatus, isPublished, homeStreetLine?, homeLocalityId?)
   b. HOME row of worker_locations + au_localities (suburb, state, postcode, retiredAt)                  (R2.5)
   c. home locality (U2+)                                                                               (R2.4)
   d. worker_services (categoryId, categoryName, subcategoryIds, subcategoryNames, createdAt)          (R5.1)
   e. verification_requirements (id, requirementType, requirementName, status, documentCategory, documentUrl, storageKey?, expiresAt, metadata)
   f. worker_availability, worker_experience, worker_job_history, worker_education, worker_additional_info (the sections)
   g. catalogue: Category (by the services' ids or names) with CategoryDocument -> Document and the matching
      Subcategory -> SubcategoryDocument -> Document                                                     (R3.3, R3.6, R4)
2. completion = completionOf({ profile, services, requirements, catalogue, sections })                  (R3)
3. groups     = requirementGroups({ services, requirements, catalogue })                                 (R4)
4. return shape(rows, completion, groups):
   - photos: { main: profile.photos ?? null, additional: parseAdditional(profile.additionalPhotos) }    (R2.6)
   - serviceArea: rows.home ? { localityId, label: localityLabel(locality), travelRadiusKm, precision } : null
   - homeAddress: rows.homeLocality ? { streetLine, localityId, suburb, state, postcode } : null
   - bankAccount: maskBankAccount(additionalInfo.bankAccount) or null                                  (R2.3)
   - displayRole: displayRoleOf(services)                                                               (R5.1)
   - completion, requirements: groups, sections: { availability, experience, jobHistory, education, additionalInfo }
```
The pipeline applies R2.7. No write (R2.8).

## L3 `completionOf(input)` (C6) -- pure

```
flags:
  accountDetails = nonEmpty(firstName) && nonEmpty(lastName) && nonEmpty(photos.main) && nonEmpty(introduction)
                && nonEmpty(city) && nonEmpty(state) && nonEmpty(postalCode) && (age != null || dateOfBirth) && nonEmpty(gender)   (R3.1)

  compliance:
    if services.length == 0 -> false                                                                    (R3.2)
    required = ids of catalogue docs with category in {IDENTITY, BUSINESS, COMPLIANCE}
               linked to the worker's categories (CategoryDocument.documentType == 'REQUIRED',
               condition honoured when known) or sub-categories; plus code-of-conduct-part1, -part2          (R3.3)
    present(id) per R3.4 over baseTypes(requirements) and the abn JSON
    if any required id not present -> false
    checked = rows that are base-compliance rows per R3.5
    compliance = checked.length > 0 && checked.every(status in {SUBMITTED, APPROVED})                   (R3.5)

  trainings:
    if services.length == 0 -> false
    requiredT = ids of catalogue docs with category == 'TRAINING' (REQUIRED for category links)         (R3.6)
    if requiredT.size == 0 -> false
    presentT(id) = some row with baseType in {id, alias(id)} and status in {SUBMITTED, APPROVED}
    trainings = requiredT.every(presentT)

  services:
    if services.length == 0 -> false
    for each service s:
      spec = union over s.subcategories (or the "no subcategory" row) of SERVICE_REQUIREMENTS[lower(trim(s.categoryName))]   (R3.7)
      uploaded = baseTypes of rows with documentCategory == SERVICE_QUALIFICATION, status in {SUBMITTED, APPROVED},
                 key parts >= 2 and lower(parts[0]) == lower(s.categoryName)
      ok(s) = spec.required.size > 0 ? spec.required ⊆ uploaded
            : spec.optional.size > 0 ? uploaded.size > 0
            : true
    services = every ok(s)

  profileCompleted = accountDetails && compliance && trainings && services                              (R3.8)
  percent = round(100 * count(filledSections) / 13)                                                     (R3.10)
return { accountDetails, compliance, trainings, services, profileCompleted, percent }
```

`baseType(t) = t.includes(':') ? t.split(':').pop() : t`. `alias = { 'ndis-worker-orientation': 'ndis-training',
'ndis-training': 'ndis-worker-orientation' }`.

## L4 `persistCompletion(tx, profileId, c)` (C6)

```
1. stored = select setupProgress, profileCompleted, verificationStatus from worker_profiles where id = profileId (in tx)
2. next = { accountDetails, compliance, trainings, services } from c
3. if next != parse(stored.setupProgress) or c.profileCompleted != stored.profileCompleted:
     update set setupProgress = next, profileCompleted = c.profileCompleted,
                verificationStatus = (stored.verificationStatus == 'NOT_STARTED' && any(next)) ? 'IN_PROGRESS' : stored.verificationStatus   (R3.9)
4. return changed: boolean
```
U1 also ships `scripts/backfill-completion.ts`: for every profile, `completionOf` then `persistCompletion`; dry run
prints counts per flag change; `--apply` writes; `--report` the JSON (the S1 backfill pattern).

## L5 `requirementGroups(input)` (C5, R4)

```
1. docs = catalogue documents linked to the worker's categories/sub-categories, deduplicated by id, catalogue order
2. mandatory = docs where category in {IDENTITY, BUSINESS, COMPLIANCE}; splice code-of-conduct-part1 after abn-contractor (else append); drop part2
3. trainings = docs where category == 'TRAINING' minus the three folded ids; sort by TRAINING_STEP_ORDER, unknown last
4. status(item) per R4.3 using the presence aliases and the rows' statuses
5. return { mandatory: items, trainings: items }   -- both empty when services.length == 0
```

## L6 The pipeline's probe branch (C17, R6)

```
step 3:  if (!m.probe) await enforceLimits(id, nonUserRules, ...)
step 10: if (!m.probe) await enforceLimits(id, userRules, ...)
```
One condition in `buildRouteHandler`; the health entry keeps its declared limit (unused).

## L7 The load script's loop (C18, R7)

```
1. guard: baseUrl host must contain 'staging'; db host must not be a production host; else exit 2
2. workers = N active WORKER users with a profile (SELECT ... LIMIT N)
3. tokens = mint(worker.id, 'WORKER', secret) each; refresh at 240 s
4. phase A: for --minutes, schedule requests at --rate/s (token bucket), choosing per request:
     70 %: GET /v1/worker/profile (50 % of those with If-None-Match from the last ETag seen for that worker)
     30 %: a section PUT when U2 is live, else another GET (reported as such)
   record latency, status, Retry-After; on 429/503 sleep Retry-After for that worker (never retry inside the window)
5. phase B (--burst f): 60 s at rate × f, same recording
6. report: per entry p50/p95/p99, status histogram, errors; JSON file; exit 1 if NFR thresholds fail
```

## Properties for PBT-01 (fed to Code Generation)

| Property | Kind | Statement |
|---|---|---|
| P1 ownership | invariant | for generated workers A, B with profiles, `getProfile` under A's principal never returns a field of B's rows (ids, names, documents) |
| P2 completion oracle | oracle | for generated rows outside the [fix] cases, `completionOf(rows).flags == oracle(rows)`; inside them, the fixed value; both partitions non-empty |
| P3 percent | invariant | adding a filled section never lowers `percent`; `percent ∈ [0, 100]`; all 13 filled ⇒ 100 |
| P4 read idempotent | idempotency | two reads with no write in between return equal bodies and the same ETag |
| P5 groups | invariant | every item of `requirements.mandatory ∪ trainings` is a catalogue document linked to one of the worker's services; `missing` items are exactly the ids R3.4/R3.6 call absent |
| P6 probe | invariant | for any request to a `probe` entry, the limiter is never called |
| P7 persistCompletion | idempotency | calling it twice with the same completion performs at most one update and returns `false` the second time |
