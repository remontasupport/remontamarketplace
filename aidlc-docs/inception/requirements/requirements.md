# Requirements -- sign-up photo on Google Cloud Storage

**Depth:** Standard. One feature re-architected end to end (browser, form engine, contract, api, database, infra,
CI, docs) plus one independent alert fix. **Sources:** the chat decisions of 2026-10-05 (audit), the inventory
`signup-photo-inventory.md`, and `requirement-verification-questions.md` (Q1-Q11 all answered A).

## 1. Intent analysis

| | |
|---|---|
| **User request** | "We should fix the system of uploading a photo" (after the latency alert and the measurements); "Go with Option A, start the AI-DLC cycle for it" |
| **Request type** | Enhancement of an existing feature with new infrastructure: the sign-up photo moves from an api-proxied upload to Vercel Blob onto a direct browser upload to a Google Cloud Storage bucket in Sydney, with server verification and background processing |
| **Scope estimate** | Multiple components: `apps/app` (upload field, HEIC handling, allowed image hosts), `packages/form-engine` (the photo kind's upload steps), `packages/api-contract` (two new entries, one removed), `apps/api` (ticket, confirm, processing, purge, store adapter, config), `packages/db` (upload row state and store), `infra/` (bucket, IAM, CORS, lifecycle, alert policy, stages table), CI (fake storage container), `docs/signup`, CLAUDE.md |
| **Complexity estimate** | Moderate to complex: a new managed service, a signed-ticket flow, an asynchronous processing step with a new native dependency, a cut-over with old data left in place, and a preview-first rollout |

## 2. Decisions

| # | Decision | Source |
|---|---|---|
| D1 | **Option A**: new sign-up photos are stored in a Google Cloud Storage bucket in `australia-southeast1`, in project `remonta-api-510206` | chat 2026-10-05 |
| D2 | The browser uploads **directly to the bucket** with a short-lived ticket issued by `apps/api`; the api never carries the bytes | chat (the plan) |
| D3 | **Old photos stay in Vercel Blob** (store region `syd1`) and keep their URLs; nothing migrates; dashboard uploads keep writing to Blob | chat, Q2 A |
| D4 | The targeted inventory is the cycle's reverse-engineering artifact | Q1 A |
| D5 | Scope is the **sign-up photo only**; the dashboard's photo replacement is a later cycle | Q2 A |
| D6 | **HEIC is no longer accepted.** The accept list changes in the shared component, everywhere it is used, as its own small PR; the wizard adds byte-level detection and a specific message; the api drops HEIC from the contract and the sniffer | Q3 A, chat |
| D7 | Photos are served as **public objects straight from Google** (`storage.googleapis.com/<bucket>/...`); the host is added to the app's allowed image hosts; no custom domain, no signed reads | Q4 A |
| D8 | **Full processing** after claim: re-encode to JPEG, longest edge 1600 px, metadata removed, a 256 px thumbnail; the profile points at the processed copy; the original upload is deleted once the copies exist | Q5 A |
| D9 | The **latency alert correction is a unit of this cycle, delivered first** as its own PR | Q6 A |
| D10 | Local development and CI use a **fake Cloud Storage server in a container** (`fake-gcs-server`), like PostGIS; the `local` disk store is retired | Q7 A |
| D11 | **Hard switch** at promotion; the purge job keeps deleting Blob keys for rows staged before the switch; the Blob token stays in the api's secrets a few days, then goes | Q8 A |
| D12 | Extensions: Security baseline (blocking), Resiliency baseline (blocking), Property-Based Testing (full) | Q9-Q11 A |
| D13 | Assumptions accepted by silence: 5 MB limit, 1600 px longest edge, 10-minute tickets, 24 h claim window and purge, IP stored only as a keyed hash, rate limits unchanged and applied to the ticket request, upload starts on file pick and submit waits for it | questions file preamble |

## 3. Functional requirements

### 3.1 Upload flow (the sign-up wizard)

| ID | Requirement | Priority |
|---|---|---|
| FR-01 | **Ticket.** A new public contract entry takes the declared type (`image/jpeg`, `image/png`, `image/webp`) and the byte size, applies the existing limits (10/h per IP, 300/h global, no CAPTCHA), creates an upload row in state `PENDING` with a server-generated UUID key under a staging prefix, and returns the upload id, the upload target (URL and the signed fields or headers the browser must send) and the expiry. The ticket is bound to that exact key, that content type, a size of at most 5 MB, and expires after 10 minutes | Must |
| FR-02 | **Direct upload.** The browser sends the shrunk file straight to the bucket using the ticket, shows progress, retries transient failures, and abandons the attempt if the person picks another photo or leaves the step. The api is not in the byte path. The bucket's CORS admits only the app's origins (production exact; previews `*.vercel.app` on staging) and only the upload method | Must |
| FR-03 | **Confirm.** A new public contract entry takes the upload id. The api checks the object in the bucket: it exists, its size is at most 5 MB, its content type is in the list, and its first bytes identify JPEG, PNG or WebP. On success the row becomes `STAGED` and the id is the field's value, exactly as today. On failure the row is marked and the object deleted; the person sees the same messages as today (413 too large, 415 not an accepted image), plus "upload incomplete" when the object is missing. Confirming an already staged id is idempotent | Must |
| FR-04 | **Claim unchanged.** Registration takes `photoUploadId` as today; only `STAGED` rows within 24 h are claimable; the profile receives the row's URL inside the registration transaction so the profile is never without a photo | Must |
| FR-05 | **The person's experience.** Picking a photo starts the ticket and the upload in the background while the form continues; a progress indicator replaces the spinner; submit waits for an in-flight upload; the draft and preview behaviour of the wizard is unchanged | Must |

### 3.2 Processing and clean-up

| ID | Requirement | Priority |
|---|---|---|
| FR-06 | **Background processing.** Claiming a photo enqueues an outbox event. Its handler reads the original, applies the EXIF orientation, resizes to a longest edge of 1600 px without enlarging, encodes JPEG at quality 85 with every metadata block removed (EXIF, GPS, XMP, IPTC; the ICC profile converted to sRGB and dropped), writes it under the profile's prefix, writes a 256 px thumbnail beside it, updates the profile's photo URL to the processed copy, records the thumbnail URL on the upload row, and only then deletes the original. The handler is idempotent and safe to retry; after the outbox's maximum attempts the event is dead-lettered and the existing dead-letter alert fires; the profile keeps the original URL in that case | Must |
| FR-07 | **Purge.** The daily job deletes, from the store that holds them and from the table, `PENDING` rows whose ticket expired without a confirmed object and `STAGED` rows unclaimed after 24 h. Rows staged on Blob before the switch are deleted from Blob while any remain. A bucket lifecycle rule deletes anything under the staging prefix older than 2 days as a backstop | Must |
| FR-08 | **Thumbnails are stored, not yet displayed.** No reader in `apps/app` changes to use the thumbnail in this cycle; the URL is recorded so a later cycle can adopt it | Should |

### 3.3 HEIC

| ID | Requirement | Priority |
|---|---|---|
| FR-09 | The shared upload component's accept list becomes `image/jpeg,image/png,image/webp` everywhere it is rendered (its own PR), and its own type check and messages match. iPhones then hand over JPEG instead of HEIC | Must |
| FR-10 | The wizard identifies a HEIC by its bytes (`ftyp` brand) when the browser cannot decode the file, before any upload, and shows: the photo is in HEIC format, please choose a JPEG or PNG, and on iPhone set Camera > Formats > Most Compatible. The occurrence is logged (no file content) so the frequency is known | Must |
| FR-11 | The contract's type list, the ticket's allowed types and the api's byte sniffer no longer include HEIC; the engine's 415 wording drops HEIC | Must |

### 3.4 Old data and serving

| ID | Requirement | Priority |
|---|---|---|
| FR-12 | Every existing Blob URL in `worker_profiles.photos` and elsewhere keeps displaying; no row is rewritten; dashboard upload routes are untouched | Must |
| FR-13 | Processed photos and thumbnails are publicly readable at `https://storage.googleapis.com/<bucket>/...`; originals under the staging prefix are not publicly readable; the host is added to `next/image`'s allowed patterns; objects carry a long immutable cache lifetime (keys are unique per upload) | Must |

### 3.5 The alert (unit delivered first)

| ID | Requirement | Priority |
|---|---|---|
| FR-14 | `latency-p95.json` measures a service-wide p95 (`ALIGN_DELTA` per series, `REDUCE_PERCENTILE_95` across series, grouped by service), requires a minimum request volume through a second condition joined by AND, and holds for at least two 5-minute windows before firing. Its documentation text describes what it now measures | Must |
| FR-15 | A repeatable way to apply policy changes to the live policies by display name (an "apply alerts" step or script), since `bootstrap.sh` only creates missing ones; the change is applied to production's policy and verified to stop the single-upload emails | Must |

### 3.6 Platform, configuration and documentation

| ID | Requirement | Priority |
|---|---|---|
| FR-16 | `infra/lib/stages.ts` gains the bucket name per stage (staging and prod use different buckets) and the public base URL; `bootstrap.sh` creates the buckets (regional `australia-southeast1`, uniform bucket-level access, public read on the processed prefix only, CORS, lifecycle rule, soft delete), enables the Storage API, and grants the runtime service accounts object create/read/delete on their bucket and token creation on themselves. `service.*.yaml` stays generated | Must |
| FR-17 | `PHOTO_STORE` becomes `gcs`, with the bucket and an optional endpoint override for the fake server; `BLOB_READ_WRITE_TOKEN` stays optional for the purge of pre-switch rows and is removed from the stages table and Secret Manager after the cut-over window | Must |
| FR-18 | The api's `API Quality` job and the local setup run `fake-gcs-server` beside PostGIS; the adapter, ticket and confirm flows have tests against it; without it those tests are skipped and reported as skipped | Must |
| FR-19 | `docs/signup/01-flow.md`, `02-api-reference.md`, `03-data-model.md`, `05-events-and-emails.md` and CLAUDE.md describe the new flow, entries, columns, event and bucket in the same PR as the code | Must |
| FR-20 | Each stage is timed and logged with the request id: ticket issue, confirm (metadata read and byte read), processing duration and bytes, purge counts. No URL with a ticket signature, no IP, no file content in logs | Must |

## 4. Non-functional requirements

| ID | Requirement | Rule |
|---|---|---|
| NFR-01 | **Latency.** Ticket and confirm each under 300 ms at p95 on production (in-region calls); processing under 10 s per photo on one vCPU; the person's upload time is their connection to Sydney, no longer doubled through the api | RESILIENCY-05 |
| NFR-02 | **Encryption.** Bucket objects are encrypted at rest by Google-managed keys (default); every call to Cloud Storage and every browser upload is TLS; the ticket flow never emits a plain-HTTP URL | SECURITY-01 |
| NFR-03 | **Least privilege.** Each runtime service account holds exactly: object create/read/delete on its own bucket (`roles/storage.objectUser`, bucket-scoped) and `roles/iam.serviceAccountTokenCreator` on itself for ticket signing. No project-wide storage roles, no wildcards; the GitHub deploy account gains nothing | SECURITY-06 |
| NFR-04 | **Public access, documented exception.** Uniform bucket-level access on; public read granted only on the processed prefix through a managed folder or a bucket-level grant scoped as narrowly as Cloud Storage allows; the staging prefix is never public. This mirrors today's public Blob URLs and is the documented exception to the block-public-access default | SECURITY-09 |
| NFR-05 | **Input validation.** Both new entries validate with Zod through the contract (type allow-list, size bounds, UUID ids); the ticket's constraints are enforced by the signed policy at the bucket, and confirm re-checks size, type and bytes server-side (defence in depth) | SECURITY-05, -11 |
| NFR-06 | **Abuse cases considered.** A ticket is single-use (exact key, confirm refuses a second staging); an attacker with a ticket can store at most one 5 MB object that is private and purged; ids are random UUIDs, so confirm and claim cannot be guessed; rate limits bound ticket issuance; the policy expiry bounds the window | SECURITY-08, -11 |
| NFR-07 | **Logging.** Structured logs with request id as today; the Cloud Storage data-access audit log for the bucket is enabled for writes so uploads and deletes are attributable; retention per the project's existing 90-day practice | SECURITY-03, -14 |
| NFR-08 | **Errors fail closed.** Any failure in ticket issuing, confirm checks or processing leaves the row unusable for claim (never silently staged); error responses stay generic | SECURITY-15 |
| NFR-09 | **Supply chain.** `sharp` and the Storage client are pinned through the lockfile; the Docker image installs sharp's prebuilt binary for the image's platform; no `latest` tags | SECURITY-10 |
| NFR-10 | **Timeouts and isolation.** Every Cloud Storage call has an explicit timeout; processing runs under the outbox's handler timeout and lease; a slow or failing bucket cannot block the request path beyond the confirm timeout | RESILIENCY-10 |
| NFR-11 | **Degraded mode.** If tickets cannot be issued (IAM signing or bucket unavailable), the wizard shows a retryable upload error and the engine's existing retry applies; the rest of the form still works; the photo remains required at submit as today | RESILIENCY-10 |
| NFR-12 | **Data protection.** Regional bucket (zone-redundant by design) in Sydney; soft delete retained at the Cloud Storage default (7 days) as the RPO backstop for accidental deletion; no cross-region replication (inherited single-region decision) | RESILIENCY-08, -12 |
| NFR-13 | **Residency.** Bucket, processing and logs stay in Australia; nothing about a person leaves the region except what already does (reCAPTCHA, Resend) | S1 data residency decision |
| NFR-14 | **Rollback.** The api rolls back by promoting the previous image; the app by Vercel promote. During a rollback window rows staged on the bucket cannot be purged by the old image (it only knows Blob); they are picked up when the new image returns, and the lifecycle rule covers the objects | RESILIENCY-04 |
| NFR-15 | **Gates.** Every existing quality gate stays green; baselines may not grow; the new tests run in CI against the fake server; property-based tests use `fast-check` (already a dependency in `apps/api`, `packages/form-engine`, `apps/app`) | PBT-08, -09 |

## 5. Resiliency decisions carried forward from S1 (RESILIENCY-02, -03, -04, -08, -15)

The baseline requires these to come from the user. They were answered in S1 (archive `s1-worker-registration`,
requirements §2 and NFR-RES-01..10) and the two later cycles inherited them. They apply here unchanged unless you
say otherwise at this review:

| Decision | Value carried forward | Applied to this cycle |
|---|---|---|
| Availability and recovery targets | SLA 99.9 % monthly for the api; RTO <= 30 min and RPO <= 5 min for an availability-zone failure; regional failure out of scope | The bucket is regional and zone-redundant; soft delete covers accidental deletion; the staged photo is the only new state and is recreatable by the person |
| Regional topology | Single region, multiple zones, Sydney | Same region as the api |
| Change management | The CLAUDE.md process: branch, PR, CI, preview checklist on staging, merge, promotion | Unchanged; the preview checklist gains the direct upload and HEIC checks (§6) |
| CI/CD | GitHub Actions | `deploy-api` unchanged; `API Quality` gains the fake storage container |
| Rollback | Redeploy the previous pinned image (api), Vercel promote (app); migrations forward-only | NFR-14; the one new column is additive |
| Deployment style | S1 chose canary; what was built is staging-first promotion of the same image, which is this project's practice today | Unchanged: nothing reaches production before it ran on staging |
| Incident response | Lightweight process with post-incident reviews, alerts to support@ | The corrected latency policy and the existing dead-letter policy route there |
| Resiliency testing | Decided at NFR Design | A bucket-unavailable and a signing-unavailable scenario will be specified then |

## 6. Verification protocol

1. **Gates**: api, api-contract, form-engine, app, infra and db quality; `turbo run build`; both Vercel previews;
   the api's tests against PostGIS and `fake-gcs-server` in CI.
2. **Preview checklist on staging, before any production step** (CLAUDE.md, extended): sign in and open a
   dashboard; health 200; suburb search with ids; **a photo upload from a phone on mobile data with the progress
   visible**; **a HEIC attempt on an iPhone (expect JPEG to arrive) and on Android or desktop (expect the HEIC
   message)**; a full sign-up with an internal email; after the outbox runs, the processed copy and thumbnail exist
   in the staging bucket, the original is gone, and the processed file carries no EXIF or GPS (checked with an
   EXIF reader); duplicate-email notice; **an old Blob photo still displays in the dashboard**; the production
   domain unchanged meanwhile.
3. **Alert unit**: on staging, a deliberately slow single request does not fire the corrected policy; the policy
   is applied to production by the new step and the next day passes without a single-upload email.
4. **Production after promotion**: the same checks on the live domain with one internal sign-up; then the Blob
   token removal after the cut-over window, with the purge job's log confirming no Blob-era rows remain.

## 7. Extension compliance (Requirements stage)

### Security (blocking)

| Rule | Status | Note |
|---|---|---|
| SECURITY-01 encryption | Compliant | NFR-02 |
| SECURITY-02 intermediary logging | N/A | No load balancer or CDN added (Q4 A); Cloud Run request logs exist |
| SECURITY-03 application logging | Compliant | FR-20, NFR-07 |
| SECURITY-04 security headers | N/A | No HTML-serving change; the app's headers are unchanged |
| SECURITY-05 input validation | Compliant | NFR-05 |
| SECURITY-06 least privilege | Compliant | NFR-03 |
| SECURITY-07 network | N/A | No network configuration change; CORS on the bucket is restrictive (FR-02) |
| SECURITY-08 access control | Compliant | Public entries by design, as today; unguessable ids; NFR-06 |
| SECURITY-09 hardening | Compliant with documented exception | NFR-04: public read on processed photos only |
| SECURITY-10 supply chain | Compliant | NFR-09 |
| SECURITY-11 secure design | Compliant | NFR-05, NFR-06 (abuse cases) |
| SECURITY-12 authentication | N/A | No credential handling change |
| SECURITY-13 integrity | Compliant | The byte check before trust (FR-03); the audit log of writes (NFR-07) |
| SECURITY-14 alerting | Compliant | FR-14, FR-15, the existing dead-letter and 5xx policies |
| SECURITY-15 fail safe | Compliant | NFR-08 |

### Resiliency (blocking)

| Rule | Status | Note |
|---|---|---|
| RESILIENCY-01 criticality | Compliant | The upload path is part of the Critical sign-up path (S1); processing is High (a failure leaves the original in place) |
| RESILIENCY-02 targets | Compliant | §5, carried forward |
| RESILIENCY-03 change management | Compliant | §5 |
| RESILIENCY-04 deployment and rollback | Compliant | §5, NFR-14 |
| RESILIENCY-05 monitoring | Compliant | FR-14, FR-20; dashboards as today |
| RESILIENCY-06 health checks | Compliant | Unchanged probes; the bucket is deliberately not in the liveness probe so a storage incident does not restart instances |
| RESILIENCY-07 resiliency monitoring | Compliant | Dead-letter alert covers failed processing; quota: Cloud Storage limits are far above this volume, documented at design |
| RESILIENCY-08 topology | Compliant | §5, NFR-12 |
| RESILIENCY-09 scaling | Compliant | Cloud Run limits unchanged; processing bounded by the outbox batch size |
| RESILIENCY-10 isolation | Compliant | NFR-10, NFR-11 |
| RESILIENCY-11..13 DR | Compliant | NFR-12; procedures inherited from S1; the staged photo is re-uploadable by the person |
| RESILIENCY-14 testing | Deferred to NFR Design | §5 last row |
| RESILIENCY-15 incident response | Compliant | §5 |

### Property-based testing (full)

| Rule | Status | Note |
|---|---|---|
| PBT-01 property identification | At Functional Design | Candidates: the byte sniffer (invariant over generated headers), key derivation and prefix safety (invariant), the ticket policy document round-trip (encode/decode), size and dimension clamping (invariant, idempotence), processing idempotence (model-based with the fake store) |
| PBT-09 framework | Compliant | `fast-check` already in the affected packages |
| PBT-02..08, -10 | At Code Generation | |

## 8. Out of scope

The dashboard's photo replacement and every other `apps/app` upload route (Q2 A); migrating old Blob objects;
displaying thumbnails (FR-08 records them only); a custom domain or CDN in front of the bucket (Q4 A); client-side
HEIC conversion (add later if FR-10's count justifies it); the search slice and the other follow-ups in the state
file.

## 9. Open items for design

| # | Item |
|---|---|
| OI-1 | Bucket names and the processed/staging prefixes (`remonta-api-photos[-staging]` proposed) |
| OI-2 | Signed POST policy document vs V4 signed PUT URL for the ticket: the policy document enforces the size range at the bucket, the PUT URL does not; decided at Functional Design |
| OI-3 | Whether the thumbnail URL lives on the upload row or a new profile column (FR-08) |
| OI-4 | The request-count threshold for the alert's second condition, derived from current traffic |
