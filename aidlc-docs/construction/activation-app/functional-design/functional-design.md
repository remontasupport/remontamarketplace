# U2 `activation-app`: functional design (2026-10-23)

Inputs: requirements FR-3..FR-10 (approved), U1 live (`746a60d`, prod revision `remonta-api-00017-4bz`), NFR design
N1-N7. **U2 is the release moment**: from its merge, clients and the public see only activated workers, and today
none is (FR-3, R-1). Answers (chat, 2026-10-23): note = "Short line, home page"; card switch = no confirm; Suspend =
confirm first; Status filter = tabs above the results.

## What changes, per screen

| Id | Where | Change |
|---|---|---|
| A1 | Admin search card (`app/admin/AdminDashboardClient.tsx`) | The **Active** switch reads the row's `activated` and calls `adminApi.setWorkerActivation(id, { activated })` (no confirm). The card is greyed when not activated, as today. The card shows the write's answer at once and the list is then reloaded past both caches (the existing `reloadRef` + `cache: 'reload'`, which sends `Cache-Control: no-cache`: N4). A failure shows the api's notice and leaves the switch as it was. |
| A2 | Admin search request | Always sends `withActivation=true` (BR-6); the tab's value as `activation` (absent for All). |
| A3 | Admin search, above the results | Tabs **All · Active · Inactive** (default All), switching at once (no Apply), page back to 1, kept in the URL as `activation=active\|inactive` with the other filters; "Clear filters" resets to All. The result count reads as today. |
| A4 | Admin dashboard button | "Show Inactive Workers" becomes **"Suspended accounts"**; the modal title "Suspended accounts (N)", its empty text "No suspended accounts"; its **Restore** calls `adminApi.setWorkerSuspension(id, { suspended: false })`. Same list entry as today. |
| A5 | Worker's admin page (`app/admin/contractors/[id]/page.tsx`) | A small status block: "Account: Active / Suspended" and "Visible to clients: Yes / No" (the flag), with **Suspend account** (an in-page confirm: "Suspend this account? The worker won't be able to sign in until it is restored." Cancel / Suspend) or **Restore account** (no confirm), through `adminApi.setWorkerSuspension`. The page's data route `/api/admin/contractors/[id]` adds `user.status` and `isActivated` to what it returns (an app route, not strictly parsed). Not in the downloaded profile JPEG. |
| A6 | Client worker search (`/api/client/workers`) | The base condition adds `isActivated: true` beside `user.status = 'ACTIVE'` (FR-5). |
| A7 | Public worker list (`/api/public/workers`, read by the marketing site) | The same condition (FR-5). |
| A8 | Worker dashboard home (`app/dashboard/worker/(home)/page.tsx`) | A client component `ActivationNote` under the welcome banner: one line, **"Your profile is awaiting approval by Remonta."**, shown only when `workerApi.getActivation()` answers `activated: false`. Nothing while loading, nothing on an error (a missing note is safer than a wrong one), nothing once activated. Home page only. |
| A9 | Old route | `PATCH /api/admin/contractors/[id]/status` deleted (both callers move to the api, A1 and A4). Checked for run-time callers (template URLs too, the #95 lesson) before deleting. |

## Business rules

| Id | Rule | Traces |
|---|---|---|
| BR-U1 | The card switch writes activation only; it can no longer suspend anyone. | FR-4, FR-7 |
| BR-U2 | Suspension only from the worker's admin page (A5) and Restore in "Suspended accounts" (A4). | FR-7, R-2 |
| BR-U3 | A suspended account never appears in the client search or public list, whatever its flag; an activated, ACTIVE account does (with the lists' other conditions unchanged: names, bio for the default listing, filters). | FR-5, P6 |
| BR-U4 | **Assigned workers stay visible to their client.** `/api/client/workers/by-ids` (the workers an admin assigned to a client's request) is **not** filtered by the flag: switching a worker off hides them from searching, not from a client they already work for. | FR-5 (scope) |
| BR-U5 | The note is the worker's own state only (`getActivation`), never cached; impersonating admins see the impersonated worker's note. | FR-10, BR-9 |
| BR-U6 | Merge order: U2 merges only after `/v1/admin/workers/:id/activation` answers on prod (checked: 401 without a token) -- done 2026-10-23. | follow-up 32 |

## Tests

- `features/admin-search/query.ts`: the tab value in `AdminFilters`, `toQuery` (absent for All; `withActivation` always),
  the URL round trip (property, as the existing ones).
- The card and tabs: component-free logic in `query.ts`; the switch's request through `adminApi` (fake fetch, as
  `admin.test.ts`).
- P6 (NFR design): the client and public `where` builders as pure functions: a worker is listed iff `isActivated` and
  `status = ACTIVE` with the other conditions held fixed (property over generated rows against an in-memory filter).
- `ActivationNote`: shown only for `activated: false`; not on loading or error.

## Release

Merge = release. Before it, on the PR preview (staging api): sign in as admin, switch a staging worker on, see them in
"Active" and in the client search, suspend from their page, restore from "Suspended accounts", switch off; a worker
sees the note; the marketing site's list is empty on staging until a worker is activated. Rollback: Vercel promote of
the previous `remonta-app` deployment (the lists show everyone again at once); the api needs nothing.
