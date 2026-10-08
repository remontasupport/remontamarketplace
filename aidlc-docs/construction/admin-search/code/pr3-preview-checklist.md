# PR 3 preview checklist -- admin-search, the app switch

Integration scenario 3 (`../../build-and-test/integration-test-instructions.md`). The PR's Vercel preview
(Preview scope: `NEXT_PUBLIC_API_URL` = staging, `API_TOKEN_SECRET` = staging's value, version 2, clean) against
staging `remonta-api-staging` running PRs 1 and 2 (`00017-h7x`). Production is checked unchanged at the same time.

Branch `feat/admin-search-app`. PR #43, CI 14/14 success on `e07abdc`; merged `64508be` 2026-10-08 ~07:20Z.

**Deviation:** the user merged before the preview rows below were run ("merged" reported and verified by refs). The
rows stay as the record of what was not proven on a preview; the production checks (scenario 5) are the proof
that exists. The two "before the merge" rows were not done either.

## Before the merge

| Step | Result |
|---|---|
| Vercel Preview scope has `API_TOKEN_SECRET` = staging's clean value (the one `staging-admin-check.ts` signs with) | pending (operator) |
| the `remonta-app` production deployment id re-recorded in CLAUDE.md (follow-up 3) | pending (operator: Vercel -> remonta-app -> Deployments -> the current Production one) |

## On the preview, signed in as the staging admin

| Step | Result |
|---|---|
| `/admin/manage?tab=contractors` loads; the network tab shows `GET /api/auth/api-token` 200 `no-store`, then `GET <staging api>/v1/admin/workers?page=1&pageSize=6` with an `Authorization: Bearer` header, 200 | pending |
| a suburb typed, a row picked (one with an id), "Within" enabled; 10 km applied: rows nearest first with "x km from the suburb centre"; the header says "within 10 km of <suburb>" | pending |
| "Any distance": every placed worker, nearest first | pending |
| the line "N active workers have no mapped suburb" and "Show them": the unmapped list, suburb and Within disabled, "Back to search" | pending |
| Apply again with the same filters within a minute: no request in the network tab (served from the browser cache); Refresh: a request with `Cache-Control: no-cache`, 200 | pending |
| the URL bar carries the canonical query plus `localityLabel`; reloading the page restores the filters | pending |
| gender + suburb + 10 km combined: the count equals the api's for the same canonical query (`staging-admin-check.ts` or the parity script) | pending |
| forced 401 (a wrong `API_TOKEN_SECRET` on a throwaway preview for a minute): the dashboard redirects to `/login?callbackUrl=`; the api logs `bad-signature` | pending |
| forced 429 (hammer Apply/Refresh past 120 per minute): the amber notice with the wait, automatic retry, last results kept | pending |
| forced 503 (an invalid `NEXT_PUBLIC_API_URL` on a throwaway preview): the red notice with "Try again", last results kept | pending |
| the impersonation picker: two characters list users; a role narrows; the Impersonate button works as before | pending |
| "Show Inactive Workers": the suspended list from the api; Reactivate removes the row and reloads the search | pending |
| the two-browser suspension check (S10): suspend a test worker in browser A; A's list reflects it at once; browser B within a minute | pending |
| production domain at the same time: unchanged (the old routes still serve the production dashboard until this PR merges) | pending |

## Parity against the old route (scenario 4, deferred from PR 2)

| Step | Result |
|---|---|
| `parity:admin-search --old=<this preview> --cookie=<admin session> --new=<staging api> --token=<admin jwt>` | pending (report pasted here) |

## After the merge (scenario 5)

| Step | Result |
|---|---|
| production dashboard: an admin search with and without a suburb through `remonta-api` (network tab) | the new build live 07:23Z (`/api/auth/api-token` 401 `no-store` without a session, where the old build answered NextAuth's 400). 07:25:05Z: the first `admin.searchWorkers` line on prod, attributed to an admin user id, no rejection: the Vercel Production secret pairs with prod's clean secret. The suburb search is the user's check (asked) |
| `auth-failed` policy silent | no `auth: rejected` line on prod in the 10 min after the build went live (07:25Z check) |
