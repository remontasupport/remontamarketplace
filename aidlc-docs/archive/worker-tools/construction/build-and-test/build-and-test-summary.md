# worker-tools: build and test summary (2026-10-22)

## Automated

| Gate | Result (last run on the shipped code) |
|---|---|
| `@remonta/schemas` | 98 tests (the lists, the matcher, PBT P1, P2, P5, TS-6) |
| `@remonta/api-contract` | 118 tests (the entries, N1 compatibility against `main`'s schemas, P6); openapi additions only |
| `@remonta/db` | 50 (7 database-gated in CI) |
| `@remonta/form-engine` | 76 |
| `@remonta/api` | lint, strict tsc, 912 unit; database-gated (CI's API Quality): `service-tools.int` (P3, BR-3, BR-10, BR-14..17), `admin/tools.int` (P4 oracle, the TS-6 search oracle) |
| `@remonta/app` | types 56 known, lint 277 known (1 improved, the H1 leftover), 308 tests (PU1-PU4, TS-5/6) |
| `@remonta/web` | lint 70 known |
| `turbo run build` | 3/3 |

This machine's Docker does not answer: the database-gated tests ran only in CI.

## Deployments

| What | When (UTC) | Evidence |
|---|---|---|
| #104 U1 `tools-api` merged -> staging (migration applied) | 02:58 -> 03:09 | deploy-api 39714324255 |
| #105 U2 `tools-app` merged (**before** the promotion, see below) | 03:54 | `main` `8ef704d` |
| U1 promoted to prod `c523f53` (migration applied) | 04:44 | deploy-api 39723885178 |
| #106 tool search api merged -> staging | 05:09 | deploy-api 39726417377 |
| tool search promoted to prod `bf9b966` | 07:44:35 | deploy-api 39742444682 |
| #107 tool search page (+ the follow-up filter commits) merged | 07:46:20 | `main` `8943f93`; Vercel production builds success 07:48 |

## Person-run checks

- U2 preview against staging: tested by the user; changes asked and made there (Tools per type of support, above
  Experience with, the search box).
- Tool search preview: first try hit staging before its deploy finished (400 "not accepted here: toolSearch",
  request `51fc3e9d-...`), then retested.
- Production: the user's checks after U1/U2 ("done"); the tool search's signed-in production check left to the user.

## Deviations and findings

1. **#105 merged before the api's promotion**, and at `ccae8ef` (without the two later filter commits). For ~50 minutes
   production's tools screen could not load and a ticked admin tool made the search fail (400). Fixed by the promotion
   at 04:44Z; the two commits shipped in #107.
2. **U1's claim about the Prisma client was wrong:** Vercel regenerates it from `packages/db` at build, so production's
   app knew the columns from #104's merge. Checked: no `apps/app` query names `worker_services` columns implicitly.
3. The admin page is the downloadable profile card: the tools line is left out of the JPEG (user).
4. One approved synonym ("ride on mower") dropped as identical to the normalised label.
5. `gcloud` needs a re-login: revision names not read; rollback rows by image sha.
