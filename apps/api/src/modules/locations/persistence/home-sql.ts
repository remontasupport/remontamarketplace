// The worker's HOME location in SQL, written once for every search that measures distance (the admin search, and
// search-locations U1's client and public searches). `wl` is the HOME row, `al` its suburb; a point is any
// geography expression: a suburb's stored point or one built from coordinates. Every value is a bound parameter.
import { Prisma } from '../../../platform/persistence/db'

/** Joins `wl` (the HOME row, if any) and `al` (its suburb) to `p` (worker_profiles). */
export const HOME_JOIN = Prisma.sql`
  LEFT JOIN worker_locations wl ON wl."workerProfileId" = p.id AND wl.kind = 'HOME'
  LEFT JOIN au_localities al ON al.id = wl."localityId"`

/** A suburb's centre. */
export const localityPoint = (localityId: number) => Prisma.sql`(SELECT point FROM au_localities WHERE id = ${localityId})`

/** A point from coordinates (WGS 84, as au_localities.point). */
export const pointOf = (lat: number, lng: number) => Prisma.sql`ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography`

/** Placed workers within `km` of the point (the GiST index on worker_locations.point serves it). */
export const withinTerm = (point: Prisma.Sql, km: number) => Prisma.sql`AND wl.point IS NOT NULL AND ST_DWithin(wl.point, ${point}, ${km * 1000})`

/** Metres from the HOME point to the point; NULL for an unplaced worker. */
export const distanceTerm = (point: Prisma.Sql) => Prisma.sql`ST_Distance(wl.point, ${point})`
