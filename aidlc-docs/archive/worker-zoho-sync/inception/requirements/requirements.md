# worker-zoho-sync -- requirements (2026-11-10)

## Goal (user, 2026-11-10)
When `worker_profiles."setupProgress".accountDetails` changes, the worker's record in Zoho is updated in near real time.

## Decisions (user answers, 2026-11-10)
- D1 Record and matching: **n8n decides**. The api sends identifiers (worker profile id, user id, email, name,
  `zohoLeadId` when present); the n8n workflow finds the Zoho record and updates it.
- D2 Route: **n8n webhook**, the same pattern as the admin status change (`N8N_SERVICE_REQUEST_WEBHOOK_URL`).
- D3 Zoho change: **one status field** (named and mapped in n8n; the api sends `accountDetails: true|false`).
- D4 **Both directions**: false -> true and true -> false.
- D5 Existing workers already complete: **no one-off send** (not chosen).

## Functional requirements
- FR-1 Every change of `accountDetails` (either direction) written by `persistCompletion` queues one outbox event in
  the same transaction as the write. No event when the flag does not change (other flags changing alone: none).
- FR-2 The event carries ids only; the handler reads the worker fresh at send time and posts
  `{ event: 'WorkerAccountDetailsChanged', accountDetails, workerProfileId, userId, email, firstName, lastName,
  zohoLeadId, changedAt }` to `N8N_WORKER_PROFILE_WEBHOOK_URL`. `accountDetails` is the value **at send time** (a
  quick true->false->true sends the current state twice, never a stale one).
- FR-3 Delivery by the existing dispatcher: retries with backoff, then DEAD; a 4xx other than 408/429 is permanent.
- FR-4 URL absent or `off` (staging by default): the event completes with a warning, nothing is sent.

## Non-functional
- Latency: seconds after a worker's own save; up to ~5 min when the `completion-sync` job flips the flag (admin
  document review, expiry), since that job runs every 5 minutes.
- No new service, no new table, no migration. One new secret per stage.
- Never on staging: the production n8n webhook (preview rule). Staging stays `off` or a test workflow.

## Out of scope
- The n8n workflow itself (built by the user in n8n; the api's body is its contract).
- The other three flags, `profileCompleted`, the sign-up CRM notification (follow-up 2).
