# Admin completion filters -- requirements (2026-11-09)

## Request (user, verbatim)
"In the current schema of the workers dashboard. I want to have a filter in admin dashboard that says who has completed
their profile, who has lacking documents in the compliance,who didnt completed their trainings documents, as well as the
Services, is that possible?"

## Answers (2026-11-09)
| Q | Answer |
|---|---|
| Filter shape | Four Complete / Incomplete dropdowns (Any / Complete / Incomplete), combinable |
| Rules | Match what the worker sees |
| Result cards | Small badges showing the unfinished sections |

## What exists (inventory, `main` `2f8dcf1`)
- The worker's dashboard checklist (`ProfileCompletionReminder.tsx`) shows four items -- **Account Details, Compliance,
  Trainings, My Services** -- from the profile read's `completion` = `completionOf` (`apps/api/.../domain/completion.ts`,
  rules R3.1-R3.7).
- The same four flags are **stored** in `worker_profiles."setupProgress"` (JSON) with `"profileCompleted"`, by
  `persistCompletion` in every worker save and by the `completion-sync` job (documents changed, reviewed or expired: every
  5 min; every worker: daily after 03:00 Sydney). Production `COMPLETION_MODEL=legacy` = exactly `completionOf`.
  **So the stored flags are what the worker sees** (lag at most ~5 min). C2 (the `groups` model) is not needed and is
  not part of this cycle: switching it would make the stored flags differ from today's worker checklist.
- The admin search's filters are one registry (`apps/api/src/modules/admin/application/filters.ts`); rows are shaped in
  `search-workers.ts`; the app parses rows strictly, so a new row key is opt-in (the `withActivation` precedent).

## Functional requirements
| Id | Requirement |
|---|---|
| FR-1 | `GET /v1/admin/workers` takes `accountDetails`, `compliance`, `trainings`, `services`, each `complete` or `incomplete`; absent = both. They AND with each other and every other filter. |
| FR-2 | `complete` = the stored flag is JSON `true`; `incomplete` = anything else (false, missing key, NULL `setupProgress`), as `parseStoredFlags` reads it. |
| FR-3 | With `withCompletion=true` each row carries `completion: { accountDetails, compliance, trainings, services }` (booleans, FR-2's reading). Opt-in, as `withActivation`. |
| FR-4 | The admin Contractors search shows four dropdowns labelled as the worker's checklist (Account Details, Compliance, Trainings, My Services): Any / Complete / Incomplete; kept in the URL like the other filters; page 1 on change. |
| FR-5 | Each result card shows a small badge per unfinished section (e.g. "Compliance ✗"); the wording for a fully complete worker is decided in U2's design. |
| FR-6 | The CSV download of the Contractors tab carries the four flags (reuses `features/admin-export`). |
| FR-7 | `docs/admin/README.md` and `openapi.json` describe the parameters and the row key in the same PR. |

## Non-functional
- No migration; no new table; no index (about 1,800 workers; the JSON conditions run on the already-filtered set).
- Security baseline unchanged: admin-only entry, existing rate limit and audit; no new data class leaves the api
  (the flags are already on the admin contractor page).
- PBT: the FR-2 reading as a property (any JSON value -> complete iff `=== true`), consistent with `parseStoredFlags`.
- Release order: the api (U1) is promoted before the app (U2) merges (follow-up 32's lesson).
