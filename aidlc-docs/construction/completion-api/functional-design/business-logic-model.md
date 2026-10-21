# C1 `completion-api`: business logic model (2026-10-21)

## L1 Building the view (pure)

```
rows (the profile read's, unchanged) ──► completionInputOf(rows)  [extended with the optional pages' values and the home address]
        │
        ├─► myProfileItems(input)        E2: 18 items from the static table
        ├─► servicesItems(input)         E3: services-chosen, service-documents:<id> per service, service-area
        ├─► complianceItems(groups)      E4: from requirementGroups(...), already computed for the profile read
        │
        └─► completionView(items, flags) E5: percent (CR-2), groups (CR-3..CR-7), profileCompleted, serviceDocuments (CR-14)
```

`storedFlags(view, input, model)` (E6) gives the four flags and `profileCompleted` for `legacy` (today's
`completionOf`) or `groups` (from the view).

## L2 `GET /v1/worker/completion`

1. The pipeline: token, WORKER, limits.
2. One read: the profile read's rows (`readProfileRows`, its statement timeout); no row → 404 (BR-1 of the worker area).
3. L1; 200 with the view; private cache 60 s, ETag (the pipeline).

## L3 A write (unchanged path)

`replaceSection(..., { completion: true })` already re-reads the rows and calls `persistCompletion`; it now passes
`storedFlags(…, config.COMPLETION_MODEL)` instead of today's `completionOf` result. Under `legacy` the stored values
are identical to today's (a test asserts it).

## L4 The job `completion-sync`

1. Every 5 minutes, under the scheduler's lease (timeout 4 minutes).
2. The changed profile ids since the watermark (one statement over the tables in CR-11, as the reconciler's).
3. Once a day (the first run after 03:00 Australia/Sydney): every profile id instead.
4. For each batch of 200: read the rows, compute, `persistCompletion` when different, in one short transaction per
   batch; stop at the timeout and keep the watermark at the last finished batch.
5. Summary: `{ checked, changed, byFlag, fullPass }`, no ids or values.

## L5 The backfill

`scripts/backfill-completion.ts` (the S1 backfills' runner): the stage's database from `apps/api/.env`, every worker,
the stage's model or `--model=groups`; dry run prints counts per flag that would change; `--report` writes them with
profile ids (no names); `--apply` writes in batches with `persistCompletion`.

## L6 The release switch (at C2)

On production: set `COMPLETION_MODEL=groups` (the stages table + deploy, or the secret/env as the infra design says),
run the backfill `--model=groups` dry run, review, `--apply`, then merge C2. Rollback: set `legacy`, run the backfill
again (the old meaning back), promote the previous app.

## Where the code goes

| File | Holds |
|---|---|
| `apps/api/src/modules/worker/domain/completion-items.ts` | E1-E4, L1, `storedFlags` |
| `domain/completion.ts` | today's functions, unchanged (used by E4/E3 and as the oracle) |
| `application/get-profile.ts` | `completionInputOf` extended |
| `application/completion-view.ts` | L2's handler work |
| `modules/worker/completion-sync.job.ts` | L4 |
| `scripts/backfill-completion.ts` | L5 |
| `packages/api-contract/src/worker.contract.ts` | `completionViewSchema`, the entry `getCompletion` |
| `apps/api/src/config/*`, `infra/lib/stages.ts` | `COMPLETION_MODEL` |
| `docs/worker/README.md` §4 | the new model, the entry, the job, the switch |

## Property candidates (NFR Design, PBT-01)

- For any generated profile: the percent's numerator = the done required My Profile items; My Profile complete ⇔
  percent = 100; profile complete ⇔ the three groups.
- Under `legacy`, `storedFlags` = today's `completionOf` (exact).
- Where the rules agree (compliance, trainings, a service's documents), the new items' group state = today's flags.
- The job and the backfill are idempotent: a second run changes nothing.
- The view is a pure function of the rows (the same rows → the same body and ETag).
