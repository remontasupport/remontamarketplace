// Matching a worker's legacy location columns to an au_localities row -- used by
// the reconciler for workers who signed up through apps/app, and by the step 10
// backfill. It never guesses (S1-data-model 2.2): anything but exactly one
// candidate is reported, not placed.
//
// The `location` string is tried first, because the city column is unreliable:
// apps/app's parseLocation turns "Mount Victoria, NSW 2786" into city "Mount" and
// does not know OT (step 6 finding, 23 real suburbs).

export interface LegacyLocation {
  location: string | null
  city: string | null
  state: string | null
  postalCode: string | null
}

export interface Candidate {
  id: number
  searchName: string
  state: string
  postcode: string
}

export type MatchResult =
  | { status: 'matched'; localityId: number; via: 'location' | 'columns' | 'postcode' }
  | { status: 'ambiguous'; candidates: number }
  | { status: 'unmatched'; reason: 'no-location-data' | 'no-candidate' }

const LOCATION = /^\s*(.+?)\s*,\s*([A-Za-z]{2,3})\s+(\d{4})\s*$/

export const normalise = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()

/** `byPostcode` returns the CURRENT localities with that postcode. */
export function matchLegacyLocation(l: LegacyLocation, byPostcode: (postcode: string) => readonly Candidate[]): MatchResult {
  const pick = (cands: readonly Candidate[], via: 'location' | 'columns' | 'postcode'): MatchResult | null => {
    if (cands.length === 1) return { status: 'matched', localityId: cands[0]!.id, via }
    if (cands.length > 1) return { status: 'ambiguous', candidates: cands.length }
    return null
  }

  // 1. "Suburb, ST 1234" -- the string the sign-up form has always built.
  const m = l.location ? LOCATION.exec(l.location) : null
  if (m) {
    const [, suburb, state, postcode] = m as unknown as [string, string, string, string]
    const found = pick(byPostcode(postcode).filter((c) => c.searchName === normalise(suburb) && c.state === state.toUpperCase()), 'location')
    if (found) return found
  }

  // 2. The parsed columns.
  const postcode = l.postalCode?.trim() ?? (m ? m[3]! : null)
  if (!postcode || !/^\d{4}$/.test(postcode)) return { status: 'unmatched', reason: l.location || l.city ? 'no-candidate' : 'no-location-data' }
  const inPostcode = byPostcode(postcode)
  if (l.city) {
    const found = pick(inPostcode.filter((c) => c.searchName === normalise(l.city!) && (!l.state || c.state === l.state.toUpperCase())), 'columns')
    if (found) return found
  }

  // 3. A postcode that belongs to exactly one suburb is not a guess.
  return pick(inPostcode, 'postcode') ?? { status: 'unmatched', reason: 'no-candidate' }
}
