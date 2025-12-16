import { NextRequest, NextResponse } from 'next/server'
import { authPrisma as prisma } from '@/lib/auth-prisma'
import { Prisma } from '@/generated/auth-client'
import { geocodeAddress } from '@/lib/geocoding'
import { requireRole } from '@/lib/auth'
import { UserRole } from '@/types/auth'

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

  // Document filters (NEW)
  documentCategories?: string[]
  documentStatuses?: string[]
  requirementTypes?: string[]
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
   * Queries the WorkerService relation table (optimized with indexes)
   * Maps kebab-case to Title Case format in database
   */
  services: (params) => {
    if (!params.typeOfSupport || params.typeOfSupport === 'all') return null;

    const dbServiceName = SERVICE_NAME_MAP[params.typeOfSupport] || params.typeOfSupport;

    return {
      workerServices: {
        some: {
          categoryName: dbServiceName
        }
      }
    };
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
   * Location Filter - REMOVED
   * Location field is now ONLY used for distance filtering
   * When "Within" = "None", all workers are shown regardless of location
   * When "Within" = distance value, location is used for geocoding and distance calc
   */
  location: (params) => null,

  /**
   * Document Categories Filter (Multi-select)
   * Filters workers who have documents in specific categories
   * Uses indexed relation for fast queries
   */
  documentCategories: (params) => {
    if (!params.documentCategories || params.documentCategories.length === 0) return null;

    return {
      verificationRequirements: {
        some: {
          documentCategory: {
            in: params.documentCategories as any[]
          }
        }
      }
    };
  },

  /**
   * Document Statuses Filter (Multi-select)
   * Filters workers who have documents with specific statuses
   * Uses indexed status field for performance
   */
  documentStatuses: (params) => {
    if (!params.documentStatuses || params.documentStatuses.length === 0) return null;

    return {
      verificationRequirements: {
        some: {
          status: {
            in: params.documentStatuses as any[]
          }
        }
      }
    };
  },

  /**
   * Requirement Types Filter (Multi-select)
   * Filters workers who have specific document types
   *
   * Logic: OR within the same filter (worker has ANY of the selected documents)
   * Uses optimized indexed query for maximum performance
   *
   * Example: If selecting ["driver-license-vehicle", "police-check"]
   * Returns: Workers who have either document (or both)
   *
   * Performance: O(log n) with requirementType index + compound index
   *
   * IMPORTANT: Uses requirementType (Document.id) for querying
   * Examples: "driver-license-vehicle", "police-check", "worker-screening-check"
   */
  requirementTypes: (params) => {
    if (!params.requirementTypes || params.requirementTypes.length === 0) return null;
    // For single document, use simple query (fastest)
    if (params.requirementTypes.length === 1) {
      return {
        verificationRequirements: {
          some: {
            requirementType: params.requirementTypes[0]
          }
        }
      };
    }

    // For multiple documents, use IN clause (optimized with index)
    // This finds workers who have AT LEAST ONE of the selected documents
    return {
      verificationRequirements: {
        some: {
          requirementType: {
            in: params.requirementTypes
          }
        }
      }
    };
  },
}

// ============================================================================
// FILTER COMPOSER
// ============================================================================

/**
 * Builds WHERE clause from active filters
 * Uses functional composition to merge filters dynamically
 *
 * FILTER COMBINATION LOGIC:
 * -------------------------
 * - Within same filter type: OR logic (any match)
 *   Example: requirementTypes = ["driver-license-vehicle", "police-check"]
 *   Result: Workers with Driver's License OR Police Check
 *
 * - Across different filter types: AND logic (all must match)
 *   Example: requirementTypes = ["driver-license-vehicle"] + documentStatuses = ["APPROVED"]
 *   Result: Workers with Driver's License AND status is APPROVED
 *
 * HOW REQUIREMENT TYPES FILTERING WORKS:
 * ---------------------------------------
 * 1. Filter options come from Document table (master list of all possible documents)
 * 2. Each Document has: id (kebab-case), name (display), category
 *    Example: { id: "driver-license-vehicle", name: "Driver's License", category: "TRANSPORT" }
 * 3. Frontend shows Document.name in dropdown, sends Document.id as value
 * 4. Backend queries VerificationRequirement.requirementType = Document.id
 * 5. This finds all workers who have uploaded that specific document type
 *
 * PERFORMANCE OPTIMIZATIONS:
 * --------------------------
 * 1. Uses indexed fields (requirementType, status, documentCategory, workerProfileId)
 * 2. Compound indexes for common combinations (workerProfileId + requirementType)
 * 3. Executes count and data queries in parallel
 * 4. Uses database-level filtering (no post-processing)
 *
 * QUERY COMPLEXITY:
 * -----------------
 * - Simple filters: O(log n) with indexes
 * - Multiple filters: O(log n * m) where m = number of active filters
 * - Expected query time: < 100ms for 10k+ records
 */
function buildWhereClause(params: FilterParams): Prisma.WorkerProfileWhereInput {
  // Execute all filters and collect non-null results
  const activeFilters = Object.values(filterRegistry)
    .map(filterFn => filterFn(params))
    .filter((clause): clause is NonNullable<typeof clause> => clause !== null)

  // Debug logging for WHERE clause
  if (activeFilters.length > 0) {
  }

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
    return result;
  }

  // No OR filters, just merge AND filters
  const result = andFilters.reduce<Prisma.WorkerProfileWhereInput>((acc, filter) => {
    return { ...acc, ...filter }
  }, {})

  return result
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
 * Converts location to coordinates using Google Geocoding API
 *
 * IMPORTANT: Uses the same geocoding service as worker registration
 * to ensure coordinate consistency and accurate distance filtering
 */
async function geocodeLocation(
  location: string
): Promise<{ lat: number; lng: number } | null> {
  try {
    // Use Google Geocoding API (same as worker registration)
    // This ensures coordinates match what's stored in worker profiles
    const result = await geocodeAddress(location)

    if (result) {
      return {
        lat: result.latitude,
        lng: result.longitude
      }
    }

    return null
  } catch (error) {
    return null
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Transform WorkerService records to legacy services array format
 * Extracts unique category names for backward compatibility
 */
function transformWorkerServices(workerServices: Array<{ categoryName: string }>): string[] {
  const uniqueCategories = new Set<string>();
  workerServices.forEach(ws => uniqueCategories.add(ws.categoryName));
  return Array.from(uniqueCategories);
}

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

  // Parse document filters (NEW - comma-separated arrays)
  const documentCategoriesParam = searchParams.get('documentCategories')
  const documentCategories = documentCategoriesParam
    ? documentCategoriesParam.split(',').map(c => c.trim()).filter(Boolean)
    : []

  const documentStatusesParam = searchParams.get('documentStatuses')
  const documentStatuses = documentStatusesParam
    ? documentStatusesParam.split(',').map(s => s.trim()).filter(Boolean)
    : []

  const requirementTypesParam = searchParams.get('requirementTypes')
  const requirementTypes = requirementTypesParam
    ? requirementTypesParam.split(',').map(t => t.trim()).filter(Boolean)
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
    documentCategories,
    documentStatuses,
    requirementTypes,
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
  if (params.documentCategories && params.documentCategories.length > 0) {
    applied.documentCategories = params.documentCategories
  }
  if (params.documentStatuses && params.documentStatuses.length > 0) {
    applied.documentStatuses = params.documentStatuses
  }
  if (params.requirementTypes && params.requirementTypes.length > 0) {
    applied.requirementTypes = params.requirementTypes
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
  const queryStartTime = Date.now()
  const where = buildWhereClause(params)
  const orderBy = buildOrderByClause(params.sortBy, params.sortOrder)
  const skip = (params.page - 1) * params.pageSize

  // Log active filters for debugging
  const appliedFilters = getAppliedFilters(params)
  if (Object.keys(appliedFilters).length > 0) {
  }

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
        workerServices: {
          select: {
            categoryName: true,
          }
        },
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

  const queryDuration = Date.now() - queryStartTime
  // Transform workerServices to legacy services array format for backward compatibility
  const workersWithServices = workers.map(worker => ({
    ...worker,
    services: transformWorkerServices(worker.workerServices),
    workerServices: undefined, // Remove from response
  }))

  const totalPages = Math.ceil(total / params.pageSize)

  return {
    success: true,
    data: workersWithServices,
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
    return searchStandard({ ...params, within: 'none' })
  }

  // Default radius: 500 km when "Within" = "None"
  // This shows workers in a wide area while still being location-based
  const radiusKm = params.within === 'none' ? 500 : parseInt(params.within!)
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
      workerServices: {
        select: {
          categoryName: true,
        }
      },
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
      services: transformWorkerServices(worker.workerServices),
      workerServices: undefined, // Remove from response
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
    // Require ADMIN role
    await requireRole(UserRole.ADMIN)

    // Parse filter parameters
    const searchParams = request.nextUrl.searchParams
    const params = parseFilterParams(searchParams)

    // Determine if distance filtering is needed
    // Distance filtering is used when:
    // 1. Location is provided, AND
    // 2. Within has any value (including "none" which defaults to 500 km)
    const hasDistanceFilter = params.location && params.location.trim() !== ''

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
