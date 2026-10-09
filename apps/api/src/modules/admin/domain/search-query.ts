// The admin worker search as a value (U2, functional design L4, rules R1, R3.6, R7):
// the contract's parsed query normalised into what the filters and the statement
// read. Pure; the invariants that the contract cannot express are checked here and
// answer 400 with the field named.
import type { AppliedFilters, WorkerSearchQueryParsed } from '@remonta/api-contract'
import { splitExperienceAreaPair } from '@remonta/schemas/data/experienceAreas'
import { ApiError } from '../../../platform/errors'

export type SortField = 'createdAt' | 'firstName' | 'lastName' | 'city' | 'state' | 'distance'
export type CareDomain = 'DISABILITY' | 'AGED_CARE' | 'WORKING_WITH_CHILDREN' | 'MENTAL_HEALTH' | 'CHRONIC_MEDICAL'

/** Today's age rule (R3.6): a year-granular date-of-birth window with the integer age column as fallback. */
export interface AgeWindow {
  range: string
  minAge: number
  maxAge: number
  /** `YYYY-01-01` of the oldest birth year in range. */
  minBirth: string
  /** `YYYY-12-31` of the youngest birth year in range. */
  maxBirth: string
}

export interface SearchQuery {
  page: number
  pageSize: number
  sortBy: SortField
  sortOrder: 'asc' | 'desc'
  search?: string
  /** The words of `search`, for the two-word name forms (R3.1). */
  searchParts: string[]
  localityId?: number
  withinKm?: number
  unplaced: boolean
  typeOfSupport?: string
  gender?: 'Male' | 'Female'
  hasVehicle?: 'Yes' | 'No'
  /** The canonical label, echoed in appliedFilters. */
  workerType?: 'Employee' | 'Contractor'
  /** What the abn JSON holds for it (R3.7). */
  workerTypeCode?: 'tfn' | 'abn'
  age?: AgeWindow
  languages: string[]
  therapeuticSubcategories: string[]
  experienceWith: CareDomain[]
  /** The canonical `DOMAIN:Area` pairs, echoed in appliedFilters. */
  experienceAreas: string[]
  /** The same pairs grouped: the areas (any of) per domain (all of) the statement reads (R3.11). */
  experienceAreasByDomain: Partial<Record<CareDomain, string[]>>
}

export interface LocalityRef {
  id: number
  label: string
}

const WORKER_TYPE_CODES = { Employee: 'tfn', Contractor: 'abn' } as const

export function normaliseQuery(raw: WorkerSearchQueryParsed, now: Date): SearchQuery {
  const unplaced = raw.unplaced === true
  // R1.4: the unmapped list ignores the location.
  const localityId = unplaced ? undefined : raw.localityId
  const withinKm = unplaced ? undefined : raw.withinKm
  // R1.3: a radius needs a centre; a distance sort needs one too.
  if (withinKm !== undefined && localityId === undefined) throw new ApiError(400, 'withinKm without localityId', { withinKm: ['Choose a suburb first'] })
  if (raw.sortBy === 'distance' && localityId === undefined) throw new ApiError(400, 'sortBy=distance without localityId', { sortBy: ['Sorting by distance needs a suburb'] })

  // R1.2: the defaults.
  const sortBy: SortField = raw.sortBy ?? (localityId !== undefined ? 'distance' : 'createdAt')
  const sortOrder = raw.sortOrder ?? (sortBy === 'distance' ? 'asc' : 'desc')

  const search = raw.search?.trim().replace(/\s+/g, ' ') || undefined
  const languages = (raw.languages ?? []).map(titleCase)
  const experienceWith = (raw.experienceWith ?? []) as CareDomain[]

  // R3.11: an area narrows a domain that is being searched; a pair whose domain is
  // not in experienceWith is refused rather than implied, so one meaning has one URL.
  const experienceAreas = raw.experienceAreas ?? []
  const experienceAreasByDomain: Partial<Record<CareDomain, string[]>> = {}
  for (const pair of experienceAreas) {
    const split = splitExperienceAreaPair(pair)
    if (!split) throw new ApiError(400, `experienceAreas pair ${pair}`, { experienceAreas: ['Unknown experience area'] })
    if (!experienceWith.includes(split.domain)) throw new ApiError(400, `experienceAreas ${pair} without its domain in experienceWith`, { experienceAreas: ['Choose the experience type first'] })
    ;(experienceAreasByDomain[split.domain] ??= []).push(split.area)
  }

  return {
    page: raw.page,
    pageSize: raw.pageSize,
    sortBy,
    sortOrder,
    ...(search !== undefined ? { search } : {}),
    searchParts: search ? search.split(' ') : [],
    ...(localityId !== undefined ? { localityId } : {}),
    ...(withinKm !== undefined ? { withinKm } : {}),
    unplaced,
    ...(raw.typeOfSupport !== undefined ? { typeOfSupport: raw.typeOfSupport } : {}),
    ...(raw.gender !== undefined ? { gender: raw.gender } : {}),
    ...(raw.hasVehicle !== undefined ? { hasVehicle: raw.hasVehicle } : {}),
    ...(raw.workerType !== undefined ? { workerType: raw.workerType, workerTypeCode: WORKER_TYPE_CODES[raw.workerType] } : {}),
    ...(raw.age !== undefined ? { age: birthWindowOf(raw.age, now) } : {}),
    languages,
    therapeuticSubcategories: raw.therapeuticSubcategories ?? [],
    experienceWith,
    experienceAreas,
    experienceAreasByDomain,
  }
}

/** `20-30`, `31-45`, `46-60`, `60+` -> today's window (the route's rule, kept for parity: D13). */
export function birthWindowOf(range: string, now: Date): AgeWindow {
  let minAge: number
  let maxAge: number
  if (range === '60+') {
    minAge = 60
    maxAge = 120
  } else {
    const m = /^(\d+)-(\d+)$/.exec(range)
    if (!m) throw new ApiError(400, `age range ${range}`, { age: ['Unknown age range'] })
    minAge = Number(m[1])
    maxAge = Number(m[2])
  }
  const year = now.getUTCFullYear()
  return { range, minAge, maxAge, minBirth: `${year - maxAge}-01-01`, maxBirth: `${year - minAge}-12-31` }
}

/** "hello world" -> "Hello World" (the route's normalisation of languages). */
export function titleCase(s: string): string {
  return s
    .split(' ')
    .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ')
}

/** Makes LIKE's wildcards and its escape character match literally. */
export function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, (c) => `\\${c}`)
}

/** The canonical query echoed (R7): every active filter, the suburb used, the sort. */
export function appliedFiltersOf(q: SearchQuery, locality?: LocalityRef): AppliedFilters {
  return {
    sortBy: q.sortBy,
    sortOrder: q.sortOrder,
    ...(locality ? { locality } : {}),
    ...(q.withinKm !== undefined ? { withinKm: q.withinKm } : {}),
    ...(q.unplaced ? { unplaced: true as const } : {}),
    ...(q.search !== undefined ? { search: q.search } : {}),
    ...(q.typeOfSupport !== undefined ? { typeOfSupport: q.typeOfSupport } : {}),
    ...(q.gender !== undefined ? { gender: q.gender } : {}),
    ...(q.hasVehicle !== undefined ? { hasVehicle: q.hasVehicle } : {}),
    ...(q.workerType !== undefined ? { workerType: q.workerType } : {}),
    ...(q.age !== undefined ? { age: q.age.range } : {}),
    ...(q.languages.length ? { languages: q.languages } : {}),
    ...(q.therapeuticSubcategories.length ? { therapeuticSubcategories: q.therapeuticSubcategories } : {}),
    ...(q.experienceWith.length ? { experienceWith: q.experienceWith } : {}),
    ...(q.experienceAreas.length ? { experienceAreas: q.experienceAreas } : {}),
  }
}
