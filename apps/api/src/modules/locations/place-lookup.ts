// The current suburbs the place resolver (domain/place.ts) chooses from, read per search: a handful of rows by
// postcode or by name, each on an index (au_localities postcode, searchName).
import type { Db } from '../../platform/persistence/db'
import type { PlaceLookup } from './domain/place'

const SELECT = { id: true, searchName: true, state: true, postcode: true, latitude: true, longitude: true } as const

export function placeLookup(db: Db): PlaceLookup {
  return {
    byPostcode: (postcode) => db.auLocality.findMany({ where: { postcode, retiredAt: null }, select: SELECT }),
    byName: (searchName, state, limit) =>
      db.auLocality.findMany({ where: { searchName, retiredAt: null, ...(state ? { state } : {}) }, select: SELECT, take: limit }),
  }
}
