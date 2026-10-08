// One canonical spelling of a query (U2 admin-search, R8.5): the page builds its URLs
// with it, the api keys its response memo with it, and the browser's HTTP cache sees
// the same URL for the same filters whatever order they were set in. Keys sorted,
// arrays sorted and comma-joined, absent values dropped, URL-encoded.
import type { EntryDef } from './define'

/** The parsed (validated, defaulted) query of an entry, as one deterministic query string without the `?`. */
export function serializeCanonical(parsed: Record<string, unknown>): string {
  const params = new URLSearchParams()
  for (const key of Object.keys(parsed).sort()) {
    const v = parsed[key]
    if (v === undefined || v === null) continue
    if (Array.isArray(v)) {
      const items = [...new Set(v.map((x) => String(x)))].sort()
      if (items.length === 0) continue
      params.set(key, items.join(','))
    } else {
      params.set(key, String(v))
    }
  }
  return params.toString()
}

/**
 * The canonical query string of raw input (strings, as a URL carries them) for an
 * entry: the input is validated and defaulted by the entry's own schema first, so an
 * invalid query throws the same error the api would answer with.
 */
export function canonicalQueryOf(entry: Pick<EntryDef, 'query'>, input: unknown): string {
  if (!entry.query) return ''
  return serializeCanonical(entry.query.parse(input ?? {}) as Record<string, unknown>)
}
