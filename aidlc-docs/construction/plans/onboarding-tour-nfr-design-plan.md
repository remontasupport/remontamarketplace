# onboarding-tour: NFR design plan, both units (2026-10-21)

Inputs: `inception/requirements/requirements.md` NFR-01..10 and §5 (NFR Requirements skipped: they are set there),
`construction/tour-seen-api/functional-design/` (approved 2026-10-21). Artifacts go to
`construction/shared/nfr-design/` (one document set for U1 and U2, as the execution plan says).

## Plan

- [x] 1. Resilience patterns: what the app does when the read or the save fails (NFR-01) -- Q1, Q2
- [x] 2. Security patterns: access, impersonation, input, abuse (NFR-03..05) -- Q3
- [x] 3. Scalability and performance: the release-day load, no extra request off the home (NFR-07) -- Q4
- [x] 4. Logical components: where the "seen" state lives in the app; the api pieces (no queue, cache or new infra)
- [x] 5. Resiliency testing scenarios (RESILIENCY-14, deferred here)
- [x] 6. The property tests to write (PBT-01, deferred here), U1 and U2
- [x] 7. Observability: the log lines; no new alert (SECURITY-14 N/A)
- [x] 8. Artifacts: `construction/shared/nfr-design/{nfr-design-patterns,logical-components}.md`

**Categories with no question, and why:**
- **Scalability mechanisms:** unchanged. The read is one lookup by a unique key, and the existing limits and Cloud Run
  scaling apply.
- **Caching:** decided (`no-store`, U1 Q5).
- **Logical infrastructure:** none needed (no queue, circuit breaker, cache or secret).
- **Data protection:** the value is not personal data beyond "this worker opened the tour".

## Questions

Fill in each `[Answer]:` with a letter, or X and your own words.

## Question 1
If saving "seen" fails (the api is down, too many requests), the tour still closes for the worker. Should the app try
the save again?

A) Once, a few seconds later, in the background (honouring `Retry-After` when the api sends it); if that fails too,
nothing more, and the card may come back on the next visit (recommended)

B) Never: one try only

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 2
How long should the dashboard home wait for the "seen" read before giving up on the card for this visit?

A) 3 seconds: a card that pops up later, while the worker is already clicking around, is more disruptive than no card
(recommended)

B) No limit: show the card whenever the answer arrives

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 3
An admin can sign in as a worker ("impersonation") to help them. During such a session:

A) No welcome card and nothing saved: the tour is the worker's own first visit, so an admin's look must not use it up.
The help button still works, so the admin can walk the worker through it (recommended)

B) Treat it like the worker's own visit (the card shows; Not now or Finish saves "seen" for the worker)

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 4
On release day every worker who opens the dashboard home makes one tiny read (one row by a unique key). Should we run
a load test before the promotion?

A) No dedicated load test: one indexed lookup per home visit, under the worker area's existing limits and the capacity
already proven for the profile read; the staging checks cover it (recommended)

B) Yes, a short load test on staging at the worker area's capacity target before the promotion

X) Other (please describe after [Answer]: tag below)

[Answer]: a
