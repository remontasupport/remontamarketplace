# User Stories Assessment -- sign-up photo on Google Cloud Storage

## Request Analysis
- **Original Request**: move the sign-up photo to a direct browser upload into a Google Cloud Storage bucket in
  Sydney, verify and process it on the api, stop accepting HEIC, correct the latency alert (requirements.md, approved
  2026-10-05)
- **User Impact**: Direct. The person signing up sees a progress indicator instead of a spinner, a new message when
  they pick a HEIC, and a faster upload; administrators see processed photos and, later, thumbnails
- **Complexity Level**: Medium. One feature, seven components, an asynchronous step, a cut-over
- **Stakeholders**: the product owner (the user), workers signing up on phones, Remonta administrators, the
  developers running the preview checklist

## Assessment Criteria Met
- [x] High Priority: **User Experience Changes** (the upload step's behaviour and messages change) and **Customer-Facing
  APIs** (two new public contract entries consumed by the form engine)
- [x] Medium Priority: **Integration Work** (a new managed service in the sign-up journey) with scope across
  multiple components and a preview checklist that is in effect user acceptance testing
- [x] Benefits: acceptance criteria become the preview checklist's photo items verbatim; the HEIC and
  failure paths get written down once; the system actor's stories (ticket, confirm, process, purge) make the
  asynchronous behaviour testable

## Decision
**Execute User Stories**: Yes
**Reasoning**: the change is user-facing on a phone-first journey, carries new failure and edge paths (HEIC,
expired ticket, missing object, processing failure, pre-switch uploads), and the previous S1 stories for the
photo step (US-REG-01's photo clause, US-ONB-01's photo rules) no longer describe the flow. Concise stories, one
file, S1's format.

## Expected Outcomes
- Stories for the worker (upload, progress, HEIC, failures), the administrator (processed photo, old photos), and
  the api as a system actor (ticket, confirm, process, purge, cut-over) with Given/When/Then criteria
- The preview checklist items of requirements §6 traceable to stories
- Property-based testing properties named per story where one applies, feeding PBT-01 at Functional Design
