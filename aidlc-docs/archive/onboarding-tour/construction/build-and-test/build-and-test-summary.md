# Build and test summary: onboarding-tour (2026-10-21)

| Category | U1 `tour-seen-api` | U2 `tour-app` |
|---|---|---|
| Build | `turbo run build` 3/3 (main checkout); the `f00a3cb` image built and deployed to staging | `turbo run build --filter=@remonta/app` compiled; Vercel preview of `ffad332` built (success) |
| Unit | api-contract 104 (6 new), api 796 passed / 213 skipped (10 new) | app 286 passed / 12 skipped (42 new); 73 type / 289 lint known, none new |
| Integration (database) | `tour.int.test.ts` 5: CI's API Quality on #88, green on Node 20 and 22 | -- |
| Integration (staging) | 13/13 (2026-10-21 02:14Z) | -- |
| Contract | the checks in api-contract; the app's client parses `TourView` (5 tests) | (same) |
| Security | CodeQL, Semgrep green on #88; access 401/403, impersonation 403, no body, server clock -- tested | the tour and ? for WORKER only (tested as `tourEnabled`); texts rendered as text |
| Performance | not run, by decision (Q4 A) | -- |
| End-to-end | NFR-02 browser check: **open, the user** | the ten preview checks: **open, the user** |

**Status:** build success; every automated test passes. **Not yet verified by a person:** the preview checks (U2) and
today's production app against staging (U1). The release waits for both.

## Then, in order (each on the user's word)

1. Merge `feat/onboarding-tour` into `feat/account-app`; its preview: CLAUDE.md's checklist plus the tour checks.
2. Promote the api: deploy-api, stage=prod, imageTag `f00a3cb85ba22939f9d6cebcf4e36509d4cb28d9` (the migration runs
   first); re-record the rollback rows; production api checks.
3. Merge `feat/account-app` into `main` ("Merge pull request"); production checks with an internal worker.
