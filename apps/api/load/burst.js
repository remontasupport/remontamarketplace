// k6 burst test (step 5b). A sign-up burst far above one instance's hashing
// capacity, while a probe measures whether everything else on the instance still
// answers. Run against load/harness.ts now; against the real registration endpoint
// in step 12.
//
//   k6 run -e BASE_URL=http://127.0.0.1:4100 --summary-export=out.json load/burst.js
import http from 'k6/http'
import { check } from 'k6'
import { Trend, Rate } from 'k6/metrics'

const BASE = __ENV.BASE_URL || 'http://127.0.0.1:4100'
const healthLatency = new Trend('health_latency', true)
const healthOk = new Rate('health_ok')
const signupAccepted = new Rate('signup_accepted')
const signupShed = new Rate('signup_shed_503')
const signupAcceptedLatency = new Trend('signup_accepted_latency', true)

export const options = {
  scenarios: {
    // ~5x what one instance can hash (bcrypt cost 12 ~ 4/s per core).
    burst: { executor: 'constant-arrival-rate', exec: 'signup', rate: 20, timeUnit: '1s', duration: '20s', preAllocatedVUs: 50, maxVUs: 400 },
    probe: { executor: 'constant-arrival-rate', exec: 'health', rate: 2, timeUnit: '1s', duration: '20s', preAllocatedVUs: 5, maxVUs: 20 },
  },
  summaryTrendStats: ['med', 'p(95)', 'max'],
}

export function signup() {
  const r = http.post(`${BASE}/v1/load/signup`, null, { timeout: '30s', tags: { name: 'signup' } })
  signupAccepted.add(r.status === 202)
  signupShed.add(r.status === 503)
  if (r.status === 202) signupAcceptedLatency.add(r.timings.duration)
  check(r, { 'signup answered (202 or fast 503)': (x) => x.status === 202 || x.status === 503 })
}

export function health() {
  const r = http.get(`${BASE}/v1/health`, { timeout: '30s', tags: { name: 'health' } })
  healthOk.add(r.status === 200)
  healthLatency.add(r.timings.duration)
}
