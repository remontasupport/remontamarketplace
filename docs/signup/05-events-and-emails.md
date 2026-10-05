# 05 — After the sign-up: events, emails, jobs, audit

The submit only writes rows. Everything that talks to the outside world afterwards goes through the
**transactional outbox**: an `outbox_events` row written in the same transaction as the account, then
delivered by a background dispatcher in apps/api. So an email is never sent for an account that did not
commit, and a crash after the commit does not lose it.

## 1. Emails

| Email | Sent when | Subject | Sent by |
|---|---|---|---|
| Verification code | 4.4, when the worker clicks Send code | "`<code>` is your Remonta verification code" | Directly in the request (not the outbox) |
| Welcome | A new account committed (`WorkerRegistered`) | "Welcome to Remonta -- your account is ready" — links to `<APP_BASE_URL>/login` | Outbox |
| Existing-account notice | Someone submitted with an email that already has an account (`RegistrationAttemptOnExistingAccount`) | "Someone tried to create a Remonta account with your email" — suggests signing in or resetting the password | Outbox |

All are sent through Resend from `Remonta <community@remontaservices.com.au>`. Each send carries an
idempotency key (`email-code/<ticket>`, `registration-confirmation/<event id>`, …), so a retry never sends a
second copy. The existing-account notice is sent at most once per account per 10 minutes, and not at all
in the first 10 minutes after the account was created (that is the browser retrying its own sign-up).

Deliverability: on 2026-10-01 a code email landed in Spam on the staging test; the form now tells the
worker to check Spam. Checking SPF / DKIM / DMARC for `remontaservices.com.au` in Resend is open.

## 2. Outbox events

| `type` | Payload | Handler does |
|---|---|---|
| `WorkerRegistered` | `{ userId, workerProfileId }` | Reads the user's email and first name at send time; sends the welcome email |
| `RegistrationAttemptOnExistingAccount` | `{ userId }` | Sends the existing-account notice |
| `PhotoUploaded` | `{ photoUploadId, workerProfileId }` | Bucket rows only (U3). Reads the staging object from the private bucket, applies the orientation, resizes inside 1600 px, re-encodes as JPEG with every metadata block removed, writes it and a 256 px thumbnail to Vercel Blob under `workers/<profileId>/`, sets `worker_profiles.photos` to the Blob URL, deletes the staging object. At most 2 in flight per instance. Undecodable bytes: stored as uploaded under the profile instead, logged `photo-processing-fallback` (a log-based metric). Idempotent on re-run |

Payloads carry ids only; names and addresses are read when sending, so no personal data sits in the
outbox.

**Not built yet:** the CRM notification (n8n → Zoho) for api-mode sign-ups. Until it is, api-mode sign-ups
do not reach Zoho; staging's `N8N_REGISTRATION_WEBHOOK_URL` is blank on purpose. It is a hard gate
before production.

### Delivery and retries

| Setting | Value |
|---|---|
| Poll interval | every 2 s (`OUTBOX_POLL_MS`) |
| Claim | due `PENDING` events, plus `PROCESSING` events whose lease expired; sets `PROCESSING`, `attempts + 1`, `lockedUntil` = handler timeout + 30 s |
| Success | `DONE`, `processedAt` set |
| Failure | back to `PENDING`, retried after 2, 4, 8, 16, 32 minutes |
| Give up | after the 6th failed attempt (about 62 minutes), or at once on a permanent failure (bad payload, user gone, provider refusal): `DEAD`, logged with `alert: outbox-dead-letter`, which fires a Cloud Monitoring alert email |
| Retention | `DONE` rows deleted after 30 days; `DEAD` rows kept |

Status meanings: [04 §9](04-enums.md#9-outboxstatus--outbox_eventsstatus).

## 3. Scheduled jobs in apps/api

A database lease makes only one instance run each job at a time (`scheduled_jobs` table: `name`,
`lockedUntil`, `lastStartedAt`, `lastFinishedAt`, `lastResult`, `watermark`).

| Job (`scheduled_jobs.name`) | Every | Does |
|---|---|---|
| `onboarding-reconciler` | 5 min (`RECONCILER_INTERVAL_MS`) | Re-derives `worker_onboarding` stages and counts from the source rows; writes a `RECONCILER` transition when a stage changes |
| `purge-unclaimed-registration-photos` | daily | Deletes confirmed photos (object first, from the store the key names; then the row) never claimed within 24 h. Objects never confirmed have no row: the bucket's lifecycle rule deletes `staging/` objects after a day. Summary: `deletedGcs`, `deletedBlob`, `skippedUnknownStore`, `failed` |
| `outbox-retention` | daily | Deletes `DONE` outbox events older than 30 days |
| `rate-limit-purge` | 10 min | Deletes expired `rate_limit_buckets` rows |

## 4. Audit

| Situation | `audit_logs` row |
|---|---|
| New account | One `ACCOUNT_REGISTERED` row, in the same transaction ([03 §2.7](03-data-model.md#27-audit_logs)) |
| Existing email | None (nothing about the account changed); the pipeline records the skip in the log |
| Refused (400/403/429) | None |

The pipeline enforces it: the submit is declared with `audit: 'ACCOUNT_REGISTERED'`, and a successful
handler that neither records nor explicitly skips the audit is an error.

## 5. Logs and alerts

The api logs JSON to Cloud Logging (90-day retention). Every line carries the `requestId` that the error
response also returns, so a worker's error can be traced. Alerts (email to support@remontaservices.com.au):
staging — instance down, outbox dead letter; production adds 5xx ratio, p95 latency, request failed, will
not start.
