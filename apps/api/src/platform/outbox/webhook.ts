// One JSON POST to an n8n webhook from an outbox handler (admin-clients U1, worker-zoho-sync U1). Success returns;
// a failure throws for the dispatcher: a 4xx other than 408/429, or a host the safe client blocks, will not improve on
// retry (PermanentFailure -> DEAD); anything else is retried with backoff.
import { PermanentFailure } from '../errors'
import type { SafeHttpClient } from '../http/safe-http-client'

const WEBHOOK_TIMEOUT_MS = 10_000

/** `name` labels the failure in the event's last error ("<name> webhook failed: status 404"). */
export async function postWebhook(http: SafeHttpClient, url: string, body: unknown, name: string): Promise<void> {
  const res = await http.request({
    method: 'POST',
    url,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    timeoutMs: WEBHOOK_TIMEOUT_MS,
  })
  if (res.ok) return
  const e = res.error
  const permanent = e.kind === 'blocked' || (e.kind === 'status' && e.status >= 400 && e.status < 500 && e.status !== 408 && e.status !== 429)
  const reason = `${name} webhook failed: ${e.kind}${e.kind === 'status' ? ` ${e.status}` : ''}`
  throw permanent ? new PermanentFailure(reason) : new Error(reason)
}
