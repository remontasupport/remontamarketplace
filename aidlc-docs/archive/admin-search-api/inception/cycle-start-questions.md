# Cycle Start Questions (2026-10-08)

No cycle is open. Please name the goal of this cycle by filling in the letter after the `[Answer]:` tag.
If none of the options match, choose the last option (Other) and describe the goal after the tag.

The options are the follow-ups left open in `aidlc-docs/aidlc-state.md` at the last close (2026-10-05).

## Question 1
What is the goal of this cycle?

A) **Search slice** (follow-up 1): move the worker-search readers (client search, public list, admin list, `lib/worker-search.ts`) from `worker_profiles.latitude/longitude` onto `worker_locations` + PostGIS; then stop the api's dual write of the legacy location columns; then a migration drops them.

B) **CRM notification for sign-ups** (follow-up 2): an outbox handler in `apps/api` that posts each new worker to n8n -> Zoho. Nothing has notified the CRM since the legacy route was removed on 2026-10-02; new workers are read from the admin list today.

C) **Credential rotation** (follow-up 5): rotate the production auth database role `neondb_owner`, the production Blob token, the Prisma Accelerate key and the `rehearse-w1` role password; then update Vercel, Secret Manager and the local env files.

D) **Dashboard photo uploads on the ticket/confirm pattern** (follow-up 13): apply the sign-up's direct-to-bucket upload (ticket, direct POST, confirm, outbox clean copy) to `/api/upload/worker-photo` and the shared `PhotoUpload` component, which still accept HEIC and go through the Next.js server.

E) **Housekeeping cycle**: the small follow-ups as one cycle of independent units -- re-record the Vercel rollback ids (3), the reCAPTCHA failure wording (4), repository visibility (6), the generated Prisma clients (7), stale exports and docs (8), the smaller items (9), the photo-era leftovers (12), and the two observations now due (10: no alert email on 2026-10-06; 11: a week of clean latency logs by 2026-10-12).

F) Other (please describe the goal after the [Answer]: tag below)

[Answer]: Let us create a new API backend for the admin dashboard, specifically the search API's. With the new schema and structure of the database, analyze how can we return accurate results especially on the radius
