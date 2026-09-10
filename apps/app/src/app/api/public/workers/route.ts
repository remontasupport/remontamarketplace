import { NextRequest, NextResponse } from 'next/server'
import { authPrisma as prisma } from '@/lib/auth-prisma'
import { Prisma } from '@/generated/auth-client'
import { geocodeAddress } from '@/lib/geocoding'
import { getCached, setCached } from '@/lib/redis'

// ============================================================================
// TYPES
// ============================================================================

interface PublicFilterParams {
  page: number
  pageSize: number
  location?: string
  typeOfSupport?: string
  within?: string
}

interface WorkerBio {
  id: string
  firstName: string
  lastName: string
  bio: string | null
  photo: string | null
  city: string | null
  state: string | null
  services: string[]
  distanceKm?: number
}

interface PublicResponse {
  success: boolean
  data: WorkerBio[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SERVICE_NAME_MAP: Record<string, string> = {
  'support-worker': 'Support Worker',
  'therapeutic-supports': 'Therapeutic Supports',
  'home-modifications': 'Home Modifications',
  'fitness-rehabilitation': 'Fitness and Rehabilitation',
  'cleaning-services': 'Cleaning Services',
  'nursing-services': 'Nursing Services',
  'home-yard-maintenance': 'Home and Yard Maintenance',
}

const RESPONSE_CACHE_TTL = 60
const GEOCODE_TTL_SECONDS = 24 * 60 * 60

// ============================================================================
// GEOSPATIAL UTILITIES
// ============================================================================

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const toRad = (deg: number) => deg * (Math.PI / 180)
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function getBoundingBox(lat: number, lng: number, radiusKm: number) {
  const latDelta = radiusKm / 111.32
  const lngDelta = radiusKm / (111.32 * Math.cos((lat * Math.PI) / 180))
  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta,
  }
}

async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  const key = `geocode:v1:${location.toLowerCase().trim()}`
  const cached = await getCached<{ lat: number; lng: number }>(key)
  if (cached) return cached

  try {
    const result = await geocodeAddress(location)
    if (result) {
      const coords = { lat: result.latitude, lng: result.longitude }
      setCached(key, coords, GEOCODE_TTL_SECONDS).catch(() => {})
      return coords
    }
    return null
  } catch {
    return null
  }
}

// ============================================================================
// WHERE CLAUSE BUILDER
// ============================================================================

function buildWhereClause(params: PublicFilterParams): Prisma.WorkerProfileWhereInput {
  const conditions: Prisma.WorkerProfileWhereInput[] = [
    { user: { status: 'ACTIVE' } },
  ]

  if (params.typeOfSupport && params.typeOfSupport !== 'all') {
    const dbServiceName = SERVICE_NAME_MAP[params.typeOfSupport] ?? params.typeOfSupport
    conditions.push({
      workerServices: { some: { categoryName: dbServiceName } }
    })
  }

  return { AND: conditions }
}

// ============================================================================
// SELECT & TRANSFORM
// ============================================================================

const bioSelect = {
  id: true,
  firstName: true,
  lastName: true,
  introduction: true,
  photos: true,
  city: true,
  state: true,
  latitude: true,
  longitude: true,
  workerServices: { select: { categoryName: true } },
} as const

function transformToBio(worker: any, distanceKm?: number): WorkerBio {
  const photo = worker.photos || null

  const services: string[] = [...new Set<string>(
    (worker.workerServices ?? []).map((ws: { categoryName: string }) => ws.categoryName)
  )]

  const bio: WorkerBio = {
    id: worker.id,
    firstName: worker.firstName,
    lastName: worker.lastName,
    bio: worker.introduction ?? null,
    photo,
    city: worker.city ?? null,
    state: worker.state ?? null,
    services,
  }

  if (distanceKm !== undefined) bio.distanceKm = Math.round(distanceKm * 10) / 10

  return bio
}

// ============================================================================
// SEARCH FUNCTIONS
// ============================================================================

async function searchStandard(params: PublicFilterParams): Promise<PublicResponse> {
  const where = buildWhereClause(params)
  const skip = (params.page - 1) * params.pageSize

  const [total, workers] = await Promise.all([
    prisma.workerProfile.count({ where }),
    prisma.workerProfile.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: params.pageSize,
      select: bioSelect,
    }),
  ])

  const totalPages = Math.ceil(total / params.pageSize)

  return {
    success: true,
    data: workers.map(w => transformToBio(w)),
    pagination: {
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  }
}

async function searchWithDistance(params: PublicFilterParams): Promise<PublicResponse> {
  const coords = await geocodeLocation(params.location!)
  if (!coords) return searchStandard({ ...params, location: undefined })

  const radiusKm = params.within && params.within !== 'none'
    ? parseInt(params.within, 10)
    : 500

  const bbox = getBoundingBox(coords.lat, coords.lng, radiusKm)

  const distanceWhere: Prisma.WorkerProfileWhereInput = {
    AND: [
      buildWhereClause(params),
      { latitude: { gte: bbox.minLat, lte: bbox.maxLat, not: null } },
      { longitude: { gte: bbox.minLng, lte: bbox.maxLng, not: null } },
    ],
  }

  // Pass 1: coordinates only — no JOINs
  const candidates = await prisma.workerProfile.findMany({
    where: distanceWhere,
    select: { id: true, latitude: true, longitude: true },
  })

  // Exact Haversine filter + sort by distance ascending
  const ranked = candidates
    .map(w => ({
      id: w.id,
      distance: haversineDistance(coords.lat, coords.lng, w.latitude!, w.longitude!),
    }))
    .filter(w => w.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)

  const total = ranked.length
  const skip = (params.page - 1) * params.pageSize
  const pageSlice = ranked.slice(skip, skip + params.pageSize)
  const pageIds = pageSlice.map(w => w.id)
  const distanceMap = new Map(pageSlice.map(w => [w.id, w.distance]))

  // Pass 2: bio data for this page only
  const workers = pageIds.length > 0
    ? await prisma.workerProfile.findMany({
        where: { id: { in: pageIds } },
        select: bioSelect,
      })
    : []

  const workerMap = new Map(workers.map(w => [w.id, w]))
  const data = pageIds
    .filter(id => workerMap.has(id))
    .map(id => transformToBio(workerMap.get(id)!, distanceMap.get(id)))

  const totalPages = Math.ceil(total / params.pageSize)

  return {
    success: true,
    data,
    pagination: {
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  }
}

// ============================================================================
// CACHE KEY
// ============================================================================

function buildCacheKey(searchParams: URLSearchParams): string {
  const allowed = ['location', 'typeOfSupport', 'within', 'page', 'pageSize']
  const sorted = [...searchParams.entries()]
    .filter(([k]) => allowed.includes(k))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
  return `public:workers:v1:${sorted || 'default'}`
}

// ============================================================================
// ROUTE HANDLER
// ============================================================================

/**
 * GET /api/public/workers
 *
 * Public endpoint — no authentication required.
 * Returns worker bios for the marketing website.
 * Only published (isPublished: true) and active workers are returned.
 *
 * Query params:
 *   location      — suburb + state + postcode, e.g. "Queenscliff NSW 2096"
 *   typeOfSupport — service slug e.g. "support-worker" | "all"
 *   within        — radius in km e.g. "5" | "10" | "20" | "50"
 *   page          — page number (default: 1)
 *   pageSize      — results per page (default: 12, max: 50)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    const searchParams = request.nextUrl.searchParams

    const cacheKey = buildCacheKey(searchParams)
    const cached = await getCached<PublicResponse>(cacheKey)
    if (cached) {
      return NextResponse.json(cached, {
        headers: {
          'X-Response-Time': `${Date.now() - startTime}ms`,
          'X-Cache': 'HIT',
          'Cache-Control': 'public, s-maxage=60',
        },
      })
    }

    const params: PublicFilterParams = {
      page:     Math.max(1, parseInt(searchParams.get('page') ?? '1', 10)),
      pageSize: Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') ?? '12', 10))),
      location:      searchParams.get('location') || undefined,
      typeOfSupport: searchParams.get('typeOfSupport') || undefined,
      within:        searchParams.get('within') || undefined,
    }

    const response = params.location
      ? await searchWithDistance(params)
      : await searchStandard(params)

    setCached(cacheKey, response, RESPONSE_CACHE_TTL).catch(() => {})

    return NextResponse.json(response, {
      headers: {
        'X-Response-Time': `${Date.now() - startTime}ms`,
        'X-Cache': 'MISS',
        'Cache-Control': 'public, s-maxage=60',
      },
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Public Workers API] Error:', errorMsg)

    return NextResponse.json(
      { success: false, error: 'Failed to fetch workers' },
      { status: 500, headers: { 'X-Response-Time': `${Date.now() - startTime}ms` } }
    )
  }
}
