# U2 `tour-app`: construction notes (2026-10-21)

Plan: `construction/plans/tour-app-code-generation-plan.md` (approved 2026-10-21). Branch `feat/onboarding-tour` from
`feat/account-app` `dda4f61` (with `main` `f00a3cb` merged in), worktree `../remonta-pr57`.

## Commits (pushed, `ffad332`; 20 files, +1,184 −7)

| Commit | Layer |
|---|---|
| `7a3791e` | `workerApi.getTour` / `putTourSeen` + `tour.api.test.ts` (5) |
| `48e7852` | `tourSteps.ts` (the approved texts) + tests (6); `machine.ts` + tests (8, the stateful property); `tourApi.ts` + tests (12: R1-R5, cancel, the retry-delay property); `rules.ts` + tests (11: TR-1, TR-8, TR-9, TR-12, R6, the placement property) |
| `947887b` | `components/ui/tour/`: `WelcomeCard`, `TourSpotlight`, `StepCard`, `HelpButton` |
| `ffad332` | `useOnboardingTour.ts`, `OnboardingTour.tsx` (with the silent error boundary); `DashboardLayout` (WORKER only, `next/dynamic`, `ssr: false`), `SimpleDashboardHeader` (`onTakeTour`), `Sidebar` and `ProfileCompletionReminder` (`data-tour` anchors) |

## Found and fixed while generating

- **The placement property found two off-screen cases** (a target scrolled below the screen pushed the card 1 px past
  the bottom; a target off the left edge put the side card at −1 px): every placement is now clamped to the screen.
- **React's development double effects** would have dropped the read's answer with a "started once" guard; the start
  effect is now safe to run twice (a second REPLAY while running changes nothing; a stale read is ignored).
- **The save is keyed on the transition** (a sequence number), not on the `save` flag's value.

## Deviations from the design

1. Component tests replaced by pure-function tests (the plan's stated decision; the app has no DOM test setup).
2. The tour cards use `@radix-ui/react-dialog` directly, not `components/ui/dialog.tsx`: that wrapper is at z-index 50
   with its own close button; the tour must sit above the drawer (1000) and Esc already ends it.
3. Leaving the home mid-tour (the browser's back button; clicks are blocked otherwise) unmounts the tour without a
   save: the card may be offered again next visit. Within NFR-01 (no harm), recorded here.

## Gates (in `../remonta-pr57`, after a local `db:generate`, not committed)

`@remonta/app` quality: exit 0, 73 type / 289 lint findings all known (none new), 286 passed / 12 skipped (244 before
+ 42). `turbo run build --filter=@remonta/app`: compiled.

## Step 12: the preview checklist (requirements §6.4), for the user

On the branch preview (`remonta-app-git-feat-onboarding-tour-...vercel.app`, against staging), signed in as the staging
worker `cmm7aoivq002sjo04iwn6d8km` (its `tourSeenAt` reset to null on 2026-10-21):

1. The dashboard home shows the welcome card with the worker's first name; the dashboard is dimmed behind it.
2. Start → step 1 of 5 highlights My Profile, the card to its right; Next → Services → Compliance → Additional
   Credentials → Your progress (the checklist); Back works; Finish closes.
3. Reload: no card (saved). [Then Claude resets the worker for 4.]
4. Not now (and, after a reset, Esc; Skip tour mid-way): each closes and the card does not come back after a reload.
5. The ? in the header (left of the phone number): on the home it starts at step 1 with no card; on a profile page it
   goes to the home and starts there. A replay saves nothing.
6. A phone width (≤ 768 px, the browser's device mode): steps 1-4 open the menu drawer and highlight inside it; step 5
   closes it; the card sits at the bottom of the screen.
7. Keyboard only: Tab stays inside the card; Esc ends the tour; focus returns afterwards.
8. A client or a coordinator account: no ? in the header, no card.
9. An admin impersonating the worker: no card; the ? still replays.
10. With the api blocked (DevTools → Network → block the staging api's domain), the home loads and works, no card.

Then the user's go to merge `feat/onboarding-tour` into `feat/account-app`.

## Preview checks and the merge (2026-10-21)

- **Run by the user on the `ffad332` preview** (`remonta-drrvbdypu-remontas-projects.vercel.app`, staging): checks
  1-4 (the card, the five steps, the saves), 5 (replay with ?), 6-7 (phone width, keyboard) -- working.
- **Not yet run:** 8 (no ? for a client or coordinator), 9 (an impersonating admin), 10 (the api blocked). Carried to
  `feat/account-app`'s preview checklist.
- **Merged:** `feat/onboarding-tour` fast-forwarded into `feat/account-app` at the user's word: `feat/account-app` =
  `ffad332`, pushed. `../remonta-pr57` back on `feat/account-app`.
