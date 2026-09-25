// Where a worker is, from the suburb they picked (S1-data-model 2.1-2.2). Pure.
//
// Registration places the worker at the locality's centroid straight away
// (precision LOCALITY, no geocoding call); onboarding may refine it to an address
// later. During the transition the old worker_profiles location columns are written
// in the same transaction, in exactly the shape apps/app writes them today, so
// every legacy reader -- search included -- keeps working unchanged.

/** Decided 2026-09-25 (S1-data-model 2.1, option A). */
export const DEFAULT_TRAVEL_RADIUS_KM = 50

export interface Locality {
  id: number
  suburb: string
  state: string
  postcode: string
  latitude: number
  longitude: number
  retiredAt: Date | null
}

export type LocationSource = 'REGISTRATION' | 'ONBOARDING' | 'ADMIN' | 'RECONCILER' | 'BACKFILL'

export interface HomeLocation {
  kind: 'HOME'
  localityId: number
  latitude: number
  longitude: number
  travelRadiusKm: number
  precision: 'LOCALITY'
  source: LocationSource
}

/** The worker_profiles columns apps/app reads today (register-async + location-parser). */
export interface LegacyLocationColumns {
  /** "Parramatta, NSW 2150" -- the string Step1Location.tsx builds from a suggestion. */
  location: string
  city: string
  state: string
  postalCode: string
  latitude: number
  longitude: number
}

export type PlacementError = { kind: 'locality-retired'; localityId: number }

export function placeHome(
  locality: Locality,
  source: LocationSource,
  travelRadiusKm: number = DEFAULT_TRAVEL_RADIUS_KM,
): { ok: true; home: HomeLocation; legacy: LegacyLocationColumns } | { ok: false; error: PlacementError } {
  // A new placement must use a current suburb; rows already placed at one that a
  // later release retires stay valid (the refresh never deletes).
  if (locality.retiredAt !== null) return { ok: false, error: { kind: 'locality-retired', localityId: locality.id } }
  if (!Number.isInteger(travelRadiusKm) || travelRadiusKm < 1 || travelRadiusKm > 500) {
    throw new RangeError(`travelRadiusKm ${travelRadiusKm} outside 1..500 (worker_locations CHECK)`)
  }
  return {
    ok: true,
    home: {
      kind: 'HOME',
      localityId: locality.id,
      latitude: locality.latitude,
      longitude: locality.longitude,
      travelRadiusKm,
      precision: 'LOCALITY',
      source,
    },
    legacy: {
      location: localityLabel(locality, ', '),
      city: locality.suburb,
      state: locality.state,
      postalCode: locality.postcode,
      latitude: locality.latitude,
      longitude: locality.longitude,
    },
  }
}

/** "Parramatta, NSW 2150" (legacy column) or "Parramatta NSW 2150" (autocomplete label). */
export function localityLabel(l: Pick<Locality, 'suburb' | 'state' | 'postcode'>, afterSuburb: ', ' | ' ' = ' '): string {
  return `${l.suburb}${afterSuburb}${l.state} ${l.postcode}`
}
