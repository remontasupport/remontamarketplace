# Personas -- the worker profile on `apps/api`

**Sources:** `../plans/story-generation-plan.md` (Q2 A: reuse by reference, add three worker variations); S1's,
the photo cycle's and the admin-search cycle's `personas.md` (archives `s1-worker-registration`, `signup-photo-gcs`,
`admin-search-api`, `inception/user-stories/`).

## Reused by reference

| Persona | From | What they do in this cycle |
|---|---|---|
| **P1 Worker** | S1: a support worker who signed up with a suburb, a photo and their services, and now has a dashboard | The main human user: edits every part of their profile, sets a home address and a service area, uploads documents, applies to jobs, finds their way by the sidebar |
| **P2 Administrator** | S1: Remonta staff who review workers, publish profiles and match workers to participants | Sees the home address and the masked bank account on a worker's page; reviews documents as today; finds a worker at the suburb they set themselves |
| **S1 `apps/app`** | S1: the Next.js application | Holds the worker's NextAuth session, mints the api token from it, renders the dashboard and the form definitions, keeps the on-device draft, calls the api through the contract client |
| **S4 `apps/api`** | Photo cycle: the NestJS service on Cloud Run in Sydney | Verifies every token, applies the own-profile rule, validates and stores every section, computes the completion status, issues upload tickets and confirms objects, enqueues and delivers the CRM notification, sheds load when busy |
| **S5 Operator** | Photo cycle: Remonta support, the person reading alerts (today the product owner) | Sets the n8n secret and the stages table, runs the staging checklist and the load test, promotes, merges the page and clean-up PRs, rolls back by promote |

## Added for this cycle

### P1 variations

**W1 -- "Filling in my profile."** A worker who signed up days ago and is working through Personal Info and the
sections for the first time, usually on a phone, sometimes on a train with no signal. Types a lot, gets interrupted,
comes back later and expects what they typed to still be there. Does not know what a BSB checksum is; wants the
form to say what is wrong next to the field. Finishes a section and expects the sidebar badge to move.

**W2 -- "Keeping it current."** An established worker who moved house, wants to work around a different suburb,
has a new photo, or must renew a police check. Expects "where I live" and "where I work" to be two different
things, and expects a changed service area to be what Remonta uses to find them from now on. Uploads a PDF from
their phone's files and expects to see it listed as submitted.

**W3 -- "Applying for work."** A worker on the dashboard who sees a job near them and applies, then expects the
office to know without a phone call. May tap "Apply" twice. Later withdraws from My Jobs.

## Persona to story map

| Persona | Stories |
|---|---|
| P1 Worker (W1) | US-WP-01, 02, 03, 04, 05, 06, 07, 12, 13, 14, 15, 16, 17, 18, 25 |
| P1 Worker (W2) | US-WP-02, 08, 09, 10, 16, 17, 19, 20 |
| P1 Worker (W3) | US-WP-22, 23, 24 |
| P2 Administrator | US-WP-11, 16, 21 |
| S1 `apps/app` | US-WP-06, 07, 25 |
| S4 `apps/api` | US-WP-26, 27, 28, 29, 30, 31 |
| S5 Operator | US-WP-30, 32, 33 |
