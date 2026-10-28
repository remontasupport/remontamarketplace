# U2 `clients-app` -- Functional Design (2026-10-28)

Requirements FR-1..FR-10 (FR-9: no password); U1 live (prod `00023-f4b`): `listRequesters`, `getRequester`,
`setRequestStatus`. Code structure CS-1..CS-5. App-only: merging is the release.

## Screens

**A1 The lists.** `/admin/manage?tab=clients` and `?tab=support-coordinators` (the sidebar's existing tabs) render one
component, `RequestersList`, with the role as its only difference (CS-1); the two "coming soon" placeholders go.
- Above the table: a search box (email or name, applied after a short pause), **Request status** (any of the 7, or
  all) and **Funding type** (any of the 5, or all). Filters and the page live in the URL (`search`, `requestStatus`,
  `fundingType`, `page`), so a reload or a shared link shows the same list.
- Table columns: Name, Email, Mobile, Organisation (coordinators only), Participants, Requests. No sign-up date.
  Newest first, 20 per page, the shared pagination (A6). A row opens the detail page.
- Empty: "No clients match" / "No support coordinators match". Errors: the shared outcome notice (A6).

**A2 The detail page.** One route for both roles, `/admin/requesters/[userId]?tab=clients|support-coordinators`
(decision D1): the `tab` keeps the sidebar's item highlighted and gives the "Back to Clients / Support Coordinators"
link. Header: name, role, email, mobile, organisation, participant and request counts.
- Then each owned participant, newest first: **the client dashboard's own participant card**
  (`ParticipantDetailPanel`, reused: name, gender, age, date of birth, relationship, conditions, notes and the NDIS
  details it already parses from `additionalInfo`), without its Edit / Remove buttons, plus the funding type and
  location beside it (the card does not show them).
- Under each participant, its requests, newest first, one card each (A3).
- No participants: "No participants yet".

**A3 A request card.** Status badge (the client table's colours, A6); services (category, then sub-categories);
location; created and updated dates; assigned workers, each a link to the worker's admin page
(`/admin/contractors/<workerProfileId>`); then everything the client entered in `details` that is present: description,
schedule notes, scheduling preferences (days, times, start, frequency, sessions/hours), preferred worker gender,
special requirements, funding type, NDIS details. Absent fields are not shown.

**A4 The status change.** On each request card: a status select (the 7 values) and **Change status**, enabled only
when a different value is chosen. It opens the existing `ConfirmDialog`: "Change this request from Pending to
Completed? The CRM (Zoho) is told of the change." (decision D2). On confirm `adminApi.setRequestStatus`; on success the
detail re-reads and a short "Status changed" note shows. 409: "This request was changed meanwhile; reloaded." and a
re-read. Other failures: the outcome notice; the select goes back.

**A5 The admin api client** (`lib/api/admin.ts`): `listRequesters(query)`, `getRequester(userId)`,
`setRequestStatus(requestId, status)`; `listRequesters` joins the canonical-query entries. Reads with React Query, as
the dashboard and the worker page do.

## A6 Shared pieces (CS-1, CS-2)

Each moves out of the one file that has it today, and that file then imports it (no visual change there):

| Piece | From | To | Used by |
|---|---|---|---|
| Pagination | `AdminDashboardClient.tsx` `renderPagination` | `components/ui/Pagination.tsx` (page block in, `onPage` out) | the worker search, A1 |
| Status labels and colours | `ManageRequestTable.tsx` `statusConfig` | `features/service-requests/status.ts`, keyed by `SERVICE_REQUEST_STATUSES` | the client's request table, A3, A4 |
| Outcome notice text | `AdminDashboardClient.tsx` `noticeTitle` / `noticeText` | `lib/api/outcome-notice.ts`, one function with the subject named by the caller ("search", "list", "page") | the worker search (same text as today, test), A1, A2, A4 |
| Participant card | `ParticipantDetailPanel.tsx` | stays; Edit renders only when `onEditClick` is given (the client always passes it: no change there) | the client dashboard, A2 |

New, in `features/admin-clients/` (CS-5): `RequestersList.tsx`, `RequesterDetail.tsx`, `RequestCard.tsx`,
`listQuery.ts` (URL <-> query, tested), and the route `app/admin/requesters/[userId]/page.tsx` (a thin client
wrapper). Nothing per role.

## Rules

- **AR-1** Every value the api returns is shown as text (React escapes it); no HTML from the client's notes.
- **AR-2** Dates in `en-AU`; the date of birth as the card shows it today.
- **AR-3** After a status change, both the detail and the list are re-read (no stale count or badge).
- **AR-4** No change to the client's or coordinator's own pages beyond the moved pieces (same output).

## Decisions for the user

- **D1** One detail route for both roles, `/admin/requesters/<id>`, instead of `/admin/clients/<id>` and
  `/admin/coordinators/<id>` (one page, CS-1). Recommended.
- **D2** A confirmation before each status change, naming the CRM. Recommended (it reaches Zoho).
- **D3** Reuse the client's participant card (the admin sees what the client sees), rather than a separate admin
  layout. Recommended.

## Verification (Build and Test)

App gate (type/lint baselines, tests incl. `listQuery`, the outcome text unchanged for the search); the preview against
staging: sign in as admin, both lists, each filter, a detail page, one status change on staging data (n8n off there),
the worker search and the client's request table unchanged; production after the merge.
