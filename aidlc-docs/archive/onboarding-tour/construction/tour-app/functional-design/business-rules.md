# U2 `tour-app`: business rules (2026-10-21)

| ID | Rule | From |
|---|---|---|
| TR-1 | The welcome card is offered only on `/dashboard/worker`, only to a WORKER, never while impersonating, only when the read answered `seenAt: null` within 3 s, at most once per visit | FR-TOUR-01, D2, P1, P2 |
| TR-2 | Not now, Esc on the welcome card, Skip tour, Esc during a step and Finish end the tour; on a first run each requests exactly one save; a replay never saves | FR-TOUR-02, -05, D3, D7, FR-REPLAY-03 |
| TR-3 | Five steps in `TOUR_STEPS` order; Back hidden on step 1; Next on steps 1-4; Finish on step 5; "Step n of 5" on every card | D4, D6, FR-TOUR-04 |
| TR-4 | A step highlights the heading only: the tour does not open or close a sidebar group or change the page | D5 |
| TR-5 | While a card is shown, clicks outside it do nothing (the overlay takes them); the highlighted item is not clickable through the overlay | FR-TOUR-08 |
| TR-6 | On a phone (≤ 768 px) the drawer opens for steps 1-4 and closes for step 5 and at the end; on a computer the drawer is never touched | D8, FR-TOUR-06 |
| TR-7 | The checklist is shown and unchanged; the tour only highlights it | D9, FR-TOUR-07 |
| TR-8 | The help button shows only to WORKER sessions, in every worker page's header; on a client, coordinator or admin dashboard it is not rendered and the tour's code is not loaded | FR-REPLAY-01, OI-6 |
| TR-9 | Replay from the home starts at step 1 without the welcome card; from another page it goes to the home first | FR-REPLAY-02, F1 A |
| TR-10 | No error is ever shown for the tour; a failure means no card (read) or a closed tour (save) | NFR-01, P1 |
| TR-11 | Texts are plain text from `TOUR_STEPS` / `TOUR_WELCOME`; the first name is inserted as text, never as HTML | FR-TOUR-09, SECURITY-09 |
| TR-12 | A step whose target is missing is skipped; if none can be shown, the tour ends as a skip | L5 |
| TR-13 | Accessibility: each card is a labelled dialog (`aria-labelledby` its title, `aria-describedby` its text); focus moves to its first button and is kept inside; focus returns to where it was at the end; Esc as TR-2; "Step n of 5" is in the dialog's label; the highlight is a ring plus the dimming, not colour alone; `prefers-reduced-motion` turns off the fade and smooth scroll | NFR-06 |
| TR-14 | The overlay sits above the drawer (`z-index` above 1000) and below nothing the worker needs during the tour | L5 |
