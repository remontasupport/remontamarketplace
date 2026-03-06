/**
 * Client Registration Load Test
 *
 * Tests POST /api/auth/register/client with 100 total registrations.
 *
 * IMPORTANT:
 *   - Each iteration creates a REAL user in the database.
 *   - Clean up test records after: DELETE FROM users WHERE email LIKE 'k6test_%'
 *
 * Development (rate limiting disabled — all 100 go through):
 *   k6 run -e BASE_URL=http://localhost:3000 tests/load/registration.test.js
 *
 * Production (strict rate limit: 30 req/min — expect 429s beyond that):
 *   k6 run -e BASE_URL=https://app.remontaservices.com.au tests/load/registration.test.js
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const ENDPOINT = `${BASE_URL}/api/auth/register/client`
const HEADERS = { 'Content-Type': 'application/json' }

const errorRate = new Rate('errors')
const registrationDuration = new Trend('registration_duration', true)

export const options = {
  scenarios: {
    // 100 total registrations — 10 VUs × 10 iterations each
    registrations: {
      executor: 'per-vu-iterations',
      vus: 10,
      iterations: 10,
      maxDuration: '5m',
    },
  },
  thresholds: {
    // Registration should complete under 10s (bcrypt + DB write + webhook)
    registration_duration: ['p(95)<10000'],
    // Allow up to 5% errors (covers edge cases, not 429s)
    errors: ['rate<0.05'],
    http_req_failed: ['rate<0.05'],
  },
}

/** Unique email per VU + iteration — avoids 409 conflicts */
function uniqueEmail() {
  return `k6test_${__VU}_${__ITER}_${Date.now()}@test-remonta.com`
}

export default function () {
  // ── Valid self-registration ─────────────────────────────────────────────
  group('self registration', () => {
    const res = http.post(ENDPOINT, JSON.stringify({
      completingFormAs: 'self',
      firstName: 'Test',
      lastName: `User${__VU}${__ITER}`,
      mobile: '0400000000',
      email: uniqueEmail(),
      password: 'TestPassword123!',
      consent: true,
    }), { headers: HEADERS })

    registrationDuration.add(res.timings.duration)

    const ok = check(res, {
      'status 201': (r) => r.status === 201,
      'success true': (r) => {
        try { return JSON.parse(r.body).success === true } catch { return false }
      },
      'has user id': (r) => {
        try { return !!JSON.parse(r.body).user?.id } catch { return false }
      },
    })

    // 429 = rate limited (expected on production) — not a real failure
    errorRate.add(!ok && res.status !== 429)

    if (res.status === 429) {
      console.log(`[VU ${__VU}] Rate limited — sleeping 10s`)
      sleep(10)
    } else {
      sleep(1)
    }
  })
}

/** Runs once after all VUs finish — summary of results */
export function handleSummary(data) {
  const duration = data.metrics.registration_duration
  const reqs = data.metrics.http_reqs

  console.log('\n=== Registration Test Summary ===')
  console.log(`Total requests   : ${reqs?.values?.count ?? 0}`)
  console.log(`Avg duration     : ${duration?.values?.avg?.toFixed(0) ?? '-'}ms`)
  console.log(`p(95) duration   : ${duration?.values?.['p(95)']?.toFixed(0) ?? '-'}ms`)
  console.log(`p(99) duration   : ${duration?.values?.['p(99)']?.toFixed(0) ?? '-'}ms`)
  console.log(`Error rate       : ${((data.metrics.errors?.values?.rate ?? 0) * 100).toFixed(2)}%`)
  console.log('=================================\n')
  console.log('Cleanup query (run in your DB):')
  console.log("  DELETE FROM users WHERE email LIKE 'k6test_%';")

  return {}
}
