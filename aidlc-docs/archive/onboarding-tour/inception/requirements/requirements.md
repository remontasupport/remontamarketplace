# Onboarding tour: requirements (2026-10-21)

Sources: the user's request and answers (verbatim in `aidlc-docs/audit.md`, 2026-10-21),
`requirement-verification-questions.md` (Q1-Q13 and the three extensions), `requirement-clarification-questions.md`
(F1, F2), and `../inventory/onboarding-tour-inventory.md` (read on `feat/account-app` `4d62630`).

## 1. Intent analysis

| | |
|---|---|
| **User request** | "a quick tour for the app, for example if the worker is first time signed in to the account, the My profile will be highlighted, then user presses Next, then highlighted the Services, then user presses Next then highlighted the Compliance and so on. Basically just a tour how to complete the profile" |
| **Request type** | New feature |
| **Scope** | Multiple components: `apps/app` (the tour, the sidebar anchors, the header button), `packages/api-contract` + `apps/api` + `packages/db` (one "seen" flag on the account) |
| **Complexity** | Simple to moderate: one presentational component, one step declaration, one small api read/write and an expand-only migration |
| **Depth** | Standard |

## 2. Decisions

| # | Decision | From |
|---|---|---|
| D1 | "Seen" is kept **on the worker's account through `apps/api`**, so the tour shows once per worker on any device | Q1 A |
| D2 | **Every worker** sees it once, existing workers included, the next time they open the dashboard home after the release | Q2 A |
| D3 | It starts with a **welcome card** ("Take a quick tour?", Start / Not now). **Not now counts as seen**, and so do Skip tour and Finish | Q3 B |
| D4 | **Steps, in order:** My Profile → Services → Compliance → Additional Credentials → the profile completion checklist on the dashboard home | Q4 C |
| D5 | A step **highlights the sidebar heading** and shows a short card next to it (a title, one or two sentences). Groups are not opened, and the card has no "Go there" button | Q5 A |
| D6 | **Buttons:** Next, Back (not on the first step), Skip tour; the last step says Finish | Q6 A |
| D7 | **Replay:** a help button (?) in the dashboard header, **for workers only**. Pressed on any page, it goes to the dashboard home and runs the whole tour there. Replaying does not change "seen" | Q7 B, F1 A |
| D8 | **On a phone** the tour opens the menu drawer and highlights the items inside it; for the checklist step the drawer closes | Q8 A |
| D9 | **The tour comes first; the checklist stays** where it is, under the overlay | Q9 A |
| D10 | **Claude drafts the step texts**; the user reviews them before code generation | Q10 A |
| D11 | **Our own component** on what the app already has (Radix popover/dialog, Tailwind, the brand navy `#0C1628`); the steps are **data declared once** next to `WORKER_MENU`; no new dependency | Q11 A |
| D12 | **Released together with `feat/account-app`**: that release waits for the tour. The api part goes first, as its own PR from `main` -> staging -> promotion, then the app | Q12 B |
| D13 | **Only "seen" is recorded** (a timestamp), not finished/skipped or the step reached | Q13 A |
| D14 | Extensions: **Security** blocking, **Resiliency** with last cycle's targets plus the rule "the tour never gets in the way of the dashboard", **PBT** full | Security A, Resiliency A + F2 A, PBT A |

## 3. Functional requirements

### 3.1 The tour (FR-TOUR)

| ID | Requirement |
|---|---|
| FR-TOUR-01 | The welcome card appears on the **worker dashboard home** when the profile read says the tour has not been seen. It does not appear on other pages; a worker who first lands elsewhere sees it the next time the home loads (D2, D3) |
| FR-TOUR-02 | **Start** begins at step 1. **Not now** closes the card and saves "seen" (D3) |
| FR-TOUR-03 | The steps are one declaration (D11): each names its target (a `WORKER_MENU` id, or the checklist) and its title and text. A test fails if a step names a target that does not exist |
| FR-TOUR-04 | Each step dims the page except its target, scrolls the target into view, and shows the card beside it with "Step n of 5", Back, Next/Finish and Skip tour (D5, D6) |
| FR-TOUR-05 | **Skip tour**, **Finish**, Esc and closing the card all end the tour and save "seen" (D3) |
| FR-TOUR-06 | **Phone widths** (the drawer layout): steps 1-4 open the menu drawer and highlight inside it; step 5 closes the drawer and highlights the checklist (D8) |
| FR-TOUR-07 | The **checklist step** highlights `ProfileCompletionReminder`'s checklist on the home. The checklist is not hidden or changed by the tour (D4, D9) |
| FR-TOUR-08 | While the tour runs, the highlighted item cannot be clicked through by accident: clicks on the dimmed page are ignored. The worker leaves the tour only with its buttons or Esc |
| FR-TOUR-09 | The **step texts** are drafted by Claude, reviewed by the user, and kept in the declaration (D10). Plain text only |

### 3.2 Replay (FR-REPLAY)

| ID | Requirement |
|---|---|
| FR-REPLAY-01 | A **help button (?)** in the dashboard header, labelled for screen readers ("Take the tour"), shows **only for workers**. The header is shared with the client and coordinator dashboards, which must not show it (D7) |
| FR-REPLAY-02 | Pressed on the home: the tour starts at step 1 (no welcome card). Pressed on another page: the app goes to the dashboard home and starts the tour there (F1 A) |
| FR-REPLAY-03 | A replay does not write anything (D7) |

### 3.3 "Seen" on the account (FR-SEEN)

| ID | Requirement |
|---|---|
| FR-SEEN-01 | One nullable timestamp per worker ("tour seen at"), added by an **expand-only migration**; null for every existing worker, so all of them see the tour once (D1, D2, D13) |
| FR-SEEN-02 | The worker's app learns the value through the api (as part of the profile read, or a read of its own: OI-1), and saves it through **one contract entry** and one handler: the token's worker only, idempotent (a second save keeps the first time), audit row, rate limited (CLAUDE.md "Dynamic by default") |
| FR-SEEN-03 | `docs/worker/README.md` and `openapi.json` are updated in the api PR |

## 4. Non-functional requirements

| ID | Requirement | Rule |
|---|---|---|
| NFR-01 | **Never in the way of the dashboard.** If the profile read fails or does not carry the value, no card appears and the dashboard works as today. If the save fails, the tour still closes; it may appear again next time; nothing else is affected. No retry loop, no error notice for the tour | F2 A; RESILIENCY-10, SECURITY-15 |
| NFR-02 | **Backward compatible api.** The api is promoted before the app (D12) while production still runs today's app, whose contract client refuses response shapes it does not expect. The promotion must not change any response today's production app reads (OI-1). Proven on staging with today's production app build before the promotion | RESILIENCY-04 |
| NFR-03 | **Access.** The save is a worker entry: bearer token required, the token's own worker only, 401 without a token, 403 for a non-worker token; tested | SECURITY-08 |
| NFR-04 | **Input.** The save takes no body (or an empty strict one); the timestamp is the server's clock, never the client's | SECURITY-05 |
| NFR-05 | **Abuse.** A per-user rate limit on the save (design: the worker area's write limit); repeated saves change nothing (idempotent) | SECURITY-11 |
| NFR-06 | **Accessibility.** The card is a labelled dialog; focus moves to it and returns afterwards; Tab stays inside it; Esc ends the tour; the step count is announced; the highlight does not rely on colour alone; `prefers-reduced-motion` turns off the scroll and fade animations | -- |
| NFR-07 | **Performance.** No extra request on any page: the "seen" value travels with a read the dashboard already makes, or its own read only on the home (OI-1). The tour's code is loaded only on worker pages | RESILIENCY-05 |
| NFR-08 | **Data and rollback.** Expand-only migration, no column dropped; rollback of the api = the previous image (the column stays, unused); rollback of the app = Vercel promote | RESILIENCY-04, -12 |
| NFR-09 | **No new dependency** (D11) | SECURITY-10 |
| NFR-10 | **Gates.** Every quality gate green; baselines do not grow; `fast-check` properties (section 7); the api's database test of the save in CI's PostGIS | PBT-08, -09 |

## 5. Resiliency decisions carried forward

| Decision | Value | Applied to this cycle |
|---|---|---|
| Targets | SLA 99.9 % monthly for the api; RTO ≤ 30 min; RPO ≤ 5 min; single region (F2 A) | The tour is **non-critical**: its failure must not affect the dashboard (NFR-01) |
| Change management | Branch, PR, CI, preview checklist on staging, merge, promotion | Unchanged; the checklist gains the tour steps (section 6) |
| Rollback | Previous image (api), Vercel promote (app) | NFR-08 |
| Resiliency testing | Scenarios at NFR Design | The save failing (500, network); the read without the value; the api down while the home loads |

## 6. Verification protocol

1. **Gates:** app, api, api-contract, db quality; `turbo run build`; both Vercel previews.
2. **Staging, after the api PR merges:** the save answers 401 without a token, 200 for a worker (twice: the first time
   kept), 403 for an admin token; the audit row; **today's production app build against staging** still loads the
   dashboard and the profile pages (NFR-02).
3. **Production promotion of the api:** health 200; nothing changes for users.
4. **The `feat/account-app` preview** (staging api), the full CLAUDE.md checklist plus: a staging worker with no
   "seen" sees the card on the home; Start → five steps in order with Back/Next/Finish; Not now / Skip / Esc each save
   "seen" and the card does not come back after a reload or on another browser; the help button replays from the home
   and from a profile page (goes home first); a phone width opens and closes the drawer; a client or coordinator
   account shows no help button; the dashboard works with the api blocked (no card, no error).
5. **Production after the merge:** the same as 4 with an internal worker account; the rollback rows re-recorded in
   CLAUDE.md.

## 7. Extension compliance (Requirements stage)

### Security (blocking)

| Rule | Status | Note |
|---|---|---|
| SECURITY-01 encryption | Compliant | No new data store; one timestamp column in the existing database |
| SECURITY-02 intermediary logging | N/A | No intermediary |
| SECURITY-03 application logging | Compliant | The save is logged by the existing pipeline (request id, worker id); no personal data |
| SECURITY-04 security headers | N/A | No header change |
| SECURITY-05 input validation | Compliant | NFR-04 |
| SECURITY-06 least privilege | Compliant | No new secret or permission |
| SECURITY-07 network | N/A | No change |
| SECURITY-08 access control | Compliant | NFR-03; FR-REPLAY-01 (workers only) |
| SECURITY-09 hardening | Compliant | Step texts are static, rendered as text |
| SECURITY-10 supply chain | Compliant | NFR-09 |
| SECURITY-11 secure design | Compliant | NFR-05 |
| SECURITY-12 authentication | Compliant | The existing worker token path |
| SECURITY-13 integrity | Compliant | Audit row on the save; server time only |
| SECURITY-14 alerting | N/A | No new alert: a failed save has no user impact (NFR-01) |
| SECURITY-15 fail safe | Compliant | NFR-01 |

### Resiliency

| Rule | Status | Note |
|---|---|---|
| RESILIENCY-01 criticality | Compliant | The tour: non-critical; it depends on the profile read and one save |
| RESILIENCY-02, -03, -08, -15 | Compliant | Section 5 (carried forward) |
| RESILIENCY-04 deployment and rollback | Compliant | D12, NFR-02, NFR-08 |
| RESILIENCY-05..07 monitoring | Compliant | The existing api policies cover the new entry |
| RESILIENCY-09 scaling | Compliant | NFR-07: no extra request per page |
| RESILIENCY-10 isolation | Compliant | NFR-01 |
| RESILIENCY-11..13 DR | Compliant | NFR-08; a lost "seen" only shows the tour again |
| RESILIENCY-14 testing | At NFR Design | Section 5 last row |

### Property-based testing (full)

| Rule | Status | Note |
|---|---|---|
| PBT-01 property identification | At Functional Design | Candidates: the tour as a state machine (any sequence of Next/Back/Skip/Esc stays within steps 1..5, Finish only on the last, every ending saves once); every step's target resolves in `WORKER_MENU` or is the checklist (invariant); the save is idempotent (the first time kept under any number of repeats); a token for another worker never changes this worker's value |
| PBT-09 framework | Compliant | `fast-check` |
| PBT-02..08, -10 | At Code Generation | |

## 8. Out of scope

Tours for the client, coordinator or admin dashboards; tours inside the pages (the profile sections, the services or
compliance steps); recording finished/skipped or the step reached (D13); a "Go there" button (D5); opening the groups
(D5); any change to `ProfileCompletionReminder` or its congratulations pop-up; `apps/web`.

## 9. Open items for design

| # | Item |
|---|---|
| OI-1 | Where the value travels: a field in `GET /v1/worker/profile` (no extra request, but its response changes: today's production app must accept the new shape, NFR-02) or a small read of its own on the home (no change to the profile read, one more request on the home only). Includes checking how strictly the app's contract client parses the profile read today |
| OI-2 | Where the column lives: `worker_profiles` (the worker's data) or `users` (an account preference); its name |
| OI-3 | The save's path and method (e.g. `PUT /v1/worker/tour-seen`), its rate limit, and the audit action name |
| OI-4 | How the tour finds its targets: a `data-tour` attribute per sidebar item rendered from `WORKER_MENU` ids, and one on the checklist |
| OI-5 | How the tour opens and closes the mobile drawer: its state lives in `DashboardLayout`; the tour needs a way to drive it |
| OI-6 | How the header knows the viewer is a worker (the session role) without the client and coordinator dashboards loading the tour's code |
| OI-7 | The five step texts (D10), for the user's review |
