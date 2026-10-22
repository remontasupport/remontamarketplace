# U2 `tour-app`: frontend components (2026-10-21)

CLAUDE.md's three layers: presentational parts in `components/ui/tour/` (values in, callbacks out), the glue in
`features/onboarding-tour/`, the declaration next to the menu.

## Hierarchy

```
DashboardLayout (client; every role)
├── SimpleDashboardHeader  + prop onTakeTour?  -> HelpButton (only when the prop is given)
├── Sidebar                + data-tour on each item heading
├── main
│   └── (home) ProfileCompletionReminder  + data-tour="checklist"
└── OnboardingTour  (lazy: next/dynamic, ssr: false; mounted only when session.user.role is WORKER)
    ├── WelcomeCard   (state offered)
    └── TourSpotlight + StepCard  (state running)
```

## New files

| File | Layer | Holds |
|---|---|---|
| `features/navigation/tourSteps.ts` | declaration | `TOUR_STEPS`, `TOUR_WELCOME`, `TourTarget` (E1) |
| `features/onboarding-tour/machine.ts` | logic | the reducer (L1); pure, no React |
| `features/onboarding-tour/tourApi.ts` | glue | `readTourSeen(deadlineMs)`, `markTourSeen()` with the retry, `retryDelay()` (L2, L3) |
| `features/onboarding-tour/useOnboardingTour.ts` | glue | the reducer in React; L2 on the home; L4; the drawer calls; runs the save when the reducer asks |
| `features/onboarding-tour/OnboardingTour.tsx` | glue | picks the card for the state; finds and measures the target (L5); an error boundary that renders nothing |
| `components/ui/tour/WelcomeCard.tsx` | UI | Radix Dialog, centred over a dimmed page (Q2 A): title, text, Start the tour, Not now |
| `components/ui/tour/TourSpotlight.tsx` | UI | a fixed full-screen layer: dimming everywhere except the target's rectangle (+8 px padding, rounded), a navy ring around it; takes all clicks (TR-5) |
| `components/ui/tour/StepCard.tsx` | UI | the step's dialog: "Step n of 5", title, text, Back / Next or Finish, Skip tour. **Computer:** to the right of the target with an arrow at its middle, kept on screen; **phone:** fixed at the bottom of the screen, full width less 16 px margins, over the drawer (Q4 A) |
| `components/ui/tour/HelpButton.tsx` | UI | a round **?** icon button, `aria-label` and tooltip "Take the tour" (Q3 A), left of the phone number |

Styling: Tailwind, the brand navy `#0C1628` for the primary button and the ring (hover `#1a2740`), white cards with
the dashboard's radius and shadow.

## Changed files

| File | Change |
|---|---|
| `components/dashboard/DashboardLayout.tsx` | For WORKER only: mount `OnboardingTour` (lazy) with `openDrawer` / `closeDrawer` / `isImpersonating`, and pass `onTakeTour` to the header |
| `components/dashboard/SimpleDashboardHeader.tsx` | Optional `onTakeTour` prop; renders `HelpButton` when given |
| `components/dashboard/Sidebar.tsx` | `data-tour={item.id}` on each item's heading |
| `components/dashboard/ProfileCompletionReminder.tsx` | `data-tour="checklist"` on the checklist |
| `features/worker/api.ts` | `getTour(opts?: { signal })` and `putTourSeen()` on `WorkerApi` (U1's entries, through the existing `call`) |

## Interaction flows

1. **First visit:** home loads → read (≤ 3 s) → `unseen` → WelcomeCard → Start → steps 1..5 (the drawer opens and
   closes on a phone) → Finish → closed, save in the background.
2. **Not now:** WelcomeCard → Not now (or Esc) → closed, save. Not offered again on any device.
3. **Replay:** ? on the home → step 1 directly → ... → Finish → closed, no save. ? on a profile page → the home with
   `?tour=start` → the same.
4. **Admin impersonating:** no read, no card; ? replays; nothing saved.
5. **Api down:** no card; the dashboard as today; ? still replays (it needs no api).

## Tests (Code Generation)

- `machine.test.ts`: the table in L1, and the PBT-06 stateful property (P8).
- `tourSteps.test.ts`: every `target` is a `WORKER_MENU` id or `checklist`; five steps; non-empty texts (property, P8).
- `tourApi.test.ts`: R1-R5 with a fake client and fake timers; the `retryDelay` property (P8).
- `OnboardingTour.test.tsx`: offered only on the home for an unseen worker; never while impersonating (R6); replay via
  `?tour=start`; a missing target is skipped (TR-12).
- `SimpleDashboardHeader` / `DashboardLayout`: no help button and no tour for a non-worker role (TR-8).
