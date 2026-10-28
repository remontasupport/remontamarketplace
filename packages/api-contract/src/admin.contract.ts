// The admin area (U2 admin-search, 2026-10-08): the three lists the admin dashboard
// reads, behind the api token (role ADMIN). Every filter travels as a query parameter
// in its canonical value (the page maps display values, Q1 A of the functional
// design); an absent parameter means no filter -- there are no `all` / `none`
// sentinels. Repeats are served by the browser's private cache and the api's memo
// (privateCacheSeconds, D15/D16). Adding an endpoint = one entry here + one handler in
// apps/api's admin module.
import { EXPERIENCE_AREA_PAIRS } from '@remonta/schemas/data/experienceAreas'
import { FUNDING_TYPES, SERVICE_REQUEST_STATUSES } from '@remonta/schemas/data/serviceRequests'
import { OTHER_TOOL_MAX_CHARS, OTHER_TOOLS_MAX, TOOL_IDS, TOOL_SEARCH_MAX_CHARS } from '@remonta/schemas/data/serviceTools'
import { createServiceRequestSchema } from '@remonta/schemas/schema/serviceRequestSchema'
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
/** The eight states and territories, as au_localities.state spells them (OT, the other territories, is not offered). */
export const AU_STATES = ['ACT', 'NSW', 'NT', 'QLD', 'SA', 'TAS', 'VIC', 'WA'] as const
export type AuState = (typeof AU_STATES)[number]
export const AU_STATE_NAMES: Record<AuState, string> = {
  ACT: 'Australian Capital Territory',
  NSW: 'New South Wales',
  NT: 'Northern Territory',
  QLD: 'Queensland',
  SA: 'South Australia',
  TAS: 'Tasmania',
  VIC: 'Victoria',
  WA: 'Western Australia',
}
/** The nursing answer's values (worker.sections' NURSING_TYPES, spelled out: that file imports this one). */
export const NURSING_TYPE_FILTERS = ['registered', 'enrolled'] as const
/** worker-activation U1 (BR-5): the admin search's activation filter values. */
export const ACTIVATION_FILTERS = ['active', 'inactive'] as const
export const WORKER_SEARCH_LIMITS = { user: 120, ip: 300 } as const
/** An admin working down a page of cards switches many in a minute; suspension is rarer. */
export const ACTIVATION_WRITE_LIMITS = { user: 120, ip: 300 } as const
export const SUSPENSION_WRITE_LIMITS = { user: 30, ip: 120 } as const
export const ADMIN_LIST_LIMITS = { user: 60, ip: 120 } as const
/** admin-clients U1: an admin opening one client or coordinator after another; a status change is rarer. */
export const REQUESTER_DETAIL_LIMITS = { user: 120, ip: 300 } as const
export const REQUEST_STATUS_WRITE_LIMITS = { user: 60, ip: 120 } as const
/** The two roles that file service requests ("requesters", as service_requests.requesterId names them). */
export const REQUESTER_ROLES = ['CLIENT', 'COORDINATOR'] as const
/** The list's participants filter: with at least one owned participant, or with none. */
export const PARTICIPANT_FILTERS = ['with', 'without'] as const

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
  /** The home state: the HOME suburb's, else the legacy column; combines with the suburb and the unmapped list (R3.12). */
  state: z.enum(AU_STATES).optional(),
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
  /**
   * worker-tools U1 (BR-12): tool ids from packages/schemas' serviceTools; the worker must have all of them, each on
   * its own service's row. The worker's own (free-text) tools are never searched.
   */
  tools: csv(z.enum(TOOL_IDS), TOOL_IDS.length).optional(),
  /**
   * Tool search (TS-4): a word or words found in the listed tools, their other names and the workers' own tools
   * (packages/schemas toolSearchOf); on the type of support's service when it has a tool list, else both.
   */
  toolSearch: z.string().trim().min(1).max(TOOL_SEARCH_MAX_CHARS).regex(/^[^\p{Cc}]*$/u, 'Plain text only').optional(),
  /** worker-activation U1 (BR-5): the admin-set activation flag; absent = both. */
  activation: z.enum(ACTIVATION_FILTERS).optional(),
  /**
   * The nursing answer (2026-10-23): "I am a registered nurse" / "I am an enrolled nurse", stored on the worker's
   * nursing-services row. Only with typeOfSupport=nursing-services (the api answers 400 otherwise).
   */
  nursingType: z.enum(NURSING_TYPE_FILTERS).optional(),
  /**
   * worker-activation U1 (BR-6): each row carries `activated`. Opt-in because the app on production parses rows
   * strictly and would refuse the new key; to become unconditional once no pre-activation build can be promoted.
   */
  withActivation: flag.optional(),
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
  /** The account is not suspended (users.status ACTIVE). Not the activation flag: that is `activated`. */
  isActive: z.boolean(),
  /** worker-activation U1 (BR-6): the admin-set flag, present only when the query had `withActivation`. */
  activated: z.boolean().optional(),
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
  state: z.string().optional(),
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
  /** Present only when the query had tools: today's app never sends them, so never receives it (N1). */
  tools: z.array(z.string()).optional(),
  /** Present only when the query had a tool search (N1: today's app never sends it). */
  toolSearch: z.string().optional(),
  /** Present only when the query had an activation filter (N1: today's app never sends it). */
  activation: z.enum(ACTIVATION_FILTERS).optional(),
  /** Present only when the query had a nurse type (today's app never sends it). */
  nursingType: z.enum(NURSING_TYPE_FILTERS).optional(),
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

/**
 * Every admin entry: ADMIN only, per-user and per-IP limits, a small body. Never cached (the api's no-store default)
 * unless the entry adds a private cache; `audit` names the action the pipeline requires the handler to record.
 */
const adminMeta = (limits: { user: number; ip: number }, extra: { privateCacheSeconds?: number; audit?: string } = {}) =>
  meta({
    access: { roles: ['ADMIN'] },
    bot: 'none',
    rateLimit: [
      { per: 'user', limit: limits.user, window: '1m' },
      { per: 'ip', limit: limits.ip, window: '1m' },
    ],
    maxBodyKb: 1,
    ...extra,
  })

// Repeats within a minute are served by the browser's private cache (ETag/304)
// and, for the search, the api's memo. Personal data: never a shared cache.
const adminRead = (limits: { user: number; ip: number }) => adminMeta(limits, { privateCacheSeconds: 60 })

const json = <S extends z.ZodType>(schema: S): { kind: 'json'; schema: S } => ({ kind: 'json', schema })

/** A record id in a path: cuid or uuid shaped, bounded. */
const recordId = (what: string) => z.string().regex(/^[A-Za-z0-9_-]{1,40}$/, `Not a ${what} id`)

/** U3b: a short-lived link to view a worker's private document (the compliance review page opens it through the app). */
export const adminDocumentParamsSchema = z.strictObject({ documentId: recordId('document') })
export const adminDocumentLinkSchema = z.strictObject({ url: z.url().max(4096), expiresAt: z.iso.datetime({ offset: true }).nullable() })

/** worker-tools U1 (E3, Q1 B): one worker's services and their tools, for the worker's admin page. */
export const adminWorkerParamsSchema = z.strictObject({ workerId: recordId('worker') })
/** worker-activation U1: the two admin switches. The target state travels in the body, so a repeat is harmless. */
export const workerActivationBodySchema = z.strictObject({ activated: z.boolean() })
export const workerActivationSchema = z.strictObject({ workerId: z.string(), activated: z.boolean() })
export type WorkerActivation = z.output<typeof workerActivationSchema>
export const workerSuspensionBodySchema = z.strictObject({ suspended: z.boolean() })
export const workerSuspensionSchema = z.strictObject({ workerId: z.string(), suspended: z.boolean() })
export type WorkerSuspension = z.output<typeof workerSuspensionSchema>
export const adminWorkerServicesSchema = z.strictObject({
  services: z
    .array(
      z.strictObject({
        categoryId: z.string().max(80),
        categoryName: z.string().max(120),
        subcategoryNames: z.array(z.string().max(120)).max(50),
        /** Empty for a service with no tool list. */
        toolIds: z.array(z.enum(TOOL_IDS)).max(TOOL_IDS.length),
        otherTools: z.array(z.string().max(OTHER_TOOL_MAX_CHARS)).max(OTHER_TOOLS_MAX),
      }),
    )
    .max(50),
})
export type AdminWorkerServices = z.output<typeof adminWorkerServicesSchema>

// ---- admin-clients U1: clients and coordinators, their participants and requests ---------------------------------
// One set of entries for both roles (CS-1). Every participant field and the request's details are shown in full
// (FR-9, no password since 2026-10-28); each detail read is audited (FR-10). The request's services and details reuse
// the client's own request schemas, so the admin sees what the client entered, typed the same way.

const { services: requestServicesSchema, details: requestDetailsSchema } = createServiceRequestSchema.shape

export const requesterListQuerySchema = z.strictObject({
  role: z.enum(REQUESTER_ROLES),
  page: positiveInt.default(1),
  pageSize: positiveInt.max(PAGE_SIZE_MAX).default(20),
  /** Email, first or last name, substring, any case. */
  search: z.string().trim().min(1).max(100).optional(),
  /** Has at least one request in this status. */
  requestStatus: z.enum(SERVICE_REQUEST_STATUSES).optional(),
  /** Has at least one participant of theirs with this funding type. */
  fundingType: z.enum(FUNDING_TYPES).optional(),
  /** With at least one participant they still own, or with none (a removed participant does not count, FR-5). */
  participants: z.enum(PARTICIPANT_FILTERS).optional(),
})
export type RequesterListQuery = z.input<typeof requesterListQuerySchema>
export type RequesterListQueryParsed = z.output<typeof requesterListQuerySchema>
export type RequesterRole = (typeof REQUESTER_ROLES)[number]

export const requesterRowSchema = z.strictObject({
  userId: z.string(),
  role: z.enum(REQUESTER_ROLES),
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  mobile: z.string(),
  /** Coordinators only. */
  organisation: z.string().optional(),
  /** Participants they still own (a removed participant is not counted, FR-5). */
  participantCount: z.number().int().min(0),
  requestCount: z.number().int().min(0),
})
export type RequesterRow = z.output<typeof requesterRowSchema>
export const requesterListResponseSchema = z.strictObject({ data: z.array(requesterRowSchema), pagination: paginationSchema })
export type RequesterListResponse = z.output<typeof requesterListResponseSchema>

export const adminServiceRequestSchema = z.strictObject({
  id: z.string(),
  status: z.enum(SERVICE_REQUEST_STATUSES),
  services: requestServicesSchema,
  details: requestDetailsSchema,
  location: z.string(),
  /** The workers in assignedWorker, resolved to their profile (a worker since removed is left out). */
  assignedWorkers: z.array(z.strictObject({ workerProfileId: z.string(), name: z.string() })),
  createdAt: isoDate,
  updatedAt: isoDate,
})
export type AdminServiceRequest = z.output<typeof adminServiceRequestSchema>

export const adminParticipantSchema = z.strictObject({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  dateOfBirth: isoDate.nullable(),
  location: z.string().nullable(),
  gender: z.string().nullable(),
  conditions: z.array(z.string()),
  fundingType: z.enum(FUNDING_TYPES).nullable(),
  relationshipToClient: z.string().nullable(),
  isSelfManaged: z.boolean(),
  servicesRequested: z.json().nullable(),
  additionalInfo: z.string().nullable(),
  createdAt: isoDate,
  /** Newest first. */
  requests: z.array(adminServiceRequestSchema),
})
export type AdminParticipant = z.output<typeof adminParticipantSchema>

export const requesterParamsSchema = z.strictObject({ userId: recordId('user') })
export const requesterDetailSchema = z.strictObject({
  requester: requesterRowSchema,
  /** Owned participants, newest first. */
  participants: z.array(adminParticipantSchema),
})
export type RequesterDetail = z.output<typeof requesterDetailSchema>

export const serviceRequestParamsSchema = z.strictObject({ requestId: recordId('service request') })
/** The target status travels in the body, so a repeat is harmless. */
export const requestStatusBodySchema = z.strictObject({ status: z.enum(SERVICE_REQUEST_STATUSES) })
export const requestStatusSchema = z.strictObject({ requestId: z.string(), status: z.enum(SERVICE_REQUEST_STATUSES) })
export type RequestStatus = z.output<typeof requestStatusSchema>

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

  getDocumentLink: {
    method: 'GET',
    path: '/v1/admin/documents/:documentId/link',
    summary: "A five-minute link to view one worker's service document (a private file), or the stored URL of a legacy public one.",
    pathParams: adminDocumentParamsSchema,
    responses: { 200: adminDocumentLinkSchema },
    meta: adminRead({ user: 120, ip: 300 }),
  },

  getWorkerServices: {
    method: 'GET',
    path: '/v1/admin/workers/:workerId/services',
    summary: "One worker's chosen services in their order, with the sub-categories and, for Cleaning Services and Home and Yard Maintenance, the tools; 404 when no worker has that id.",
    pathParams: adminWorkerParamsSchema,
    responses: { 200: adminWorkerServicesSchema },
    meta: adminRead({ user: 120, ip: 300 }),
  },

  // worker-activation U1: the admin-set activation flag (BR-1..BR-4) and the account's suspension (BR-7, BR-8), which
  // the card's switch wrote through the app until now. No audit row (Q8 c): the request log line is the record.
  setWorkerActivation: {
    method: 'PUT',
    path: '/v1/admin/workers/:workerId/activation',
    summary: "Switch a worker on or off for clients and the public list: only the activation flag changes, never sign-in or Verify Compliance; 404 when no worker has that id.",
    pathParams: adminWorkerParamsSchema,
    body: json(workerActivationBodySchema),
    responses: { 200: workerActivationSchema },
    meta: adminMeta(ACTIVATION_WRITE_LIMITS),
  },

  setWorkerSuspension: {
    method: 'PUT',
    path: '/v1/admin/workers/:workerId/suspension',
    summary: "Suspend a worker's account (no sign-in) or restore it; the activation flag is untouched. Worker accounts only: 404 when no worker has that id.",
    pathParams: adminWorkerParamsSchema,
    body: json(workerSuspensionBodySchema),
    responses: { 200: workerSuspensionSchema },
    meta: adminMeta(SUSPENSION_WRITE_LIMITS),
  },

  listRequesters: {
    method: 'GET',
    path: '/v1/admin/requesters',
    summary: 'Clients or support coordinators (by role) with their participant and request counts, newest first, paged; search by email or name, filter by a request status or a participant funding type.',
    query: requesterListQuerySchema,
    responses: { 200: requesterListResponseSchema },
    meta: adminMeta(ADMIN_LIST_LIMITS),
  },

  getRequester: {
    method: 'GET',
    path: '/v1/admin/requesters/:userId',
    summary: 'One client or support coordinator: the profile, the participants they own and every request of each, in full. Audited. 404 when no client or coordinator has that id.',
    pathParams: requesterParamsSchema,
    responses: { 200: requesterDetailSchema },
    meta: adminMeta(REQUESTER_DETAIL_LIMITS, { audit: 'ADMIN_RECORD_VIEW' }),
  },

  setRequestStatus: {
    method: 'PUT',
    path: '/v1/admin/service-requests/:requestId/status',
    summary: 'Set a service request to any status (an active one included); the change is audited and sent to the CRM workflow. A repeat writes nothing. 404 when no request has that id.',
    pathParams: serviceRequestParamsSchema,
    body: json(requestStatusBodySchema),
    responses: { 200: requestStatusSchema },
    meta: adminMeta(REQUEST_STATUS_WRITE_LIMITS, { audit: 'SERVICE_REQUEST_STATUS_CHANGE' }),
  },
})
