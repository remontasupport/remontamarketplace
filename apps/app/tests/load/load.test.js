/**
 * Load test — simulates realistic production traffic.
 *
 * Profile:
 *   0 → 15 VUs over 1 min  (ramp up)
 *   15 VUs for 3 min        (sustained load)
 *   15 → 0 VUs over 1 min  (ramp down)
 *   Total wall-clock: ~5 min
 *
 * Traffic mix (weighted):
 *   50% base list  — most common admin action
 *   25% filtered   — common filter usage
 *   15% search     — text search
 *   10% distance   — geo search (most expensive)
 *
 * Run:
 *   k6 run -e BASE_URL=http://localhost:3000 -e SESSION_TOKEN=<token> tests/load/load.test.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'
import { HEADERS, SCENARIOS, THRESHOLDS } from './config.js'

const errorRate = new Rate('errors')

export const options = {
  stages: [
    { duration: '1m', target: 15 },
    { duration: '3m', target: 15 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    ...THRESHOLDS,
    // Custom error-rate metric must stay below 1%
    errors: ['rate<0.01'],
  },
}

/** Weighted random scenario selector */
function pickScenario() {
  const rand = Math.random()
  if (rand < 0.50) return ['baseList', SCENARIOS.baseList]
  if (rand < 0.75) return ['filtered', SCENARIOS.filtered]
  if (rand < 0.90) return ['search', SCENARIOS.search]
  return ['distance', SCENARIOS.distance]
}

export default function () {
  const [name, url] = pickScenario()
  const res = http.get(url, { headers: HEADERS, tags: { scenario: name } })

  const ok = check(res, {
    'status 200': (r) => r.status === 200,
    'valid JSON': (r) => {
      try { JSON.parse(r.body); return true } catch { return false }
    },
    'success true': (r) => {
      try { return JSON.parse(r.body).success === true } catch { return false }
    },
  })

  errorRate.add(!ok)

  // Think time: 1–3 s between requests (simulates admin reading results)
  sleep(1 + Math.random() * 2)
}
