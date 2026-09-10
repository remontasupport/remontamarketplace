/**
 * Edit Profile (PATCH /api/client/participants/[id]) Load Test
 *
 * Simulates 500 support coordinators editing their clients' profiles simultaneously.
 * 50 coordinators × 10 participants each = 500 unique (coordinator, participant) pairs.
 * Each VU gets its own dedicated coordinator session + participant — no contention.
 *
 * Seed (run in Neon console before testing):
 *   See tests/load/seed-coordinators.sql
 *
 * Run (dev):
 *   k6 run -e BASE_URL=http://localhost:3000 -e ACCOUNT_PASS=K6Coord123! tests/load/edit-profile.test.js
 *
 * Run (production):
 *   k6 run -e BASE_URL=https://app.remontaservices.com.au -e ACCOUNT_PASS=K6Coord123! tests/load/edit-profile.test.js
 *
 * Cleanup (run in Neon console after testing):
 *   DELETE FROM participants          WHERE id LIKE 'k6ppt%';
 *   DELETE FROM coordinator_profiles  WHERE "userId" LIKE 'k6crd%';
 *   DELETE FROM "User"                WHERE id LIKE 'k6crd%';
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const BASE_URL      = __ENV.BASE_URL      || 'http://localhost:3000'
const ACCOUNT_PASS  = __ENV.ACCOUNT_PASS  || 'K6Coord123!'

// Dev: use 10 coordinators (faster setup — ~10 bcrypt signins)
// Production: use 50 coordinators (50 × 10 = 500 unique pairs)
const COORDINATOR_COUNT      = parseInt(__ENV.COORDINATOR_COUNT || '10')
const PARTICIPANTS_PER_COORD = 10

const CSRF_URL   = `${BASE_URL}/api/auth/csrf`
const SIGNIN_URL = `${BASE_URL}/api/auth/callback/credentials`

const patchDuration = new Trend('patch_duration', true)
const errorRate     = new Rate('errors')

export const options = {
  setupTimeout: '3m', // bcrypt signins in setup() can be slow on dev
  scenarios: {
    edit_profile: {
      executor: 'ramping-vus',
      stages: [
        { duration: '1m',  target: 250 }, // ramp up
        { duration: '2m',  target: 500 }, // sustained load
        { duration: '1m',  target: 0   }, // ramp down
      ],
    },
  },
  thresholds: {
    patch_duration:  ['p(95)<3000', 'p(99)<5000'],
    errors:          ['rate<0.05'],
    http_req_failed: ['rate<0.05'],
  },
}

// ============================================================================
// HELPERS
// ============================================================================

function signIn(email, csrfToken, csrfCookie) {
  const payload = [
    `email=${encodeURIComponent(email)}`,
    `password=${encodeURIComponent(ACCOUNT_PASS)}`,
    `csrfToken=${encodeURIComponent(csrfToken)}`,
    `callbackUrl=${encodeURIComponent(BASE_URL)}`,
    `json=true`,
  ].join('&')

  return http.post(SIGNIN_URL, payload, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: csrfCookie },
    redirects: 0,
  })
}

function extractSessionCookie(setCookieHeader) {
  const cookieName = BASE_URL.startsWith('https')
    ? '__Secure-next-auth.session-token'
    : 'next-auth.session-token'
  const match = setCookieHeader.match(new RegExp(`${cookieName}=([^;]+)`))
  return match ? `${cookieName}=${match[1]}` : null
}

function padded(n) {
  return String(n).padStart(4, '0')
}

// ============================================================================
// SETUP — signs in all 50 coordinators once, builds session pool with participant lists
// ============================================================================

export function setup() {
  const sessions = []

  for (let c = 1; c <= COORDINATOR_COUNT; c++) {
    const email = `k6coord_${c}@test-remonta.com`

    try {
      const csrfRes = http.get(CSRF_URL)
      if (csrfRes.status !== 200) {
        console.error(`[setup] CSRF failed for ${email} — status ${csrfRes.status}: ${csrfRes.body}`)
        continue
      }

      const csrfBody = JSON.parse(csrfRes.body)
      const csrfCookie = csrfRes.headers['Set-Cookie'] || ''
      const res = signIn(email, csrfBody.csrfToken, csrfCookie)

      const sessionCookie = extractSessionCookie(res.headers['Set-Cookie'] || '')
      if (!sessionCookie) {
        console.error(`[setup] No session cookie for ${email} — status ${res.status}, body: ${res.body.substring(0, 200)}`)
        continue
      }

      const participantIds = []
      for (let p = 1; p <= PARTICIPANTS_PER_COORD; p++) {
        participantIds.push('k6ppt' + padded((c - 1) * PARTICIPANTS_PER_COORD + p))
      }

      sessions.push({ cookie: sessionCookie, participantIds, coordIndex: c })
    } catch (err) {
      console.error(`[setup] Exception signing in ${email}: ${err}`)
    }
  }

  console.log(`[setup] Signed in ${sessions.length}/${COORDINATOR_COUNT} coordinators`)
  if (sessions.length === 0) {
    console.error('[setup] No sessions — did you run the SQL seed in Neon dev console?')
  }
  return { sessions }
}

// ============================================================================
// VU DEFAULT — each VU gets its own coordinator + dedicated participant
// ============================================================================

export default function ({ sessions }) {
  if (!sessions || sessions.length === 0) {
    console.error('No sessions — check setup()')
    return
  }

  // VU 1-50   → coordinator 1, participant sub-index 0
  // VU 51-100 → coordinator 1, participant sub-index 1  (etc.)
  const vuIndex        = __VU - 1
  const coordIndex     = vuIndex % COORDINATOR_COUNT
  const participantSub = Math.floor(vuIndex / COORDINATOR_COUNT) % PARTICIPANTS_PER_COORD

  const session       = sessions[coordIndex]
  const participantId = session.participantIds[participantSub]
  const url           = `${BASE_URL}/api/client/participants/${participantId}`

  group('patch participant', () => {
    const start = Date.now()
    const res = http.patch(url, JSON.stringify({
      firstName:      'K6Updated',
      lastName:       `Participant${session.coordIndex}_${participantSub + 1}`,
      gender:         'prefer_not_to_say',
      additionalInfo: `Coord ${session.coordIndex} — iteration ${__ITER}`,
    }), {
      headers: {
        'Content-Type': 'application/json',
        Cookie: session.cookie,
      },
    })
    patchDuration.add(Date.now() - start)

    const ok = check(res, {
      'status 200':   (r) => r.status === 200,
      'success true': (r) => { try { return JSON.parse(r.body).success === true } catch { return false } },
    })
    errorRate.add(!ok)
  })

  sleep(1)
}

// ============================================================================
// SUMMARY
// ============================================================================

export function handleSummary(data) {
  const d = data.metrics.patch_duration
  const e = data.metrics.errors

  console.log('\n=== Edit Profile (Coordinator) Test Summary ===')
  console.log(`Total requests : ${data.metrics.http_reqs?.values?.count ?? 0}`)
  console.log(`Avg duration   : ${d?.values?.avg?.toFixed(0) ?? '-'}ms`)
  console.log(`p(95) duration : ${d?.values?.['p(95)']?.toFixed(0) ?? '-'}ms`)
  console.log(`p(99) duration : ${d?.values?.['p(99)']?.toFixed(0) ?? '-'}ms`)
  console.log(`Error rate     : ${((e?.values?.rate ?? 0) * 100).toFixed(2)}%`)
  console.log('===============================================\n')
  console.log('Cleanup SQL:')
  console.log("  DELETE FROM participants         WHERE id LIKE 'k6ppt%';")
  console.log("  DELETE FROM coordinator_profiles WHERE \"userId\" LIKE 'k6crd%';")
  console.log("  DELETE FROM \"User\"               WHERE id LIKE 'k6crd%';")

  return {}
}
