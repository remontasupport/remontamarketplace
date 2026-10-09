# Requirement Verification Questions: worker-profile-api (2026-10-09)

Please answer each question by filling in the letter after the `[Answer]:` tag. If none of the options match, choose
the last option (Other) and describe after the tag. The inventory these rest on is
`aidlc-docs/inception/requirements/worker-profile-inventory.md`; read its section 1 first: the dashboard's writes are
server actions, not HTTP routes, so the migration is larger than the route list suggests.

## Question 1
Two authenticated worker routes send per-user data with a public CDN cache header (`/api/worker/requirements`,
`/api/worker/other-requirements`), so the edge can serve one worker's documents list to another for 30-60 s. Should
this be fixed now, before the cycle, as a two-line hotfix PR?

A) Yes: a hotfix PR on `main` now (change the two headers to `private, no-store`), verified on the preview, merged
before the cycle's first unit.

B) No: fix it inside the cycle when those routes are replaced.

C) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 2
The archived reverse-engineering pass (2026-10-08) covers `apps/api`, the contract, the form engine and infra, and
this inventory maps the worker dashboard and its routes. Is that enough to proceed, or do you want a full
reverse-engineering pass over the worker dashboard code (`apps/app/src/{app/dashboard/worker, services/worker,
components/{dashboard,account-setup,profile-building,requirements-setup,services-setup}}`)?

A) The archive plus this inventory is enough; proceed to requirements.

B) Run a full reverse-engineering pass over the worker dashboard code first (the nine standard artifacts).

C) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 3
Which page is the "Edit Profile" the first unit builds?

A) Both pages as the first unit: **Personal Info** (`/account/setup`: name, photo, bio, address, personal info) and
**Edit profile** (`/profile-building`: experience, hours, the additional-details sections). This is "the profile"
as a worker sees it; one contract area, one set of entries, two pages switched.

B) **Personal Info** (`/account/setup`) first: the core identity fields, the photo and the address (the legacy
location write and the Blob photo go with it). `/profile-building` is the second unit.

C) **Edit profile** (`/profile-building`) first: the sidebar's own "Edit profile" link (experience, preferred hours,
the 11 additional-details sections, four tables). Personal Info is the second unit.

D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 4
Where does the worker profile's logic live after the migration?

A) In `apps/api` only: every read and write of the worker dashboard becomes a contract entry under a new `worker`
area (the token carries the worker's id; an entry never takes a user id); the server actions, the Prisma reads in
server components, and the Upstash caching in the app are deleted as each page moves. The app is a client of the
api, as the admin dashboard is.

B) In `apps/api` for writes only; the pages keep their server-side Prisma reads for now (faster first paint), moved
in a later cycle.

C) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 5
How should the edited pages be built in the app?

A) As form definitions on the form engine (`features/forms/definitions/`), one per section: validation from the
contract entry, the on-device draft, retries, server field errors mapped back. The hand-built `useState` pages are
replaced section by section. (The codebase rule: don't add hand-built forms.)

B) Keep the existing page components and only swap their data layer (React Query hooks calling the api client);
no form-engine conversion in this cycle.

C) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 6
What does "10,000+ users at the same time" mean as a target the design must meet and a test must prove?

A) 10,000 workers signed in and active over the same hour (in the order of tens of requests per second averaged,
a few hundred at a burst). Met by the present stateless shape with a raised instance ceiling, the pool and Neon's
pooler sized to it, one statement per page and private caching on reads; proven by a load test on staging at that
rate before promotion.

B) 10,000 requests in flight in the same second. A different order of capacity (about 125 instances at 80 each plus
a much larger database pooler); the design states the instance and pool numbers and a load test at that level is
the acceptance gate.

C) No numeric target in this cycle: apply the capacity practices (horizontal scaling, pooling, caching, one statement
per page) and record the measured ceiling from a staging load test for a later decision.

D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 7
By "worker servers" (your words, "not sure for the term"), which of these did you mean? Note: the api's instances are
already stateless and scale horizontally (rate limits, outbox claims and job leases live in Postgres); production
is capped at 4 instances x 80 requests today.

A) More instances of the same api serving requests in parallel (horizontal scaling): raise the production ceiling,
tune concurrency, pool and shedding, and prove it under load. (This is what the present design supports.)

B) A separate background-work service: move the outbox dispatcher and the scheduled jobs out of the request-serving
instances into their own Cloud Run service or job, so request capacity and background capacity scale independently.

C) Both A and B.

D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 8
The address edit today takes free text, geocodes it with Google and writes the legacy `worker_profiles` location
columns (the only dashboard writer of those columns), while the api owns `worker_locations` HOME rows placed by
locality id. After the migration, how does a worker set their address?

A) Pick a suburb from `au_localities` (the api's `GET /v1/localities`, as the sign-up does); the api places the HOME
row (`placeHome`) and dual-writes the legacy columns so the client search still works. No Google geocode. This also
lets the 69 unplaced workers fix themselves, and shares its code path with the admin set-suburb control
(follow-up 17), which can ride in this cycle as a small unit.

B) Keep free text and Google geocoding, written through the api, with the HOME row placed only when the text matches
one locality (the reconciler's rule).

C) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 9
Documents and photos are on Vercel Blob through app routes and actions (the sign-up photo alone uses the Cloud
Storage ticket/confirm pattern). In this cycle:

A) Profile photo and documents move to the ticket/confirm pattern on Cloud Storage through api entries (the sign-up's
code reused: ticket, direct POST, confirm, outbox clean copy); the Blob routes go when their last caller moves.

B) Uploads stay on Vercel Blob through the existing app routes for this cycle (out of scope, as decided for
follow-up 11); only the metadata writes (the `verification_requirements` rows) move to the api.

C) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 10
An admin impersonating a worker reaches the api with a token whose `act` claim names the admin. On the new worker
entries:

A) Writes are allowed under impersonation and every one is attributed (`impersonatorId` in the audit and logs), as
the admin does today without any record.

B) Reads only under impersonation; writes return 403 so an admin can look but not change a worker's profile.

C) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 11
The sidebar reorder. The current order is: Edit profile, Edit services, Dashboard, Personal Info, Mandatory,
Trainings, My Services, Additional Credentials, My Jobs, Account. The menu becomes one declaration (an array)
whatever the order. Which order?

A) Dashboard, Personal Info, Edit profile, My Services (with Edit services inside it), Mandatory, Trainings,
Additional Credentials, My Jobs, Account.

B) Dashboard, Edit profile, Edit services, Personal Info, Mandatory, Trainings, My Services, Additional Credentials,
My Jobs, Account (today's order with Dashboard moved to the top).

C) Other: write the exact order after the [Answer]: tag (and say whether Edit services folds into My Services).

[Answer]: 

## Question 12
Cut-over per page. The admin search moved as: the api entry merged and promoted first, the app switched in its own
PR against the live entry, the old route deleted in a third PR. For the worker pages:

A) The same: entry PR (api, promoted after the preview checklist), page PR (the app switches), clean-up PR (server
actions and routes deleted), one page or section group at a time. Rollback is a Vercel promote.

B) Page and entry in one PR behind a per-page switch (an environment variable), old code deleted later.

C) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 13
The routes shared with other callers (`/api/suburbs`, `/api/categories`, `/api/upload/worker-photo`, `/api/share/*`,
`/api/contractors*`, `/api/geocode`):

A) The worker pages stop using them (the api already serves localities and categories); the routes stay for the
client, coordinator, admin and `apps/web` callers and are out of this cycle's scope.

B) Move the shared routes' other callers too, so the routes can be deleted in this cycle.

C) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 14
The browser calls a hard-coded n8n webhook after a job application (`ApplyModal.tsx:13`), the only CRM notification
left. When job applications move to the api:

A) The api posts it from an outbox handler (the `SafeHttpClient` to an allow-listed n8n host, the URL a secret),
which also gives sign-ups the CRM notification that follow-up 2 asks for.

B) Leave the browser call as it is in this cycle.

C) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 15
Security Baseline extension (the last cycle: enabled, blocking)?

A) Enabled, blocking (the per-user data exposure, the unauthenticated upload and SMS routes, and the token-bound
ownership rule make this the natural setting).

B) Enabled, advisory.

C) Disabled.

D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 16
Resiliency Baseline extension (the last cycle: enabled, blocking; SLA 99.9 %, RTO <= 30 min, RPO <= 5 min, single
region)?

A) Enabled, blocking, the same targets.

B) Enabled, blocking, with a stated capacity target from Question 6 added to the targets.

C) Disabled.

D) Other (please describe after [Answer]: tag below)

[Answer]: 

## Question 17
Property-Based Testing extension (the last cycle: enabled, full)?

A) Enabled, full.

B) Enabled, light (the domain rules only).

C) Disabled.

D) Other (please describe after [Answer]: tag below)

[Answer]: 
