# U2 `tour-app`: business logic model (2026-10-21)

## L1 The state machine (a pure reducer, `features/onboarding-tour/machine.ts`)

`reduce(state, event, ctx) -> { state, save: boolean }`, with `ctx = { steps: number, impersonating: boolean }`.
`save` asks the caller to run the save (L3) once.

| From | Event | To | save |
|---|---|---|---|
| `idle` | `UNSEEN` (the read said `seenAt: null`) | `offered` (not when `impersonating`: stays `idle`) | no |
| `idle` / `closed` | `REPLAY` (help button or `?tour=start`) | `running` step 0, mode `replay` | no |
| `offered` | `START` | `running` step 0, mode `first` | no |
| `offered` | `NOT_NOW` or `ESC` | `closed` | **yes** |
| `running` | `NEXT` (step < last) | same, step + 1 | no |
| `running` | `BACK` (step > 0) | same, step − 1 | no |
| `running` | `FINISH` (step = last) | `closed` | **yes** if mode `first` |
| `running` | `SKIP` or `ESC` | `closed` | **yes** if mode `first` |
| `closed` | `UNSEEN` | `closed` (never offered twice in a visit) | no |
| any | an event not listed | unchanged | no |

`save` is never true while `impersonating` (P2): a first run cannot start then (it needs `offered`), and a replay saves
nothing.

## L2 The read (P1, `features/onboarding-tour/tourApi.ts`)

1. Only on `/dashboard/worker`, only for WORKER, only when not impersonating, once per mount.
2. `workerApi.getTour({ signal })`, the signal aborting at `TOUR_READ_DEADLINE_MS = 3000`.
3. `ok` with `seenAt: null` → dispatch `UNSEEN`. Anything else (`ok` with a time, an outcome other than ok, an abort,
   a thrown error) → nothing. A result that arrives after the deadline is ignored.

## L3 The save (P1)

1. Called after the state is already `closed` (the card is gone first).
2. `workerApi.putTourSeen()`. `ok` → done.
3. `rateLimited` → wait `retryDelay(retryAfterSeconds)`; `unavailable` / `failed` with status ≥ 500 / a network error →
   wait 5 s; then **one** more call; its result is not acted on.
4. `unauthenticated`, `forbidden`, `failed` 4xx → no retry.
5. `retryDelay(s)`: `s` a finite number ≥ 0 → `min(s, 30)` seconds; otherwise 5 s. A pending retry is cancelled on
   unmount (sign-out, leaving the dashboard).

## L4 Starting and replaying

- **On the home:** `OnboardingTour` mounts with the page. If the address has `?tour=start`, it dispatches `REPLAY` and
  removes the parameter (`router.replace`, no new history entry); otherwise it runs L2.
- **Help button:** on the home it dispatches `REPLAY`; elsewhere it navigates to `/dashboard/worker?tour=start`.

## L5 Showing a step

1. Find the target: `document.querySelector('[data-tour="<target>"]')`.
2. **Phone** (`matchMedia('(max-width: 768px)')`, the sidebar's breakpoint in `dashboard.css`): steps whose target is
   a menu item open the drawer (`DashboardLayout`'s state) before measuring; the `checklist` step closes it. A replay
   or an ending closes the drawer if the tour opened it.
3. Scroll the target into view (`block: "nearest"`; instant under `prefers-reduced-motion`), then measure it
   (`getBoundingClientRect`); re-measure on resize, scroll and the drawer's transition end.
4. Draw the spotlight around the rectangle and place the card (frontend-components.md).
5. **Target missing** (a menu change, the checklist not rendered): the step is skipped in the direction of travel; if
   no step can be shown, the tour ends as `SKIP` would.
