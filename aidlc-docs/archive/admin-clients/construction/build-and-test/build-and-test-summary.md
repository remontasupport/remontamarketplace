# Build and Test summary -- admin-clients (written at the close, 2026-10-28)

## Units

| Unit | PR / merge | Gates | Staging / preview | Production |
|---|---|---|---|---|
| U1 `clients-api` | #132, `main` `59fd8cd` | contract, api unit + database tests (CI API Quality; Docker broken locally) | local api against the copy: `_admin-clients-local-check.ts` 24/24 PASS; deploy-api run 40617477585, staging `remonta-api-staging-00068-dz7`, the same check with `STAGE=staging` 24/24 PASS (lists = the database, filters, detail, view audited, status change + 409 race, webhook skipped on `off`) | promoted 2026-10-28 02:05Z, run 40618713934, `remonta-api-00023-f4b`; migration `admin_clients_audit_actions` applied |
| U2 `clients-app` | #133, then #134-#141 | app gate each PR (latest: 49 test files, 350 tests) | PR previews against staging, checked by the user | Vercel builds; the user's checks on the live admin pages |
| Participants filter (api) | #139, `main` `979543a` | as U1 | deploy-api run 40627331698; staging check 26/26 PASS (`participants=with/without`) | promoted 03:42Z, run 40628114144, `remonta-api-00024-fpj` |
| Contractors CSV | #142 | app gate (350 tests; `contactsCsv`, `allPages` tests) | preview | live with `main` `8a805c3` |

## Deviations

- **The sensitive-data password dropped** by the user ("admin can see the details instantly"); the detail is audited per view instead.
- **n8n reuses the client's Cancel/Archive webhook** (user option A) rather than a new one; production secret version 2 is the real URL (version 1, a placeholder, disabled), staging `off`.
- **MATCHED left out** of Change status and the status filter (user); the api still accepts it.
- **"Has a matched request"** removed from the filter; **the Participants filter** added later (api #139), shown on coordinators only (#141).
- **Two "merged" reports were not merges** (#133 still open); caught by `git ls-remote`. **#140 conflicted** with `main` once; `main` merged in, then the user merged.
- **The webhook URL appeared in the transcript** while fixing a malformed `gcloud` command (no rotation decided).

## Changes made during the cycle, outside its goal (live)

#143 a Matching request is editable by its client/coordinator (the PATCH route took PENDING only); #144 manage-request's
Renew restored on a cancelled request (`/reactivate` → PENDING, n8n `Renew`), removed 2026-10-26 in `9f77989`.

## Not done

- **Zoho end to end for an admin status change**: no admin status change in production logs at the close; whether the n8n
  workflow writes `status` from an `Edit` is unknown (follow-up 35).
- **n8n's handling of `Renew`** after #144 not verified (follow-up 36).
- Database-gated tests ran only in CI. The full local `turbo run build` not run for #142-#144 (Vercel built them).
