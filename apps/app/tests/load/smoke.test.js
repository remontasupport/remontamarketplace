/**
 * Smoke test — minimal sanity check.
 *
 * Goals:
 *   - Confirm the API is reachable and returns valid JSON
 *   - 1 VU, 10 iterations, no ramp-up
 *
 * Run:
 *   k6 run -e BASE_URL=http://localhost:3000 -e SESSION_TOKEN=<token> tests/load/smoke.test.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { HEADERS, SCENARIOS, THRESHOLDS } from './config.js'

export const options = {
  vus: 1,
  iterations: 10,
  thresholds: {
    ...THRESHOLDS,
    // Smoke should be fast — 99% under 1 s
    http_req_duration: ['p(99)<1000'],
  },
}

export default function () {
  // Hit every scenario once per iteration to verify all code paths
  for (const [name, url] of Object.entries(SCENARIOS)) {
    const res = http.get(url, { headers: HEADERS })

    console.log(`[${name}] status=${res.status} duration=${res.timings.duration.toFixed(0)}ms`)

    check(res, {
      [`[${name}] status 200`]: (r) => r.status === 200,
      [`[${name}] has data array`]: (r) => {
        try {
          const body = JSON.parse(r.body)
          return Array.isArray(body.data)
        } catch {
          return false
        }
      },
      [`[${name}] has pagination`]: (r) => {
        try {
          const body = JSON.parse(r.body)
          return typeof body.pagination?.total === 'number'
        } catch {
          return false
        }
      },
    })

    sleep(0.5)
  }
}
