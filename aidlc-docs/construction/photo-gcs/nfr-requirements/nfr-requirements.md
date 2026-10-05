# NFR Requirements -- unit `photo-gcs` (U3)

**Decisions:** NFR plan Q1 A (`sharp`), Q2 A (split test strategy), Q3 A (bulkhead of 2), Q4 A (write-side
bucket audit logs), Q5 A (two log metrics, no new alert); approved 2026-10-05. Traced to the cycle's requirements
(NFR-01..15), the business rules (R#) and the stories (US-PH-#).

## Performance

| ID | Requirement | Trace |
|---|---|---|
| U3-PERF-01 | `createPhotoUploadTicket` answers in under 300 ms at p95 on production: one in-region signing call, no database write, no file | NFR-01, R1 |
| U3-PERF-02 | `confirmPhotoUpload` answers in under 300 ms at p95: one metadata read, one 16-byte ranged read, one insert | NFR-01, R2 |
| U3-PERF-03 | Processing finishes in under 10 s per photo on one vCPU for inputs up to 5 MB and 24 megapixels; typical phone photos in under 2 s | NFR-01, R4 |
| U3-PERF-04 | The browser transfers the photo once, to Sydney; the api never buffers it; the multipart entry's 5 MB body limit disappears from the new path | NFR-01, D2 |
| U3-PERF-05 | The photo step never blocks the form: ticket, upload and confirm run in the background from the pick; submit waits only if still in flight | US-PH-01, US-PH-04 |

## Scalability and capacity

| ID | Requirement | Trace |
|---|---|---|
| U3-SCAL-01 | Processing runs behind a bulkhead of 2 per instance; events beyond it wait inside the handler timeout and are retried by the outbox if it expires; memory per image bounded by `sharp`'s streaming decode (no full-resolution bitmap kept beyond one image) | Q3 A, RESILIENCY-09 |
| U3-SCAL-02 | Cloud Run limits unchanged (prod 1-4 instances, 1 vCPU, 1 GiB); the bucket has no practical request or storage quota at this volume; documented quotas: 5 TB object cap (irrelevant), 1 write/s per object (keys are unique) | RESILIENCY-09 |
| U3-SCAL-03 | Rate limits bound the ticket and confirm entries per IP and globally (R1.2, R2); a flood of tickets costs the api one signing call each and the bucket nothing until an upload happens | SECURITY-11 |

## Availability and resiliency

| ID | Requirement | Trace |
|---|---|---|
| U3-AVAIL-01 | Regional bucket in `australia-southeast1` (zone-redundant by Google's design); soft delete at the 7-day default; no versioning | NFR-12, RESILIENCY-08, -12 |
| U3-AVAIL-02 | Every Cloud Storage call carries an explicit 5 s timeout (`GCS_TIMEOUT_MS`); the handler respects the outbox's 15 s; the purge the job's 10 min | NFR-10, RESILIENCY-10 |
| U3-AVAIL-03 | Degraded mode: ticket or confirm 503 → the engine retries with back-off, then a retryable field error; the rest of the form works; the photo stays required | NFR-11, R6, R8 |
| U3-AVAIL-04 | A bucket outage during processing never affects the request path: the event retries and dead-letters; the profile stays without a photo until re-run; nothing else about the account is affected | R4.9 |
| U3-AVAIL-05 | The bucket is deliberately absent from the liveness probe, so a storage incident does not restart instances | RESILIENCY-06 |
| U3-AVAIL-06 | Rollback at each PR is a promote; the overlap rules keep sign-ups working in either direction (R9) | NFR-14, RESILIENCY-04 |

## Security and privacy

| ID | Requirement | Trace |
|---|---|---|
| U3-SEC-01 | Google-managed encryption at rest; TLS for every call and upload; the ticket's URL is `https://storage.googleapis.com/<bucket>` | NFR-02, SECURITY-01 |
| U3-SEC-02 | Runtime service account: `roles/storage.objectUser` on its own bucket, `roles/iam.serviceAccountTokenCreator` on itself; nothing project-wide; the deploy account unchanged | NFR-03, SECURITY-06 |
| U3-SEC-03 | Uniform bucket-level access; public read only on the `workers/` managed folder; `staging/` never readable without the api's identity; documented exception to block-public-access | NFR-04, SECURITY-09 |
| U3-SEC-04 | The policy binds key, content type, size range and expiry; confirm re-checks size and bytes; ids are random uuids; a ticket is single-purpose (one key) | NFR-05, NFR-06, SECURITY-05, -08, -11 |
| U3-SEC-05 | Bucket CORS: origins = the stage's app origins (prod exact, staging `https://*.vercel.app`), methods `POST`, max age 1 h; no credentials | FR-02, SECURITY-07 |
| U3-SEC-06 | Cloud Storage data-access audit logs: `DATA_WRITE` on; reads off | Q4 A, SECURITY-13, -14 |
| U3-SEC-07 | Logs carry the request id and upload id; never a signed URL or policy field, never an IP (the hash only), never file bytes | FR-20, SECURITY-03 |
| U3-SEC-08 | Processed copies carry no EXIF, GPS, XMP, IPTC or comments (privacy of the worker's location) | R4.3 |
| U3-SEC-09 | Residency: bucket, processing, logs in Australia | NFR-13 |

## Reliability and observability

| ID | Requirement | Trace |
|---|---|---|
| U3-REL-01 | Confirm is idempotent and race-safe (R2.1, R2.6); processing is idempotent (R4.1); purge is claim-safe (R5.2) | L2, L4, L5 |
| U3-REL-02 | Log-based metrics `remonta-api-photo-rejected` and `remonta-api-photo-processing-fallback` created by bootstrap; no new alert in this unit; the dead-letter alert covers permanent processing failure | Q5 A, SECURITY-14 |
| U3-REL-03 | Each stage logs its duration: `photo-ticket` (sign ms), `photo-confirm` (inspect ms, read ms, outcome), `photo-process` (decode ms, encode ms, bytes in/out, outcome), purge summary per store | FR-20, RESILIENCY-05 |
| U3-REL-04 | Resiliency testing approach: decided at NFR Design (RESILIENCY-14 question) | §5 of requirements |

## Maintainability and testability

| ID | Requirement | Trace |
|---|---|---|
| U3-MAINT-01 | One contract area, one handler per entry, no Nest controller; `apps/api` code inside `modules/registration` (AD-4) | CLAUDE.md |
| U3-MAINT-02 | Tests: adapter and flows against `fake-gcs-server` (container in `API Quality`, Node 20 and 22, and locally); policy signing offline with a throwaway key; property-based tests with `fast-check` for the properties of the functional design; skipped-not-passed when the container is absent | Q2 A, FR-18, PBT-08, -09 |
| U3-MAINT-03 | `sharp` and `@google-cloud/storage` pinned through the lockfile; the Docker build on Linux installs sharp's optional prebuilt package; no `latest` tags | NFR-09, SECURITY-10 |
| U3-MAINT-04 | `docs/signup` and CLAUDE.md updated in the same PRs; the stages table remains the only place a bucket name is written | FR-16, FR-19 |
| U3-MAINT-05 | Property files and generators centralised (`test/generators.ts` per package) and reused | PBT-07 |

## Usability

| ID | Requirement | Trace |
|---|---|---|
| U3-USE-01 | Progress visible from the first byte; indeterminate state before and after the transfer | US-PH-02 |
| U3-USE-02 | Messages name the fix: HEIC (with the iPhone setting), size, type, retry | R7, R8 |
| U3-USE-03 | Picking another photo cancels the previous upload silently; leaving the form aborts it | R6.8 |
| U3-USE-04 | The progress bar is reachable by assistive technology (`role="progressbar"`, `aria-valuenow`, a text alternative) | frontend-components |

## Extension compliance (NFR Requirements, U3)

| Rule | Status | Note |
|---|---|---|
| SECURITY-01..15 | Compliant / N/A as in requirements §7, refined by U3-SEC-01..09 | no blocking finding |
| RESILIENCY-01..13, -15 | Compliant | U3-AVAIL-01..06, U3-REL-01..03 |
| RESILIENCY-14 | Deferred to NFR Design | the question is asked there |
| PBT-09 framework | Compliant | `fast-check` present in `apps/api`, `packages/form-engine`, `packages/schemas`; `vitest` runner |
| PBT-01 | Compliant | properties listed in the functional design |
