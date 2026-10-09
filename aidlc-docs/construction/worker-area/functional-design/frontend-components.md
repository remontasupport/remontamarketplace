# Frontend Components -- unit `worker-area` (U1)

U1 changes nothing in `apps/app` (PR 1 is api, infra and scripts). This note checks that the read's shape (E1)
covers what the sidebar and the dashboard need, so U2's PR 3 can switch them without a second entry.

| Consumer today | Reads | Covered by E1 |
|---|---|---|
| `Sidebar.tsx` avatar and name | `profileData.firstName`, `photos`, `role`/`displayRole` | `names.firstName`, `photos.main`, `displayRole` |
| `Sidebar.tsx` Edit Profile badge | the preview's 10-field percent | `completion.percent` (R3.10) |
| `Sidebar.tsx` checkmarks | `setupProgress` from the profile route | `completion.*` |
| `Sidebar.tsx` Mandatory and Trainings dropdowns | `useWorkerRequirements` → `requirements.baseCompliance`/`trainings` | `requirements.mandatory`/`trainings` (R4), each item with `id`, `name`, `status`, `documentType` |
| `Sidebar.tsx` My Services dropdown | `profile.services` | `services[]` |
| `dashboard/worker/page.tsx` hero, reminder | profile columns, completion flags, `role` | `names`, `completion`, `displayRole`, `serviceArea` (null → the "suburb not set" reminder, US-WP-10) |
| `ProfileCompletionReminder` | `setupProgress` | `completion` |
| `profile-preview` | `getProfilePreviewData` (all sections) | `sections.*`, `photos`, `bio`, `serviceArea` |

Gaps found: none for the sidebar and the home page. `documentsByService` (the old route's per-service url map) is
not in E1 by design: U3's `listDocuments` serves the services pages. The `jobs` slider and applications are U4's
entries.
