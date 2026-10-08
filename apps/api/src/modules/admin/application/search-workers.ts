// The search service (U2, functional design L1, L5; rules R2, R6): normalise, resolve
// the suburb, run the statement, shape the rows into the contract's row.
import type { WorkerRow, WorkerSearchQueryParsed, WorkerSearchResponse } from '@remonta/api-contract'
import type { Clock } from '../../../platform/clock'
import { ApiError } from '../../../platform/errors'
import type { Db } from '../../../platform/persistence/db'
import { localityLabel } from '../../locations/domain/home'
import { appliedFiltersOf, normaliseQuery, type LocalityRef, type SearchQuery } from '../domain/search-query'
import { runSearch, type RawWorkerRow, type SearchResult } from '../persistence/worker-search-sql'

export interface SearchDeps {
  db: Db
  clock: Clock
  /** Injectable for the unit tests; the real one runs the statement. */
  run?: (db: Db, q: SearchQuery, localityId: number | undefined) => Promise<SearchResult>
}

export async function searchWorkers(deps: SearchDeps, raw: WorkerSearchQueryParsed): Promise<WorkerSearchResponse> {
  const now = deps.clock()
  const q = normaliseQuery(raw, now)

  // R2.1: the suburb must be one of ours; a retired one keeps its point.
  let locality: LocalityRef | undefined
  if (q.localityId !== undefined) {
    const row = await deps.db.auLocality.findUnique({ where: { id: q.localityId }, select: { id: true, suburb: true, state: true, postcode: true } })
    if (!row) throw new ApiError(400, `unknown locality ${q.localityId}`, { localityId: ['Unknown suburb'] })
    locality = { id: row.id, label: localityLabel(row, ' ') }
  }

  const { rows, total, unplacedCount } = await (deps.run ?? runSearch)(deps.db, q, locality?.id)
  const data = rows.map((r) => shapeRow(r, now, locality !== undefined))
  const totalPages = Math.ceil(total / q.pageSize)
  return {
    data,
    pagination: { total, page: q.page, pageSize: q.pageSize, totalPages, hasNext: q.page < totalPages, hasPrev: q.page > 1 },
    appliedFilters: appliedFiltersOf(q, locality),
    unplacedCount,
  }
}

/** R6: today's row plus the distance and the home suburb; nothing else leaves (G10). */
export function shapeRow(raw: RawWorkerRow, now: Date, withDistance: boolean): WorkerRow {
  const computedAge = raw.dateOfBirth ? calculateAge(raw.dateOfBirth, now) : null
  const languages = raw.infoLanguages && raw.infoLanguages.length > 0 ? raw.infoLanguages : (raw.languages ?? [])
  const row: WorkerRow = {
    id: raw.id,
    userId: raw.userId,
    firstName: raw.firstName,
    lastName: raw.lastName,
    mobile: raw.mobile,
    email: raw.email ?? null,
    gender: raw.gender,
    age: computedAge ?? raw.age,
    languages,
    services: raw.serviceNames ?? [],
    serviceIds: raw.serviceIds ?? [],
    city: raw.city,
    state: raw.state,
    postalCode: raw.postalCode,
    photos: raw.photos,
    experience: raw.experience,
    introduction: raw.introduction,
    createdAt: raw.createdAt.toISOString(),
    updatedAt: raw.updatedAt.toISOString(),
    isActive: raw.userStatus === 'ACTIVE',
  }
  if (withDistance && raw.distance_m !== null && raw.distance_m !== undefined) row.distanceKm = Math.round(raw.distance_m / 100) / 10
  if (raw.homeSuburb && raw.homeState && raw.homePostcode && raw.precision && raw.travelRadiusKm !== null) {
    row.location = { localityLabel: `${raw.homeSuburb} ${raw.homeState} ${raw.homePostcode}`, precision: raw.precision, travelRadiusKm: raw.travelRadiusKm }
  }
  return row
}

/** Today's function, ported (R6.2): month- and day-aware; null when the text is not a date. */
export function calculateAge(dateOfBirth: string, now: Date): number | null {
  const dob = new Date(dateOfBirth)
  if (Number.isNaN(dob.getTime())) return null
  let age = now.getUTCFullYear() - dob.getUTCFullYear()
  const m = now.getUTCMonth() - dob.getUTCMonth()
  if (m < 0 || (m === 0 && now.getUTCDate() < dob.getUTCDate())) age--
  return age >= 0 ? age : null
}
