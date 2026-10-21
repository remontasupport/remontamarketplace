# U2 `tour-app`: functional design plan (2026-10-21)

Unit (execution plan): the tour in `apps/app`, on `feat/onboarding-tour` from `feat/account-app`. Inputs: requirements
FR-TOUR-01..09, FR-REPLAY-01..03; U1's entries (`GET /v1/worker/tour`, `PUT /v1/worker/tour/seen`); NFR design P1-P8.

Read on `feat/account-app` for this plan:
- `components/dashboard/DashboardLayout.tsx` (client, **shared by every role**) owns the drawer state
  (`isMobileMenuOpen`) and already checks `isImpersonating(session)`; it renders `SimpleDashboardHeader` and `Sidebar`.
- `Sidebar.tsx` renders `WORKER_MENU`: groups as a `<button class="nav-dropdown-header">`, links as `<Link class="nav-item">`.
- `SimpleDashboardHeader.tsx`: burger (phone only), logo; on the right the phone number and Log Out.
- `ProfileCompletionReminder.tsx`: the checklist is `<ul class="completion-checklist">` on the home.
- `features/worker/api.ts` (`workerApi`, `ApiOutcome`: `rateLimited` carries `retryAfterSeconds`).

## Proposed design (no question needed; say so if you disagree)

- **OI-4 anchors:** `data-tour="<menu id>"` on each `WORKER_MENU` item's heading (rendered from the id, so a new menu
  item gets one for free) and `data-tour="checklist"` on the checklist.
- **OI-5 drawer:** the tour is mounted inside `DashboardLayout`, which owns the drawer, so it opens and closes it
  directly. Phone width = the width at which the burger shows.
- **OI-6 workers only:** `DashboardLayout` mounts the tour and passes the help button's action to the header **only
  when `session.user.role` is WORKER**; the tour's code is a lazy chunk, never loaded for other roles.
- **Replay from another page (F1 A):** the help button links to `/dashboard/worker?tour=start`; the home starts the tour
  and removes the parameter from the address.
- **Scrolling:** during a step the page does not scroll by itself except to bring the target into view.

## Plan

- [x] 1. Component tree and where each piece lives (glue in `features/onboarding-tour/`, presentational parts in
  `components/ui/tour/`, the step list next to `WORKER_MENU`)
- [x] 2. The state machine: states, events, the save rule (P8)
- [x] 3. The read with the 3 s deadline and the save with one retry (P1), the impersonation rule (P2)
- [x] 4. The welcome card and the step card: layout, position, focus, keyboard -- Q2, Q4
- [x] 5. The help button -- Q3
- [x] 6. Phone behaviour: the drawer, the card's position
- [x] 7. The step texts -- Q1
- [x] 8. Artifacts: `construction/tour-app/functional-design/{business-logic-model,business-rules,domain-entities,frontend-components}.md`

## Questions

Fill in each `[Answer]:` with a letter, or X and your own words.

## Question 1
These are the draft texts (D10). `{firstName}` is the worker's first name from the profile.

**Welcome card**
- Title: **Welcome to Remonta, {firstName}!**
- Text: Let's take a quick tour of how to complete your profile. It takes less than a minute.
- Buttons: **Start the tour** · **Not now**

**Step 1 of 5 · My Profile**
Start here. Add your photo, a short bio, your experience and the details families look for. The percentage shows how
much of your profile is complete.

**Step 2 of 5 · Services**
Choose the services you offer, finish each service's setup, and set your Service Area so clients near you can find
you.

**Step 3 of 5 · Compliance**
Upload your mandatory checks and documents, such as your ID and police check, and complete the required trainings.
Our team reviews each one.

**Step 4 of 5 · Additional Credentials**
Have extra qualifications or certificates? Add them here to stand out to families.

**Step 5 of 5 · Your progress** (the checklist)
This checklist shows what is left to do. When everything is ticked, your profile is complete. You can take this tour
again anytime with the **?** button at the top.

A) Use them as written

B) Use them with the changes I write below

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 2
What should the welcome card look like?

A) A card in the middle of the screen over the dimmed dashboard (recommended: clearly the first thing to see)

B) A small card in the bottom-right corner; the dashboard stays undimmed until Start

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 3
The help button in the header, to the left of the phone number:

A) A round **?** icon, with "Take the tour" shown on hover and read by screen readers (recommended: small, fits the
header on a phone)

B) A text button "Take the tour"

C) **?** and "Take the tour" on a computer, the **?** alone on a phone

X) Other (please describe after [Answer]: tag below)

[Answer]: a

## Question 4
Where the step card sits next to the highlighted item:

A) On a computer to the right of the sidebar item, with a small arrow pointing at it; on a phone at the bottom of the
screen, under the open menu (recommended)

B) Always at the bottom of the screen, on a computer too

X) Other (please describe after [Answer]: tag below)

[Answer]: a
