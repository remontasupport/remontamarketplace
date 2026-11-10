# Worker Zoho sync (cycle closed 2026-11-10)

**Goal (user, 2026-11-10):** when `worker_profiles."setupProgress".accountDetails` changes, the worker's Zoho record is
updated in near real time. Decisions: n8n finds the Zoho record and sets one status field; the api posts to an n8n
webhook; both directions (true and false); no one-off send for workers already complete. A database-trigger design
(to catch manual Neon edits too) was offered and declined ("Do not switch").

## What shipped (live)

| PR | Content |
|---|---|
| #157 `6ae45a6` | U1 `account-details-webhook`: `persistCompletion` queues `WorkerAccountDetailsChanged` `{ workerProfileId }` in the writer's transaction when `accountDetails` changes; handler `modules/worker/outbox/account-details-webhook.ts` POSTs `{ event, eventId, accountDetails, workerProfileId, userId, email, firstName, lastName, zohoLeadId }` to `N8N_WORKER_PROFILE_WEBHOOK_URL` (`off` = nothing sent); `platform/outbox/webhook.ts` shared with the service request handler; secret in the stages table; `run-api.sh` forces it off |
| #158 `167bc28` | Fix found on staging: the outbox dispatcher claims only the event types it has a handler for (an old revision in a rollout overlap had marked the new event DEAD) |

Production at the close: api `remonta-api-00030-89z` = `167bc288da94aa91ea435d2ed7c2c28630e000cb`; app and web
unchanged in code (`main` `167bc28`, rollback point still the `972ff6b` builds). Secrets
`remonta-api[-staging]-N8N_WORKER_PROFILE_WEBHOOK_URL`: staging `off`, prod the n8n Production webhook URL. Verified
live by the user ("It works now!").

## Deviations

See `construction/build-and-test/build-and-test-summary.md`.

## Layout

`inception/` (requirements, execution plan), `construction/build-and-test/`, `aidlc-state-at-close.md`. The audit
trail is `aidlc-docs/audit.md` (2026-11-10 entries).
