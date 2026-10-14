# Business Logic Model -- unit `edit-profile` (U2)

Algorithms step by step; rules cited as R# from `business-rules.md` (U2) and U1-R# from U1's. Technology-agnostic
except where a port is named (`unitOfWork`, `placeHome`, the photo functions of the registration module).

## L1 `replaceSection(deps, principal, work, opts)` (C7, R1)

```
1. tx = unitOfWork(db) with the statement timeout (U1's readTransaction helper reused for writes: set_config first)
2. profile = tx.workerProfile.findUnique({ userId: principal.userId }, select: { id })   -> none: 404 (U1 R1.2)
3. result = await work(tx, profile.id)                     -- the section's delete+insert or update, then its re-read
4. if opts.completion:
     rows = readProfileRows(tx, principal.userId)          -- the U1 read inside this transaction
     completion = completionOf(completionInputOf(rows))
     persistCompletion(tx, profile.id, completion)         -- writes only on change (U1 L4)
5. commit; recordDbSuccess()
6. ctx.audit.record(action, { profileId: profile.id, section })   -- never values
7. return result
```
One transaction per write (R1.2); the ownership lookup is folded in (U1 P7); the handler logs `{entry, durationMs,
userId}`.

## L2 The column sections (R2.1-R2.3, R5, R6)

```
putName(body):          update worker_profiles set firstName, middleName (null when empty), lastName   -> re-read the three
putBio(body):           update introduction = body.bio                                                 -> { bio }
putPersonalInfo(body):  assert ageOn(clock(), body.dateOfBirth) in 16..100 (schema already did; the api re-checks with its clock)
                        update dateOfBirth, gender, hasVehicle   (age untouched)                       -> the three
putAbn(body):           value = digits(body.abn); assert abnChecksum(value)
                        stored = profile.abn; signed = stored?.workerEngagementType?.type === 'abn' && stored.workerEngagementType.signed === true
                        update abn = { workerEngagementType: { type: 'abn', value, signed } }           -> { type: 'abn', value, signed }
putBankAccount(body):   upsert worker_additional_info (workerProfileId) set bankAccount = { accountName, bankName, bsb: digits(bsb), accountNumber }
                        -> maskBankAccount(stored)                                                     (no completion)
```
`completion: true` for name, bio, personal info, ABN.

## L3 The list sections (R2.7-R2.10, R2.11)

```
putAvailability(body):
  slots = body.slots sorted by (DAYS.indexOf(day), startMinute)
  for each day: assert count <= 4; assert every slot.start < slot.end; assert slots[i].start >= slots[i-1].end  (R2.7)
  in tx: deleteMany worker_availability where workerProfileId; createMany rows with sortOrder = index
  -> findMany ordered by sortOrder                                             (completion: true -- the percent)

putExperience(body):
  assert domains unique; for each: assert specificAreas ⊆ experienceAreasOf(domain), |specificAreas| <= 3, isProfessional || isPersonal
  in tx: deleteMany worker_experience; createMany                             -> findMany ordered by domain (completion: true)

putJobHistory(body) / putEducation(body):
  for each entry: if currently: assert endMonth == null && endYear == null; else assert both present && (endYear, monthIndex(endMonth)) >= (startYear, monthIndex(startMonth))
  in tx: deleteMany; createMany with sortOrder = index                        -> findMany ordered by sortOrder (completion: true)

putAdditionalInfo(group, body):
  assert body.group === group (path)                                           (R7.2)
  columns = the group's fields only
  in tx: upsert worker_additional_info (create with defaults + columns; update columns)  -> the group's fields
  completion: true for languages, about-me, personality (the percent reads languages, personality); false otherwise
```

## L4 The two addresses (R3)

```
putHomeAddress({ streetLine, localityId }):
  locality = db.auLocality.findUnique(localityId, select id, suburb, state, postcode, retiredAt)
  if !locality || locality.retiredAt: 400 fields.localityId = ['Unknown suburb']
  in tx: update worker_profiles set homeStreetLine = streetLine.trim(), homeLocalityId = localityId     -- nothing else (R3.2)
  -> { streetLine, localityId, suburb, state, postcode }                                               (no completion)

putServiceArea({ localityId, travelRadiusKm }):
  locality = db.auLocality.findUnique(localityId, select id, suburb, state, postcode, latitude, longitude, retiredAt)
  if !locality: 400 fields.localityId
  placed = placeHome(locality, 'ONBOARDING', travelRadiusKm)          -- 400 fields.localityId when retired (placeHome's rule)
  in tx:
    upsert worker_locations where (workerProfileId, kind HOME): set localityId, latitude, longitude, travelRadiusKm, precision 'LOCALITY', source 'ONBOARDING'
    update worker_profiles set location, city, state, postalCode, latitude, longitude = placed.legacy   (R3.5)
    persistCompletion (the percent's "service area")
  -> { localityId, label: localityLabel(locality, ', '), travelRadiusKm, precision: 'LOCALITY' }
```
`worker_locations` has no unique key on `(workerProfileId, kind)` today: the upsert is "find the HOME row for this
profile; update it or create one" inside the transaction (the sign-up creates; the reconciler updates by id).

## L5 Photos (R4)

```
createPhotoTicket({ contentType, sizeBytes }):   (R4.1)
  the registration's createPhotoTicket with ownerProfileId = profile.id: a row in registration_photo_uploads with workerProfileId set, a staging key, the signed POST
  -> { photoUploadId, upload: { url, fields }, expiresAt }   (the sign-up's response shape, reused)

confirmPhoto({ uploadId, slot }):   (R4.2)
  row = registration_photo_uploads by id; if !row || row.workerProfileId != profile.id: 404
  confirmPhotoUpload(uploadId) (the registration's inspect + reject rules; its 400 messages)
  in tx:
    if slot == 'additional' && additionalPhotos.length >= 2: 400 fields.slot
    url = the staged public URL (the sign-up's asIsKey public URL, as the row records it)
    if slot == 'main': photos = url  else additionalPhotos = [...additionalPhotos, url]
    attachPhoto(tx, uploadId, profile.id); enqueue PhotoUploaded { photoUploadId, workerProfileId, slot }
    persistCompletion
  -> { main, additional }
  The existing photoUploadedHandler processes the object and repoints the column that holds the staged URL
  (today it writes `photos`; it learns to replace whichever column holds the URL -- the one code change in the handler).

makeMainPhoto({ url }):   (R4.3)
  in tx: assert url ∈ additionalPhotos; newMain = url; additional = additionalPhotos with url replaced by the old main (or removed when main was null)
  -> { main, additional }

removePhoto({ url }):   (R4.4)
  in tx: if url == photos: assert additionalPhotos.length == 0 -> photos = null
         else assert url ∈ additionalPhotos -> remove it
         persistCompletion
  after commit: deleteBlobObjects(url) best-effort (the processed copy and its thumbnail when url is a Blob URL)
  -> { main, additional }
```

## L6 The ABN checksum (R5.1), pure

```
abnChecksum(digits: string): boolean
  if !/^\d{11}$/.test(digits) return false
  weights = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19]
  sum = Σ (i == 0 ? digit[0] - 1 : digit[i]) * weights[i]
  return sum % 89 == 0
```
Shared by the contract (a `superRefine` on the `abn` field) and the api (the same function from the contract
package, so there is one copy).

## L7 The engine's section mode and the client (R9, S7)

```
defineSection(def):  at import: every field ∈ keys(writeEntry.body); def.pick ∈ keys(readEntry.response); unique field names; the kinds exist
seedSection(def, readBody):  values = for each field: KINDS[kind].fromRead(field, readBody[def.pick])  (defaults when null)
sectionBody(def, values):    body = merge of KINDS[kind].toBody(field, values) over the fields, plus def.constants
useSection(def):
  profile = useWorkerProfile()                           -- one query, ['worker','profile']
  values = draft(section:<name>) ?? seedSection(def, profile)   -- draftRestored = true when a draft was used
  on change: validate with the kind's schemas (from the contract shape); write the draft (neverSaved fields excluded)
  save(): submit(def.writeEntry, sectionBody(values)) through the engine (retries, Retry-After, offline pause; field errors mapped)
          on 200: clear the draft; values = seed from the response; profile.reload()  -- cache: 'reload'
```
The sidebar, the badge and every section seed read the same profile query; a save never re-fetches a section on
its own.

## Properties for PBT-01

| Property | Kind | Statement |
|---|---|---|
| P1 round-trip | invariant | for every section and a generated valid body, write then read returns a section equal to the body after normalisation (trim, null for empty optionals, `sortOrder` by position) |
| P2 idempotency | idempotency | writing a generated body twice gives equal responses and equal rows (ids aside) |
| P3 no overlap | invariant | after any accepted availability write, no two slots of a day overlap and no day has more than 4; every generated overlapping body is refused with 400 naming a slot |
| P4 masked | invariant | for any stored bank account, no response body of any worker or admin entry contains more than the last three digits of the BSB or the number; no log line captured during the write contains them |
| P5 home address stays private | invariant | for any generated profile with a home address, the client search, the public list, the share page and the search cards contain no part of the street line and no `homeLocalityId`; the legacy columns are unchanged by a home-address write |
| P6 service area moves the worker | invariant | after a service-area write, the HOME row's locality is the body's, the legacy columns equal `placeHome`'s `legacy`, the row's `source` is `ONBOARDING`, and the reconciler leaves it unchanged |
| P7 group isolation | invariant | writing group A then reading leaves every other group's fields equal to before |
| P8 ABN | oracle/invariant | every generated valid ABN (digits that satisfy L6) is accepted and round-trips; every 11-digit string that fails L6 is refused; the schema and the api agree on every input |
| P9 ownership | invariant | for any entry and any body, a principal with no profile gets 404; a photo ticket of another profile is 404 on confirm |
| P10 sidebar order | invariant | `WORKER_MENU`'s ids are D11's order; Edit Profile's children are R8.2's order; every static href is a page file |
| P11 engine agreement | invariant | for every section definition, what the definition's schemas accept the contract body accepts (the engine's existing test extended) |
