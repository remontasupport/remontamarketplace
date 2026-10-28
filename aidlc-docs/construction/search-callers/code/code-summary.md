# U2 `search-callers`: code summary (2026-10-28)

Branch `feat/search-callers` (`b7fa2b1`, 5 commits on `main` `6886e09`, 20 files, +244 / -1403). Pushed; PR to be
opened by the user. No api source change (only `apps/api/package.json`'s script line and the removed parity script:
a merge redeploys staging with the same code; no promotion needed).

| Commit | What |
|---|---|
| `3c4fc4e` | `apps/app/src/lib/api/call.ts` (the token, bearer, 401-retry loop once), `account.ts` on it, `search.ts` (canonical query, `callWithToken`), tests; contract `ClientWorkerQueryInput`, `PublicWorkerQueryInput`, `ClientWorkerResponse`, `PublicWorkerResponse` |
| `b3d6c80` | `useWorkers` → `searchApi`; types from the contract; anything but ok throws (React Query unchanged) |
| `d929c98` | `apps/web/src/app/search/page.tsx` → `createClient(searchContract)`, `NEXT_PUBLIC_API_URL`, `next: { revalidate: 60 }`; `apps/web` depends on `@remonta/api-contract` (P-1 allows) |
| `9b0afe4` | removed: app `/api/client/workers`, `/api/public/workers`, web `/api/public/workers` proxy, `lib/workers/listable(.test).ts` (no user left), `parity-search.ts/.json` + script line, the routes' baseline lines |
| `b7fa2b1` | `docs/search/README.md`: callers, parity history |

## Deviations from the plan

- **Step 5:** the batched parity script was **removed**, not committed: with the old routes gone it has nothing to
  compare. Results stay in `search-api/code/parity-runs.md`.
- **`LISTABLE_WORKER`** removed with its test (its only user was the public route; the rule is BR-E2 in the api's
  statement, covered by `test/search/search.int.test.ts`).
- **Step 6, web:** `apps/web` has no test runner; the page is proven by its typecheck, `turbo build` and the preview.
- **Baselines:** only the deleted routes' lines dropped; two unrelated improvements (contractors status TS2339,
  `profileData` lint) left for their own change.

## Duplicate check

The token loop now exists once for account + search (`call.ts`); `admin.ts` and `features/worker/api.ts` still carry
their own (follow-up 40). The keyword rules and the slug map exist once (apps/api, packages/schemas).

## Gates (local)

app: 54 type / 273 lint known, 50 files, 353 tests (5 new); web quality (lint, strict tsc) clean after clearing a stale
`.next/types`; api-contract 138; api tsc clean; `turbo build` 3/3 (after stopping the local api/app that held the
Prisma engine). Regenerated Prisma clients discarded (absolute paths only).
