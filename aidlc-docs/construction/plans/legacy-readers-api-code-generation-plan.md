# Code generation plan: U5 `legacy-readers-api` (2026-10-29)

Requirements: FR-7r (api readers), FR-8r, FR-9r, FR-10, FR-11r. Branch `feat/legacy-readers-api` from `main` after #150
(U4 live). The `apps/api` path: staging on merge, the preview checklist, then promotion (CLAUDE.md).

After U5 the api neither reads nor writes `worker_profiles.location, city, state, postalCode, latitude, longitude`.
The columns stay in the schema (U6) and the database (U7).

## Reuse vs add (CS-1..CS-5)

| Reused | Changed / removed |
|---|---|
| the HOME join every reader already has (`locations` HOME select; `home-sql.ts`'s `wl`/`al` join) | the readers take city/state/postcode from it only |
| `localityLabel` from `@remonta/schemas/data/locality` (U4) | api copy in `locations/domain/home.ts` deleted, imports switched |
| `hasHome` (already computed for completion's service-area item) | `accountDetailsOf` uses it instead of the three columns |
| `legacy-match.ts` (still used by the search's place matcher, `place.ts`) | -- |
| | removed: the reconciler's home step (`reconcileHome`, `home` outcome and summary), `locations/candidates.ts`, `locations/backfill.ts` + `scripts/backfill-worker-locations.ts` + `backfill:locations` + their tests |
| | `placeHome` returns the HOME row only (`legacy` gone); sign-up and the service-area save write no legacy column |

## Steps

1. [ ] Readers (keep every response shape; values from HOME, null without):
   - worker profile: `persistence/profile-read.ts` select, `application/get-profile.ts`
   - admin users / suspended lists: `application/lists.ts`
   - admin worker search: `persistence/worker-search-sql.ts` (row and sort: `al.*` only), `application/search-workers.ts`,
     the `state` filter in `application/filters.ts` (`al.state` only)
   - client/public search card: `search/persistence/worker-search-sql.ts` (`al.*` only)
2. [ ] Completion: `accountDetailsOf(profile, hasHome)`; every caller passes it (profile read, completion backfill).
3. [ ] Reconciler: drop the home step; it keeps the onboarding markers. Remove candidates/backfill files and the script.
4. [ ] Write stop: `placeHome` without `legacy`; `register-worker.ts` and `addresses.ts` write HOME only.
5. [ ] Guard test (api): no Prisma select/data and no raw SQL in `apps/api/src` names a legacy column of
   `worker_profiles` (`p.city`, `p."postalCode"`, `city: true`, ...); proved to fail on a reverted reader.
6. [ ] Tests updated (unit + DB: completion, lists, both searches, registration, addresses, reconciler); docs
   (`docs/worker`, `docs/admin`, `docs/search`, `docs/signup/03-data-model.md`), CLAUDE.md (`backfill:locations` gone).
7. [ ] Gates: api, api-contract, form-engine, schemas, app, `turbo run build`; CI's API Quality is the DB proof.
8. [ ] PR -> merge -> staging; preview checklist (CLAUDE.md) plus: a sign-up writes no legacy column; a service-area
   change moves HOME and stays moved after a reconciler tick (5 min); admin search state filter and sort; a worker
   profile shows the HOME suburb.
9. [ ] Promotion (user, full sha) -> production checks.

## Effects to know

- Completion: the 4 overseas workers (legacy text, no HOME) lose the location part of account details; the 4 empty
  ones already lacked it. Everyone else: unchanged.
- Rollback to the previous image (`331e5e3`) resumes the double write and the reconciler's home step; it would move a
  worker who changed suburb during U5 back to their frozen columns. Roll back only within the soak; a re-save fixes it.
