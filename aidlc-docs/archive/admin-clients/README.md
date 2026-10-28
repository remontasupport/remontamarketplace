# Admin clients and coordinators (cycle closed 2026-10-28)

**Goal (user, 2026-10-28):** "in the admin dashboard, I want to have a list of the clients and coordinators and a
display with their participants and requests". Standing requirement: "a good code and file structure, avoid repetitive
code and abstraction" (CS-1..CS-5 in the execution plan).

## What shipped (live 2026-10-28)

| PR | Content |
|---|---|
| #132 `59fd8cd` | U1 `clients-api`: `listRequesters`, `getRequester` (audited `ADMIN_RECORD_VIEW`), `setRequestStatus` (audited `SERVICE_REQUEST_STATUS_CHANGE`, outbox `ServiceRequestStatusChanged` → the n8n Cancel/Archive webhook, `changedBy: 'admin'`); migration `admin_clients_audit_actions`; secret `N8N_SERVICE_REQUEST_WEBHOOK_URL` (staging `off`). Promoted 02:05Z, `remonta-api-00023-f4b` |
| #133 | U2 `clients-app`: the Clients and Support Coordinators tabs (one component), the detail page with participants and requests, Change status |
| #134-#138 | prev/next arrows; Matched not offered; requests inside a collapsible participant card; larger request text; the age fix; CSV download (selected or all matching the filters) |
| #139 `979543a` / #140 / #141 | the Participants filter (api promoted 03:42Z, `remonta-api-00024-fpj`), coordinators only |
| #142 | CSV download on the Contractors tab; the download pieces shared (`features/admin-export`, `lib/api/allPages`) |
| #143, #144 | outside the goal, same day: a Matching request can be edited by its client/coordinator; manage-request's Renew restored |
| #145 `aaf1841` | after the close, same day: manage-request offers Edit on Pending/Matching only and Archive on Completed/Cancelled only; the client PATCH enforces both (`EDITABLE_STATUSES`, `ARCHIVABLE_STATUSES` in `features/service-requests/status.ts`) |

## Deviations

See `construction/build-and-test/build-and-test-summary.md`.

## Layout

`inception/` (requirements + questions, execution plan), `construction/` (functional designs and code summaries per
unit, shared NFR design, plans, build-and-test), `aidlc-state-at-close.md`. The audit trail stays in `aidlc-docs/audit.md`.
