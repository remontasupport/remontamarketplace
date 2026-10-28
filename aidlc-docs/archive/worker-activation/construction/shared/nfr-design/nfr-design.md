# worker-activation: NFR design (shared by U1 and U2, 2026-10-23)

Baselines: Security (blocking), Resiliency (SLA 99.9 %, RTO ≤ 30 min, RPO ≤ 5 min, single region), PBT (full).
Inputs: requirements NFR-1..NFR-5; U1 functional design BR-1..BR-12 (approved 2026-10-23).

## N1 Compatibility with the app on production (Resiliency: change management)

The app parses responses strictly. Between U1's promotion and U2's merge, and after any rollback of U2, the
production app is the pre-U2 build. So in U1:
- `GET /v1/admin/workers` without the new parameters answers **exactly** today's shape: `activated` only with
  `withActivation` (BR-6); `appliedFilters.activation` only when the query had `activation` (as `tools`, `toolSearch`).
- `GET /v1/worker/profile`, `/v1/admin/workers/suspended`, `/v1/admin/users` unchanged.
- **Test:** the response JSON Schemas compared with a snapshot taken from `main` `8943f93`, equal except the two
  optional keys above; a response built without the parameters parses with the snapshot's strict row schema.

## N2 Expand-only migration and rollback (Resiliency: RTO/RPO)

- One `ADD COLUMN ... NOT NULL DEFAULT false` (metadata-only on Postgres 11+, no rewrite, no long lock); no index.
- `down.sql` drops the column, run on a Neon branch before the merge.
- Rollback: the previous api image (`bf9b966...`) ignores the column; the app by Vercel promote. Rolling back loses
  only activations made since (the column stays, so a roll-forward restores them: RPO 0 for the flag).
- No data change in the migration itself: the default is the reset (FR-3).

## N3 Access and abuse (Security)

- Both writes: `access: { roles: ['ADMIN'] }` (SUPER_ADMIN maps to ADMIN in the token, as every admin entry), the
  pipeline's token check on every request, per-user and per-IP limits (activation 120/min — an admin working down a
  page of cards; suspension 30/min), body ≤ 1 KB, strict bodies (`{ activated: boolean }`, `{ suspended: boolean }`).
- `getActivation`: WORKER only, the caller's own profile; nobody can read another worker's state through it.
- No worker or sign-up body accepts `isActivated` (strict schemas; a test sends it and expects 400).
- Suspension reaches WORKER accounts only (BR-7): an admin cannot lock out another admin through this entry.
- Logs (SECURITY-03): entry, caller id, `workerProfileId`, the new state. No names, emails or bodies.

## N4 Freshness after a switch (NFR-5; replaces BR-11's memo clearing)

The search is cached for 60 s twice: the browser's private cache (ETag) and the api's in-process memo (per instance,
1–4 instances on prod), keyed by the query. Clearing the memo from the write would only clear one instance. Instead:
- the card shows the write's own answer at once (U2);
- the next search the page runs **after a switch** is sent with `Cache-Control: no-cache` and `cache: 'no-store'`
  (U2): the pipeline already bypasses the memo for it and stores the fresh answer.
- Other admins may see a state up to 60 s old, as for every other change today.
So U1 has no memo code; BR-11 is superseded by this rule.

## N5 Performance

- The filter is `p."isActivated" = true|false` on the statement that already joins `users`; 1,765 rows. Checked with
  `EXPLAIN ANALYZE` on the staging copy in Build and Test; an index only if the plan says so (it will not at this size).
- U2's client search and public list add the same equality to their Prisma `where`.

## N6 Property-based tests (PBT full)

| Id | Property | Where |
|---|---|---|
| P1 | For any valid search query q: `ids(q ∧ active) ∪ ids(q ∧ inactive) = ids(q)` and the two are disjoint | db-gated, random workers |
| P2 | For any q, every row has `activated` iff `q.withActivation`; with it, `activated` equals the column | db-gated |
| P3 | For any sequence of activation writes on a worker, the final column equals the last write; no other column of the profile or user changes (a snapshot of both rows apart from `updatedAt`) | db-gated |
| P4 | For any sequence of suspension writes, `users.status` equals the last write's mapping and `isActivated` is untouched | db-gated |
| P5 | Query normalisation: `activation` round-trips into `appliedFilters`; absent stays absent | unit |
| P6 (U2) | A worker is in the client and public lists iff `isActivated ∧ status = ACTIVE` (with the lists' other conditions held fixed) | U2 |

fast-check, as the earlier cycles; generators built from the test harness's worker factory.

## N7 Observability

No new alert. The existing api error-rate and latency policies cover the new entries. The request log line per write
(N3) is the record (Q8 c).
