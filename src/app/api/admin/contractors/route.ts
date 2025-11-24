import { NextRequest, NextResponse } from 'next/server'
import { authPrisma as prisma } from '@/lib/auth-prisma'
import { Prisma } from '@/generated/auth-client'

// ============================================================================
// TYPES
// ============================================================================

interface FilterParams {
  page: number
  pageSize: number
  search?: string
  sortBy: string
  sortOrder: 'asc' | 'desc'

  // Advanced filters
  location?: string
  typeOfSupport?: string
  gender?: string
  languages?: string[]
  age?: string
  within?: string
}

interface PaginatedResponse {
  success: boolean
  data: any[]
  pagination: {
    total: number
    page: number
    pageSize: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  appliedFilters?: Partial<FilterParams>
}

// ============================================================================
// HELPER FUNCTIONS FOR DATA NORMALIZATION
// ============================================================================

/**
 * Normalizes string to Title Case (e.g., "hello world" -> "Hello World")
 * Use for: Gender, Languages, etc.
 */
function toTitleCase(str: string): string {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Maps frontend service names (kebab-case) to database format (Title Case)
 */
const SERVICE_NAME_MAP: Record<string, string> = {
  'support-worker': 'Support Worker',
  'therapeutic-supports': 'Therapeutic Supports',
  'home-modifications': 'Home Modifications',
  'fitness-rehabilitation': 'Fitness and Rehabilitation',
  'cleaning-services': 'Cleaning Services',
  'nursing-services': 'Nursing Services',
  'home-yard-maintenance': 'Home and Yard Maintenance',
};

// ============================================================================
// FILTER REGISTRY PATTERN (No If-Statements!)
// ============================================================================

type FilterBuilder = (params: FilterParams) => Prisma.WorkerProfileWhereInput | null

/**
 * Filter Registry
 * Each filter is an independent, composable function
 * Add new filters by adding entries to this registry
 *
 * DATABASE FORMAT CONVENTIONS:
 * - Gender: Title Case ("Male", "Female")
 * - Services: Title Case with spaces ("Support Worker", "Home Modifications")
 * - Languages: Title Case ("English", "Mandarin", "Spanish")
 * - Age: Integer (18, 25, 45, etc.)
 * - Text fields: Case-insensitive searches using `mode: 'insensitive'`
 *
 * IMPORTANT: Always normalize input to match database format to avoid mismatches!
 */
const filterRegistry: Record<string, FilterBuilder> = {

  /**
   * Gender Filter
   * Normalizes to Title Case to match database format (Male/Female)
   */
  gender: (params) => {
    if (!params.gender || params.gender === 'all') return null;
    return { gender: toTitleCase(params.gender) };
  },

  /**
   * Age Range Filter
   * Converts age range string (e.g., "20-30") to integer range query
   */
  age: (params) => {
    if (!params.age || params.age === 'all') return null;

    // Parse age range
    if (params.age === '60+') {
      return { age: { gte: 60 } };
    }

    const match = params.age.match(/^(\d+)-(\d+)$/);
    if (match) {
      const [, min, max] = match;
      return {
        age: {
          gte: parseInt(min, 10),
          lte: parseInt(max, 10)
        }
      };
    }

    return null;
  },

  /**
   * Services/Type of Support Filter
   * Uses PostgreSQL array contains operator
   * Maps kebab-case to Title Case format in database
   */
  services: (params) => {
    if (!params.typeOfSupport || params.typeOfSupport === 'all') return null;

    const dbServiceName = SERVICE_NAME_MAP[params.typeOfSupport] || params.typeOfSupport;

    return { services: { has: dbServiceName } };
  },

  /**
   * Languages Filter (Multi-select)
   * Uses PostgreSQL array intersection
   * Matches workers who speak ANY of the selected languages
   * Normalizes to Title Case to match database format (e.g., "English", "Mandarin")
   */
  languages: (params) => {
    if (!params.languages || params.languages.length === 0) return null;

    const normalizedLanguages = params.languages.map(toTitleCase);

    return { languages: { hasSome: normalizedLanguages } };
  },

  /**
   * Text Search Filter
   * Searches across firstName, lastName, mobile
   */
  textSearch: (params) =>
    params.search
      ? {
          OR: [
            { firstName: { contains: params.search, mode: 'insensitive' } },
            { lastName: { contains: params.search, mode: 'insensitive' } },
            { mobile: { contains: params.search } },
          ]
        }
      : null,

  /**
   * Location Filter (Without Distance)
   * Searches city or state fields
   * Only applies when distance filter is not active
   */
  location: (params) =>
    params.location && params.within === 'none'
      ? {
          OR: [
            { city: { contains: params.location, mode: 'insensitive' } },
            { state: { contains: params.location, mode: 'insensitive' } },
          ]
        }
      : null,
}

// ============================================================================
// FILTER COMPOSER
// ============================================================================

/**
 * Builds WHERE clause from active filters
 * Uses functional composition to merge filters dynamically
 */
function buildWhereClause(params: FilterParams): Prisma.WorkerProfileWhereInput {
  // Execute all filters and collect non-null results
  const activeFilters = Object.values(filterRegistry)
    .map(filterFn => filterFn(params))
    .filter((clause): clause is NonNullable<typeof clause> => clause !== null)

  // Edge case: No filters active
  if (activeFilters.length === 0) {
    return {}
  }

  // Separate OR filters from AND filters
  const orFilters = activeFilters.filter(f => f.OR)
  const andFilters = activeFilters.filter(f => !f.OR)

  // If we have multiple OR filters, wrap each in AND
  if (orFilters.length > 0) {
    const andConditions = orFilters.map(f => ({ OR: f.OR }))

    // Merge with regular AND filters
    const mergedAndFilters = andFilters.reduce((acc, filter) => {
      return { ...acc, ...filter }
    }, {})

    // Combine everything
    let result
    if (Object.keys(mergedAndFilters).length > 0) {
      result = {
        AND: [...andConditions, mergedAndFilters]
      }
    } else {
      result = orFilters.length === 1
        ? orFilters[0]
        : { AND: andConditions }
    }

    return result
  }

  // No OR filters, just merge AND filters
  return andFilters.reduce<Prisma.WorkerProfileWhereInput>((acc, filter) => {
    return { ...acc, ...filter }
  }, {})
}

/**
 * Builds ORDER BY clause
 */
function buildOrderByClause(
  sortBy: string,
  sortOrder: 'asc' | 'desc'
): Prisma.WorkerProfileOrderByWithRelationInput {
  const validSortFields = ['createdAt', 'firstName', 'lastName', 'city', 'state']
  const field = validSortFields.includes(sortBy) ? sortBy : 'createdAt'
  return { [field]: sortOrder }
}

// ============================================================================
// GEOSPATIAL UTILITIES
// ============================================================================

/**
 * Haversine Formula
 * Calculates great-circle distance between two points
 */
function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371 // Earth's radius in km

  const toRad = (deg: number) => deg * (Math.PI / 180)

  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Bounding Box Calculation
 * Creates rectangular boundary around a point
 */
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

/**
 * Geocode Location String
 * Converts location to coordinates
 */
async function geocodeLocation(
  location: string
): Promise<{ lat: number; lng: number } | null> {
  // Major Australian cities coordinates
  const majorCities: Record<string, { lat: number; lng: number }> = {
    'sydney': { lat: -33.8688, lng: 151.2093 },
    'melbourne': { lat: -37.8136, lng: 144.9631 },
    'brisbane': { lat: -27.4705, lng: 153.0260 },
    'perth': { lat: -31.9505, lng: 115.8605 },
    'adelaide': { lat: -34.9285, lng: 138.6007 },
    'gold coast': { lat: -28.0167, lng: 153.4000 },
    'newcastle': { lat: -32.9283, lng: 151.7817 },
    'canberra': { lat: -35.2809, lng: 149.1300 },
    'sunshine coast': { lat: -26.6500, lng: 153.0667 },
    'wollongong': { lat: -34.4278, lng: 150.8931 },
  }

  // Extract city name from location string
  const cityName = location.split(',')[0].trim().toLowerCase()

  // Check if it's a major city
  if (majorCities[cityName]) {
    return majorCities[cityName]
  }

  // Try to fetch from suburbs API
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/suburbs?q=${encodeURIComponent(cityName)}`
    )
    const suburbs = await response.json()

    if (Array.isArray(suburbs) && suburbs.length > 0) {
      const match = suburbs[0]
      if (match.latitude && match.longitude) {
        return {
          lat: match.latitude,
          lng: match.longitude
        }
      }
    }
  } catch (error) {
    console.error('Geocoding error:', error)
  }

  return null
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse filter parameters from URL
 */
function parseFilterParams(searchParams: URLSearchParams): FilterParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)))
  const search = searchParams.get('search') || undefined
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

  // Advanced filters
  const location = searchParams.get('location') || undefined
  const typeOfSupport = searchParams.get('typeOfSupport') || undefined
  const gender = searchParams.get('gender') || undefined
  const age = searchParams.get('age') || undefined
  const within = searchParams.get('within') || 'none'

  // Parse languages (comma-separated)
  const languagesParam = searchParams.get('languages')
  const languages = languagesParam
    ? languagesParam.split(',').map(l => l.trim()).filter(Boolean)
    : []

  return {
    page,
    pageSize,
    search,
    sortBy,
    sortOrder,
    location,
    typeOfSupport,
    gender,
    languages,
    age,
    within,
  }
}

/**
 * Get applied filters for response
 */
function getAppliedFilters(params: FilterParams): Partial<FilterParams> {
  const applied: Partial<FilterParams> = {}

  if (params.search) applied.search = params.search
  if (params.location) applied.location = params.location
  if (params.typeOfSupport && params.typeOfSupport !== 'all') {
    applied.typeOfSupport = params.typeOfSupport
  }
  if (params.gender && params.gender !== 'all') {
    applied.gender = params.gender
  }
  if (params.languages && params.languages.length > 0) {
    applied.languages = params.languages
  }
  if (params.age && params.age !== 'all') {
    applied.age = params.age
  }
  if (params.within && params.within !== 'none') {
    applied.within = params.within
  }

  return applied
}

// ============================================================================
// MAIN QUERY FUNCTIONS
// ============================================================================

/**
 * Standard search (no distance filtering)
 */
async function searchStandard(params: FilterParams): Promise<PaginatedResponse> {
  const where = buildWhereClause(params)
  const orderBy = buildOrderByClause(params.sortBy, params.sortOrder)
  const skip = (params.page - 1) * params.pageSize

  // Execute count and data query in parallel for performance
  const [total, workers] = await Promise.all([
    prisma.workerProfile.count({ where }),
    prisma.workerProfile.findMany({
      where,
      orderBy,
      skip,
      take: params.pageSize,
      select: {
        id: true,
        userId: true,
        firstName: true,
        lastName: true,
        mobile: true,
        gender: true,
        age: true,
        languages: true,
        services: true,
        city: true,
        state: true,
        postalCode: true,
        latitude: true,
        longitude: true,
        experience: true,
        introduction: true,
        photos: true,
        createdAt: true,
        updatedAt: true,
      }
    })
  ])

  const totalPages = Math.ceil(total / params.pageSize)

  return {
    success: true,
    data: workers,
    pagination: {
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
    appliedFilters: getAppliedFilters(params),
  }
}

/**
 * Search with distance filtering
 * Uses bounding box + Haversine for accuracy and performance
 */
async function searchWithDistance(params: FilterParams): Promise<PaginatedResponse> {
  // Geocode the search location
  const coords = await geocodeLocation(params.location!)

  if (!coords) {
    // Fallback to standard search if geocoding fails
    console.warn('Geocoding failed for:', params.location)
    return searchStandard({ ...params, within: 'none' })
  }

  const radiusKm = parseInt(params.within!)
  const bbox = getBoundingBox(coords.lat, coords.lng, radiusKm)

  // Build base WHERE clause (all non-distance filters)
  const where = buildWhereClause(params)

  // Add bounding box filter (uses indexed lat/lng fields)
  where.latitude = { gte: bbox.minLat, lte: bbox.maxLat }
  where.longitude = { gte: bbox.minLng, lte: bbox.maxLng }

  // Ensure lat/lng are not null
  where.AND = [
    { latitude: { not: null } },
    { longitude: { not: null } }
  ]

  // Fetch candidates from database (pre-filtered by bounding box)
  const candidates = await prisma.workerProfile.findMany({
    where,
    select: {
      id: true,
      userId: true,
      firstName: true,
      lastName: true,
      mobile: true,
      gender: true,
      age: true,
      languages: true,
      services: true,
      city: true,
      state: true,
      postalCode: true,
      latitude: true,
      longitude: true,
      experience: true,
      introduction: true,
      photos: true,
      createdAt: true,
      updatedAt: true,
    }
  })

  // Calculate exact distance and filter
  const workersWithDistance = candidates
    .map(worker => ({
      ...worker,
      distance: haversineDistance(
        coords.lat,
        coords.lng,
        worker.latitude!,
        worker.longitude!
      )
    }))
    .filter(worker => worker.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance) // Sort by distance (closest first)

  // Apply pagination to filtered results
  const skip = (params.page - 1) * params.pageSize
  const paginatedWorkers = workersWithDistance.slice(skip, skip + params.pageSize)

  const totalPages = Math.ceil(workersWithDistance.length / params.pageSize)

  return {
    success: true,
    data: paginatedWorkers,
    pagination: {
      total: workersWithDistance.length,
      page: params.page,
      pageSize: params.pageSize,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
    appliedFilters: getAppliedFilters(params),
  }
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

/**
 * GET /api/admin/contractors
 * Search workers with advanced filtering
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Parse filter parameters
    const searchParams = request.nextUrl.searchParams
    const params = parseFilterParams(searchParams)

    // Determine if distance filtering is needed
    const hasDistanceFilter =
      params.location &&
      params.within !== 'none' &&
      params.within !== undefined

    // Execute appropriate search strategy
    const response = hasDistanceFilter
      ? await searchWithDistance(params)
      : await searchStandard(params)

    const duration = Date.now() - startTime

    return NextResponse.json(response, {
      headers: {
        'X-Response-Time': `${duration}ms`,
      },
    })

  } catch (error) {
    const duration = Date.now() - startTime
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'

    console.error('[Admin API] Error fetching workers:', errorMsg)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch workers',
        message: errorMsg,
      },
      {
        status: 500,
        headers: {
          'X-Response-Time': `${duration}ms`,
        },
      }
    )
  }
}
