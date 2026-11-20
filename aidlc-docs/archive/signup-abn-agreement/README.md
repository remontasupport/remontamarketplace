# Sign-up ABN and agreement (cycle closed 2026-11-20)

**Goal (user, 2026-11-19):** the ABN notice before the worker sign-up and the Contractor Agreement as its final step.
Grew in the same session (user's requests) into the worker Rates, admin dashboard additions and three security fixes.

## What shipped (live)

| PR | Content |
|---|---|
| #165 `fcc503a` (U1 `agreement-api`) | `createAgreementUploadTicket`; the registration body takes `abn` + `agreementUploadId` (optional in the schema); `registerWorker` stores the agreement row and the signed engagement |
| #166 `95df496` | `GET /v1/service-requirements` (the sign-up's requirements list) |
| #167 `9a01efd` | the 24 h verified-email window |
| #168 `bbeec8e` (worker-rates api) | `worker_rates` table (migration `20261120120000_worker_rates`, cents, CHECK 1..999999, `down.sql` tested on a Neon branch); `GET/PUT /v1/worker/rates`, `GET /v1/admin/workers/:workerId/rates` |
| #170 `626dd09` | admin search `withRates` (the rows carry the rates) |
| #171 `4d67e36` | **the auth middleware runs again** (it had not run since the monorepo move: `src/middleware.ts`); `lib/routeAccess.ts`; sign-in required on `/api/upload/worker-photo` and `/api/contractors[/id]` |
| #172 `02f3c75` | a password reset by email sets `passwordChangedAt` (signs out every other session) |
| #169 `dfa4b49` (U2 `agreement-app` + app side of the above) | the sign-up notice and agreement step (one service); Manage services, My Profile save-on-leave; Services -> Rates (above Service Area; admin-only view on Show profile and the dashboard cards, one per line); Suspended accounts search; **Suspend account on the dashboard cards** (off the Edit Profile page) |

Production at the close: api image `626dd096d505acbc3fd0ecba98633b91ab961b75` (previous `bbeec8ec35badc6d8338b2ac5712c982d1027dbf`,
before it `fcc503a982ba6807f9ee57f16bbeeffd4a8c3fcf`); app/web `main` `dfa4b49` (Vercel success; previous `02f3c75`).
Checked 2026-11-20 after #169: deep links to `/dashboard/worker/profile/rates` and `/admin` -> 307 to `/login?callbackUrl=...`;
`/api/contractors` -> 401. The U2 preview checklist was the user's; its result is not recorded in this session.

## Not done (moved to follow-ups 49-53)

U3 `agreement-required` (the schema still accepts a sign-up without ABN/agreement and with more than one service; the
form requires them). Plus the suspension session gap, `/remontaadmin/findsupport`, an admin password page, and Restore
for LOCKED / PENDING_VERIFICATION accounts.

## Deviations

- The cycle grew beyond its goal at the user's requests (rates, admin dashboard, security fixes), each in its own PR or on the U2 branch.
- `8e313ff` (#171) and `ed95378` (#169) each carried only a file move (git add stopped on the old path); the next commit completed each. Revert them in pairs.
- The api was promoted before the U2 preview checklist (additive changes; no failure).

## Layout

`inception/` (requirements, execution plan, worker-rates plan, primary-service analysis), `construction/u1-agreement-api/`,
`construction/u2-agreement-app/`, `aidlc-state-at-close.md`. Audit: `aidlc-docs/audit.md` (2026-11-19/20 entries).
