// The searched place (search-locations U1, BR-P1..P4): the text a search bar sends, turned into a point, or into
// nothing when it does not pin down one place. Pure, over a lookup of current suburbs. It never guesses: a picked
// suggestion goes through the legacy matcher's exact rules; a postcode alone stands for its suburbs' centre (they
// are next to each other); a name alone counts only when one suburb has it. Anything else is no place, and the
// search runs without one (BR-P5), as a failed geocode did.
import { matchLegacyLocation, normalise, normalisePostcode, normaliseState, type Candidate } from './legacy-match'

/** A current suburb with its centre. */
export interface PlaceCandidate extends Candidate {
  latitude: number
  longitude: number
}

export interface PlaceLookup {
  /** Current suburbs with that (four-digit) postcode. */
  byPostcode(postcode: string): Promise<PlaceCandidate[]>
  /** Current suburbs with that search name (lower case, single-spaced), in that state if given; at most `limit`. */
  byName(searchName: string, state: string | null, limit: number): Promise<PlaceCandidate[]>
}

export interface Place {
  lat: number
  lng: number
  via: 'suburb' | 'postcode' | 'name'
}

/** Enough rows to see two places under one name (a suburb's postcodes are a few rows at one point). */
const NAME_ROWS_MAX = 20
const POSTCODE_ONLY = /^\d{3,4}$/
const ENDS_WITH_POSTCODE = /(\d{3,4})$/

const centre = (c: PlaceCandidate) => ({ lat: c.latitude, lng: c.longitude })

export async function resolvePlace(raw: string, lookup: PlaceLookup): Promise<Place | null> {
  const text = normalise(raw)
  if (!text) return null

  // BR-P2: a postcode alone.
  if (POSTCODE_ONLY.test(text)) {
    const cands = await lookup.byPostcode(normalisePostcode(text)!)
    if (cands.length === 0) return null
    const lat = cands.reduce((s, c) => s + c.latitude, 0) / cands.length
    const lng = cands.reduce((s, c) => s + c.longitude, 0) / cands.length
    return { lat, lng, via: 'postcode' }
  }

  // BR-P1: "Suburb, ST 1234", the autocomplete's suggestion (or anything ending in a postcode).
  const pcText = ENDS_WITH_POSTCODE.exec(text)?.[1]
  if (pcText) {
    const cands = await lookup.byPostcode(normalisePostcode(pcText)!)
    // The name (and state) before the postcode, exactly: the matcher's own pattern needs the comma the
    // suggestions carry, and typed text or an old link may not ("Harris Park NSW 2150").
    const { name, state } = splitState(text.slice(0, -pcText.length))
    const exact = cands.filter((c) => c.searchName === name && (!state || c.state === state))
    if (exact.length === 1) return { ...centre(exact[0]!), via: 'suburb' }
    // Otherwise the matcher's rules: a street address or a metro name around the suburb, a wrong state.
    const m = matchLegacyLocation({ location: text, city: null, state: null, postalCode: null }, () => cands)
    const hit = m.status === 'matched' ? cands.find((c) => c.id === m.localityId) : undefined
    return hit ? { ...centre(hit), via: 'suburb' } : null
  }

  // BR-P3: a name alone, or a name and a state ("richmond vic", "richmond, victoria").
  const { name, state } = splitState(text)
  if (!name) return null
  // One suburb may have a row per postcode (Parramatta 2150 and 2124), all at the suburb's centre: one place.
  const cands = await lookup.byName(name, state, NAME_ROWS_MAX)
  const places = new Map(cands.map((c) => [`${c.state}|${c.latitude}|${c.longitude}`, c]))
  return places.size === 1 ? { ...centre(cands[0]!), via: 'name' } : null
}

/** The trailing state, if the last one to three words are one ("new south wales"); the name before it, comma-free. */
export function splitState(text: string): { name: string; state: string | null } {
  const words = text.replace(/,/g, ' ').trim().split(/\s+/)
  for (let k = Math.min(3, words.length - 1); k >= 1; k--) {
    const state = normaliseState(words.slice(-k).join(' '))
    if (state) return { name: words.slice(0, -k).join(' '), state }
  }
  return { name: words.join(' '), state: null }
}
