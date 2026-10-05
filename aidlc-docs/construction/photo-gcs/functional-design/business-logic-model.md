# Business Logic Model -- unit `photo-gcs` (U3)

Algorithms step by step, technology-agnostic except where the port is named. Rules are cited as R#.

## L1 `createPhotoTicket(input, ip, deps)`

```
1. id = uuid(); ext = extensionOf(input.contentType); key = `staging/${id}.${ext}`
2. expiresAt = now + 10 min
3. ticket = store.createUploadTicket(key, input.contentType, 5_242_880, expiresAt)      -- may throw -> 503 (R1.5)
4. db.insert(row: id, PENDING, gcs, key, url = publicUrl(key), declared type/size, ipHash(ip), expiresAt, createdAt = now)
5. return { photoUploadId: id, upload: { url: ticket.url, method: POST, fields: ticket.fields, fileField: 'file' }, expiresAt }
```

Order 3 before 4: a ticket that cannot be issued leaves no row. A row without a successful response (crash between
4 and 5) is a `PENDING` row the purge removes after `expiresAt`.

## L2 `confirmPhotoUpload(id, deps)`

```
1. row = db.find(id)
2. if !row or row.store != gcs or row.state in {CLAIMED, REJECTED} -> 404            (R2.1)
3. if row.state == STAGED -> return { id }                                         (R2.2)
4. if now > row.expiresAt -> 404                                                   (R2.3)
5. info = store.inspect(row.key)            -- null -> 409                         (R2.4; store error -> 503, R2.9)
6. if info.sizeBytes > 5_242_880 -> reject('too-large', 413)                        (R2.5)
7. head = store.readPrefix(row.key, 16); type = detectImageType(head)
8. if !type or type == image/heic -> reject('not-image', 415)                       (R2.6)
9. if type != row.contentType -> reject('wrong-type', 415)                          (R2.7)
10. if row.sizeBytes != info.sizeBytes -> log('declared size differs')              (R2.10)
11. db.update(id, WHERE state = PENDING: state = STAGED, contentType = type, sizeBytes = info.sizeBytes, confirmedAt = now)
    -- 0 rows updated (a concurrent confirm won): re-read; if STAGED return { id }, else 404
12. return { id }

reject(reason, status):
   a. db.update(id, WHERE state = PENDING: state = REJECTED, rejectedReason = reason)
   b. store.delete(row.key)  (best effort; the purge and the lifecycle rule back it up)
   c. throw ApiError(status, message)
```

Confirm is idempotent (3) and race-safe (11, a). It reads 16 bytes, never the whole object.

## L3 `claimPhoto(tx, id, now)` inside `createAccount`

```
1. updated = tx.update(id, WHERE state = STAGED AND createdAt > now - 24 h: state = CLAIMED, claimedAt = now)
2. if updated == 0 -> field error 400 "Please upload your photo again"                (R3.1)
3. row = tx.find(id)
4. photosAtCreate = row.store == vercel-blob ? row.url : null                        (R3.3, R3.4)
5. ...create user + profile with photos = photosAtCreate... (unchanged otherwise)
6. attachPhoto: tx.update(id: claimedByWorkerProfileId = profileId)
7. if row.store == gcs: enqueue(tx, PhotoUploaded { photoUploadId: id, workerProfileId })
```

Everything is in the registration transaction: a failure after 1 rolls the claim back, as today.

## L4 `processPhoto(uploadId, deps, signal)` (the `PhotoUploaded` handler)

```
1. row = db.find(uploadId); profile = db.findProfile(row.claimedByWorkerProfileId)
2. if row.processedAt and profile.photos == (row.processedUrl ?? asIsUrl) -> return   (R4.1, re-run)
3. original = store.read(row.key)
     missing and row.processedAt -> return; missing otherwise -> PermanentFailure    (R4.2)
4. try:
     img = decode(original); img = orient(img)
     main = encodeJpeg(resizeMax(img, 1600), q85, stripAll, sRGB)                      (R4.3)
     thumb = encodeJpeg(resizeMax(img, 256), q85, stripAll, sRGB)                      (R4.4)
   catch DecodeError:
     asIsKey = `workers/${profileId}/${id}.${ext(row.contentType)}`
     url = store.write(asIsKey, original, row.contentType, immutable)                  (R4.8)
     db.tx: profile.photos = url; row.processedAt = now; row.processedUrl = url
     store.delete(row.key) best effort; log warn photo-processing-fallback; return
5. processedKey = `workers/${profileId}/${id}.jpg`; thumbKey = `workers/${profileId}/${id}-256.jpg`
   processedUrl = store.write(processedKey, main, image/jpeg, immutable)
   thumbnailUrl = store.write(thumbKey, thumb, image/jpeg, immutable)                  (R4.5)
6. db.tx: profile.photos = processedUrl; row.processedUrl, thumbnailUrl, processedAt = now   (R4.6)
7. store.delete(row.key) best effort                                                   (R4.7)
```

Idempotence argument: steps 5 and 6 are overwrites with identical content and values; a crash before 6 leaves the
staging object and `processedAt` unset, so the retry redoes everything; a crash after 6 and before 7 leaves an
orphan staging object that 2 and 7 (next run) or the lifecycle rule remove. Permanent failures never retry because
step 4's fallback completes the event.

## L5 Purge (daily)

```
candidates = rows WHERE (state = PENDING AND expiresAt < now) OR state = REJECTED OR (state = STAGED AND createdAt < now - 24 h)
             ORDER BY createdAt LIMIT 1000
for each (until the signal aborts):
   adapter = stores[row.store]; if none -> skippedUnknownStore++; continue                (R5.3)
   adapter.delete(row.key)   (missing = ok)
   db.deleteMany(id, WHERE state = row.state)   -- a claim in between changed the state and wins     (R5.2)
summary: { candidates, deletedGcs, deletedBlob, skippedUnknownStore, failed }
```

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
      try: await uploader.upload(file, ticket.upload, { onProgress, signal }); uploaded = true
      catch UploadError e:
         if e.policyRefused (403) -> break (ticket dead)                                  (R6.4)
         if ++sameTicketTries > 2 -> break                                                (R6.3)
         await backoff(sameTicketTries); continue
      r = withRetry(POST confirmEntry { photoUploadId })                                  (429/503 inside withRetry)
      if r.status == 200 -> return photoUploadId
      if r.status == 409 -> (same as UploadError without policyRefused)                   (R6.5)
      if r.status == 404 -> break (ticket dead)
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
| `stagingKey`, `processedKey`, `thumbnailKey` | For any uuid and type: the key starts with its prefix, contains no `..`, no leading `/`, only `[a-z0-9/._-]`, and the id is recoverable from it | Invariant; round-trip (`idFromKey(key(id)) == id`) |
| State machine `canTransition` | Only the three legal pairs return true over the full state product | Oracle (the explicit table) |
| `isClaimable(row, now)` | True iff `STAGED` and age < 24 h, for any `createdAt` and `now` | Invariant |
| Policy document (adapter, with a throwaway key) | For any (key, type, size ≤ 5 MB, expiry): the decoded policy's conditions name exactly that key, that type, a range ≤ 5 242 880 and that expiry | Round-trip |
| Confirm decision (L2) | Over generated (row state, expiry, object presence, size, header bytes, declared type): the outcome equals the decision table; applying confirm twice yields the same final state as once | Oracle; idempotence |
| Processing (L4, against the fake store with generated images) | After one run or two runs: the store holds the processed copy and thumbnail (or the as-is copy for undecodable input) and not the staging object; dimensions ≤ 1600 and ≤ 256; output has no EXIF segment; the profile URL equals the row's `processedUrl` | Idempotence; invariant; model-based |
| Purge (L5, with a modelled store) | For any set of rows and states, after a run no row is `PENDING`-expired, `REJECTED`, or `STAGED`-old, every `CLAIMED` row survives, and every deleted row's object was deleted first | Invariant; model-based |
| `stagePhoto` (L6, against a modelled api and uploader with injected failures) | For any failure sequence: at most 3 uploads per ticket and at most 2 tickets; success iff some upload-then-confirm pair succeeded within the budget; never a request after abort | Invariant; model-based |
| `shrinkImage` (existing) | Longest edge ≤ 1600, never enlarges, idempotent | Invariant; idempotence |
