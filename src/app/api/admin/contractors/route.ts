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
  hasVehicle?: string
  workerType?: string
  languages?: string[]
  age?: string
  within?: string

  // Therapeutic subcategories filter (NEW)
  therapeuticSubcategories?: string[]

  // Document filters (NEW)
  documentCategories?: string[]
  documentStatuses?: string[]
  requirementTypes?: string[]

  // Experience filter (NEW)
  experienceWith?: string[]
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

/** Maps frontend service names (kebab-case) to database format (Title Case) */
const SERVICE_NAME_MAP: Record<string, string> = {
  'support-worker': 'Support Worker',
  'therapeutic-supports': 'Therapeutic Supports',
  'home-modifications': 'Home Modifications',
  'fitness-rehabilitation': 'Fitness and Rehabilitation',
  'cleaning-services': 'Cleaning Services',
  'nursing-services': 'Nursing Services',
  'home-yard-maintenance': 'Home and Yard Maintenance',
}

/** Maps frontend experience display names to database JSON keys */
const EXPERIENCE_KEY_MAP: Record<string, string> = {
  'Aged Care': 'aged-care',
  'Chronic medical conditions': 'chronic-medical',
  'Disability': 'disability',
  'Mental health': 'mental-health',
  'Working with Children': 'working-with-children',
}

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
   * Has Vehicle / Driver Access Filter
   * Database format is "Yes" or "No"
   */
  hasVehicle: (params) => {
    if (!params.hasVehicle || params.hasVehicle === 'all') return null;
    return { hasVehicle: params.hasVehicle };
  },

  /**
   * Worker Type Filter
   * Queries JSON column: abn = {"workerEngagementType":{"type":"abn"|"tfn","signed":true}}
   * Employee = type is "tfn", Contractor = type is "abn"
   */
  workerType: (params) => {
    if (!params.workerType || params.workerType === 'all') return null;
    const typeValue = params.workerType === 'Employee' ? 'tfn' : 'abn';
    return {
      abn: {
        path: ['workerEngagementType', 'type'],
        equals: typeValue,
      },
    };
  },

  /**
   * Age Range Filter
   * Filters by dateOfBirth (primary) or age column (fallback)
   * Converts age range to birth date range for accurate filtering
   */
  age: (params) => {
    if (!params.age || params.age === 'all') return null;

    const today = new Date();
    const currentYear = today.getFullYear();

    let minAge: number;
    let maxAge: number;

    // Parse age range
    if (params.age === '60+') {
      minAge = 60;
      maxAge = 120; // Reasonable upper limit
    } else {
      const match = params.age.match(/^(\d+)-(\d+)$/);
      if (!match) return null;

      const [, min, max] = match;
      minAge = parseInt(min, 10);
      maxAge = parseInt(max, 10);
    }

    // Calculate birth year range (reverse logic: older age = earlier birth year)
    const maxBirthYear = currentYear - minAge; // younger end of range
    const minBirthYear = currentYear - maxAge; // older end of range

    // Create OR condition: match either dateOfBirth range OR age range
    return {
      OR: [
        // Match by dateOfBirth (primary method)
        {
          AND: [
            { dateOfBirth: { not: null } },
            { dateOfBirth: { gte: `${minBirthYear}-01-01` } },
            { dateOfBirth: { lte: `${maxBirthYear}-12-31` } }
          ]
        },
        // Match by age column (fallback for profiles without dateOfBirth)
        {
          AND: [
            { dateOfBirth: null },
            { age: { gte: minAge, lte: maxAge } }
          ]
        }
      ]
    };
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
   * Queries from WorkerAdditionalInfo table's languages column with fallback to WorkerProfile.languages
   *
   * FALLBACK LOGIC:
   * 1. Primary: Check workerAdditionalInfo.languages array (preferred, detailed info)
   * 2. Fallback: Check workerProfile.languages array (basic profile data)
   *
   * Both use PostgreSQL array intersection for fast queries
   * Matches workers who speak ANY of the selected languages
   * Normalizes to Title Case to match database format (e.g., "English", "Mandarin")
   */
  languages: (params) => {
    if (!params.languages || params.languages.length === 0) return null;

    const normalizedLanguages = params.languages.map(toTitleCase);

    return {
      OR: [
        // Primary: Check workerAdditionalInfo.languages array
        {
          workerAdditionalInfo: {
            languages: { hasSome: normalizedLanguages }
          }
        },
        // Fallback: Check workerProfile.languages array
        {
          languages: { hasSome: normalizedLanguages }
        }
      ]
    };
  },

  /**
   * Text Search Filter
   * Searches across firstName, lastName, mobile
   * Supports full name search (e.g., "Test Terson" matches firstName="Test" lastName="Terson")
   */
  textSearch: (params) => {
    if (!params.search) return null;

    const search = params.search.trim();
    const searchParts = search.split(/\s+/).filter(Boolean);

    // Base conditions: search in individual fields
    const baseConditions = [
      { firstName: { contains: search, mode: 'insensitive' as const } },
      { lastName: { contains: search, mode: 'insensitive' as const } },
      { mobile: { contains: search } },
    ];

    // If search has multiple words, add full name matching conditions
    if (searchParts.length >= 2) {
      const firstPart = searchParts[0];
      const remainingParts = searchParts.slice(1).join(' ');

      // firstName matches first part AND lastName matches remaining (e.g., "Test Terson")
      baseConditions.push({
        AND: [
          { firstName: { contains: firstPart, mode: 'insensitive' as const } },
          { lastName: { contains: remainingParts, mode: 'insensitive' as const } },
        ],
      } as any);

      // lastName matches first part AND firstName matches remaining (e.g., "Terson Test")
      baseConditions.push({
        AND: [
          { lastName: { contains: firstPart, mode: 'insensitive' as const } },
          { firstName: { contains: remainingParts, mode: 'insensitive' as const } },
        ],
      } as any);
    }

    return { OR: baseConditions };
  },

  /**
   * Therapeutic Subcategories Filter (Multi-select)
   * Filters workers who have therapeutic supports with specific subcategories
   * Checks WorkerService.subcategoryIds array for therapeutic-supports category
   */
  therapeuticSubcategories: (params) => {
    if (!params.therapeuticSubcategories || params.therapeuticSubcategories.length === 0) return null;

    return {
      workerServices: {
        some: {
          categoryId: 'therapeutic-supports',
          subcategoryIds: {
            hasSome: params.therapeuticSubcategories
          }
        }
      }
    };
  },

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
   * Workers who have ANY of the selected document types.
   * Uses IN clause — PostgreSQL optimises IN('x') to = 'x' for single values.
   */
  requirementTypes: (params) => {
    if (!params.requirementTypes?.length) return null
    return {
      verificationRequirements: {
        some: { requirementType: { in: params.requirementTypes } }
      }
    }
  },

  /**
   * Experience With Filter (Multi-select)
   * Workers must have ALL selected experience types (AND logic).
   * Queries WorkerAdditionalInfo.experience JSON column.
   * Uses module-level EXPERIENCE_KEY_MAP — not recreated per call.
   */
  experienceWith: (params) => {
    if (!params.experienceWith?.length) return null
    return {
      AND: params.experienceWith.map(exp => ({
        workerAdditionalInfo: {
          experience: {
            path: [EXPERIENCE_KEY_MAP[exp] ?? exp.toLowerCase().replace(/\s+/g, '-')],
            not: Prisma.DbNull
          }
        }
      }))
    }
  },
}

// ============================================================================
// FILTER COMPOSER
// ============================================================================

/**
 * Builds the Prisma WHERE clause from all active filters.
 *
 * Combination logic:
 *   - Filters of the same type use OR internally (e.g. requirementTypes IN [...])
 *   - Different filter types are ANDed together via the top-level AND array
 *
 * The AND array composition prevents the silent key-overwrite bug that spread
 * merging causes when multiple filters target the same relation field
 * (e.g. documentCategories + documentStatuses both targeting verificationRequirements).
 */
function buildWhereClause(params: FilterParams): Prisma.WorkerProfileWhereInput {
  const baseCondition: Prisma.WorkerProfileWhereInput = {
    user: { status: 'ACTIVE' }
  }

  const activeFilters = Object.values(filterRegistry)
    .map(filterFn => filterFn(params))
    .filter((clause): clause is NonNullable<typeof clause> => clause !== null)

  if (activeFilters.length === 0) return baseCondition

  // AND array safely composes all filters — prevents silent key overwrites
  // when multiple filters target the same relation (e.g. verificationRequirements)
  return { AND: [baseCondition, ...activeFilters] }
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

// Module-level geocode cache — reused across requests within a warm serverless instance.
// Location strings (e.g. "Sydney NSW") rarely change coordinates, so 24h TTL is safe.
const _geocodeCache = new Map<string, { coords: { lat: number; lng: number }; expiresAt: number }>()
const GEOCODE_TTL_MS = 24 * 60 * 60 * 1000

async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  const key = location.toLowerCase().trim()
  const cached = _geocodeCache.get(key)
  if (cached && cached.expiresAt > Date.now()) return cached.coords

  try {
    const result = await geocodeAddress(location)
    if (result) {
      const coords = { lat: result.latitude, lng: result.longitude }
      _geocodeCache.set(key, { coords, expiresAt: Date.now() + GEOCODE_TTL_MS })
      return coords
    }
    return null
  } catch {
    return null
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function transformWorkerServices(workerServices: Array<{ categoryName: string }>): string[] {
  return [...new Set(workerServices.map(ws => ws.categoryName))]
}

function calculateAge(dateOfBirth: string): number | null {
  const dob = new Date(dateOfBirth)
  if (isNaN(dob.getTime())) return null

  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--

  return age >= 0 ? age : null
}

function parseFilterParams(searchParams: URLSearchParams): FilterParams {
  const get = (key: string) => searchParams.get(key)
  const parseArr = (key: string) =>
    (get(key) ?? '').split(',').map(s => s.trim()).filter(Boolean)

  return {
    page:     Math.max(1, parseInt(get('page') ?? '1', 10)),
    pageSize: Math.min(100, Math.max(1, parseInt(get('pageSize') ?? '20', 10))),
    sortBy:   get('sortBy') || 'createdAt',
    sortOrder: get('sortOrder') === 'asc' ? 'asc' : 'desc',
    search:        get('search')       || undefined,
    location:      get('location')     || undefined,
    typeOfSupport: get('typeOfSupport')|| undefined,
    gender:        get('gender')       || undefined,
    hasVehicle:    get('hasVehicle')   || undefined,
    workerType:    get('workerType')   || undefined,
    age:           get('age')          || undefined,
    within:        get('within')       || 'none',
    languages:                 parseArr('languages'),
    therapeuticSubcategories:  parseArr('therapeuticSubcategories'),
    documentCategories:        parseArr('documentCategories'),
    documentStatuses:          parseArr('documentStatuses'),
    requirementTypes:          parseArr('requirementTypes'),
    experienceWith:            parseArr('experienceWith'),
  }
}

function getAppliedFilters(params: FilterParams): Partial<FilterParams> {
  const applied: Partial<FilterParams> = {}

  // String filters — include only when set and not the default sentinel value
  const stringChecks: Array<[keyof FilterParams, string]> = [
    ['typeOfSupport', 'all'],
    ['gender',        'all'],
    ['hasVehicle',    'all'],
    ['workerType',    'all'],
    ['age',           'all'],
    ['within',        'none'],
  ]
  for (const [key, sentinel] of stringChecks) {
    const val = params[key]
    if (val && val !== sentinel) (applied as any)[key] = val
  }

  if (params.search)   applied.search   = params.search
  if (params.location) applied.location = params.location

  // Array filters — include only when non-empty
  const arrKeys: Array<keyof FilterParams> = [
    'languages', 'therapeuticSubcategories', 'documentCategories',
    'documentStatuses', 'requirementTypes', 'experienceWith',
  ]
  for (const key of arrKeys) {
    const val = params[key] as string[]
    if (val?.length) (applied as any)[key] = val
  }

  return applied
}

// ============================================================================
// SHARED QUERY HELPERS
// ============================================================================

/** Columns fetched for every worker record — shared by both query paths */
const workerSelect = {
  id: true,
  userId: true,
  firstName: true,
  lastName: true,
  mobile: true,
  gender: true,
  age: true,
  dateOfBirth: true,
  languages: true,
  workerAdditionalInfo: { select: { languages: true } },
  workerServices: { select: { categoryName: true } },
  user: { select: { email: true, status: true } },
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
} as const

/** Transforms a raw DB worker record into the API response shape */
function transformWorker(worker: any, distanceKm?: number) {
  const calculatedAge = worker.dateOfBirth ? calculateAge(worker.dateOfBirth) : null
  const finalAge = calculatedAge !== null ? calculatedAge : worker.age

  let finalLanguages: string[] = []
  if (worker.workerAdditionalInfo?.languages?.length > 0) {
    finalLanguages = worker.workerAdditionalInfo.languages
  } else if (worker.languages?.length > 0) {
    finalLanguages = worker.languages
  }

  const result: Record<string, unknown> = {
    ...worker,
    email: worker.user?.email ?? null,
    age: finalAge,
    languages: finalLanguages,
    services: transformWorkerServices(worker.workerServices),
    isActive: worker.user?.status === 'ACTIVE',
    workerServices: undefined,
    workerAdditionalInfo: undefined,
    user: undefined,
    dateOfBirth: undefined,
  }

  if (distanceKm !== undefined) result.distance = distanceKm
  return result
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

  let total, workers
  try {
    [total, workers] = await Promise.all([
      prisma.workerProfile.count({ where }),
      prisma.workerProfile.findMany({ where, orderBy, skip, take: params.pageSize, select: workerSelect }),
    ])
  } catch (prismaError: any) {
    console.error('[Admin Contractors] Prisma query error:', {
      message: prismaError.message,
      code: prismaError.code,
      meta: prismaError.meta,
    })
    throw new Error(`Database query failed: ${prismaError.message}`)
  }

  const totalPages = Math.ceil(total / params.pageSize)

  return {
    success: true,
    data: workers.map(w => transformWorker(w)),
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
 * Search with distance filtering — two-pass strategy:
 *
 * Pass 1: Fetch only { id, lat, lng } for all bounding-box candidates (no JOINs).
 *         Apply exact Haversine filter + sort in JS on this tiny payload.
 *
 * Pass 2: Fetch full data only for the current page IDs (≤ pageSize rows).
 *
 * This prevents loading full records for every candidate and makes
 * both total count and pagination 100% accurate.
 */
async function searchWithDistance(params: FilterParams): Promise<PaginatedResponse> {
  const coords = await geocodeLocation(params.location!)
  if (!coords) return searchStandard({ ...params, within: 'none' })

  const radiusKm = params.within === 'none' ? 500 : parseInt(params.within!)
  const bbox = getBoundingBox(coords.lat, coords.lng, radiusKm)

  // Compose WHERE: base filters + bounding box pre-filter (hits lat/lng composite index)
  const distanceWhere: Prisma.WorkerProfileWhereInput = {
    AND: [
      buildWhereClause(params),
      { latitude: { gte: bbox.minLat, lte: bbox.maxLat, not: null } },
      { longitude: { gte: bbox.minLng, lte: bbox.maxLng, not: null } },
    ]
  }

  // Pass 1: coordinates only — no JOINs, minimal data transfer
  const candidates = await prisma.workerProfile.findMany({
    where: distanceWhere,
    select: { id: true, latitude: true, longitude: true },
  })

  // Exact Haversine filter + sort ascending by distance
  const ranked = candidates
    .map(w => ({ id: w.id, distance: haversineDistance(coords.lat, coords.lng, w.latitude!, w.longitude!) }))
    .filter(w => w.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)

  const total = ranked.length
  const skip = (params.page - 1) * params.pageSize
  const pageSlice = ranked.slice(skip, skip + params.pageSize)
  const pageIds = pageSlice.map(w => w.id)
  const distanceMap = new Map(pageSlice.map(w => [w.id, w.distance]))

  // Pass 2: full data only for this page (≤ pageSize rows)
  const workers = pageIds.length > 0
    ? await prisma.workerProfile.findMany({ where: { id: { in: pageIds } }, select: workerSelect })
    : []

  // Re-order to match distance sort — IN clause does not guarantee order
  const workerMap = new Map(workers.map(w => [w.id, w]))
  const data = pageIds
    .filter(id => workerMap.has(id))
    .map(id => transformWorker(workerMap.get(id)!, distanceMap.get(id)))

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

    // Log detailed error for debugging
    console.error('[Admin Contractors API] Error:', {
      message: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
      error: error,
    });

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch workers',
        message: errorMsg,
        // Include stack trace in development
        ...(process.env.NODE_ENV === 'development' && {
          stack: error instanceof Error ? error.stack : undefined,
        }),
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
