# U2 `clients-app` -- code summary (2026-10-28)

Branch `feat/admin-clients-app` from `main` `59fd8cd`, head `d9970a4`; 2 commits, 21 files.

| Commit | Content |
|---|---|
| `8d6c61a` | Shared, no visual change: `components/ui/Pagination.tsx` (from the worker search), `lib/api/outcome-notice.ts` (+ test pinning the search's wording), `features/service-requests/status.ts` (from the client's request table), `features/service-requests/funding.ts` (short labels); `ParticipantDetailPanel`'s Edit only with `onEditClick` (the client always passes it) |
| `d9970a4` | `adminApi.listRequesters/getRequester/setRequestStatus` (+ tests); `features/admin-clients/`: `RequestersList` (both tabs), `RequesterDetail`, `RequestCard`, `listQuery` (+ test), `requestDetails` (+ test); route `app/admin/requesters/[userId]`; the manage page's two placeholders removed; `docs/admin/README.md` |

## Duplicate check (CS-1..CS-5)

- One list, one detail, one card for both roles; the role picks the tab, titles and the organisation column only.
- Moved out, not copied: pagination, outcome notices, status styles. The worker search and the client's request table
  now import them (-171 lines there).
- The participant card is the client's own; the request details are one row function (`detailRows`), so the card has no
  per-field markup.
- Reused: `adminApi`'s `call`, React Query, `ConfirmDialog`, `Loader`, the contract's types, `SERVICE_REQUEST_STATUSES`,
  `FUNDING_TYPES`, `REQUESTER_ROLES`.
- Left alone (follow-up): the client forms' two identical long funding option lists (`AddClientModal`,
  `EditParticipantModal`).

## Gates (local)

App quality: typescript 55 known (1 improved), eslint 277 known, 42 files / 329 tests; `turbo build` of the app:
`/admin/manage` and `/admin/requesters/[userId]` built.
