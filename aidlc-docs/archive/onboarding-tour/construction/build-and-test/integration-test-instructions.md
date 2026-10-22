# Integration test instructions: onboarding-tour (2026-10-21)

1. **Database (U1 on PostGIS):** `apps/api/test/worker/tour.int.test.ts` (5: the column, `updatedAt` untouched, the
   audit row, two concurrent saves keep one time, the property over two workers, 404 without a profile). Needs a local
   PostGIS (`TEST_DATABASE_URL` on localhost, CLAUDE.md "apps/api"); otherwise skipped -- CI's API Quality runs it.
2. **Staging api (U1 deployed):** the 13 checks of `construction/tour-seen-api/code/U1-summary.md` (tokens minted with
   the staging secret; the staging worker; reset afterwards). Run 2026-10-21: 13/13.
3. **App against staging (U1 + U2):** the branch preview, `e2e-test-instructions.md`.
4. **Backward compatibility (NFR-02):** today's production app build against the staging api (any open PR preview):
   the worker dashboard and a profile page load.
