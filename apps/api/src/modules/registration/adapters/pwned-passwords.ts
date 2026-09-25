// Breached-password check (S1-design 3.3): HaveIBeenPwned's range API with
// k-anonymity -- only the first 5 characters of the SHA-1 leave the server, and
// padding hides how many suffixes matched. Unreachable -> "unknown": the sign-up
// continues and the gap is recorded (Q2 = A), because a third-party outage must
// not stop people registering.
import { createHash } from 'node:crypto'
import * as z from 'zod'
import type { SafeHttpClient } from '../../../platform/http/safe-http-client'

export type BreachCheck = { status: 'breached'; count: number } | { status: 'clear' } | { status: 'unknown'; reason: string }

export interface BreachedPasswordChecker {
  check(password: string): Promise<BreachCheck>
}

const rangeBody = z.string().max(2_000_000)

export class PwnedPasswordsChecker implements BreachedPasswordChecker {
  constructor(private readonly http: SafeHttpClient) {}

  async check(password: string): Promise<BreachCheck> {
    const sha1 = createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase()
    const prefix = sha1.slice(0, 5)
    const suffix = sha1.slice(5)
    const res = await this.http.request({
      method: 'GET',
      url: `https://api.pwnedpasswords.com/range/${prefix}`,
      headers: { 'add-padding': 'true', 'user-agent': 'remonta-api' },
      schema: rangeBody,
      responseType: 'text',
    })
    if (!res.ok) return { status: 'unknown', reason: res.error.kind }
    for (const line of res.data.split('\n')) {
      const [s, n] = line.trim().split(':')
      if (s === suffix) {
        const count = Number(n)
        // Padding entries carry a count of 0: not a breach.
        return count > 0 ? { status: 'breached', count } : { status: 'clear' }
      }
    }
    return { status: 'clear' }
  }
}
