# Admin completion filters (cycle closed 2026-11-09)

**Goal (user, 2026-11-09):** a filter on the admin dashboard for who has completed their profile, and who is missing
compliance documents, trainings or services. Decisions: Complete / Incomplete per checklist item, combinable; the
worker's own dashboard checklist as the rule (the stored `legacy` flags); small badges on the cards. Revised during
U2: one multi-choice dropdown instead of four ("Do not seperate them"), and "Account Details" reads "Profile Creation"
on the admin side.

## What shipped (live)

| PR / action | Content |
|---|---|
| #154 `fc194e8` | U1 `completion-filters-api`: `GET /v1/admin/workers` takes `accountDetails`, `compliance`, `trainings`, `services` = `complete` / `incomplete` (ANDed, on `worker_profiles."setupProgress"`) and `withCompletion` (the row's `completion` flags); `appliedFilters` echo; `openapi.json` |
| #156 `ca84c22` | U2 `completion-filters-app`: one "Profile completion" dropdown (Complete / Incomplete per item, chips, in the URL); card badges (amber "<item> ✗" or green "Profile complete"); the four flags as extra columns in the Contractors CSV |
| #155 (outside the goal) | "Download results (N)" on the three admin lists (it always read every page of the current search); the freshness line and Refresh removed |

Production at the close: api `remonta-api-00029-xw2` = `fc194e8f353176e2cefe64de67b5f7d3ada41f4e` (dispatch
42547053046, 2026-11-09 01:43Z); app and web `main` `972ff6b`. Verified live by the user ("all works!").

**Where the status lives:** `worker_profiles."setupProgress"` (JSON: the four flags) and `"profileCompleted"`
(boolean), written by `persistCompletion` on each worker save and by the api's `completion-sync` job (5 min for
changed documents, a full pass daily).

## Deviations

See `construction/build-and-test/build-and-test-summary.md`.

## Layout

`inception/` (requirements, execution plan), `construction/build-and-test/`, `aidlc-state-at-close.md`. The audit
trail stays in `aidlc-docs/audit.md`.
