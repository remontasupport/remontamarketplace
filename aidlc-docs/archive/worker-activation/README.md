# Worker activation (cycle closed 2026-10-28)

**Goal (user, 2026-10-23):** the admin card's Active switch becomes a new admin-set flag, separate from `users.status`
(which blocks sign-in); every worker, existing ones included, starts inactive.

## What shipped (live 2026-10-23)

| PR | Content |
|---|---|
| #108 `746a60d` | U1 `activation-api`: `worker_profiles."isActivated"` (`NOT NULL DEFAULT false`, expand-only); `setWorkerActivation`, `setWorkerSuspension`, `getActivation`; `activation` filter + `withActivation` on the admin search. Promoted 02:30Z (`remonta-api-00017-4bz`) |
| #109 `8b8a82d` | U2 `activation-app`: the card switch on the flag, All/Active/Inactive tabs, "Suspended accounts" with Restore, Suspend/Restore on the worker's admin page; the public list reads the flag |

Later the same day: the signed-in client search back to every ACTIVE-account worker (FR-5 changed); only the public list
needs the flag.

## Deviations

See `construction/build-and-test/build-and-test-summary.md` (it also lists #110-#131, made outside the cycle).

## Layout

`inception/` (requirements + questions, execution plan), `construction/` (functional designs per unit, shared NFR
design, plans, build-and-test), `aidlc-state-at-close.md`. The audit trail stays in `aidlc-docs/audit.md`.
