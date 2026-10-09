# Cycle Start Questions (2026-10-09)

No cycle is open. Please name the goal of this cycle by filling in the letter after the `[Answer]:` tag.
If none of the options match, choose the last option (Other) and describe the goal after the tag.

The options are the follow-ups left open in `aidlc-docs/aidlc-state.md` at the last close (2026-10-09, the
admin-search cycle). Option A is the one that close recommended.

## Question 1
What is the goal of this cycle?

A) **Unplaced workers** (follow-up 17, recommended at the last close): an admin set-suburb control -- a contract entry
and handler that writes a HOME row in `worker_locations` with `source = 'ADMIN'` plus the legacy `worker_profiles`
columns, and a suburb picker on the worker's admin page -- so the 69 active workers with no HOME row can be placed
without touching the database; plus city-name help in the suburb autocomplete (Hervey Bay, Gold Coast, Sunshine
Coast, Toowoomba have no locality row: offer their suburbs).

B) **Search slice, remainder** (follow-up 1): the client search and the public list still read
`worker_profiles.latitude/longitude`; move them to `worker_locations` + PostGIS, then stop the api's dual write of
the legacy location columns, then a migration drops them. (The admin list is done.)

C) **CRM notification for sign-ups** (follow-up 2): an outbox handler in `apps/api` that posts each new worker to
n8n -> Zoho. Nothing has notified the CRM since the legacy route was removed on 2026-10-02; new workers are read from
the admin list today.

D) **Credential rotation** (follow-up 4): the production auth database role, the production Blob token, the Prisma
Accelerate key and the `rehearse-w1` role password; then Vercel, Secret Manager and the local env files.

E) **Admin identity hardening** (follow-up 12): MFA for admin accounts (SECURITY-12), the identity slice.

F) **Housekeeping cycle**: the small follow-ups as one cycle of independent units -- the reCAPTCHA failure wording
(3), repository visibility (5), the generated Prisma clients (6), stale exports and docs (7), the smaller items (8),
the photo-era leftovers (10), the trailing-newline note in the rotation runbook (15), the experience sub-area options
(18), and the observations now due (9: the latency policy; the photo log review by 2026-10-12).

G) Other (please describe the goal after the [Answer]: tag below)

[Answer]: I want to migrate all the legacy api on the workers profile to the new api backend, and reorder the side bar navigation as well. Let us start with the Edit Profile. Along with this changes, I want the api also handles multiple requests at the same time. It can handle 10,000+ users at the same time, so I think we can use a worker servers for this (not sure for the term)
. The system should also be easy to maintain, as well as the code and file structure,  review first the current api structure