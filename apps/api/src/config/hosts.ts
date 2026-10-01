// Host and origin allow-lists that may carry ONE wildcard label (D11, 2026-09-30).
//
// Staging must admit Vercel previews, whose hostnames differ per deployment
// (remonta-app-<hash>-<team>.vercel.app). So an entry may be `*.vercel.app`
// (hostnames) or `https://*.vercel.app` (origins): the `*` stands for exactly one
// DNS label, never for a dot, never for the empty string, and never for localhost.
// Production keeps exact values; the deploy stage table (infra/lib/stages.ts) is the
// only place that hands the api a wildcard. Everything else is an exact,
// case-insensitive match. No regular expressions are built from input.

const LABEL = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/i

/** A hostname pattern: exact (`app.example.com`) or one leading wildcard label (`*.example.com`). */
export function isHostPattern(p: string): boolean {
  const labels = p.split('.')
  if (labels.length < 2) return LABEL.test(p) // a bare host such as localhost
  const [first, ...rest] = labels
  if (rest.length === 0) return false
  if (first === '*') return rest.length >= 2 && rest.every((l) => LABEL.test(l))
  return labels.every((l) => LABEL.test(l))
}

/** Does `hostname` match `pattern` (exact, or one label under a `*.` pattern)? */
export function hostMatches(pattern: string, hostname: string): boolean {
  const h = hostname.toLowerCase()
  const p = pattern.toLowerCase()
  if (!p.startsWith('*.')) return p === h
  const suffix = p.slice(1) // ".example.com"
  if (!h.endsWith(suffix)) return false
  const label = h.slice(0, h.length - suffix.length)
  return LABEL.test(label) // exactly one label, non-empty, no dots
}

export function hostAllowed(patterns: readonly string[], hostname: string): boolean {
  return patterns.some((p) => hostMatches(p, hostname))
}

/**
 * An origin pattern: an exact origin (`https://app.example.com`, `http://localhost:3000`)
 * or `https://*.example.com`. A wildcard origin must be https and have no port.
 */
export function isOriginPattern(o: string): boolean {
  const wild = o.match(/^https:\/\/(\*\.[^/:?#]+)$/)
  if (wild) return isHostPattern(wild[1]!)
  try {
    const u = new URL(o)
    const local = u.hostname === 'localhost' || u.hostname === '127.0.0.1'
    // The URL parser tolerates `*` in a hostname; an exact origin must be a real one.
    const realHost = local || (isHostPattern(u.hostname) && !u.hostname.startsWith('*'))
    return realHost && (u.protocol === 'https:' || (u.protocol === 'http:' && local)) && u.origin === o
  } catch {
    return false
  }
}

/** Does a request's Origin header value match one of the patterns? */
export function originAllowed(patterns: readonly string[], origin: string): boolean {
  let u: URL
  try {
    u = new URL(origin)
  } catch {
    return false
  }
  if (u.origin !== origin) return false
  return patterns.some((p) => {
    const wild = p.match(/^https:\/\/(\*\.[^/:?#]+)$/)
    if (wild) return u.protocol === 'https:' && u.port === '' && hostMatches(wild[1]!, u.hostname)
    return p.toLowerCase() === origin.toLowerCase()
  })
}
