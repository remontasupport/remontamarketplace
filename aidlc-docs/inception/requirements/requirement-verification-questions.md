# Requirements Verification Questions -- sign-up photo on Google Cloud Storage

Cycle started 2026-10-05 with "Go with Option A, start the AI-DLC cycle for it". Option A, as agreed in chat: new
sign-up photos go to a Google Cloud Storage bucket in Sydney; the browser uploads directly with a short-lived ticket
issued by `apps/api`; the api confirms and checks the object; a background step makes a clean copy and a thumbnail;
HEIC is no longer accepted; old photos stay in Vercel Blob; the latency alert policy is corrected.

Please answer each question by writing the letter after the `[Answer]:` tag. Choose the last option (Other) and
describe if nothing fits. Say "done" when finished. The facts behind the questions are in
`signup-photo-inventory.md` next to this file.

**Assumptions I will make unless you say otherwise:** the 5 MB limit and the 1600 px longest edge stay; tickets
expire after 10 minutes; unclaimed uploads are still purged after 24 h; the uploader's IP is still stored only as a
keyed hash; the rate limits stay (10/h per IP, 300/h global) and move to the ticket request; the person still sees the
upload start the moment they pick a photo, and the form still waits for it at submit.

## Question 1
Reverse Engineering. The inventory in `signup-photo-inventory.md` was written from this session's reading of the photo
path (browser, form engine, contract, api, database, infra, docs) and from the production and staging measurements.
Is that enough as the cycle's picture of the code?

A) **Yes** -- the targeted inventory is the reverse-engineering artifact; the S1 archive stays the reference for the
rest (the previous cycles' approach).

B) **No** -- run a full reverse-engineering pass over `apps/api`, `packages/api-contract`, `packages/form-engine` and
`infra/` first (they postdate the archived 2026-09-25 analysis).

C) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 2
Scope of the storage move. The dashboard also lets a worker replace their profile photo later
(`apps/app` `api/upload/worker-photo`, written to Vercel Blob by the app, not by the api). What is in this cycle?

A) **The sign-up photo only.** The dashboard keeps writing to Blob; a profile may hold a Google URL (set at sign-up)
or a Blob URL (replaced later). Both display, since every reader uses the URL as stored. Recommended: one path per
PR, rollback stays a promote.

B) **Sign-up and the dashboard replacement**, the latter moved onto `apps/api` as a second pair of contract entries
behind sign-in, so every new profile photo lands in the bucket. Larger: the dashboard route's callers, and
authentication on the api side.

C) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 3
HEIC. You do not want to accept HEIC. The `accept` list that invites it lives in the shared
`components/forms/fields/PhotoUpload.tsx`, which the dashboard screens also render. Where does the change apply?

A) **Everywhere the shared component is used**, in its own small PR (no browser can display a stored HEIC, so the
dashboard has the same problem today). The sign-up adds the byte-level detection and the specific message; the api
drops HEIC from the contract and the sniffer.

B) **The sign-up wizard only**: the wizard passes its own accept list and messages; the dashboard screens are left as
they are for a later cycle.

C) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 4
How the stored photos are served to the app (dashboard, admin list, public worker list).

A) **Public objects, read straight from Google** (`https://storage.googleapis.com/<bucket>/...`): the same model as
today's public Blob URLs; the host is added to `next/image`'s allowed list; nothing else in the app changes.
Recommended.

B) **Private bucket, short-lived signed read URLs** issued by the api: every screen that shows a photo must ask for a
URL first (many readers in `apps/app`); stronger privacy, much wider change.

C) **A custom domain in front of the bucket** (external load balancer + Cloud CDN): nicer URLs and edge caching, but
a load balancer costs about USD 18 a month and needs DNS and a certificate. Stored URLs would carry the custom host
from day one, so this must be decided now, not added later.

D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 5
Processing after the photo is claimed by a sign-up (runs in the background through the outbox).

A) **Full**: re-encode to JPEG, longest edge 1600 px, every metadata block removed (EXIF and GPS; the colour profile
only if needed for correct colours), plus a 256 px thumbnail; the profile points at the processed copy; the original
upload is deleted once the copies exist. Recommended.

B) **Full, but keep the original** in a non-public prefix for a fixed period (say 30 days) in case a re-process is
needed.

C) **Minimal**: strip metadata in place, no thumbnail, no resize beyond what the browser did.

D) **None** in this cycle: store what was uploaded, as today; processing is a later cycle.

E) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 6
The latency alert. Today's policy fires on one slow request. The correction (service-wide p95 with `ALIGN_DELTA` +
`REDUCE_PERCENTILE_95`, a request-count condition joined by AND, a duration of 2-3 windows, and a way to apply changes
to the live policy since `bootstrap.sh` only creates) is independent of the storage move.

A) **A unit of this cycle**, delivered first as its own small PR so the emails stop while the storage work proceeds.
Recommended.

B) **Outside the cycle**: a quick fix PR now, not tracked as a unit.

C) **Leave it**: the storage move will make the photo route fast enough; revisit if it keeps firing.

D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 7
Local development and CI. `apps/api`'s database tests run against a local PostGIS container, the same image CI uses.
The bucket adapter needs an equivalent, since neither a developer's machine nor the API Quality job has Google
credentials.

A) **A fake Cloud Storage server in a container** (`fake-gcs-server`), locally and in CI, like PostGIS: the adapter
and the ticket flow are tested against it; the `local` disk store is retired. Recommended.

B) **Keep the `local` disk store for development** and let the api itself accept the upload in that mode (a
development-only route the ticket points at); the bucket adapter is tested only on staging through the preview
checklist.

C) **A real development bucket** in the project, used with each developer's own `gcloud` login; CI tests the adapter
with a mocked client.

D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 8
Cut-over. Uploads staged on Blob in the 24 h before the switch may still be claimed or purged after it.

A) **Hard switch** at the promotion: new uploads go to the bucket; the purge job still deletes Blob keys for the old
rows (the row records which store holds it); the Blob token stays in the api's secrets for a few days, then is
removed from `stages.ts` and Secret Manager. Recommended.

B) **Both stores selectable by environment** for a while (`PHOTO_STORE=gcs` or `vercel-blob`), so a problem on the
bucket can be rolled back by an environment change and a redeploy instead of an image promotion.

C) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 9: Security Extensions
Should security extension rules be enforced for this project?

A) Yes -- enforce all SECURITY rules as blocking constraints (recommended for production-grade applications; every
cycle so far chose this)

B) No -- skip all SECURITY rules (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 10: Resiliency Extensions
Should the resiliency baseline be applied to this project?

**What this extension is.** Enabling it applies a set of directional, design-time best practices for building
resilient systems, derived from the AWS Well-Architected Framework (Reliability Pillar) and resilience-review guidance.
It steers requirements, design, and code toward fault tolerance, high availability, observability, and
recoverability -- covering 15 practice areas across business goals, change management, observability, high
availability, disaster recovery, and continuous improvement.

**What this extension is NOT.** Enabling it does not make your workload production-ready, nor does it certify or
guarantee any availability, RTO, or RPO target. It is a starting point that scaffolds good resiliency decisions
early -- it is not a substitute for a formal AWS Well-Architected Review of the built system.

A) Yes -- apply the resiliency baseline as directional best practices and design-time guidance (recommended for
business-critical workloads; every cycle so far chose this, with targets SLA 99.9 %, RTO <= 30 min, RPO <= 5 min)

B) No -- skip the resiliency baseline (suitable for PoCs, prototypes, and experimental projects)

X) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 11: Property-Based Testing Extension
Should property-based testing (PBT) rules be enforced for this project?

A) Yes -- enforce all PBT rules as blocking constraints (recommended for projects with business logic, data
transformations, serialization, or stateful components)

B) Partial -- enforce PBT rules only for pure functions and serialization round-trips (here: the ticket and key
derivation, the byte sniffer, the processing parameters)

C) No -- skip all PBT rules (the last cycle's choice)

X) Other (please describe after [Answer]: tag below)

[Answer]: 
