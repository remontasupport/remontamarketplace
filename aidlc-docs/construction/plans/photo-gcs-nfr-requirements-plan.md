# NFR Requirements Plan -- unit `photo-gcs` (U3)

**Inputs:** functional design (`../photo-gcs/functional-design/`, zero new columns), requirements NFR-01..NFR-15,
the api's runtime (Node 22 on `bookworm-slim`, pnpm hoisted, `pnpm deploy --prod --ignore-scripts` into the image,
Cloud Run 1 vCPU / 1 GiB, outbox batch 20 with a 15 s handler timeout), CI's `API Quality` job (PostGIS service
container, Node 20 and 22).

Five questions, each pre-filled with a proposal; leave or change the letter and say "approved" (or "done").

## Question 1
The image library for processing (R4.3, R4.4).

A) **`sharp`** (libvips). Prebuilt binaries as optional packages, so no compiler and no install script; the Linux
x64 package is installed by the Docker build on Linux and carried by `pnpm deploy`. Orientation, resize, JPEG
encode, metadata stripping and sRGB conversion are one call chain; a 12-megapixel JPEG takes well under a second on
one vCPU. No HEIC decoder (by design, patents), which matches R2.4. Recommended.

B) **`jimp`** (pure JavaScript). No native code at all, but 5-10 times slower, higher memory per image, and
metadata handling is less explicit; the 15 s handler budget is tight for large PNGs.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 2
How the bucket code is tested without Google credentials (FR-18, NFR-15).

A) **Split by what each test can prove.** (1) The adapter's `inspect`, `readPrefix`, `read`, `write`, `delete`
and the confirm, processing and purge flows run against a `fake-gcs-server` container locally and in `API
Quality` (objects are put there through the client library). (2) Ticket signing is tested offline with a throwaway
service-account key injected into the client: the policy document is decoded and its conditions asserted
(round-trip property), no server needed. (3) The browser's form POST against a real bucket is exercised only on
staging through the preview checklist, since the fake server does not document policy enforcement for form
uploads. Recommended.

B) **Everything against the fake server**, including the form POST, accepting that a fake which ignores
signatures proves less than it seems; if it rejects the form, fall back to A at code generation.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 3
Processing concurrency and memory (RESILIENCY-09, -10). The outbox dispatcher runs a batch of up to 20 events
concurrently; 20 decodes of 5 MB images on a 1 GiB instance could exhaust memory.

A) **A bulkhead of 2** around the processing handler (the same `Bulkhead` the password hasher uses): at most two
images in flight per instance, the others wait within the handler timeout and are retried by the outbox if it
expires; `sharp` limited to its default thread pool. Recommended at today's volume; raise with traffic.

B) **No limit**; rely on the outbox batch size and Cloud Run's memory.

C) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 4
Audit logging of the bucket (SECURITY-07, SECURITY-13, NFR-07). Cloud Run's request logs already cover the
api; the bucket's own data-access logs are off by default and billed by volume.

A) **Write-side only** (`DATA_WRITE` for Cloud Storage on the project): every object create and delete is
attributable, uploads by the browser included; reads are not logged. Negligible cost at this volume. Recommended.

B) **Off**; rely on the api's log lines (ticket issued, confirm outcome, processing done) that carry the upload id.

C) **Reads and writes**; complete, but public-read traffic would generate log volume for no security value.

D) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Question 5
Log-based metrics for the new failure paths (SECURITY-14, RESILIENCY-05), through the bootstrap `metric` helper.

A) **Three metrics, no new alerts yet**: `photo-rejected` (confirm 413/415, with reason), `photo-processing-fallback`
(R4.8) and `heic-rejected` is browser-side (console only, not a metric). The dead-letter alert already covers
processing that fails for good; the metrics make the rejection and fallback rates visible in Metrics Explorer, and
an alert can be added later by editing a JSON and running `apply-alerts.sh`. Recommended.

B) **Metrics plus an alert** on the fallback metric (any fallback in 24 h emails support).

C) **No new metrics**; logs only.

D) Other (please describe after [Answer]: tag below)

[Answer]: A -- proposed

## Fixed by earlier decisions (not questions)

- Latency targets: ticket and confirm under 300 ms at p95 in production; processing under 10 s per photo; the
  browser upload is the person's bandwidth once.
- Timeouts: every Cloud Storage call 5 s (`GCS_TIMEOUT_MS`); ticket signing within that; the processing handler
  within the outbox's 15 s; purge within the job's 10 min.
- Residency: bucket, processing and logs in `australia-southeast1`; Google-managed encryption; TLS only.
- Availability: single region, zone-redundant bucket; soft delete at the 7-day default; no versioning.
- Dependencies pinned by the lockfile; `@google-cloud/storage` and `sharp` added to `apps/api` only;
  `fast-check` for the property tests (already present); `vitest` as the runner.

## Execution checklist

- [ ] 1. Confirm the five answers; resolve ambiguity in a clarification file
- [ ] 2. `aidlc-docs/construction/photo-gcs/nfr-requirements/nfr-requirements.md`: scalability, performance,
  availability, security, reliability, maintainability and usability requirements for the unit, each traced to a
  rule or story, with the extension compliance tables
- [ ] 3. `tech-stack-decisions.md`: the libraries, versions, the signing method, the test strategy, the fake
  server, the bulkhead, logging and metrics, with alternatives considered
- [ ] 4. Present for approval
