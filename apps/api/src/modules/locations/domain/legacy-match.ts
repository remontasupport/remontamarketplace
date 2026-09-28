// Matching a worker's legacy location columns to an au_localities row -- used by
// the reconciler for workers who signed up through apps/app, and by the step 10
// backfill. It never guesses (S1-data-model 2.2): anything but exactly one
// candidate is reported, not placed.
//
// The `location` string is tried first, because the city column is unreliable:
// apps/app's parseLocation turns "Mount Victoria, NSW 2786" into city "Mount" and
// does not know OT (step 6 finding, 23 real suburbs).
//
// The rehearsal on production data (2026-09-28, 1,789 workers) showed that most
// failures were systematic, not individual, so the rules below handle them
// deterministically -- each is a normalisation or an exact, unique match, never a
// nearest guess:
//   - Northern Territory postcodes stored with three digits ("Darwin, NT 800");
//   - "TA" for Tasmania, full state names, trailing spaces;
//   - a wrong state with the suburb and postcode both right ("Epsom, QLD 3551");
//   - a street address or a metro name around the suburb ("20 Evergreen Dr, Oran
//     Park, NSW 2570", "Chipping Norton, Sydney, NSW 2170");
//   - Australia Post centre names ("Maroochydore DC").
// A metro name with a suburb's postcode ("Sydney, NSW 2147") and a misspelt suburb
// stay ambiguous: resolving them would be a guess.

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

export type MatchVia = 'location' | 'columns' | 'postcode' | 'suburb-in-text' | 'suburb-and-postcode'

export type MatchResult =
  | { status: 'matched'; localityId: number; via: MatchVia }
  | { status: 'ambiguous'; candidates: number }
  | { status: 'unmatched'; reason: 'no-location-data' | 'no-candidate' }

const LOCATION = /^\s*(.+?)\s*,?\s*([A-Za-z ]{2,30}?)\s*,?\s+(\d{3,4})\s*$/

export const normalise = (s: string) => s.trim().replace(/\s+/g, ' ').toLowerCase()

/** Australian postcodes are four digits; a three-digit one lost its leading zero (NT 08xx, ACT 02xx). */
export function normalisePostcode(raw: string | null | undefined): string | null {
  const digits = raw?.trim() ?? ''
  if (/^\d{4}$/.test(digits)) return digits
  if (/^\d{3}$/.test(digits)) return `0${digits}`
  return null
}

const STATE_ALIASES: Record<string, string> = {
  nsw: 'NSW', 'new south wales': 'NSW',
  vic: 'VIC', victoria: 'VIC',
  qld: 'QLD', queensland: 'QLD',
  wa: 'WA', 'western australia': 'WA',
  sa: 'SA', 'south australia': 'SA',
  tas: 'TAS', ta: 'TAS', tasmania: 'TAS',
  act: 'ACT', 'australian capital territory': 'ACT',
  nt: 'NT', 'northern territory': 'NT',
  ot: 'OT',
}

/** "TA", "Victoria", " NSW " -> the abbreviation; null when it is not a state. */
export function normaliseState(raw: string | null | undefined): string | null {
  if (!raw) return null
  return STATE_ALIASES[normalise(raw)] ?? null
}

/** Australia Post centre suffixes that are not suburbs: "Maroochydore DC", "Gold Coast MC". */
const POST_CENTRE = /\s+(dc|bc|mc)$/

const wordBoundary = (text: string, name: string) => new RegExp(`(^|[^a-z])${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}($|[^a-z])`).test(text)

/** `byPostcode` returns the CURRENT localities with that postcode. */
export function matchLegacyLocation(l: LegacyLocation, byPostcode: (postcode: string) => readonly Candidate[]): MatchResult {
  const pick = (cands: readonly Candidate[], via: MatchVia): MatchResult | null => {
    if (cands.length === 1) return { status: 'matched', localityId: cands[0]!.id, via }
    if (cands.length > 1) return { status: 'ambiguous', candidates: cands.length }
    return null
  }
  const byName = (cands: readonly Candidate[], name: string, state: string | null) =>
    cands.filter((c) => c.searchName === name && (!state || c.state === state))

  // 1. "Suburb, ST 1234" -- the string the sign-up form has always built (state
  //    and postcode normalised; the text may hold more than the suburb).
  const m = l.location ? LOCATION.exec(l.location) : null
  const text = m ? normalise(m[1]!) : null
  const stateInText = m ? normaliseState(m[2]) : null
  const pcInText = m ? normalisePostcode(m[3]) : null
  if (text && pcInText) {
    const cands = byPostcode(pcInText)
    const exact = byName(cands, text.replace(POST_CENTRE, ''), stateInText)
    const found = pick(exact, 'location')
    if (found) return found
    // Suburb and postcode both right, state wrong ("Epsom, QLD 3551" is Epsom VIC).
    const anyState = pick(byName(cands, text.replace(POST_CENTRE, ''), null), 'suburb-and-postcode')
    if (anyState) return anyState
    // The city column, when apps/app parsed the suburb out correctly, is exact.
    const cityNow = l.city ? normalise(l.city).replace(POST_CENTRE, '') : null
    if (cityNow) {
      const fromCity = pick(byName(cands, cityNow, stateInText), 'columns')
      if (fromCity) return fromCity
    }
    // The suburb is somewhere in the text: a street address before it, or a metro
    // name after it. Exactly one candidate of that postcode named in the text is
    // not a guess; several are -- unless one name contains all the others
    // ("Redbank Plains" also names "Redbank"), in which case the longest is what
    // was written.
    const named = cands.filter((c) => wordBoundary(text, c.searchName))
    const longest = named.reduce<Candidate | null>((a, c) => (!a || c.searchName.length > a.searchName.length ? c : a), null)
    const inText = pick(longest && named.every((c) => longest.searchName.includes(c.searchName)) ? [longest] : named, 'suburb-in-text')
    if (inText) return inText
  }

  // 2. The parsed columns.
  const postcode = normalisePostcode(l.postalCode) ?? pcInText
  if (!postcode) return { status: 'unmatched', reason: l.location?.trim() || l.city?.trim() ? 'no-candidate' : 'no-location-data' }
  const inPostcode = byPostcode(postcode)
  const city = l.city ? normalise(l.city).replace(POST_CENTRE, '') : null
  const state = normaliseState(l.state) ?? stateInText
  if (city) {
    const found = pick(byName(inPostcode, city, state), 'columns')
    if (found) return found
    // Suburb and postcode both right, state wrong ("Epsom, QLD 3551" is Epsom VIC).
    const anyState = pick(byName(inPostcode, city, null), 'suburb-and-postcode')
    if (anyState) return anyState
  } else if (text) {
    const anyState = pick(byName(inPostcode, text.replace(POST_CENTRE, ''), null), 'suburb-and-postcode')
    if (anyState) return anyState
  }

  // 3. A postcode that belongs to exactly one suburb is not a guess.
  return pick(inPostcode, 'postcode') ?? { status: 'unmatched', reason: 'no-candidate' }
}
