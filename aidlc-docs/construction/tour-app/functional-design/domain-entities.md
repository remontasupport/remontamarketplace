# U2 `tour-app`: domain entities (2026-10-21)

Answers: `construction/plans/tour-app-functional-design-plan.md` Q1-Q4 (all A; the step texts as drafted).

## E1 `TourStep` (the declaration, D11)

```ts
type TourTarget = (typeof WORKER_MENU)[number]["id"] | "checklist";
interface TourStep { id: string; target: TourTarget; title: string; text: string }
```

`TOUR_STEPS` in `features/navigation/tourSteps.ts`, next to `WORKER_MENU`. The texts are the approved drafts (Q1 A):

| # | id | target | title | text |
|---|---|---|---|---|
| 1 | `my-profile` | `edit-profile` | My Profile | Start here. Add your photo, a short bio, your experience and the details families look for. The percentage shows how much of your profile is complete. |
| 2 | `services` | `services` | Services | Choose the services you offer, finish each service's setup, and set your Service Area so clients near you can find you. |
| 3 | `compliance` | `compliance` | Compliance | Upload your mandatory checks and documents, such as your ID and police check, and complete the required trainings. Our team reviews each one. |
| 4 | `additional-credentials` | `additional-credentials` | Additional Credentials | Have extra qualifications or certificates? Add them here to stand out to families. |
| 5 | `progress` | `checklist` | Your progress | This checklist shows what is left to do. When everything is ticked, your profile is complete. You can take this tour again anytime with the ? button at the top. |

`TOUR_WELCOME`: title `Welcome to Remonta, {firstName}!` (`Welcome to Remonta!` when the first name is empty or the
profile is not loaded), text `Let's take a quick tour of how to complete your profile. It takes less than a minute.`,
buttons `Start the tour` and `Not now`.

## E2 `TourState` (the state machine, business-logic-model.md)

```ts
type TourMode = "first" | "replay";
type TourState =
  | { kind: "idle" }                                   // nothing shown
  | { kind: "offered" }                                // the welcome card
  | { kind: "running"; step: number; mode: TourMode }  // step 0..TOUR_STEPS.length-1
  | { kind: "closed" };                                // ended for this visit
```

## E3 `TourSeen` (what the app knows about U1's value)

`"unknown"` (reading, or the read failed or was late) · `"unseen"` (`seenAt: null`) · `"seen"` (a time). Only
`"unseen"` leads to the welcome card. It is held in component state for the visit; it is not put in the shared React
Query cache (the read is `no-store` and happens once per home visit).

## E4 Anchors (OI-4)

`data-tour="<WORKER_MENU id>"` on every menu item's heading element (the group `<button>` or the link `<a>`), rendered
from `item.id` in `Sidebar.tsx`; `data-tour="checklist"` on `ProfileCompletionReminder`'s `ul.completion-checklist`.
