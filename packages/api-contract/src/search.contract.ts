// The worker search for clients, coordinators and the marketing site (search-locations U1, 2026-10-28): the two
// searches apps/app ran as Next routes (/api/client/workers, /api/public/workers), moved here on worker_locations +
// PostGIS. The query parameters and the response bodies are the ones those routes had (FR-5), so the pages change
// only the URL they call. `location` is the autocomplete's text ("Suburb, ST 1234"), matched to one of our suburbs
// on the server (BR-P1..P5); text that pins no suburb searches without a place.
import * as z from 'zod'
import { paginationSchema, WITHIN_KM_MAX, WORKER_SEARCH_LIMITS } from './admin.contract'
import { defineContract } from './define'
import { meta } from './meta'

export const CLIENT_SEARCH_PAGE_SIZE = { default: 20, max: 50 } as const
export const PUBLIC_SEARCH_PAGE_SIZE = { default: 12, max: 50 } as const
/** The radius when none is given: the client page's 50 km, the marketing page's "any distance". */
export const CLIENT_DEFAULT_WITHIN_KM = 50
export const PUBLIC_DEFAULT_WITHIN_KM = 500
/** The marketing site renders server side, so every visitor reaches the api from Vercel's addresses (NFR design). */
export const PUBLIC_SEARCH_LIMITS = { ip: 600, global: 3000 } as const

const positiveInt = z.coerce.number().int().min(1)
/** An optional text parameter: trimmed, single-spaced; empty means absent, as the routes read `get(x) || undefined`. */
const text = (max: number) =>
  z
    .string()
    .max(max * 2)
    .transform((s) => s.trim().replace(/\s+/g, ' '))
    .pipe(z.string().max(max))
    .transform((s) => (s === '' ? undefined : s))
    .optional()

export const clientWorkerQuerySchema = z.strictObject({
  page: positiveInt.default(1),
  pageSize: positiveInt.max(CLIENT_SEARCH_PAGE_SIZE.max).default(CLIENT_SEARCH_PAGE_SIZE.default),
  /** Keywords: a service ("nurse") or anything on the profile ("cooking"); every word must match (BR-K1..K4). */
  search: text(200),
  location: text(120),
  /** Category names, comma separated: any of them (BR-S1). */
  services: z
    .preprocess(
      (v) => (typeof v === 'string' ? [...new Set(v.split(',').map((s) => s.trim()).filter(Boolean))] : v),
      z.array(z.string().max(100)).max(10),
    )
    .optional(),
  within: positiveInt.max(WITHIN_KM_MAX).default(CLIENT_DEFAULT_WITHIN_KM),
})

export const publicWorkerQuerySchema = z.strictObject({
  page: positiveInt.default(1),
  pageSize: positiveInt.max(PUBLIC_SEARCH_PAGE_SIZE.max).default(PUBLIC_SEARCH_PAGE_SIZE.default),
  location: text(120),
  /** A service slug (packages/schemas serviceSlugs) or `all`. */
  typeOfSupport: text(100),
  /** Kilometres, or `none` for any distance. */
  within: z
    .union([z.literal('none'), positiveInt.max(WITHIN_KM_MAX)])
    .optional()
    .transform((v) => (v === undefined || v === 'none' ? PUBLIC_DEFAULT_WITHIN_KM : v)),
})

export const clientWorkerCardSchema = z.strictObject({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  photo: z.string().nullable(),
  /** The first service, else "Support Worker". */
  role: z.string(),
  bio: z.string(),
  skills: z.array(z.string()),
  /** "Suburb, ST", else "Australia". */
  location: z.string(),
  isNdisCompliant: z.boolean(),
})

export const publicWorkerCardSchema = z.strictObject({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  bio: z.string().nullable(),
  photo: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  services: z.array(z.string()),
  /** Only with a place: from the place to the worker's suburb, 1 decimal. */
  distanceKm: z.number().optional(),
})

export const clientWorkerResponseSchema = z.strictObject({ success: z.literal(true), data: z.array(clientWorkerCardSchema), pagination: paginationSchema })
export const publicWorkerResponseSchema = z.strictObject({ success: z.literal(true), data: z.array(publicWorkerCardSchema), pagination: paginationSchema })

/** Parsed: what apps/api's handlers receive (defaults applied). */
export type ClientWorkerQuery = z.output<typeof clientWorkerQuerySchema>
export type PublicWorkerQuery = z.output<typeof publicWorkerQuerySchema>
/** What a caller may send (every field optional). */
export type ClientWorkerQueryInput = z.input<typeof clientWorkerQuerySchema>
export type PublicWorkerQueryInput = z.input<typeof publicWorkerQuerySchema>
export type ClientWorkerResponse = z.output<typeof clientWorkerResponseSchema>
export type PublicWorkerResponse = z.output<typeof publicWorkerResponseSchema>
export type ClientWorkerCard = z.output<typeof clientWorkerCardSchema>
export type PublicWorkerCard = z.output<typeof publicWorkerCardSchema>

export const searchContract = defineContract('search', {
  searchWorkersForClient: {
    method: 'GET',
    path: '/v1/client/workers',
    summary: "The client and coordinator dashboard's worker search: keywords, services, and a radius from a suburb, nearest first.",
    query: clientWorkerQuerySchema,
    responses: { 200: clientWorkerResponseSchema },
    meta: meta({
      access: { roles: ['CLIENT', 'COORDINATOR'] },
      bot: 'none',
      rateLimit: [
        { per: 'user', limit: WORKER_SEARCH_LIMITS.user, window: '1m' },
        { per: 'ip', limit: WORKER_SEARCH_LIMITS.ip, window: '1m' },
      ],
      maxBodyKb: 1,
      // The body does not depend on who asks: the api's memo and the browser's private cache.
      privateCacheSeconds: 60,
    }),
  },

  searchPublicWorkers: {
    method: 'GET',
    path: '/v1/public/workers',
    summary: "The marketing site's worker list: unsuspended workers' public cards, by service and a radius from a suburb.",
    query: publicWorkerQuerySchema,
    responses: { 200: publicWorkerResponseSchema },
    meta: meta({
      access: 'public',
      bot: 'none', // read-only public cards, cached; the limits bound it
      rateLimit: [
        { per: 'ip', limit: PUBLIC_SEARCH_LIMITS.ip, window: '1m' },
        { per: 'global', limit: PUBLIC_SEARCH_LIMITS.global, window: '1m' },
      ],
      maxBodyKb: 1,
      cacheSeconds: 60,
    }),
  },
})
