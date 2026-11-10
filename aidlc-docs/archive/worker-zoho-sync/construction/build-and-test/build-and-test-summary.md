# worker-zoho-sync -- build and test summary

## Gates
- Local: api quality 1166 passed / 253 skipped (database tests skip: Docker down here); infra 43 passed.
- CI on #157 and #158: API Quality (Node 20, 22; PostGIS: the new `profile.int.test.ts` case and the dispatcher case),
  Infra Quality, Supply chain, CodeQL, Semgrep: all green.

## Staging
- 01:06:19Z `confirmPhoto` on the new revision queued the event; 01:06:20Z the old revision `00076-zrm` claimed it and
  marked it DEAD (no handler). Root cause of #158.
- 01:19-01:21Z (`00077-c57`): removePhoto / confirmPhoto / removePhoto, each followed within ~1 s by "worker profile
  webhook off: nothing sent" (one event per change, both directions).
- `00078-q4g` = `167bc28`: no errors.

## Production
- `00030-89z` = `167bc28`, 100 %; no ERROR / DEAD / retry entries after the switch-over; saves on 00030 from 01:30:55Z;
  the user confirmed n8n and Zoho.

## Deviations from the plan
- `changedAt` replaced by `eventId` in the body (the idempotency key).
- `persistCompletion` uses `enqueue`'s default clock (the app clock) instead of a new `now` argument.
- #158 was not planned (found on staging).
- Secrets were created by the assistant (create + accessor + staging `off`); the production value was added by the user.

## Known limits (carried as follow-ups)
- Workers already complete before 2026-11-10 were never sent (D5).
- A manual `setupProgress` edit in Neon sends nothing (no trigger) and is recomputed by `completion-sync`.
- A backfill or a `COMPLETION_MODEL` switch sends every flipped worker to n8n (docs/worker/README.md §4).
- A rollback to `fc194e8` makes Account Details events DEAD while it runs; requeue after rolling forward.
