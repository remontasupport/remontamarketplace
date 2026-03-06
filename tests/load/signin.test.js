/**
 * Sign-in Load Test
 *
 * Tests NextAuth CredentialsProvider login flow:
 *   Step 1 — GET  /api/auth/csrf              → get CSRF token + cookie
 *   Step 2 — POST /api/auth/callback/credentials → submit credentials
 *
 * Scenarios covered:
 *   1. Valid login (worker)          → expects redirect (no error)
 *   2. Invalid password              → expects error in redirect URL
 *   3. Missing credentials           → expects error
 *
 * Run (development):
 *   k6 run \
 *     -e BASE_URL=http://localhost:3000 \
 *     -e WORKER_COUNT=10 \
 *     -e WORKER_PASS=K6Worker123! \
 *     tests/load/signin.test.js
 *
 * Run (production — 100 users, valid login only):
 *   k6 run \
 *     -e BASE_URL=https://app.remontaservices.com.au \
 *     -e WORKER_COUNT=100 \
 *     -e WORKER_PASS=K6Worker123! \
 *     -e LOAD_ONLY=true \
 *     tests/load/signin.test.js
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const BASE_URL    = __ENV.BASE_URL     || 'http://localhost:3000'
const CSRF_URL    = `${BASE_URL}/api/auth/csrf`
const SIGNIN_URL  = `${BASE_URL}/api/auth/callback/credentials`

const WORKER_PASS  = __ENV.WORKER_PASS || ''
const WORKER_COUNT = parseInt(__ENV.WORKER_COUNT || '10')

// Generate emails from pattern: k6worker_1@test-remonta.com ... k6worker_N@test-remonta.com
// Each VU gets its own account — no lockout collisions
const WORKER_EMAIL = `k6worker_${((__VU - 1) % WORKER_COUNT) + 1}@test-remonta.com`

// Set LOAD_ONLY=true in production to skip error scenarios (avoids lockouts at scale)
const LOAD_ONLY = __ENV.LOAD_ONLY === 'true'

const signinDuration = new Trend('signin_duration', true)
const errorRate      = new Rate('errors')

export const options = {
  scenarios: {
    signin_load: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m',  target: 50  }, // ramp up
        { duration: '3m',  target: 100 }, // sustained load
        { duration: '1m',  target: 0   }, // ramp down
      ],
    },
  },
  thresholds: {
    // Sign-in should complete under 5s (bcrypt verify + Redis cache + JWT issue)
    signin_duration: ['p(95)<5000'],
    errors: ['rate<0.05'],
    http_req_failed: ['rate<0.05'],
  },
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Fetches a fresh CSRF token and returns { csrfToken, cookie }.
 * NextAuth requires the CSRF cookie to match the token in the body.
 */
function getCsrf() {
  const res = http.get(CSRF_URL)
  const body = JSON.parse(res.body)
  const cookie = res.headers['Set-Cookie'] || ''
  return { csrfToken: body.csrfToken, cookie }
}

/**
 * Submits credentials to NextAuth.
 * NextAuth expects application/x-www-form-urlencoded with csrfToken.
 * Returns the response.
 */
function signIn(email, password, csrfToken, cookie) {
  const payload = [
    `email=${encodeURIComponent(email)}`,
    `password=${encodeURIComponent(password)}`,
    `csrfToken=${encodeURIComponent(csrfToken)}`,
    `callbackUrl=${encodeURIComponent(BASE_URL)}`,
    `json=true`,
  ].join('&')

  return http.post(SIGNIN_URL, payload, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Cookie: cookie,
    },
    redirects: 0, // Capture redirect instead of following it
  })
}

/** Returns true if response indicates a successful login (redirect to dashboard, not error page) */
function isLoginSuccess(res) {
  if (res.status === 200) {
    try {
      const body = JSON.parse(res.body)
      return body.url && !body.url.includes('error')
    } catch { return false }
  }
  // NextAuth may return 302 redirect on success
  if (res.status === 302) {
    const location = res.headers['Location'] || ''
    return !location.includes('error')
  }
  return false
}

/** Returns true if response indicates a failed login (redirected to error page) */
function isLoginError(res) {
  const location = res.headers['Location'] || ''
  if (res.status === 302) return location.includes('error')
  if (res.status === 200) {
    try {
      const body = JSON.parse(res.body)
      return body.url?.includes('error')
    } catch { return false }
  }
  return false
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

export default function () {

  // ── 1. Valid worker login ─────────────────────────────────────────────────
  group('valid worker login', () => {
    if (!WORKER_EMAIL || !WORKER_PASS) return

    const { csrfToken, cookie } = getCsrf()
    const start = Date.now()
    const res = signIn(WORKER_EMAIL, WORKER_PASS, csrfToken, cookie)
    signinDuration.add(Date.now() - start)

    const ok = check(res, {
      '[worker] login succeeds': () => isLoginSuccess(res),
      '[worker] no error in redirect': () => !isLoginError(res),
    })
    errorRate.add(!ok)
    sleep(1)
  })

  // ── 2. Invalid password (skipped in load test — causes lockouts at scale) ──
  if (!LOAD_ONLY) {
    group('invalid password', () => {
      if (!WORKER_EMAIL) return

      const { csrfToken, cookie } = getCsrf()
      const res = signIn(WORKER_EMAIL, 'WrongPassword999!', csrfToken, cookie)

      check(res, {
        '[invalid-pass] redirects to error': () => isLoginError(res),
        '[invalid-pass] not 500': () => res.status !== 500,
      })
      sleep(1)
    })

    // ── 3. Missing credentials ──────────────────────────────────────────────
    group('missing credentials', () => {
      const { csrfToken, cookie } = getCsrf()
      const res = signIn('', '', csrfToken, cookie)

      check(res, {
        '[missing-creds] returns error': () => isLoginError(res) || res.status === 400,
        '[missing-creds] not 500': () => res.status !== 500,
      })
      sleep(0.5)
    })
  }
}

// ============================================================================
// SUMMARY
// ============================================================================

export function handleSummary(data) {
  const d = data.metrics.signin_duration
  const e = data.metrics.errors

  console.log('\n=== Sign-in Test Summary ===')
  console.log(`Total requests : ${data.metrics.http_reqs?.values?.count ?? 0}`)
  console.log(`Avg duration   : ${d?.values?.avg?.toFixed(0) ?? '-'}ms`)
  console.log(`p(95) duration : ${d?.values?.['p(95)']?.toFixed(0) ?? '-'}ms`)
  console.log(`p(99) duration : ${d?.values?.['p(99)']?.toFixed(0) ?? '-'}ms`)
  console.log(`Error rate     : ${((e?.values?.rate ?? 0) * 100).toFixed(2)}%`)
  console.log('============================\n')

  return {}
}
