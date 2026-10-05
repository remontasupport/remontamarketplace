# Application Design -- sign-up photo on Google Cloud Storage (consolidated)

**Status:** written 2026-10-05 from the approved plan (`../plans/application-design-plan.md`: Q1 A, Q2 A, Q3 A,
Q4 A). Scope: the sign-up path only (user, 2026-10-05). The four detailed files beside this one are the reference;
this page is the overview.

## The shape in one paragraph

The browser shrinks the photo, checks its first bytes for HEIC, asks the api for a ticket, POSTs the file straight
to a Sydney bucket with the signed fields the api issued, then asks the api to confirm. The api never carries the
bytes: it creates a `PENDING` row and a signed POST policy bound to one key, one type and at most 5 MB for ten
minutes; on confirm it inspects the object and reads 16 bytes, then marks the row `STAGED` or deletes the object and
marks it `REJECTED`. Registration claims a `STAGED` row as today and enqueues one outbox event; the handler makes
the 1600 px metadata-free JPEG and the 256 px thumbnail under the profile's public prefix, points the profile at
the processed copy, and deletes the original. A daily job purges what was never used, from whichever store holds
it; a bucket rule backs it up. The multipart entry keeps storing to Vercel Blob until the new wizard is live, then
goes.

## Components (21), by layer

| Layer | Components | New / changed |
|---|---|---|
| Shared | C1 `detectImageType` in `packages/schemas` | moved from the api, one implementation for both sides |
| Contract | C2 two new entries, the multipart entry kept until 3c | new |
| Engine | C3 photo kind (`ticketEntry`, `confirmEntry`), C4 `stagePhoto`, C5 `Uploader` port + `isHeicHeader` | new / changed |
| App | C6 `xhrUploader`, C7 `uploaderFor` with HEIC stop and progress, C8 `PhotoUpload` optional props, C9 image host | new / changed, dashboard defaults untouched |
| Api | C10 state machine and keys, C11 ports and adapters (GCS new, Blob kept), C12 ticket, C13 confirm, C14 claim, C15 processing handler, C16 multipart (overlap), C17 purge, C18 wiring and config | new / changed |
| Infra, CI | C19 buckets, IAM, stages table, bootstrap; C20 alert policy and apply step; C21 fake storage in `API Quality` | new |

## Decisions carried into construction

| # | Decision | Where it bites |
|---|---|---|
| AD-1 | Signed POST policy V4; the GCS adapter signs through the client library (IAM `signBlob` on Cloud Run, a throwaway key in tests) | C11, C21, NFR Requirements |
| AD-2 | Processed and thumbnail URLs on the upload row; the profile keeps `photos` | migration in 3a, C14, C15 |
| AD-3 | The multipart entry's behaviour is frozen during the overlap, HEIC still listed there; the new entries never accept HEIC | C2, C16, 3c |
| AD-4 | All api code in `modules/registration` | C10-C18 |
| AD-5 | The sniffer moves to `packages/schemas` | C1; PBT tests there |
| AD-6 | Engine owns the flow and the HEIC decision; the app owns transport (`XMLHttpRequest`) and progress rendering | C4-C8, P-7 |
| AD-7 | `PhotoUpload` gains optional props only; the wizard passes its own accept list | C8, scope rule |
| AD-8 | Config: `PHOTO_BUCKET`, `PHOTO_PUBLIC_BASE_URL`, optional `GCS_API_ENDPOINT`; `PHOTO_STORE` and `PHOTO_LOCAL_DIR` removed; Blob token optional until 3c | C18, C19 |
| AD-9 | Public read only on the `workers/` managed folder; `staging/` private; lifecycle 2 days on `staging/` | C19, SECURITY-09 exception |
| AD-10 | Processing is an outbox handler with `sharp` loaded lazily; permanent failure on undecodable bytes | C15, RESILIENCY-10 |

## Open for Functional Design (U3)

- Exact error mapping table (api status -> engine message -> field state), including 429 with `Retry-After`.
- The retry budget split between "same ticket" and "fresh ticket".
- Whether confirm re-checks the declared `sizeBytes` against the object's size (information only, since storage
  enforced the cap).
- The `N` requests per 5 minutes for the alert's volume condition (U1 Infrastructure Design, from current traffic).
- Property list (PBT-01): state machine transitions, key derivation and prefix safety, sniffer invariants,
  processing idempotence and dimension bounds, `stagePhoto` retry behaviour against a modelled api.

## Extension compliance at this stage

- **Security**: least privilege and the public-read exception are placed (AD-9, C19); input validation on both
  entries (C2); unguessable ids (C10); no bytes through the api (C4, C11); nothing sensitive logged (R-LOG).
  No blocking finding.
- **Resiliency**: timeouts named on every store call (C11, `GCS_TIMEOUT_MS`), processing isolated in the outbox
  with retries and dead-lettering (C15), degraded mode is a retryable field error (C4). No blocking finding.
- **PBT**: properties identified for Functional Design (above); `fast-check` present. No blocking finding.

## Amendment 2026-10-05 (Functional Design, user: "I don't want more columns")

AD-2 is replaced: **no new columns, no migration.** Nothing is persisted at ticket time (the ticket is a signed
policy for `staging/<uuid>`); confirm creates the row after checking the object, so a row's existence means
"staged" and `claimedAt` means "claimed", as today; the store is derived from the key's prefix
(`workers/registration/` = Blob, otherwise the bucket); the processed and thumbnail URLs are derived from the
profile id and the upload id, and "processing done" is read from the profile's `photos`. C10 loses the state
machine (replaced by `isClaimable` and `storeOf`); C12 writes nothing; C13 inserts the row; C17 keeps today's
query. Details: `../../construction/photo-gcs/functional-design/`.
