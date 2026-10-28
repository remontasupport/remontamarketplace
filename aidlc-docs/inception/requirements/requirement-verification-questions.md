# Requirements questions: worker search on worker_locations (2026-10-28)

Your request: "let's do this" (follow-up 1: move the client search and the public list to `worker_locations` +
PostGIS, then stop the dual write, then drop the legacy columns). The map is in `../search-locations-inventory.md`.

Fill in each `[Answer]:` with a letter (or X and your words). Answer in the file or in chat, whichever is easier.

---

## Question 1: Where should the two searches run?
A) On `apps/api`, as contract entries (`GET /v1/client/workers` with the bearer token, `GET /v1/public/workers`
   public), the way the admin search moved; the Next routes go
B) Stay as Next routes in `apps/app`, rewritten to query `worker_locations` with PostGIS
X) Other (please describe after [Answer]: tag below)

[Answer]:

## Question 2: How is the searched place given?
A) A locality id from the suburb autocomplete (both bars already use one); a free-text `location` (old links, the
   marketing area pages) is matched to a suburb on the server; no Google geocoding
B) Keep Google geocoding of the text, only change what the distance is measured against
X) Other (please describe after [Answer]: tag below)

[Answer]:

## Question 3: Workers with no HOME location (69 active)
A location search on `worker_locations` alone leaves them out; today they appear if their old columns have coordinates.
A) Leave them out of location searches (they still appear in searches without a place); fixing them is follow-up 17
B) Fall back to the old coordinates for them until follow-up 17 places them
X) Other (please describe after [Answer]: tag below)

[Answer]:

## Question 4: The worker's own travel radius
Each HOME row has `travelRadiusKm` (default 50). Today only the searcher's radius ("within") counts.
A) Searcher's radius only, as today
B) Also require the searched suburb within the worker's own travel radius
X) Other (please describe after [Answer]: tag below)

[Answer]:

## Question 5: How far this cycle goes
The old columns are also read for display (profile preview, the worker's profile, completion) and by the reconciler,
which places unplaced workers from the old city/state/postcode.
A) This cycle: the two searches only. Stopping the dual write and dropping columns become a later cycle, after the
   new searches have run in production for a while
B) The searches, then stop writing and drop `latitude`/`longitude` only (nothing else measures distance with them);
   keep `location/city/state/postalCode` for display and the reconciler
C) Everything: the searches, every display reader moved to the HOME locality, the reconciler reworked, all six
   columns dropped
X) Other (please describe after [Answer]: tag below)

[Answer]:

## Question 6: What users see
A) No visible change: same cards, same order (nearest first), same filters
B) A plus "N km away" on the client dashboard's cards (the public cards already show it)
X) Other (please describe after [Answer]: tag below)

[Answer]:

## Question 7: The marketing `/api/contractors` search
It reads `contractor_profiles` in the jobs database (the Zoho sync), not worker profiles.
A) Out of scope for this cycle
B) In scope: decide its future here too
X) Other (please describe after [Answer]: tag below)

[Answer]:

## Question 8: Extensions (carried from the last two cycles)
Security Baseline (blocking), Resiliency Baseline (99.9 %, RTO ≤ 30 min, RPO ≤ 5 min), Property-Based Testing (full).
A) Keep all three as they are
B) Change (say which after [Answer]:)

[Answer]:
