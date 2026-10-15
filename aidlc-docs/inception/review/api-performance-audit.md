# Worker api performance audit (2026-10-15)

Asked by the user before merging U3a: "the query is too slow, ESPECIALLY WHEN UPLOADING A FILE, REVIEW THE UPLOADS API".
Read on `feat/edit-profile-app` `d50f0ba`; measured on this machine against the dev Neon branch.

## Method

- **Round trip** this machine -> Neon (ap-southeast-2): `select 1` median **301 ms**. An empty interactive transaction
  (set_config + one statement) **1,801 ms** = 6 round trips. Cloud Run (australia-southeast1) -> Neon (Sydney) is a
  few ms, so production pays the same *count* at a much smaller price: local is "the count x 300 ms".
- **Statements per entry**: the real handlers in-process (testApp, query events) on the dev copy; rows restored after.
- **Production timings**: not read -- `gcloud` needs a re-login (Cloud Logging refused the token). To do once it is back.

## Measured (local, dev copy)

| Entry | Statements in the handler | + rate limiter | Local total |
|---|---|---|---|
| `GET /v1/worker/profile` | 6 | 2 | 2.4-3.6 s |
| `PUT /v1/worker/profile/bio` | 10 | 2 | 4.3 s |
| `PUT /v1/worker/services` (6 rows, unchanged) | 18 | 2 | 6.7 s (13.5 s with a removal, through the app) |
| `PUT .../services/nursing-services/registration` | 12 | 2 | 4.2 s |
| `POST /v1/worker/photos` (confirm), from the code | 2 before + ~16 in the transaction | 2 | ~6 s + 2 storage calls |

## Where the round trips go (every write)

`BEGIN` · `SET TRANSACTION ISOLATION LEVEL READ COMMITTED` · `set_config(statement_timeout)` · the ownership lookup ·
**the work** · the completion re-read (the whole profile, 9 relations joined) · the catalogue · `persistCompletion`'s own
re-read of three columns the re-read already has · the audit insert · `COMMIT`. Nine fixed round trips around the work.

## Findings

| # | Sev | Finding | Where | Saves |
|---|---|---|---|---|
| P1 | High | **The rate limiter runs one statement per rule, in sequence**: two round trips before every handler (user, then IP). One multi-row `INSERT ... ON CONFLICT ... RETURNING` decides both. (A denied user rule then also counts the IP hit -- harmless.) | `platform/pipeline/pipeline.ts` `enforceLimits`; `platform/rate-limit/rate-limiter.ts` | 1 per request, every entry of every area |
| P2 | High | **`SET TRANSACTION ISOLATION LEVEL READ COMMITTED` on every transaction** although it is the database default (checked: `default_transaction_isolation = read committed`). | `platform/persistence/db.ts` (`unitOfWork`, `readTransaction`) | 1 per transaction |
| P3 | High | **The catalogue is re-read on every profile read and every write that recomputes completion.** It changes only when an admin edits services; `selectCatalogueFor` already selects in memory. A process cache (60 s, refreshed lazily) removes the statement. | `persistence/profile-read.ts` `readProfileRowsTx` | 1 per read and per write |
| P4 | Med | **`persistCompletion` re-reads `setupProgress`, `profileCompleted`, `verificationStatus`** that the completion re-read just returned in the same transaction. | `domain/persist-completion.ts`; `application/replace-section.ts` | 1 per write |
| P5 | Med | **`set_config` and the ownership lookup are two statements**; one tagged-template statement does both (`SELECT set_config(...), id, "userId" FROM worker_profiles WHERE "userId" = $2`). | `replace-section.ts`, `db.ts writeTransaction` | 1 per write |
| P6 | Med | **U3a `writeServices` updates every kept row (N+1)** even when nothing changed, then re-reads the list. Update only the changed rows (usually none); build the answer from the rows already read. | `application/sections/services.ts` | N + 1 per services save |
| P7 | Med | **Photo confirm, the upload's slow step**: `claimAsPhoto` reads the profile (only needed for a repeat), reads the upload row, then updates it twice (`claimPhoto` sets `claimedAt`, `attachPhoto` sets the owner). One `UPDATE ... SET "claimedAt", "claimedByWorkerProfileId" ... RETURNING url`, with the reads only on the rare repeat/refusal path. | `worker/application/photos.ts`, `registration/application/photo-claim.ts` | 3 per confirm |
| P8 | Low | **Photo confirm makes two storage calls**: `getMetadata` then a ranged read of 16 bytes. One ranged GET returns the bytes, the content type and the total size (`Content-Range`). | `registration/application/photo-confirm.ts`, `adapters/gcs-photo-store.ts` | 1 storage call per confirm (sign-up too) |
| P9 | Info | The ticket signs its POST policy through IAM `signBlob` (a network call per ticket) -- needed without a key file; leave. The app side is sound: shrink to 1,600 px / q 0.85 on the device, one ticket, a direct upload with progress, one confirm, a non-blocking reload. | | -- |
| P10 | Info | The service documents (U3b) still upload through the app's server action: the whole file (up to 50 MB) through the Next.js function to Blob, then the database. U3b moves them to the photo pattern (direct to a private bucket, ticket/confirm). | `apps/app/src/services/worker/serviceDocuments.service.ts` | the file never passes through a function |

Structure: sound. One contract entry -> one handler -> `replaceSection` (ownership, transaction, completion, audit) keeps
every write uniform, which is also why each fix above lands in one place and speeds up every entry at once.

## Expected effect (statements per request, limiter included)

| Entry | Now | After P1-P7 |
|---|---|---|
| profile read | 8 | 5 |
| bio (any single-section write) | 12 | 7 |
| services, unchanged | 20 | 8 |
| photo confirm | ~20 + 2 storage | ~12 + 1 storage |

Locally that is roughly 40-60% less time; in production the same share of a much smaller number.

## Not changed

- The statement timeout stays (the pooler refuses `options=-c statement_timeout`: tested; the direct host accepts it).
- The completion recompute stays inside the write's transaction (correctness of the stored flags).
