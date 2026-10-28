// The two worker searches (search-locations U1): fill one SearchSpec from each entry's query, run the one
// statement, shape the rows into each entry's card (E4, E5). The place and the keyword names degrade: when they
// cannot be read, the search runs without them (BR-P5, BR-K5), and the caller logs it.
import type { ClientWorkerCard, ClientWorkerQuery, PublicWorkerCard, PublicWorkerQuery } from '@remonta/api-contract'
import { categoryNameOfSlug } from '@remonta/schemas/data/serviceSlugs'
import type { Db } from '../../../platform/persistence/db'
import { paginationOf } from '../../admin/domain/pagination'
import { resolvePlace, type Place, type PlaceLookup } from '../../locations/domain/place'
import { keywordsOf } from '../domain/keywords'
import { runWorkerSearch, type RawSearchRow, type SearchSpec } from '../persistence/worker-search-sql'

/** The client card's services: the first five, as the route read them (`take: 5`). */
const CLIENT_SERVICES_MAX = 5

export interface SearchDeps {
  db: Db
  places: PlaceLookup
  serviceTerms: () => Promise<ReadonlySet<string>>
  /** Injectable for the unit tests; the real one runs the statement. */
  run?: (db: Db, spec: SearchSpec) => Promise<{ rows: RawSearchRow[]; total: number }>
}

/** What the handler logs: how the place was read and what degraded; never the text itself. */
export interface SearchNotes {
  place: Place['via'] | 'none' | 'unmatched' | 'failed'
  keywordNamesFailed: boolean
}

async function placeOf(deps: SearchDeps, location: string | undefined, notes: SearchNotes): Promise<Place | null> {
  if (location === undefined) return null
  try {
    const place = await resolvePlace(location, deps.places)
    notes.place = place?.via ?? 'unmatched'
    return place
  } catch {
    notes.place = 'failed'
    return null
  }
}

async function run(deps: SearchDeps, spec: SearchSpec) {
  const { rows, total } = await (deps.run ?? runWorkerSearch)(deps.db, spec)
  return { rows, pagination: paginationOf(total, spec.page, spec.pageSize) }
}

export async function searchForClient(deps: SearchDeps, q: ClientWorkerQuery, notes: SearchNotes) {
  let terms: ReadonlySet<string> = new Set()
  if (q.search !== undefined) {
    try {
      terms = await deps.serviceTerms()
    } catch {
      notes.keywordNamesFailed = true // BR-K5: every token a text token
    }
  }
  const services = q.services ?? []
  const spec: SearchSpec = {
    // BR-E3: a location that matches nothing still counts as given, as it did.
    introductionRequired: q.search === undefined && q.location === undefined && services.length === 0,
    keywords: q.search === undefined ? [] : keywordsOf(q.search, terms),
    services,
    place: await placeOf(deps, q.location, notes),
    withinKm: q.within,
    page: q.page,
    pageSize: q.pageSize,
  }
  const { rows, pagination } = await run(deps, spec)
  return { success: true as const, data: rows.map(clientCardOf), pagination }
}

export async function searchPublic(deps: SearchDeps, q: PublicWorkerQuery, notes: SearchNotes) {
  const spec: SearchSpec = {
    introductionRequired: false,
    keywords: [],
    services: q.typeOfSupport && q.typeOfSupport !== 'all' ? [categoryNameOfSlug(q.typeOfSupport)] : [],
    place: await placeOf(deps, q.location, notes),
    withinKm: q.within,
    page: q.page,
    pageSize: q.pageSize,
  }
  const { rows, pagination } = await run(deps, spec)
  return { success: true as const, data: rows.map((r) => publicCardOf(r, spec.place !== null)), pagination }
}

/** E4, as the route's transformToPublicData. */
export function clientCardOf(r: RawSearchRow): ClientWorkerCard {
  const services = (r.services ?? []).slice(0, CLIENT_SERVICES_MAX)
  return {
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    photo: r.photos || null,
    role: services[0]?.name || 'Support Worker',
    bio: r.introduction || '',
    skills: [...new Set(services.flatMap((s) => s.subs ?? []))],
    location: [r.city, r.state].filter(Boolean).join(', ') || 'Australia',
    isNdisCompliant: r.approved,
  }
}

/** E5, as the route's transformToBio. */
export function publicCardOf(r: RawSearchRow, withDistance: boolean): PublicWorkerCard {
  const card: PublicWorkerCard = {
    id: r.id,
    firstName: r.firstName,
    lastName: r.lastName,
    bio: r.introduction ?? null,
    photo: r.photos || null,
    city: r.city ?? null,
    state: r.state ?? null,
    services: [...new Set((r.services ?? []).map((s) => s.name))],
  }
  if (withDistance && r.distance_m !== null) card.distanceKm = Math.round(r.distance_m / 100) / 10
  return card
}
