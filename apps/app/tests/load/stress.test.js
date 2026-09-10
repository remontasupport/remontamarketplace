/**
 * Stress test — ramps VUs aggressively to find the breaking point.
 *
 * Profile:
 *   0  → 10  VUs  (1 min)  — warm up
 *   10 → 30  VUs  (2 min)  — moderate stress
 *   30 → 60  VUs  (2 min)  — high stress
 *   60 → 100 VUs  (2 min)  — extreme load
 *   100 VUs for 2 min      — hold at peak
 *   100 → 0  VUs  (1 min)  — cool down
 *   Total wall-clock: ~10 min
 *
 * What to watch:
 *   - At which VU level does p(95) latency cross 2 s?
 *   - At which VU level does error rate rise above 1%?
 *   - Does the API recover after VUs drop (resilience check)?
 *
 * Run:
 *   k6 run -e BASE_URL=http://localhost:3000 -e SESSION_TOKEN=<token> tests/load/stress.test.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'
import { HEADERS, SCENARIOS, THRESHOLDS } from './config.js'

const errorRate = new Rate('errors')
const distanceDuration = new Trend('distance_req_duration', true)

export const options = {
  stages: [
    { duration: '1m',  target: 10  },
    { duration: '2m',  target: 30  },
    { duration: '2m',  target: 60  },
    { duration: '2m',  target: 100 },
    { duration: '2m',  target: 100 },
    { duration: '1m',  target: 0   },
  ],
  thresholds: {
    // Stress thresholds are intentionally looser than load — goal is to find limits
    http_req_duration: ['p(95)<4000'],
    http_req_failed: ['rate<0.05'],
    errors: ['rate<0.05'],
  },
}

export default function () {
  // Cycle through all scenarios under stress — don't weight, hammer everything
  for (const [name, url] of Object.entries(SCENARIOS)) {
    const res = http.get(url, { headers: HEADERS, tags: { scenario: name } })

    if (name === 'distance') {
      distanceDuration.add(res.timings.duration)
    }

    const ok = check(res, {
      [`[${name}] status 200`]: (r) => r.status === 200,
      [`[${name}] no server error`]: (r) => r.status < 500,
    })

    errorRate.add(!ok)

    // Minimal think time under stress (0.2–0.5 s) to apply maximum pressure
    sleep(0.2 + Math.random() * 0.3)
  }
}
