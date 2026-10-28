# U2 `clients-app` -- Code Generation plan (2026-10-28)

Design: `construction/clients-app/functional-design/functional-design.md` (approved, D1-D3 as recommended).
Branch `feat/admin-clients-app` from `main` `59fd8cd` (U1 live). One PR, app only; merge = release.

## Steps

1. **Shared pieces first, no visual change** (A6), each with the old file switched to it:
   - `components/ui/Pagination.tsx` from `AdminDashboardClient.renderPagination`.
   - `features/service-requests/status.ts` (`SERVICE_REQUEST_STATUS_STYLE`, keyed by `SERVICE_REQUEST_STATUSES`) from
     `ManageRequestTable.statusConfig`.
   - `lib/api/outcome-notice.ts` (`outcomeNotice(outcome, subject)`) from the dashboard's `noticeTitle` /
     `noticeText`; a test pins today's search wording.
   - `ParticipantDetailPanel`: the Edit button only with `onEditClick`.
2. **Client** (`lib/api/admin.ts`): `listRequesters`, `getRequester`, `setRequestStatus`; `listRequesters` canonical;
   tests beside the existing ones (URL, bearer, 404 / 409 outcomes).
3. **`features/admin-clients/listQuery.ts`**: URL params <-> `RequesterListQuery` (role from the tab; unknown values
   dropped; page >= 1), tested.
4. **`RequestersList.tsx`** (A1) and the manage page's two cases switched to it; placeholders removed.
5. **`RequestCard.tsx`** (A3, A4): the details sections, the status select + `ConfirmDialog`, the 409 path.
6. **`RequesterDetail.tsx`** + `app/admin/requesters/[userId]/page.tsx` (A2): header, participants with the reused
   card, funding type and location, the request cards; React Query, re-read of detail and list after a change.
7. **Gates**: the app's quality (type/lint baselines, tests), `turbo build` of the app; web untouched.
8. **Docs**: `docs/admin/README.md` "The app side" row; the code summary in the record with the duplicate check.

## Reused, not added

`adminApi`'s `call` (token, retry, outcomes), React Query, `ConfirmDialog`, `Loader`, the client's participant card,
the contract's types and `SERVICE_REQUEST_STATUSES` / `FUNDING_TYPES`.

## Release

App only. The preview points at staging (U1 there): sign in as admin, both lists and filters, a detail page, one
status change on staging data, the worker search and the client's request table unchanged. Then merge (Vercel deploys
production; rollback = promote the previous `remonta-app` deployment).
