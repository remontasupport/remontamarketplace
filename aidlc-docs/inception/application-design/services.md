# Services -- orchestration of the sign-up photo

The "services" are the api's application functions (C12-C17) and the engine's `stagePhoto` (C4). Each flow below
names who calls whom, in order. Rules are in Functional Design.

## S-A Stage a photo (browser-driven)

```
PhotoUpload (file picked)
  -> uploaderFor: shrinkImage -> readHeader -> isHeicHeader? -> stop with the HEIC message
  -> stagePhoto (engine)
       1. POST photo-tickets {contentType, sizeBytes}            -> api createPhotoTicket -> row PENDING, store.createUploadTicket
       2. uploader.upload(file, target, onProgress)              -> bucket (signed POST policy; storage enforces key, type, size, expiry)
       3. POST photo-confirmations {photoUploadId}               -> api confirmPhotoUpload -> store.inspect + readPrefix -> row STAGED
       retries: 2 on network/5xx with the same ticket while it lives; after expiry or 404/409 from 3: back to 1 once
  <- upload id -> field value; preview thumbnail kept
```

Progress: step 2 reports bytes sent; steps 1 and 3 report "indeterminate".

## S-B Register (unchanged shape)

```
submit -> waits for in-flight stagePhoto promises -> POST /v1/registrations/worker {..., photoUploadId}
  api registerWorker (transaction): ... claimPhoto(id) -> row CLAIMED, profile.photos = row.url
                                      if row.store == gcs: enqueue PhotoUploaded {photoUploadId, workerProfileId}
```

## S-C Process (outbox-driven)

```
OutboxDispatcher (2 s poll) -> photoUploadedHandler(event)
  processPhoto: store.read(stagingKey) -> sharp rotate/resize/strip -> store.write(processedKey), store.write(thumbnailKey)
                -> db: profile.photos = processedUrl; row.processedUrl, row.thumbnailUrl -> store.delete(stagingKey)
  failure: retry with back-off (6 attempts) -> DEAD + existing dead-letter alert; profile keeps the uploaded URL
```

## S-D Purge (scheduler-driven, daily)

```
purgeUnclaimedPhotosJob: rows where (PENDING and createdAt + ticket life < now) or REJECTED or (STAGED and createdAt + 24 h < now)
  -> for each: store named by row.store -> delete(key) -> delete row   (claimed-in-between rows skipped)
bucket lifecycle rule: staging/ objects older than 2 days deleted regardless
```

## S-E The overlap (PR 3a promoted, 3b not yet merged)

```
live wizard -> POST /v1/registrations/worker/photo (multipart) -> stagePhoto (C16) -> VercelBlobPhotoStore.put -> row STAGED, store vercel-blob
new entries exist but have no caller except the staging checklist (curl)
claim of a vercel-blob row: profile.photos = Blob URL, no PhotoUploaded event
purge: Blob rows deleted through the Blob adapter
```

## S-F After PR 3b (the direct upload is live)

New sign-ups use S-A. Multipart rows drain within 24 h. S-E's handler is still bound but idle.

## S-G PR 3c (clean-up)

Multipart entry, `stage-photo.ts`, the Blob adapter and `BLOB_READ_WRITE_TOKEN` removed; purge takes one store;
`store` column stays (historical rows).

## S-H The alert (U1, independent)

```
developer edits infra/cloudrun/monitoring/*.json -> apply-alerts.sh staging -> apply-alerts.sh prod
policy: service-wide p95 (ALIGN_DELTA, REDUCE_PERCENTILE_95) > 2000 ms for 2 windows AND request count >= N per 5 min
```
