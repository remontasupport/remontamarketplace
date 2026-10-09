// The admin area (U2 admin-search, 2026-10-08): the three lists the admin dashboard
// reads, behind the api token (role ADMIN). Every filter travels as a query parameter
// in its canonical value (the page maps display values, Q1 A of the functional
// design); an absent parameter means no filter -- there are no `all` / `none`
// sentinels. Repeats are served by the browser's private cache and the api's memo
// (privateCacheSeconds, D15/D16). Adding an endpoint = one entry here + one handler in
// apps/api's admin module.
import { EXPERIENCE_AREA_PAIRS } from '@remonta/schemas/data/experienceAreas'
import * as z from 'zod'
import { defineContract } from './define'
import { meta, ROLES } from './meta'

export const PAGE_SIZE_MAX = 100
export const WITHIN_KM_MAX = 500
export const SORT_FIELDS = ['createdAt', 'firstName', 'lastName', 'city', 'state', 'distance'] as const
/** The age ranges the dashboard offers; the api keeps today's year-granular rule (R3.6). */
export const AGE_RANGES = ['20-30', '31-45', '46-60', '60+'] as const
/** packages/db's CareDomain enum, spelled out (this package never imports Prisma, P-6). */
export const CARE_DOMAINS = ['DISABILITY', 'AGED_CARE', 'WORKING_WITH_CHILDREN', 'MENTAL_HEALTH', 'CHRONIC_MEDICAL'] as const
export const WORKER_SEARCH_LIMITS = { user: 120, ip: 300 } as const
export const ADMIN_LIST_LIMITS = { user: 60, ip: 120 } as const

/** A comma-separated query value: split, trimmed, empties dropped, deduplicated, sorted (R1.5). */
const csv = <T extends z.ZodType<string>>(item: T, max = 20) =>
  z.preprocess(
    (v) =>
      typeof v === 'string'
        ? [...new Set(v.split(',').map((s) => s.trim()).filter(Boolean))].sort()
        : v,
    z.array(item).max(max),
  )

/** "true" / "false" as a URL carries them. */
const flag = z.preprocess((v) => (v === 'true' ? true : v === 'false' ? false : v), z.boolean())

const positiveInt = z.coerce.number().int().min(1)

export const workerSearchQuerySchema = z.strictObject({
  page: positiveInt.default(1),
  pageSize: positiveInt.max(PAGE_SIZE_MAX).default(20),
  sortBy: z.enum(SORT_FIELDS).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  /** Name or mobile, substring; two words match first/last in either order (R3.1). */
  search: z.string().trim().max(100).optional(),
  /** An au_localities id: the suburb picked from the autocomplete (R2). */
  localityId: positiveInt.optional(),
  /** Kilometres from that suburb's centre; only with localityId (R1.3). */
  withinKm: positiveInt.max(WITHIN_KM_MAX).optional(),
  /** List the workers with no mapped suburb instead; ignores localityId/withinKm (R1.4). */
  unplaced: flag.optional(),
  /** A category id (`support-worker`, `therapeutic-supports`, ...). */
  typeOfSupport: z.string().trim().min(1).max(60).optional(),
  gender: z.enum(['Male', 'Female']).optional(),
  hasVehicle: z.enum(['Yes', 'No']).optional(),
  workerType: z.enum(['Employee', 'Contractor']).optional(),
  age: z.enum(AGE_RANGES).optional(),
  languages: csv(z.string().max(40)).optional(),
  therapeuticSubcategories: csv(z.string().max(60)).optional(),
  experienceWith: csv(z.enum(CARE_DOMAINS)).optional(),
  /**
   * `DOMAIN:Area` pairs from packages/schemas' experience vocabulary (the labels
   * `worker_experience.specificAreas` stores): within a domain any of, across domains
   * all of. Each pair's domain must also be in `experienceWith` (the api answers 400
   * otherwise), so one meaning has one URL.
   */
  experienceAreas: csv(z.enum(EXPERIENCE_AREA_PAIRS as [string, ...string[]]), EXPERIENCE_AREA_PAIRS.length).optional(),
})
export type WorkerSearchQuery = z.input<typeof workerSearchQuerySchema>
export type WorkerSearchQueryParsed = z.output<typeof workerSearchQuerySchema>

const isoDate = z.iso.datetime({ offset: true })

/** A row of the list: today's columns, plus the distance and the home suburb when known (R6). */
export const workerRowSchema = z.strictObject({
  id: z.string(),
  userId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  mobile: z.string(),
  email: z.string().nullable(),
  gender: z.string().nullable(),
  age: z.number().int().nullable(),
  languages: z.array(z.string()),
  services: z.array(z.string()),
  serviceIds: z.array(z.string()),
  city: z.string().nullable(),
  state: z.string().nullable(),
  postalCode: z.string().nullable(),
  photos: z.string().nullable(),
  experience: z.string().nullable(),
  introduction: z.string().nullable(),
  createdAt: isoDate,
  updatedAt: isoDate,
  isActive: z.boolean(),
  /** Present when a suburb was given and the worker is placed; one decimal (R6.4). */
  distanceKm: z.number().optional(),
  /** Present when the worker has a HOME row (R6.5). */
  location: z
    .strictObject({
      localityLabel: z.string(),
      precision: z.enum(['LOCALITY', 'ADDRESS']),
      travelRadiusKm: z.number().int(),
    })
    .optional(),
})
export type WorkerRow = z.output<typeof workerRowSchema>

export const paginationSchema = z.strictObject({
  total: z.number().int().min(0),
  page: z.number().int().min(1),
  pageSize: z.number().int().min(1),
  totalPages: z.number().int().min(0),
  hasNext: z.boolean(),
  hasPrev: z.boolean(),
})

/** The canonical query echoed, plus the suburb that was used (R7). */
export const appliedFiltersSchema = z.strictObject({
  sortBy: z.enum(SORT_FIELDS),
  sortOrder: z.enum(['asc', 'desc']),
  locality: z.strictObject({ id: z.number().int(), label: z.string() }).optional(),
  withinKm: z.number().int().optional(),
  unplaced: z.literal(true).optional(),
  search: z.string().optional(),
  typeOfSupport: z.string().optional(),
  gender: z.string().optional(),
  hasVehicle: z.string().optional(),
  workerType: z.string().optional(),
  age: z.string().optional(),
  languages: z.array(z.string()).optional(),
  therapeuticSubcategories: z.array(z.string()).optional(),
  experienceWith: z.array(z.string()).optional(),
  experienceAreas: z.array(z.string()).optional(),
})
export type AppliedFilters = z.output<typeof appliedFiltersSchema>

export const workerSearchResponseSchema = z.strictObject({
  data: z.array(workerRowSchema),
  pagination: paginationSchema,
  appliedFilters: appliedFiltersSchema,
  /** Active workers matching the other filters who have no mapped suburb (R4.4). */
  unplacedCount: z.number().int().min(0),
})
export type WorkerSearchResponse = z.output<typeof workerSearchResponseSchema>

export const userSearchQuerySchema = z.strictObject({
  search: z.string().trim().min(2).max(100),
  role: z.enum(ROLES).optional(),
})
export type UserSearchQuery = z.input<typeof userSearchQuerySchema>

export const userRowSchema = z.strictObject({
  id: z.string(),
  email: z.string(),
  role: z.enum(ROLES),
  status: z.string(),
  createdAt: isoDate,
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  mobile: z.string().optional(),
})
export const userListResponseSchema = z.strictObject({ users: z.array(userRowSchema).max(50) })
export type UserListResponse = z.output<typeof userListResponseSchema>

export const suspendedListQuerySchema = z.strictObject({
  page: positiveInt.default(1),
  pageSize: positiveInt.max(PAGE_SIZE_MAX).default(20),
})
export type SuspendedListQuery = z.input<typeof suspendedListQuerySchema>
export const suspendedListResponseSchema = z.strictObject({ data: z.array(workerRowSchema), pagination: paginationSchema })
export type SuspendedListResponse = z.output<typeof suspendedListResponseSchema>

const adminRead = (limits: { user: number; ip: number }) =>
  meta({
    access: { roles: ['ADMIN'] },
    bot: 'none',
    rateLimit: [
      { per: 'user', limit: limits.user, window: '1m' },
      { per: 'ip', limit: limits.ip, window: '1m' },
    ],
    maxBodyKb: 1,
    // Repeats within a minute are served by the browser's private cache (ETag/304)
    // and, for the search, the api's memo. Personal data: never a shared cache.
    privateCacheSeconds: 60,
  })

export const adminContract = defineContract('admin', {
  searchWorkers: {
    method: 'GET',
    path: '/v1/admin/workers',
    summary: 'The admin worker search: every filter combined with AND, the radius from a suburb of ours computed by PostGIS, nearest first; counts the workers with no mapped suburb.',
    query: workerSearchQuerySchema,
    responses: { 200: workerSearchResponseSchema },
    meta: adminRead(WORKER_SEARCH_LIMITS),
  },

  listUsers: {
    method: 'GET',
    path: '/v1/admin/users',
    summary: 'The impersonation picker: up to 50 users newest first matching an email or a profile name.',
    query: userSearchQuerySchema,
    responses: { 200: userListResponseSchema },
    meta: adminRead(ADMIN_LIST_LIMITS),
  },

  listSuspendedWorkers: {
    method: 'GET',
    path: '/v1/admin/workers/suspended',
    summary: 'Workers whose account is suspended, most recently changed first, paged.',
    query: suspendedListQuerySchema,
    responses: { 200: suspendedListResponseSchema },
    meta: adminRead(ADMIN_LIST_LIMITS),
  },
})
