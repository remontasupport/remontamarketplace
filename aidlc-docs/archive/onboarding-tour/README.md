# Onboarding tour + profile completion (cycle closed 2026-10-22)

**Goal (user, 2026-10-21):** a quick tour on a worker's first sign-in through the sidebar groups ("Basically just a
tour how to complete the profile"); then, in the same cycle, profile completion computed by `apps/api`.

## What shipped

| PR | Content |
|---|---|
| #88 `f00a3cb` | U1 `tour-seen-api`: `worker_profiles.tour_seen_at` + its entry; promoted `remonta-api-00012-gts` |
| #89 `1eda05a`, #91 `0fbd3d4` | C1 `completion-api`: completion on the api (`COMPLETION_MODEL=legacy`), the completion-sync job + alert; Language optional; promoted `00013-rl7` |
| #93 `9fdcf6d` | Service area: the travel distance optional; promoted `00014-wdv` |
| #94 `cf43d23` | The worker dashboard release: the new sidebar, My Profile / Services / Compliance / Account on the api, U2 the tour |
| #95-#101 | 98 unused files removed, rollback rows, mobile layout, admin reports restored, the committed Prisma client refreshed |
| #102, #103 (`62e24f9`) | Security H2 (/setup-password takeover closed) and H1 (bank details off the share link); verified live |

## Not done (carried to `aidlc-state.md` follow-ups 27-31)

C2 `completion-app` (then the switch to `groups` + backfill); H3 (published-only search: a product decision, 1 of 1,765
published; local branch `fix/h3-published-workers-only-v2`); rotating the Zoho OAuth secret in git history; the
production 403 on `GET /v1/worker/profile` for one non-WORKER account; `test/my-profile-columns`.

## Layout

`inception/` (inventory, requirements incl. the completion set, plans, review: completion audit, unused-file scan,
deleted branches), `construction/` (tour-seen-api, tour-app, completion-api, shared NFR design, build-and-test, plans),
`aidlc-state-at-close.md`. The audit trail stays in `aidlc-docs/audit.md`.
