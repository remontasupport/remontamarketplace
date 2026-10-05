# NFR Design Patterns -- unit `photo-gcs` (U3)

**Decisions:** NFR design plan Q1 B (proposed resiliency testing plan), Q2 A (no circuit breaker); approved
2026-10-05. Each pattern names the requirement it satisfies.

## P1 Bounded calls: one timeout per outbound call, no retry inside the adapter

Every `GcsPhotoStore` method wraps the client call in `AbortSignal.timeout(GCS_TIMEOUT_MS)` (5 s) and maps a
timeout or transport error to a typed `StoreUnavailable` error. The adapter never retries; the caller owns the
decision: ticket and confirm turn it into 503 with `Retry-After: 2` (the engine retries), the processing handler
throws (the outbox retries), the purge counts it as `failed` and moves on. One policy, three owners, no double
retries. (U3-AVAIL-02, RESILIENCY-10)

## P2 Bounded retries with a budget, owned by the client of the flow

The engine's `stagePhoto` holds the whole budget (R6): at most 3 uploads per ticket, at most 2 tickets, back-off
with jitter between attempts, `Retry-After` honoured, the offline pause between steps, and an abort signal that
stops everything. The api never retries on the browser's behalf. (U3-AVAIL-03, R6)

## P3 Bulkhead around the expensive work

`photoUploadedHandler` runs `processPhoto` inside `new Bulkhead({ name: 'photo-processing', maxConcurrent: 2,
maxQueue: 20, queueTimeoutMs: 10_000 })`. A third concurrent event waits up to 10 s for a slot; past that the
bulkhead throws, the handler fails non-permanently and the outbox retries later with back-off. The request path is
unaffected: the bulkhead exists only inside the dispatcher's work. `sharp` keeps its default thread pool
(`sharp.concurrency()` untouched, libuv threads). (U3-SCAL-01, RESILIENCY-09)

## P4 Idempotent handlers and claim-safe jobs

Confirm: "row exists → 200" first, insert last, unique-violation → 200 (L2). Processing: "profile already points
under `workers/<profileId>/<id>` → clean up and finish" first; writes are overwrites of deterministic keys; the
profile update is last-but-one and the staging delete last (L4). Purge: delete the object first, then the row
conditionally on `claimedAt IS NULL` (L5). Re-running any of them after a crash converges. (U3-REL-01)

## P5 Fail closed, write last

Ticket: sign first, respond; nothing to roll back. Confirm: all checks before the single insert; a rejected object
is deleted, never recorded. Claim: inside the registration transaction, as today. Processing: no partial profile
state, because the one profile write happens after both objects exist. (U3-AVAIL-04, SECURITY-15)

## P6 Single-purpose credentials and immutable keys

The browser holds a policy for one key, one type, one size range, ten minutes. The api's identity holds object
create/read/delete on one bucket and `signBlob` on itself. Keys are uuid-derived and never reused; processed copies
are served with `immutable` cache control, so a URL never changes meaning. (U3-SEC-02, U3-SEC-04)

## P7 Private by default, public by prefix

Uniform bucket-level access; the only public grant is `allUsers: objectViewer` on the managed folder `workers/`.
`staging/` holds unverified bytes and is reachable only by the api. Nothing the browser uploads is public until
the api has processed it (or, on permanent failure, copied it as-is, which is still after confirm's checks).
(U3-SEC-03, SECURITY-09)

## P8 Backstops that need no code to run

The bucket lifecycle rule deletes `staging/` objects older than 1 day, covering tickets nobody used, crashes
between steps and purge failures. Soft delete (7 days) covers an accidental deletion of a processed copy. Neither
depends on the api being up. (U3-AVAIL-01, RESILIENCY-12)

## P9 Observability per stage, without secrets

| Log line (`msg`) | Fields | Level |
|---|---|---|
| `photo-ticket` | `photoUploadId`, `contentType`, `sizeBytes`, `signMs` | info |
| `photo-confirm` | `photoUploadId`, `outcome` (`staged`/`too-large`/`not-image`/`wrong-type`/`missing`/`idempotent`), `inspectMs`, `readMs`, `sizeBytes` | info; `photo-rejected` at warn for the three rejections |
| `photo-process` | `photoUploadId`, `workerProfileId`, `decodeMs`, `encodeMs`, `bytesIn`, `bytesOut`, `outcome` (`processed`/`fallback`/`already`) | info; `photo-processing-fallback` at warn |
| purge summary | `candidates`, `deletedGcs`, `deletedBlob`, `skippedUnknownStore`, `failed` | job result |

Never logged: the policy fields or URL, the IP (hash only), file bytes. Request id on every line as today. Two
log-based metrics (`remonta-api-photo-rejected`, `remonta-api-photo-processing-fallback`) are created by bootstrap.
(U3-REL-02, U3-REL-03, U3-SEC-07)

## P10 Degraded modes, stated

| Failure | What the person sees | What the system does |
|---|---|---|
| Bucket or signing unavailable at ticket | the field shows "uploading" through the engine's retries, then "We couldn't upload your photo right now. Please try again in a moment." | 503 with `Retry-After`; nothing written; log |
| Bucket unavailable at confirm | same | 503; nothing written |
| Browser cannot reach the bucket | retries on the ticket, then a fresh ticket, then the final message | no api involvement |
| Bucket unavailable during processing | nothing; the profile has no photo until recovery | outbox retries, dead-letter alert after 6 |
| Undecodable upload | nothing; the profile shows the uploaded photo as-is | fallback copy; warn metric |
| Bulkhead full | nothing | outbox retry later |
| Blob adapter removed while Blob rows remain | nothing | purge skips and counts them |

## P11 No circuit breaker (Q2 A)

Justification recorded: at most two bounded bucket calls per request; the load shedder (event-loop delay, in-flight
cap) converts sustained slowness into fast 503s; the outbox and scheduler back off. Revisit if `photo-ticket` 503s
show a pattern in Metrics Explorer.

## P12 Resiliency testing plan (Q1 B, RESILIENCY-14)

### Automated, in CI (`API Quality`, against the fake storage server and a modelled api)

| Scenario | Injected how | Expected |
|---|---|---|
| Bucket unreachable at ticket | adapter endpoint pointed at a closed port | 503, `Retry-After`, no log of a policy, engine model retries then final message |
| Bucket unreachable at confirm | same | 503, no row |
| Signing unavailable | throwaway credentials replaced by a signer that throws | 503 at ticket |
| Bucket unreachable during processing | adapter throws on `read` | event retried; after 6 attempts `DEAD`; profile unchanged |
| Staging object missing at processing | delete it before the handler runs | `PermanentFailure`; `DEAD`; profile unchanged |
| Undecodable bytes | a 1-byte "image" that passed confirm (sniffer bypassed in the test) | as-is copy; profile set; staging gone; warn log |
| Bulkhead full | 3 concurrent events with a slow fake `read` | third waits, then retried; never more than 2 in flight (asserted) |
| Purge with a store missing | Blob adapter absent, one Blob-prefixed row | skipped and counted; bucket rows purged |
| Engine budget | model api/uploader with failure sequences (property test) | at most 3 uploads per ticket and 2 tickets; no request after abort |

### Staging drill, once per release that touches the bucket code

1. `gcloud storage buckets remove-iam-policy-binding <staging bucket> --member=serviceAccount:<staging runtime>
   --role=roles/storage.objectUser` (ten minutes).
2. On a preview: pick a photo → observe the retries and the final message; the api log shows `photo-ticket` 503s;
   no alert expected (5xx-ratio is prod-only).
3. Restore the binding; pick again → upload succeeds; a sign-up completes; processing runs.
4. Record the timestamps and observations in the construction notes.

### Runbook additions (inherited S1 DR runbook)

- Restore a deleted processed copy: `gcloud storage restore` within the soft-delete window.
- Re-run dead-lettered processing: reset the outbox event to `PENDING` (existing procedure) after the cause is fixed;
  the handler is idempotent.
- Lost bucket (catastrophic): the profile URLs point at missing objects; re-upload by the workers is the recovery;
  cross-region replication is out of scope (inherited decision).
