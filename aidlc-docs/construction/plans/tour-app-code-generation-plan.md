# U2 `tour-app`: code generation plan (2026-10-21)

**The single source of truth for U2's code generation.** Design: `construction/tour-app/functional-design/` (E1-E4,
L1-L5, TR-1..TR-14, the component table) and `construction/shared/nfr-design/` (P1, P2, P4, P7 R1-R6, P8 U2).
Requirements FR-TOUR-01..09, FR-REPLAY-01..03, NFR-01, NFR-06, NFR-07, NFR-09.

- **Branch:** `feat/onboarding-tour` from `feat/account-app` after `main` (`f00a3cb`, U1) is merged into it, in the
  worktree `../remonta-pr57`. Code only, all in `apps/app`.
- **Depends on:** U1's entries (on staging; in the contract on this branch).
- **Ships:** merged into `feat/account-app`, released with it (D12), after U1 is promoted to production.

## A decision this plan makes (say if you disagree)

The app's tests run in Node with no DOM (`apps/app/vitest.config.mts`: "Component testing is a separate decision").
The functional design listed two component tests (`OnboardingTour.test.tsx` and a header/layout test). **Instead of
adding jsdom and Testing Library, every rule those tests would check is put in a pure function and tested in Node**:
when the card is offered (TR-1, R6), which step is shown when a target is missing (TR-12), where the card goes
(Q4 A), and which roles get the tour and the help button (TR-8). The components themselves stay thin (values in,
callbacks out) and are checked by hand on the preview (Step 12). No new dependency (NFR-09).

## Steps

- [x] **Step 1 -- Branch.** `feat/account-app` with `main` merged (gates green there first), pushed; then
  `git checkout -b feat/onboarding-tour`.

- [ ] **Step 2 -- The api client** (`src/features/worker/api.ts`): `getTour(opts?: { signal })` and `putTourSeen()` on
  `WorkerApi`, through the existing `call` (token, one 401 retry, `ApiOutcome`). Test `src/features/worker/tour.api.test.ts`
  with a fake fetch: the paths and methods, a bearer token, `seenAt` passed through, 429 → `rateLimited` with
  `Retry-After`.

- [ ] **Step 3 -- The step declaration** (`src/features/navigation/tourSteps.ts`, E1): `TOUR_STEPS` (the approved texts),
  `TOUR_WELCOME`, `welcomeTitle(firstName)`, `TourTarget`. Test `tourSteps.test.ts`: five steps in order; **property**
  (P8): every target is a `WORKER_MENU` id or `checklist`; non-empty plain texts; the welcome title falls back without
  a name.

- [ ] **Step 4 -- The state machine** (`src/features/onboarding-tour/machine.ts`, L1): `reduce(state, event, ctx)`.
  Test `machine.test.ts`: every row of the L1 table; **stateful property** (PBT-06, P8): for any sequence of events the
  step stays in range, Back never below the first step, Finish only on the last, and saves = 1 for a first run that
  ended, 0 for a replay or while impersonating.

- [ ] **Step 5 -- The read and the save** (`src/features/onboarding-tour/tourApi.ts`, L2, L3): `readTourSeen(api,
  deadlineMs)` → `'unseen' | 'seen' | 'unknown'`; `markTourSeen(api, timers)` with one retry; `retryDelay(seconds)`.
  Test `tourApi.test.ts` with a fake api and fake timers: R1 (500, network error, a 3 s timeout → unknown), R2 (an
  answer after the deadline is dropped), R3, R4 (at most two calls), R5 (`Retry-After: 7` → 7 s), no retry on
  401/403/404; **property** (P8): `retryDelay` is within 0..30 s and 5 s for absent or malformed values.

- [ ] **Step 6 -- The rules as pure functions** (`src/features/onboarding-tour/rules.ts`): `tourEnabled(role)` (TR-8);
  `shouldRead({ pathname, impersonating })` (TR-1, P2); `nextShowable(from, direction, has)` (TR-12);
  `cardPlacement(target, viewport, phone)` (Q4 A: right of the item with the arrow at its middle, kept on screen; the
  bottom of the screen on a phone); `PHONE_QUERY = '(max-width: 768px)'`; `replayRequested(searchParams)`.
  Test `rules.test.ts`: each rule, R6 (no read while impersonating), and a **property** that the card is always
  inside the viewport.

- [ ] **Step 7 -- Presentational components** (`src/components/ui/tour/`): `WelcomeCard.tsx` (Radix Dialog, centred,
  dimmed; Q2 A), `TourSpotlight.tsx` (the fixed layer: dimming with the target's rectangle cut out, the navy ring,
  takes every click; z-index above the drawer's 1000), `StepCard.tsx` (a labelled dialog: "Step n of 5", title, text,
  Back / Next or Finish, Skip tour; focus kept inside and returned; Esc), `HelpButton.tsx` (a round ? with
  "Take the tour"; Q3 A). Values in, callbacks out; no fetching; `prefers-reduced-motion` respected.

- [ ] **Step 8 -- The glue** (`src/features/onboarding-tour/`): `useOnboardingTour.ts` (the reducer in React; the read
  on the home; `?tour=start`; the save in the background; the drawer calls; cancels a pending retry on unmount) and
  `OnboardingTour.tsx` (finds and measures the target, L5; renders the cards; an error boundary that renders nothing).

- [ ] **Step 9 -- The changed files:** `DashboardLayout.tsx` (for WORKER only: `next/dynamic` import of `OnboardingTour`
  with `ssr: false`, `openDrawer` / `closeDrawer`, the replay action to the header); `SimpleDashboardHeader.tsx`
  (optional `onTakeTour`, renders `HelpButton` left of the phone number); `Sidebar.tsx` (`data-tour={item.id}` on each
  heading); `ProfileCompletionReminder.tsx` (`data-tour="checklist"`).

- [ ] **Step 10 -- Gates** in `../remonta-pr57`: `pnpm --filter @remonta/app run quality` (type and lint baselines may
  not grow; the new files add no finding), `npx turbo run build`. Exit codes checked. Regenerated Prisma clients
  restored, not committed.

- [ ] **Step 11 -- Commit and push** `feat/onboarding-tour` (one commit per layer: client; logic and tests; components;
  wiring). Vercel builds a preview of the branch, pointed at staging.

- [ ] **Step 12 -- Preview checks** (requirements §6.4; the user, with Claude's list), on the branch preview with the
  staging worker reset to "not seen": the card on the home; Start → five steps with Back/Next/Finish; Not now / Skip /
  Esc each save (the card does not return after a reload or on another browser); ? replays from the home and from a
  profile page; a phone width opens and closes the drawer; a client or coordinator account has no ? and no tour;
  keyboard only (Tab, Esc); with the api URL blocked the dashboard works and no card shows. Then
  `feat/onboarding-tour` is merged into `feat/account-app` (the user's go) and the construction notes are written.

## Story traceability
FR-TOUR-01 (Steps 6, 8) · FR-TOUR-02/05 (Steps 4, 5) · FR-TOUR-03 (Step 3) · FR-TOUR-04 (Steps 7, 8) · FR-TOUR-06
(Steps 6, 8) · FR-TOUR-07 (Step 9) · FR-TOUR-08 (Step 7) · FR-TOUR-09 (Step 3) · FR-REPLAY-01..03 (Steps 4, 6, 9) ·
NFR-01 (Steps 5, 8) · NFR-06 (Step 7) · NFR-07 (Step 9) · NFR-09 (all).
