// The admin dashboard's filter state and its two mappings (U2 admin-search, R11.1-R11.3):
// display values -> the contract's canonical query (`toQuery`), and the URL bar
// <-> the state (`urlFromFilters`, `filtersFromURL`) through the contract's own
// canonical serialisation, so the URL, the browser's cache key and the api's memo
// key are the same string for the same filters. No React here; tested in node.
import { AGE_RANGES, CARE_DOMAINS, SORT_FIELDS, adminContract, canonicalQueryOf, workerSearchQuerySchema, type WorkerSearchQuery } from '@remonta/api-contract'
import { EXPERIENCE_AREA_SEPARATOR, experienceAreasOf, splitExperienceAreaPair } from '@remonta/schemas/data/experienceAreas'

export type AgeRange = (typeof AGE_RANGES)[number]
export type SortField = (typeof SORT_FIELDS)[number]
export type CareDomain = (typeof CARE_DOMAINS)[number]

/** E7: what the page holds. Display values where the UI has them; canonical where it already does. */
export interface AdminFilters {
  page: number
  pageSize: number
  /** Only when the admin chose one: the api defaults to distance with a suburb, else createdAt (R1.2). */
  sortBy?: SortField
  sortOrder?: 'asc' | 'desc'
  search: string
  /** The suburb picked from the autocomplete: an au_localities id and its label (R11.3). */
  locality?: { id: number; label: string }
  withinKm?: number
  /** The unmapped list instead of a search (R11.4). */
  unplaced: boolean
  /** A category id, or undefined for all. */
  typeOfSupport?: string
  gender: 'all' | 'male' | 'female'
  hasVehicle: 'all' | 'Yes' | 'No'
  workerType: 'all' | 'Employee' | 'Contractor'
  age: 'all' | AgeRange
  languages: string[]
  therapeuticSubcategories: string[]
  /** Display names from EXPERIENCE_OPTIONS. */
  experienceWith: string[]
  /**
   * The specific areas chosen under each selected domain, keyed by CareDomain (the
   * labels are canonical already: `worker_experience.specificAreas` stores them as
   * written). Areas of a domain not in experienceWith are never sent (R3.11).
   */
  experienceAreas: Partial<Record<CareDomain, string[]>>
}

export const PAGE_SIZE = 6
export const WITHIN_OPTIONS_KM = [5, 10, 20, 50] as const
export const THERAPEUTIC_CATEGORY_ID = 'therapeutic-supports'
export const LOCALITY_LABEL_PARAM = 'localityLabel'

/** The "Experience with" buttons: display name -> CareDomain (R11.1, one map). */
export const EXPERIENCE_OPTIONS: ReadonlyArray<{ label: string; domain: CareDomain }> = [
  { label: 'Aged Care', domain: 'AGED_CARE' },
  { label: 'Chronic medical conditions', domain: 'CHRONIC_MEDICAL' },
  { label: 'Disability', domain: 'DISABILITY' },
  { label: 'Mental health', domain: 'MENTAL_HEALTH' },
  { label: 'Working with Children', domain: 'WORKING_WITH_CHILDREN' },
]

export const DEFAULT_FILTERS: AdminFilters = {
  page: 1,
  pageSize: PAGE_SIZE,
  search: '',
  unplaced: false,
  gender: 'all',
  hasVehicle: 'all',
  workerType: 'all',
  age: 'all',
  languages: [],
  therapeuticSubcategories: [],
  experienceWith: [],
  experienceAreas: {},
}

export const domainOf = (label: string): CareDomain | undefined => EXPERIENCE_OPTIONS.find((o) => o.label === label)?.domain
const labelOf = (domain: string): string | undefined => EXPERIENCE_OPTIONS.find((o) => o.domain === domain)?.label

/** The areas the dashboard offers under an "Experience with" button: the shared vocabulary's, by display name. */
export function experienceAreasOfLabel(label: string): readonly string[] {
  const domain = domainOf(label)
  return domain ? experienceAreasOf(domain) : []
}

/** R11.1: display -> canonical. Absent means no filter; `all`/`none` never reach the api. */
export function toQuery(f: AdminFilters): WorkerSearchQuery {
  const q: WorkerSearchQuery = { page: f.page, pageSize: f.pageSize }
  if (f.unplaced) {
    q.unplaced = true
  } else if (f.locality) {
    q.localityId = f.locality.id
    if (f.withinKm !== undefined) q.withinKm = f.withinKm
  }
  if (f.sortBy && (f.sortBy !== 'distance' || (f.locality && !f.unplaced))) q.sortBy = f.sortBy
  if (f.sortOrder) q.sortOrder = f.sortOrder
  const search = f.search.trim().slice(0, 100)
  if (search) q.search = search
  if (f.typeOfSupport) q.typeOfSupport = f.typeOfSupport
  if (f.gender === 'male') q.gender = 'Male'
  else if (f.gender === 'female') q.gender = 'Female'
  if (f.hasVehicle !== 'all') q.hasVehicle = f.hasVehicle
  if (f.workerType !== 'all') q.workerType = f.workerType
  if (f.age !== 'all') q.age = f.age
  if (f.languages.length) q.languages = f.languages
  if (f.therapeuticSubcategories.length) q.therapeuticSubcategories = f.therapeuticSubcategories
  const domains = f.experienceWith.map(domainOf).filter((d): d is CareDomain => d !== undefined)
  if (domains.length) q.experienceWith = domains
  // R3.11: only the areas of a searched domain, and only the vocabulary's.
  const pairs = domains.flatMap((d) => (f.experienceAreas[d] ?? []).filter((a) => experienceAreasOf(d).includes(a)).map((a) => `${d}${EXPERIENCE_AREA_SEPARATOR}${a}`))
  if (pairs.length) q.experienceAreas = pairs
  return q
}

/** The canonical query string of the state (R11.2). */
export function canonicalOf(f: AdminFilters): string {
  return canonicalQueryOf(adminContract.entries.searchWorkers, toQuery(f))
}

/** The URL bar: the canonical query plus the suburb's label for display (R11.2). */
export function urlFromFilters(f: AdminFilters): string {
  const params = new URLSearchParams(canonicalOf(f))
  if (f.locality && !f.unplaced) params.set(LOCALITY_LABEL_PARAM, f.locality.label)
  const s = params.toString()
  return s ? `?${s}` : ''
}

/** Loading a URL restores the state (R11.2); anything the contract rejects falls back to the defaults. */
export function filtersFromURL(params: URLSearchParams): AdminFilters {
  const raw: Record<string, string> = {}
  let label: string | undefined
  for (const [k, v] of params) {
    if (k === LOCALITY_LABEL_PARAM) label = v
    else raw[k] = v
  }
  if (!('pageSize' in raw)) raw.pageSize = String(PAGE_SIZE) // the page's default, not the contract's
  const parsed = workerSearchQuerySchema.safeParse(raw)
  if (!parsed.success) return { ...DEFAULT_FILTERS }
  const q = parsed.data
  const f: AdminFilters = {
    ...DEFAULT_FILTERS,
    page: q.page,
    pageSize: q.pageSize,
    sortBy: q.sortBy,
    sortOrder: q.sortOrder,
    search: q.search ?? '',
    unplaced: q.unplaced === true,
    languages: q.languages ?? [],
    therapeuticSubcategories: q.therapeuticSubcategories ?? [],
    experienceWith: (q.experienceWith ?? []).map(labelOf).filter((l): l is string => l !== undefined),
    experienceAreas: {},
  }
  for (const pair of q.experienceAreas ?? []) {
    const split = splitExperienceAreaPair(pair)
    if (split && (q.experienceWith ?? []).includes(split.domain)) (f.experienceAreas[split.domain] ??= []).push(split.area)
  }
  if (q.localityId !== undefined && !f.unplaced) {
    f.locality = { id: q.localityId, label: label ?? `Suburb #${q.localityId}` }
    if (q.withinKm !== undefined) f.withinKm = q.withinKm
  }
  if (q.typeOfSupport) f.typeOfSupport = q.typeOfSupport
  if (q.gender === 'Male') f.gender = 'male'
  else if (q.gender === 'Female') f.gender = 'female'
  if (q.hasVehicle) f.hasVehicle = q.hasVehicle
  if (q.workerType) f.workerType = q.workerType
  if (q.age) f.age = q.age
  return f
}
