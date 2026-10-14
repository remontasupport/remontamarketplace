# User Stories Assessment -- the worker profile on `apps/api`

## Request Analysis
- **Original Request**: migrate every legacy api of the worker profile to `apps/api`, starting with Edit Profile;
  reorder the sidebar; the api to serve "10,000+ users at the same time"; maintainable; review the api structure
  first (requirements.md, approved 2026-10-09)
- **User Impact**: Direct for every worker (about 2,000 today): every page of their dashboard changes its data
  path, two pages are rebuilt on the form engine, a home address and a service-area editor appear, uploads change
  mechanism, the sidebar is reordered. Indirect for administrators (the home address on the worker page, the
  masked bank account, workers who place themselves), for clients (nothing visible; the search point is unchanged
  by design), and for the CRM (job applications and sign-ups arrive through the outbox).
- **Complexity Level**: Complex. The largest surface moved so far, personal and financial data behind ownership
  rules, a document-upload path, a per-page cut-over, a capacity claim to prove.
- **Stakeholders**: the product owner (the user), workers, administrators, the operator who promotes and reads
  alerts, the developers running the staging checklist and the load test.

## Assessment Criteria Met
- [x] High Priority: **User Experience Changes** (every worker dashboard page), **New User Features** (home
  address, service-area editor, self-placement), **Security Enhancements affecting permissions** (the worker's
  own-profile rule on the api, the masked bank account), **Multi-Persona** (worker, administrator, operator, the
  two system actors)
- [x] Medium Priority: **Integration Work** (the app becomes a client of the api for the worker; the outbox
  reaches n8n), **Data Changes** (two new columns; `documentUrl` meaning two stores), **Performance** (the
  capacity target is user-visible under load)
- [x] Benefits: the acceptance criteria become the staging checklist and the load-test acceptance verbatim; the
  failure paths (api down with a draft on the device, 503 with retry, an unknown suburb, an unplaced worker placing
  themselves, a document of a disallowed type) are written once; the system actor's stories make ownership,
  completion status and the outbox testable; the per-page cut-over gets an operator story per unit

## Decision
**Execute User Stories**: Yes
**Reasoning**: the change touches every screen a worker uses, adds two features and a permission rule, and must
be cut over page by page without a gap; stories give each page group an agreed definition of done before design
splits the work into units. Concise stories, one file, the previous cycles' format.

## Expected Outcomes
- Stories for the worker (edit each section and see it saved; the photo and documents; the home address and the
  service area; the dashboard, jobs and applications; the sidebar; errors and offline), for the administrator (the
  home address and the masked bank account; a self-placed worker found by the search), for the api as a system actor
  (ownership, section round-trips, completion status, uploads, the CRM handler, capacity under load), and for the
  operator (secrets, promotion, the load test, rollback, clean-up)
- Every FR of requirements section 3 traceable to a story; every verification item of section 6 traceable
- PBT properties named per story where one applies, feeding PBT-01 at Functional Design
