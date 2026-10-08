# PR 4 -- admin-search, clean-up (generated 2026-10-08)

Branch `feat/admin-search-cleanup` from `main` `64508be` (PR 3 merged and live). Commits: `bfe795e` the deletions
with the tightened baselines (Part L), `ce37ec7` docs (Part M). PR: #44 (opened by the user from the compare link; CI 9/9
success; merged `36b25e6` 2026-10-08 ~07:37Z). Plan: `../../plans/admin-search-code-generation-plan.md` (Parts L-M ticked).

## Files

**Deleted**
- `apps/app/src/app/api/admin/contractors/route.ts` (855 lines: the old search, Google geocoding, the Redis
  response cache `admin:contractors:v1:*`), `api/admin/contractors/inactive/route.ts`, `api/admin/users/route.ts`,
  `api/admin/filters/route.ts`, `src/lib/worker-search.ts` (no importer anywhere in `apps/app`)

**Modified**
- `apps/app/.quality-baseline/typescript.txt` (-2 signatures: the `UserRole.SUPER_ADMIN` reference in the inactive
  route, a TS2322 in `worker-search.ts`), `.quality-baseline/eslint.txt` (-15: `no-explicit-any` in the deleted
  files). Tightened deliberately with `--update`; the gate confirms "all known", nothing new.
- `docs/admin/README.md` section 5: the routes are gone; the per-contractor routes (`[id]`, `[id]/status`) remain
  for the status toggle and Reactivate.

**Kept on purpose**
- `apps/app/src/app/api/admin/contractors/[id]/**` (the dashboard's admin actions), every other `api/admin/*` area.
- `apps/app/docs/architecture-audit.md` and `business-requirements.md` mention the deleted routes as a 2026-09
  analysis; they are the state file's follow-up 8, not this PR.

## Decisions taken during generation

| # | Decision | Why |
|---|---|---|
| L1 | The baselines are tightened in the same commit as the deletions | the gate passes either way (improvements never fail it), but a baseline naming files that no longer exist would hide a regression of the same signature elsewhere |
| L2 | Nothing replaces `/api/admin/filters` | its document-filter options were fetched and never rendered (PR 3's code map); the document-filter screen is the state file's follow-up 16 |
| L3 | No feature flag, no redirect from the old paths | since PR 3 nothing calls them; a caller that still did would get Next's 404, visible in Vercel's logs |

## Gates (local, 2026-10-08)

| Gate | Result |
|---|---|
| `@remonta/app` quality | typescript 142 findings all known, eslint 471 all known; 118 passed / 12 skipped |
| `turbo run build --filter=@remonta/app` | success; the regenerated Prisma clients discarded |

## After the merge

Production: the dashboard keeps working (it has not called these routes since PR 3); `GET /api/admin/contractors`
answers 404. The state file's follow-up 1 shrinks to the client search and the public list readers plus the dual
write and the column drop.
