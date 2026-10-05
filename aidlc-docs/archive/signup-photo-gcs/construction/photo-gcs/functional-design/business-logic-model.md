# Business Logic Model -- unit `photo-gcs` (U3)

Algorithms step by step, technology-agnostic except where the port is named. Rules are cited as R#.
**Amended 2026-10-05: no new columns** -- no row at ticket time, the row is created by confirm, the store is
derived from the key's prefix, URLs are derived from ids.

## L1 `createPhotoTicket(input, deps)`

```
1. id = uuid(); key = `staging/${id}`; expiresAt = now + 10 min
2. ticket = store.createUploadTicket(key, input.contentType, 5_242_880, expiresAt)      -- may throw -> 503 (R1.5)
3. log info { photoUploadId: id, contentType, sizeBytes }                                (R1.3)
4. return { photoUploadId: id, upload: { url: ticket.url, method: POST, fields: ticket.fields, fileField: 'file' }, expiresAt }
```

Nothing is written. A ticket nobody uses leaves at most an object the lifecycle rule removes, or nothing.

## L2 `confirmPhotoUpload(id, ip, deps)`

```
1. if row = db.find(id) -> return { id }                                              (R2.1)
2. key = `staging/${id}`
3. info = store.inspect(key)            -- null -> 409                                (R2.2; store error -> 503, R2.7)
4. if info.sizeBytes > 5_242_880 -> reject('too-large', 413)                           (R2.3)
5. head = store.readPrefix(key, 16); type = detectImageType(head)
6. if !type or type == image/heic -> reject('not-image', 415)                          (R2.4)
7. if type != info.contentType -> reject('wrong-type', 415)                            (R2.5)
8. try db.insert({ id, blobKey: key, url: publicUrl(key), contentType: type, sizeBytes: info.sizeBytes, ipHash: hash(ip), createdAt: now })
   catch unique violation -> return { id }      -- a concurrent confirm won            (R2.6)
9. return { id }

reject(reason, status):
   a. store.delete(key)  (best effort; the lifecycle rule backs it up)
   b. log warn photo-rejected { photoUploadId: id, reason }
   c. throw ApiError(status, message)
```

Confirm is idempotent (1, 8) and reads 16 bytes, never the whole object. Nothing is persisted for a rejected or
missing upload.

## L3 `claimPhoto(tx, id, now)` inside `createAccount`

```
1. updated = tx.update(id, WHERE claimedAt IS NULL AND createdAt > now - 24 h: claimedAt = now)
2. if updated == 0 -> field error 400 "Please upload your photo again"                (R3.1, R3.5)
3. row = tx.find(id); bucketRow = row.blobKey.startsWith('staging/')
4. photosAtCreate = bucketRow ? null : row.url                                       (R3.3, R3.4)
5. ...create user + profile with photos = photosAtCreate... (unchanged otherwise)
6. attachPhoto: tx.update(id: claimedByWorkerProfileId = profileId)
7. if bucketRow: enqueue(tx, PhotoUploaded { photoUploadId: id, workerProfileId })
```

Everything is in the registration transaction: a failure after 1 rolls the claim back, as today.

## L4 `processPhoto(uploadId, deps, signal)` (the `PhotoUploaded` handler)

```
1. row = db.find(uploadId); profileId = row.claimedByWorkerProfileId; profile = db.findProfile(profileId)
   donePrefix = publicUrl(`workers/${profileId}/${uploadId}`)
2. if profile.photos?.startsWith(donePrefix): store.delete(row.blobKey) best effort; return      (R4.1)
3. original = store.read(row.blobKey)        -- missing -> PermanentFailure                      (R4.2)
4. try:
     img = decode(original); img = orient(img)
     main  = encodeJpeg(resizeMax(img, 1600), q85, stripAll, sRGB)                                (R4.3)
     thumb = encodeJpeg(resizeMax(img, 256),  q85, stripAll, sRGB)                                (R4.4)
   catch DecodeError:
     url = store.write(`workers/${profileId}/${uploadId}.${ext(row.contentType)}`, original, row.contentType, immutable)   (R4.8)
     db.updateProfile(profileId, photos = url); store.delete(row.blobKey) best effort
     log warn photo-processing-fallback { photoUploadId }; return
5. processedUrl = store.write(`workers/${profileId}/${uploadId}.jpg`, main, image/jpeg, immutable)
   store.write(`workers/${profileId}/${uploadId}-256.jpg`, thumb, image/jpeg, immutable)          (R4.5)
6. db.updateProfile(profileId, photos = processedUrl)                                             (R4.6)
7. store.delete(row.blobKey) best effort                                                          (R4.7)
```

Idempotence: steps 5 and 6 are overwrites with identical content and values; a crash before 6 leaves the staging
object and the profile unchanged, so the retry redoes everything; a crash after 6 is caught by step 2 next time.
Permanent failures never retry because step 4's fallback completes the event.

## L5 Purge (daily)

```
candidates = rows WHERE claimedAt IS NULL AND createdAt < now - 24 h ORDER BY createdAt LIMIT 1000       (R5.1)
for each (until the signal aborts):
   adapter = row.blobKey.startsWith('workers/registration/') ? blob : gcs
   if adapter missing -> skippedUnknownStore++; continue                                                 (R5.3)
   adapter.delete(row.blobKey)   (missing = ok)
   db.deleteMany(id, WHERE claimedAt IS NULL)   -- a claim in between wins                                (R5.2)
summary: { candidates, deletedGcs, deletedBlob, skippedUnknownStore, failed }
```

Never-confirmed staging objects have no row: the bucket's lifecycle rule (age 1 day on `staging/`) removes them.

## L6 `stagePhoto(def, backend, field, file, deps)` (engine)

```
declaredType = sniff(first 16 bytes of file) ?? file.type ?? image/jpeg                    (R7.4)
freshTickets = 0
loop:
   ticket = withRetry(POST ticketEntry { contentType: declaredType, sizeBytes: file.size })   (R6.2; 400/415 final)
   sameTicketTries = 0
   while true:
      if signal.aborted -> throw Aborted                                                   (R6.8)
      if now >= ticket.expiresAt -> break (ticket dead)                                   (R6.6)
      try: await uploader.upload(file, ticket.upload, { onProgress, signal })
      catch UploadError e:
         if e.policyRefused (403) -> break (ticket dead)                                  (R6.4)
         if ++sameTicketTries > 2 -> break                                                (R6.3)
         await backoff(sameTicketTries); continue
      r = withRetry(POST confirmEntry { photoUploadId })                                  (429/503 inside withRetry)
      if r.status == 200 -> return photoUploadId
      if r.status == 409 -> (same as UploadError without policyRefused)                   (R6.5)
      if r.status in {413, 415} -> throw FieldError(messageFor(r))                         (final)
      throw FieldError(generic)                                                            (other final)
   if ++freshTickets > 1 -> throw FieldError("Your photo could not be uploaded. Please try again or choose another photo.")   (R6.7)
```

Progress: `onProgress('indeterminate')` before the ticket and confirm calls; `onProgress({sent,total})` from the
uploader. The offline pause is the existing one around `withRetry`.

## Testable properties (PBT-01)

| Component | Property | Category |
|---|---|---|
| `detectImageType` (C1) | For any 16+ bytes starting with a JPEG, PNG or WebP signature, the result is that type; for any bytes not starting with one of the four signatures, `null`; the result depends only on the first 12 bytes | Invariant; oracle (a naive table-driven matcher) |
| `stagingKey`, `processedKey`, `thumbnailKey`, `storeOf` | For any uuid and profile id: the key starts with its prefix, contains no `..`, no leading `/`, only `[a-z0-9/._-]`; the id is recoverable; `storeOf(key)` is `blob` iff the key starts with `workers/registration/` | Invariant; round-trip |
| `isClaimable(row, now)` | True iff `claimedAt` null and age < 24 h, for any `createdAt` and `now` | Invariant |
| Policy document (adapter, with a throwaway key) | For any (key, type, size ≤ 5 MB, expiry): the decoded policy's conditions name exactly that key, that type, a range ≤ 5 242 880 and that expiry | Round-trip |
| Confirm decision (L2) | Over generated (row present?, object present?, size, header bytes, object content type): the outcome equals the decision table; confirm twice yields the same final state as once; a rejected or missing upload never leaves a row | Oracle; idempotence; invariant |
| Processing (L4, against the fake store with generated images) | After one run or two runs: the store holds the processed copy and thumbnail (or the as-is copy for undecodable input) and not the staging object; dimensions ≤ 1600 and ≤ 256; output has no EXIF segment; the profile URL equals the derived processed URL | Idempotence; invariant; model-based |
| Purge (L5, with a modelled store) | For any set of rows, after a run every unclaimed row older than 24 h is gone, every claimed row and every younger row survives, and every deleted row's object was deleted first | Invariant; model-based |
| `stagePhoto` (L6, against a modelled api and uploader with injected failures) | For any failure sequence: at most 3 uploads per ticket and at most 2 tickets; success iff some upload-then-confirm pair succeeded within the budget; never a request after abort | Invariant; model-based |
| `shrinkImage` (existing) | Longest edge ≤ 1600, never enlarges, idempotent | Invariant; idempotence |
