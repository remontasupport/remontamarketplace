# Integration Test Instructions -- cycle *admin worker search on apps/api*

## Purpose

Prove the pieces work together where the unit tests cannot: the api against a real PostGIS database and the
fake bucket (CI and local), the api on staging with a real secret and a real token (the staging checklist), the
app on a preview talking to staging (the preview checklist), and the old route against the new entry on the same
data (the parity script).

## Scenario 1: the api against PostGIS and the fake bucket (every PR touching `apps/api`)

- **Setup (local):** the two containers of CLAUDE.md "apps/api"; `TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:55432/s1test`,
  `GCS_API_ENDPOINT=http://localhost:4443`, `PHOTO_BUCKET=test-photos`, `PHOTO_PUBLIC_BASE_URL=http://localhost:4443/test-photos`;
  migrations deployed and the suburb list loaded. **CI:** `.github/workflows/ci-api.yml` does all of it.
- **Run:** `pnpm --filter @remonta/api run quality` with those variables.
- **Expected:** the 128 gated tests run instead of skipping; from PR 2 the admin geo properties (G1-G3) and the
  statement-timeout scenario (S1) among them.
- **Cleanup:** nothing; the suites clean their rows.

## Scenario 2: staging after a merge (PR 1 and PR 2)

- **Setup:** the merge deployed `remonta-api-staging` (`deploy-api`); the secrets are set (PR 1's operator steps).
- **Steps and expected results (PR 1):**
  1. `curl -s -o /dev/null -w '%{http_code}' https://remonta-api-staging-154148201608.australia-southeast1.run.app/v1/health` -> `200`.
  2. Cloud Logging shows `apps/api listening` for the new revision and no `will not start` line.
  3. A sign-up on a Vercel preview still works end to end (every public entry unchanged).
  4. A token minted by hand with the staging secret (`docs/admin/README.md`) sent to any role-restricted entry:
     before PR 2 there is none, so the proof is CI's `attribution.test.ts`; after PR 2, `GET /v1/admin/workers`
     answers 200.
  5. A tampered token answers 401 and Cloud Logging shows `jsonPayload.auth="rejected" AND jsonPayload.reason="bad-signature"`.
  6. Production unchanged: `.../remonta-api-154148201608.../v1/health` 200, the live sign-up page 200.
- **Steps (PR 2, in addition):** the three entries with a staging admin's token; `EXPLAIN ANALYZE` of the slowest
  geo case (GiST index visible); the parity script green; the timed replay p95 under 500 ms; the drills S9, S12.
- **Record:** `../<unit>/code/<pr>-verification.md`.

## Scenario 3: the app on a preview against staging (PR 3)

- **Setup:** the PR's Vercel preview (Preview scope: `NEXT_PUBLIC_API_URL` = staging, `API_TOKEN_SECRET` = the
  staging value); staging runs PRs 1 and 2.
- **Steps:** sign in as the staging admin; the dashboard searches through the api (network tab: `Authorization`
  header, 200); a search with a suburb and 10 km; "Any distance"; the unmapped line and list; a repeat within a
  minute served from the browser cache; forced 401 (a wrong secret on the preview for a minute), 429 (hammer the
  limit), 503 (an invalid `NEXT_PUBLIC_API_URL` on a throwaway preview) each show their notice; the impersonation
  picker and the suspended list; the two-browser suspension check (S10).
- **Record:** `../admin-search/code/pr3-preview-checklist.md`.

## Scenario 4: parity, old route vs new entry (before PR 3 merges)

- **Run:** `pnpm --filter @remonta/api parity:admin-search --old=<preview base> --cookie=<session> --new=<staging api> --token=<jwt> --cases=apps/api/scripts/parity-cases.json [--time]`.
- **Expected:** identical id sets and totals for every case without a suburb; the differences with a suburb each
  explained by a known loss (L1-L5, L7); `--time` p95 under 500 ms.
- **Record:** the report pasted into `../admin-search/code/pr2-verification.md`.

## Scenario 5: production after promotion (PR 2) and after the app merge (PR 3)

- Health 200; an admin search with and without a suburb; the `auth-failed` policy silent; the rollback deployment
  ids re-recorded in CLAUDE.md before PR 3's merge.
