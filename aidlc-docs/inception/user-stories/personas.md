# Personas -- admin worker search on `apps/api`

**Sources:** `../plans/story-generation-plan.md` (Q2 A: reuse by reference, add two administrator variations and
the operator); S1's and the photo cycle's `personas.md` (archives `s1-worker-registration` and `signup-photo-gcs`,
`inception/user-stories/`).

## Reused by reference

| Persona | From | What they do in this cycle |
|---|---|---|
| **P2 Administrator** | S1: Remonta staff who review workers, publish profiles and match workers to participants | The only human user of this cycle: searches workers by suburb and distance and by every other filter; opens the impersonation picker and the suspended list |
| **S1 `apps/app`** | S1: the Next.js application | Holds the admin's NextAuth session, mints the api token from it, renders the admin screens, calls the api through the contract client |
| **S4 `apps/api`** | Photo cycle: the NestJS service on Cloud Run in Sydney | Verifies every token, applies roles and limits, resolves the suburb, ranks workers by distance in the database, counts the unmapped, logs who asked |

## Added for this cycle

### P2 variations

**V1 -- "Matching a participant."** An administrator with a participant's suburb in mind (often from a service
request) who needs the nearest suitable workers. Picks the suburb from the list, chooses 10 or 20 km, scans the
results nearest first, and wants the distance beside each name. Expects "any distance" to mean exactly that.
Trusts the number only if it is honest about what it measures (the suburb centre, not the front door).

**V2 -- "Tidying the list."** An administrator cleaning up data: wants to know how many active workers have no
mapped suburb (so they never appear in a distance search), list them, open each one and fix the suburb, and see
the count fall. Uses the suspended list and the impersonation picker for the same housekeeping.

### S5 -- Operator (Remonta support, the person reading alerts)

| | |
|---|---|
| **Who** | Whoever receives `support@remontaservices.com.au`: today the product owner |
| **Does** | Sets the token secret in Secret Manager and Vercel before a promotion; promotes the api image after the staging checklist; merges the page PR; reads the auth-failure alert; rolls back by promote |
| **Never** | Edits the generated YAML; promotes an image that did not pass the staging checklist; puts the secret anywhere but the two secret stores |

## Persona to story map

| Persona | Stories |
|---|---|
| P2 Administrator (V1) | US-AS-01, 02, 03, 04, 06, 07, 08, 09, 11 |
| P2 Administrator (V2) | US-AS-05, 13 |
| P2 Administrator (impersonating) | US-AS-10 |
| S4 `apps/api` | US-AS-14, 15, 16, 17 |
| S1 `apps/app` | US-AS-08, 09, 10, 11 (the minting and adapter side) |
| S5 Operator | US-AS-18 |
