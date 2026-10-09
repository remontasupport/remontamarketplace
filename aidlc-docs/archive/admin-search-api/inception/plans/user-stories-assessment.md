# User Stories Assessment -- admin worker search on `apps/api`

## Request Analysis
- **Original Request**: a new api backend for the admin dashboard's search endpoints, with the radius computed
  accurately on the new schema (requirements.md, approved 2026-10-08; execution plan approved 2026-10-08)
- **User Impact**: Direct for administrators. The suburb box keeps an id, "Within" needs a suburb, distances come
  from the suburb centroid, a count of unmapped workers appears with a way to list them, and api errors are shown
  as notices. Indirect for workers: whether an admin finds them now depends on their HOME row. None for clients or
  the public.
- **Complexity Level**: Complex. The api's first authenticated path, four endpoints migrated, a hand-built geo
  statement, a result-parity cut-over of a live screen.
- **Stakeholders**: the product owner (the user), Remonta administrators who match workers to participants, the
  developers running the staging checklist and the parity script; workers indirectly.

## Assessment Criteria Met
- [x] High Priority: **User Experience Changes** (the administrators' main screen changes behaviour) and
  **Security Enhancements affecting permissions** (the token mechanism decides who may call the api)
- [x] Medium Priority: **Integration Work** (the app becomes a client of the api for signed-in reads) with scope
  across four packages and a staging checklist that is in effect user acceptance testing
- [x] Benefits: acceptance criteria become the staging checklist and the parity script's cases verbatim; the
  failure paths (expired token, api down, 429, unknown suburb, unmapped workers) are written down once; the system
  actor's stories (verify a token, rank by distance, count the unplaced) make the api's behaviour testable; the
  radius semantics the user confirmed in chat ("returns all the workers that are covered to the selected distance")
  get a story with exact criteria

## Decision
**Execute User Stories**: Yes
**Reasoning**: the change is user-facing on the screen administrators use most, carries new failure and edge paths,
and introduces a permission mechanism whose behaviour (what a token allows, for how long, for whom) must be
agreed before design. Concise stories, one file, S1's format, as the two previous cycles did.

## Expected Outcomes
- Stories for the administrator (search by suburb and distance, any distance, unmapped workers, the other filters
  unchanged, errors and sign-in expiry, the user picker and the suspended list) and for the api as a system actor
  (token verification and rejection, the geo ranking, pagination, parity, logging and alerting), with
  Given/When/Then criteria
- Every FR of requirements section 3 traceable to a story; every staging checklist item of section 6 traceable
- Property-based testing properties named per story where one applies, feeding PBT-01 at Functional Design
