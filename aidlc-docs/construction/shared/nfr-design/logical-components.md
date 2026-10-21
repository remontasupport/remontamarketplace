# onboarding-tour: logical components (2026-10-21)

No new infrastructure: no queue, cache, circuit breaker, secret, bucket, service or alert.

## Api (U1)

| Component | Role |
|---|---|
| `worker_profiles."tourSeenAt"` | The stored value (E1) |
| `getTour` / `putTourSeen` contract entries | Declared once in `worker.contract.ts`; the pipeline applies access, limits, body limit, audit |
| `sections/tour.ts` | `readTour`, `markTourSeen`; the impersonation refusal (BR-10) |
| `replaceSection` | The existing transaction + ownership + audit wrapper |

## App (U2, on `feat/account-app`)

| Component | Role |
|---|---|
| `tourSteps` declaration (next to `WORKER_MENU`) | The five steps: target id, title, text (D11) |
| Tour state hook | The state machine (P8); the read with its deadline and the save with its retry (P1); the impersonation rule (P2) |
| Tour overlay component | The dim layer, the highlight, the card (Radix); lazy-loaded on the worker home |
| Anchors | `data-tour` on the sidebar items and on the checklist (OI-4) |
| Drawer control | A way for the tour to open and close the mobile drawer owned by `DashboardLayout` (OI-5) |
| Help button | In `SimpleDashboardHeader`, rendered for WORKER only (OI-6) |

U2's Functional Design settles the last three (OI-4..OI-6) and the step texts (OI-7).
