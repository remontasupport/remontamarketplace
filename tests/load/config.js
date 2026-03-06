/**
 * Shared k6 configuration for Remonta load tests.
 *
 * Usage:
 *   Set BASE_URL and SESSION_TOKEN as environment variables before running:
 *     k6 run -e BASE_URL=http://localhost:3000 -e SESSION_TOKEN=<your-token> smoke.test.js
 *
 * How to get SESSION_TOKEN:
 *   1. Log in to the admin panel in your browser
 *   2. Open DevTools → Application → Cookies
 *   3. Copy the value of `next-auth.session-token` (or `__Secure-next-auth.session-token` on HTTPS)
 */

export const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'

/** Cookie header for authenticated requests. */
// Production (HTTPS) uses __Secure- prefix; localhost uses plain name
const cookieName = (BASE_URL.startsWith('https'))
  ? '__Secure-next-auth.session-token'
  : 'next-auth.session-token'

export const AUTH_COOKIE = __ENV.SESSION_TOKEN
  ? `${cookieName}=${__ENV.SESSION_TOKEN}`
  : ''

export const HEADERS = {
  'Content-Type': 'application/json',
  Cookie: AUTH_COOKIE,
}

/** API endpoint under test */
export const CONTRACTORS_URL = `${BASE_URL}/api/admin/contractors`

// ---------------------------------------------------------------------------
// Shared thresholds — import and spread into your scenario's options object
// ---------------------------------------------------------------------------
export const THRESHOLDS = {
  // 95% of requests must complete under 2 s
  http_req_duration: ['p(95)<2000'],
  // No more than 1% of requests may fail (non-2xx / network errors)
  http_req_failed: ['rate<0.01'],
}

// ---------------------------------------------------------------------------
// Common filter query-strings used across test scenarios
// ---------------------------------------------------------------------------
export const SCENARIOS = {
  /** No filters — plain paginated list */
  baseList: `${CONTRACTORS_URL}?page=1&pageSize=20`,

  /** Text search */
  search: `${CONTRACTORS_URL}?search=support&page=1&pageSize=20`,

  /** Combined filters (no geo — stays on fast DB path) */
  filtered: `${CONTRACTORS_URL}?gender=female&typeOfSupport=ndis&languages=English&page=1&pageSize=20`,

  /** Distance search — triggers geocode + two-pass query */
  distance: `${CONTRACTORS_URL}?location=Sydney&within=25&page=1&pageSize=20`,
}
