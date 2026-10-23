# U2 `activation-app`: code generation plan (2026-10-23)

**Single source of truth for U2's code.** Branch `feat/worker-activation-app` from `main` `746a60d` (U1 merged and on
prod); one PR; "Merge pull request" **only when admins are ready to start activating** (the release). Design:
`construction/activation-app/functional-design/functional-design.md` (A1-A9, BR-U1..BR-U6, approved 2026-10-23).

## Steps

### Step 1 -- The api clients (`apps/app/src/lib/api/admin.ts`, `features/worker/api.ts`)
- [ ] `AdminApi`: `setWorkerActivation(workerId, activated)` and `setWorkerSuspension(workerId, suspended)`; `call()`
      learns a JSON body beside path params (never cached). Tests in `lib/api/admin.test.ts` with the fake fetch (path,
      method, body, bearer, the 401 retry, a 404 as `failed`).
- [ ] `WorkerApi.getActivation()` (as `getTour`), never cached.

### Step 2 -- The search query (`features/admin-search/query.ts`) [A2, A3]
- [ ] `AdminFilters.activation: 'all' | 'active' | 'inactive'` (default `all`); `toQuery` sends `activation` unless all
      and **always** `withActivation: true`; `filtersFromURL` / `urlFromFilters` carry it; "Clear filters" resets it.
- [ ] Tests: the mapping, the URL round trip (property), `withActivation` always present.

### Step 3 -- The admin dashboard (`app/admin/AdminDashboardClient.tsx`) [A1, A3, A4]
- [ ] The card switch reads `contractor.activated` and calls `adminApi.setWorkerActivation`; optimistic card state from
      the answer, then the existing reload past the caches; the api notice on failure.
- [ ] The tabs All · Active · Inactive above the results (instant; page 1; URL).
- [ ] "Show Inactive Workers" -> "Suspended accounts" (button, modal title, empty text); Restore via
      `adminApi.setWorkerSuspension(id, false)`.

### Step 4 -- The worker's admin page [A5]
- [ ] `/api/admin/contractors/[id]/route.ts`: add `user.status` and `isActivated` to the select and the answer.
- [ ] `app/admin/contractors/[id]/page.tsx` + `WorkerAccountStatus.tsx`: "Account: Active/Suspended", "Visible to
      clients: Yes/No", Suspend (in-page confirm) / Restore via `adminApi.setWorkerSuspension`; not in the JPEG.
      A small pure helper for the labels and the button, tested.

### Step 5 -- The client search and the public list [A6, A7, BR-U3, BR-U4, P6]
- [ ] `/api/client/workers/route.ts` and `/api/public/workers/route.ts`: `isActivated: true` in the base condition.
      `/by-ids` unchanged (BR-U4).
- [ ] P6: the two `buildWhereClause` base conditions asserted to contain both conditions, and a property over generated
      workers evaluated against an in-memory reading of the base condition (listed iff activated and ACTIVE).

### Step 6 -- The worker's note [A8, BR-U5]
- [ ] `components/dashboard/ActivationNote.tsx` (client): one line "Your profile is awaiting approval by Remonta." only
      on `activated: false`; nothing on loading or error. Placed under the welcome banner of `(home)/page.tsx`.
- [ ] Test: the decision function (show / hide per outcome).

### Step 7 -- Remove the old route [A9]
- [ ] Search every caller of `contractors/${...}/status` and `/status'` (template URLs too, with `MSYS_NO_PATHCONV=1`);
      delete `app/api/admin/contractors/[id]/status/route.ts` when none remain.

### Step 8 -- Docs, gates, PR
- [ ] `docs/admin/README.md` §5 (the app side: switch, tabs, Suspended accounts, the status block); `docs/worker/` (the
      note).
- [ ] App quality (type/lint baselines unchanged or better; tests), web, `turbo run build`; generated Prisma clients not
      committed; push; compare link; CI.
- [ ] The preview run (the design's "Release" list) by the user; then the merge, when admins are ready; production
      checks; the rollback row.
