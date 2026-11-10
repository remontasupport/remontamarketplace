# worker-zoho-sync -- execution plan (2026-11-10)

One unit, **U1 `account-details-webhook`** (apps/api + infra), one PR.

## Reuses (CS-1..CS-5: no new layer)
- `persistCompletion` (the single writer of `setupProgress`) -- the trigger point; it already compares old/new flags.
- `enqueue` (platform/outbox) inside the caller's transaction; the dispatcher's retries/DEAD.
- The handler shape of `admin/outbox/service-request-webhook.ts`: the permanent/transient split is moved into one
  shared helper `postWebhook(http, url, body)` used by both handlers (removes the copy instead of making a second).
- Config: one `N8N_WORKER_PROFILE_WEBHOOK_URL` entry like `N8N_SERVICE_REQUEST_WEBHOOK_URL` (`off` allowed, its host in
  the egress allow-list); `infra/lib/stages.ts` secret list; `render`.

## Adds
- `worker/domain/events.ts`: `WORKER_ACCOUNT_DETAILS_CHANGED` + zod payload `{ workerProfileId }`.
- `persistCompletion`: when `accountDetails` differs from the stored flag, `enqueue(tx, ...)` (a `now` argument from
  the callers' clock).
- `worker/outbox/account-details-webhook.ts`: the handler (FR-2..FR-4); registered in `main.ts`.
- Tests: persistCompletion enqueues on each direction and not otherwise (unit + PBT over flag pairs); the handler's
  body, `off`, 4xx permanent / 5xx retry; database test: the event row commits with the write and rolls back with it.
- Docs: `docs/worker/README.md` (the event and body), `infra/README.md` (the secret).

## Rollout
1. Secrets `remonta-api[-staging]-N8N_WORKER_PROFILE_WEBHOOK_URL` (staging `off` or an n8n test workflow; prod the
   real webhook) -- user runs `printf '%s' ... | gcloud secrets versions add`.
2. PR -> CI -> merge -> staging deploy. Preview checklist + on staging: complete Account Details for a test worker,
   see the outbox row DONE (and, with a test webhook, the body arriving in n8n); undo it, see the false event.
3. Promote the full sha to prod. Check: the first real event DONE, the Zoho field changes.
4. Rollback: previous image (`fc194e8...`); events queued meanwhile stay in the outbox, harmless (no handler -> they
   wait/DEAD; check before promoting back).

## Needed from the user
- The n8n webhook URL(s) (prod; optional test one for staging) and the Zoho field's name for the workflow.
