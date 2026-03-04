/**
 * Client Workers Search API
 *
 * GET /api/client/workers
 *
 * A fast, optimized API for clients to discover support workers.
 *
 * PERFORMANCE OPTIMIZATIONS:
 * 1. Redis caching (5-minute TTL for search results)
 * 2. Lean database queries (select only needed fields)
 * 3. Parallel query execution (count + data)
 * 4. Indexed field queries (services, location, status)
 * 5. Connection pooling (Prisma default)
 * 6. Response compression (Next.js default)
 *
 * SECURITY:
 * - Requires CLIENT or COORDINATOR role
 * - Returns only public worker information
 * - Rate limited to prevent abuse
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { authPrisma as prisma } from '@/lib/auth-prisma';
import { Prisma } from '@/generated/auth-client';
import { UserRole } from '@/types/auth';
import redis from '@/lib/redis';
import { applyRateLimit, publicApiRateLimit } from '@/lib/ratelimit';
import { geocodeAddress } from '@/lib/geocoding';

// ============================================================================
// TYPES
// ============================================================================

interface SearchParams {
  page: number;
  pageSize: number;
  search?: string;
  location?: string;
  services?: string[];
  within?: number; // radius in km, default 50
}

interface WorkerPublicData {
  id: string;
  firstName: string;
  lastName: string;
  photo: string | null;
  role: string;
  bio: string;
  skills: string[];
  location: string;
  isNdisCompliant: boolean;
}

interface SearchResponse {
  success: boolean;
  data: WorkerPublicData[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  cached?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;
const CACHE_PREFIX = 'client:workers:search:';
const CACHE_TTL_SECONDS = 300; // 5 minutes

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
  try {
    const result = await geocodeAddress(location)
    return result ? { lat: result.latitude, lng: result.longitude } : null
  } catch {
    return null
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate cache key from search parameters.
 *
 * Search terms are tokenized and sorted before keying so that semantically
 * equivalent queries share the same cache entry:
 *   "loves cooking"    → tokens: ["cooking"]     → key: s:cooking
 *   "cooking"          → tokens: ["cooking"]     → key: s:cooking  (same — cache hit)
 *   "speech therapist" → tokens: ["speech","therapist"] → key: s:speech,therapist
 *   "therapist speech" → tokens: ["speech","therapist"] → key: s:speech,therapist (same)
 */
function generateCacheKey(params: SearchParams): string {
  const searchKey = params.search
    ? `s:${tokenizeQuery(params.search).sort().join(',')}`
    : ''

  const keyParts = [
    `p${params.page}`,
    `ps${params.pageSize}`,
    searchKey,
    params.location ? `l:${params.location.toLowerCase().trim()}` : '',
    params.services?.length ? `sv:${[...params.services].sort().join(',')}` : '',
  ].filter(Boolean)

  return CACHE_PREFIX + keyParts.join(':')
}

/**
 * Parse and validate search parameters from URL
 */
function parseSearchParams(searchParams: URLSearchParams): SearchParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(searchParams.get('pageSize') || String(DEFAULT_PAGE_SIZE), 10))
  );
  const search = searchParams.get('search')?.trim() || undefined;
  const location = searchParams.get('location')?.trim() || undefined;
  const withinParam = searchParams.get('within');
  const within = withinParam ? Math.max(1, parseInt(withinParam, 10)) : 50;

  // Parse services (comma-separated)
  const servicesParam = searchParams.get('services');
  const services = servicesParam
    ? servicesParam.split(',').map(s => s.trim()).filter(Boolean)
    : undefined;

  return { page, pageSize, search, location, services, within };
}

// ============================================================================
// SEARCH UTILITIES
// ============================================================================

/**
 * Stop words stripped from search queries before tokenization.
 * Covers common English stop words and "intent" words (loves, likes, wants)
 * so that "loves cooking" → ["cooking"] and "likes swimming" → ["swimming"].
 */
const SEARCH_STOP_WORDS = new Set([
  // Intent / filler words users type to describe what they want
  'love', 'loves', 'like', 'likes', 'want', 'wants', 'need', 'needs',
  'enjoy', 'enjoys', 'find', 'looking', 'someone',
  // English stop words
  'i', 'me', 'my', 'we', 'our', 'you', 'your', 'they', 'their',
  'is', 'are', 'was', 'were', 'be', 'been', 'being',
  'do', 'does', 'did', 'has', 'have', 'had',
  'a', 'an', 'the', 'and', 'or', 'but', 'not',
  'who', 'what', 'where', 'when', 'how',
  'that', 'this', 'these', 'those',
  'can', 'will', 'would', 'could', 'should', 'may', 'might',
  'with', 'for', 'of', 'to', 'in', 'on', 'at', 'by', 'from', 'into',
])

/** Cap on the number of tokens processed per query to prevent query explosion */
const MAX_SEARCH_TOKENS = 5

/** Redis key + TTL for the cached set of known service category/subcategory names */
const SERVICE_TERMS_CACHE_KEY = 'search:service_terms:v1'
const SERVICE_TERMS_CACHE_TTL = 3600 // 1 hour — refreshes automatically on miss

/**
 * Tokenize a natural-language search query into meaningful terms.
 *
 * Examples:
 *   "loves cooking"        → ["cooking"]
 *   "likes swimming"       → ["swimming"]
 *   "speech therapist"     → ["speech", "therapist"]
 *   "gardening nurse"      → ["gardening", "nurse"]
 *   "loves cooking pasta"  → ["cooking", "pasta"]
 */
function tokenizeQuery(query: string): string[] {
  const tokens = query
    .trim()
    .split(/[\s,]+/)
    .map(word => word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase())
    .filter(word => word.length >= 2 && !SEARCH_STOP_WORDS.has(word))
    .slice(0, MAX_SEARCH_TOKENS)

  // Fallback: if the entire query consists of stop words, use the raw trimmed query
  return tokens.length > 0 ? tokens : [query.trim()]
}

/**
 * Load all known service category and subcategory names from the database.
 * Results are Redis-cached for 1 hour to avoid a DB round-trip on every search.
 *
 * Used to classify search tokens as "service terms" vs "lifestyle/text terms"
 * so that each token is routed to the correct set of fields.
 */
async function getServiceTerms(): Promise<Set<string>> {
  // ── Try Redis cache first ──────────────────────────────────────────────────
  try {
    if (redis) {
      const cached = await redis.get(SERVICE_TERMS_CACHE_KEY)
      if (cached) {
        return new Set(JSON.parse(cached as string) as string[])
      }
    }
  } catch { /* fall through to DB */ }

  // ── Fetch from DB (both categories and subcategories) ────────────────────
  const [categories, subcategories] = await Promise.all([
    prisma.category.findMany({ select: { name: true } }),
    prisma.subcategory.findMany({ select: { name: true } }),
  ])

  const terms = [
    ...categories.map(c => c.name.toLowerCase()),
    ...subcategories.map(s => s.name.toLowerCase()),
  ]

  // ── Write to Redis for future requests ────────────────────────────────────
  try {
    if (redis) {
      await redis.setex(SERVICE_TERMS_CACHE_KEY, SERVICE_TERMS_CACHE_TTL, JSON.stringify(terms))
    }
  } catch { /* non-fatal */ }

  return new Set(terms)
}

/**
 * Determine whether a search token represents a service type.
 *
 * A token is a service token if it appears as a substring of any known
 * category or subcategory name (min 4 chars to avoid false positives).
 *
 * Examples (given terms contain "nursing", "speech therapist", "cleaning"):
 *   "nurse"     → "nursing".includes("nurs") ✓ → service token
 *   "cleaning"  → "cleaning".includes("cleaning") ✓ → service token
 *   "speech"    → "speech therapist".includes("speech") ✓ → service token
 *   "cooking"   → no term contains "cooking" → text token
 *   "swimming"  → no term contains "swimming" → text token
 */
function isServiceToken(token: string, serviceTerms: Set<string>): boolean {
  const t = token.toLowerCase()
  // Exact match on the full term
  if (serviceTerms.has(t)) return true
  // Partial match: the token is a meaningful substring of a known service term
  // Require min 4 chars to avoid short words ("in", "or", "at") creating false matches
  if (t.length >= 4) {
    for (const term of serviceTerms) {
      if (term.includes(t)) return true
    }
  }
  return false
}

/**
 * WHERE condition for a SERVICE token (e.g. "nurse", "cleaning", "speech therapist").
 *
 * Deliberately excludes bio/hobbies/personality to prevent false positives:
 * a Support Worker who mentions "nurse" in their bio must NOT appear for a "nurse" search.
 *
 * Searched fields:
 *   - workerServices.categoryName  (primary registered service — partial match)
 *   - qualifications               (e.g. "Registered Nurse", "Cert III Cleaning")
 *   - uniqueService                (worker's own description of what they offer)
 */
function buildServiceTokenCondition(token: string): Prisma.WorkerProfileWhereInput {
  return {
    OR: [
      { workerServices: { some: { categoryName: { contains: token, mode: 'insensitive' } } } },
      { qualifications: { contains: token, mode: 'insensitive' } },
      { uniqueService:  { contains: token, mode: 'insensitive' } },
    ],
  }
}

/**
 * WHERE condition for a TEXT / lifestyle token (e.g. "cooking", "swimming", "music").
 *
 * Deliberately excludes workerServices to avoid cross-contamination:
 * searching "cooking" should not surface a worker just because their service
 * category happens to contain that word.
 *
 * Searched fields:
 *   - name, bio, hobbies, fun fact, personality, interests, work preferences
 */
function buildTextTokenCondition(token: string): Prisma.WorkerProfileWhereInput {
  return {
    OR: [
      // Name
      { firstName:    { contains: token, mode: 'insensitive' } },
      { lastName:     { contains: token, mode: 'insensitive' } },
      // Bio & profile text
      { introduction: { contains: token, mode: 'insensitive' } },
      { hobbies:      { contains: token, mode: 'insensitive' } },
      { funFact:      { contains: token, mode: 'insensitive' } },
      // Additional info — text fields
      { workerAdditionalInfo: { personality:     { contains: token, mode: 'insensitive' } } },
      { workerAdditionalInfo: { funFact:         { contains: token, mode: 'insensitive' } } },
      // Additional info — array fields (exact element match, Prisma array limitation)
      { workerAdditionalInfo: { interests:       { hasSome: [token] } } },
      { workerAdditionalInfo: { workPreferences: { hasSome: [token] } } },
    ],
  }
}

/**
 * Build optimized WHERE clause for worker search.
 * Uses indexed fields for fast queries.
 *
 * @param serviceTerms - Set of known category/subcategory names used to classify tokens.
 *                       Pass an empty Set when there is no search query.
 */
function buildWhereClause(
  params: SearchParams,
  serviceTerms: Set<string>,
): Prisma.WorkerProfileWhereInput {
  const conditions: Prisma.WorkerProfileWhereInput[] = []

  // Base condition: only ACTIVE users with completed profiles
  conditions.push({
    user:      { status: 'ACTIVE' },
    firstName: { not: '' },
    lastName:  { not: '' },
  })

  // Default listing only: require a bio/introduction to be present
  const isDefaultListing = !params.search && !params.location && !params.services?.length
  if (isDefaultListing) {
    conditions.push({ introduction: { not: null } })
    conditions.push({ introduction: { not: '' } })
  }

  // ── Multi-token semantic search ───────────────────────────────────────────
  // Each token is classified then routed to the appropriate set of fields:
  //   Service token  → services / qualifications only (strict, no bio)
  //   Text token     → bio / hobbies / personality only (no services)
  //
  // AND logic across tokens: every token must match somewhere in the profile.
  // "speech therapist" → "speech" (service) AND "therapist" (service) both matched via services.
  // "loves cooking"    → "cooking" (text) matched via hobbies/bio.
  // "nurse"            → service token → ONLY workers with "Nursing" as their service category.
  if (params.search) {
    const tokens = tokenizeQuery(params.search)
    for (const token of tokens) {
      const condition = isServiceToken(token, serviceTerms)
        ? buildServiceTokenCondition(token)
        : buildTextTokenCondition(token)
      conditions.push(condition)
    }
  }

  // NOTE: Location filtering is handled via geocoding + Haversine in searchWorkersWithDistance.

  // Explicit services filter (separate from keyword search)
  if (params.services && params.services.length > 0) {
    conditions.push({
      workerServices: {
        some: { categoryName: { in: params.services } },
      },
    })
  }

  return { AND: conditions }
}

/**
 * Transform database worker to public API response
 * Only exposes safe, public information
 */
function transformToPublicData(worker: any): WorkerPublicData {
  // Get primary service (first service as role)
  const primaryService = worker.workerServices?.[0]?.categoryName || 'Support Worker';

  // Get all sub-category names as skills (flatten from all services)
  const skills = worker.workerServices?.flatMap((ws: any) => ws.subcategoryNames || []) || [];

  // Build location string
  const locationParts = [worker.city, worker.state].filter(Boolean);
  const location = locationParts.join(', ') || 'Australia';

  // Check NDIS compliance (simplified - has any approved verification)
  const isNdisCompliant = worker.verificationRequirements?.some(
    (vr: any) => vr.status === 'APPROVED'
  ) ?? false;

  return {
    id: worker.id,
    firstName: worker.firstName,
    lastName: worker.lastName,
    photo: worker.photos || null,
    role: primaryService,
    bio: worker.introduction || '',
    skills: [...new Set(skills)], // Remove duplicates
    location,
    isNdisCompliant,
  };
}

// ============================================================================
// MAIN SEARCH FUNCTION
// ============================================================================

/**
 * Execute optimized worker search
 * Uses parallel queries and caching for performance
 */
async function searchWorkers(params: SearchParams): Promise<SearchResponse> {
  // Only fetch service terms when there is a keyword query (skips the Redis/DB
  // round-trip for location-only or default listing searches)
  const serviceTerms = params.search ? await getServiceTerms() : new Set<string>()
  const where = buildWhereClause(params, serviceTerms)
  const skip = (params.page - 1) * params.pageSize;

  // Execute count and data queries in parallel for performance
  const [total, workers] = await Promise.all([
    prisma.workerProfile.count({ where }),
    prisma.workerProfile.findMany({
      where,
      skip,
      take: params.pageSize,
      orderBy: [
        { createdAt: 'desc' }, // Newest first
      ],
      select: {
        // Only select fields we need (lean query)
        id: true,
        firstName: true,
        lastName: true,
        photos: true,
        introduction: true,
        city: true,
        state: true,
        latitude: true,
        longitude: true,
        workerServices: {
          select: {
            categoryName: true,
            subcategoryNames: true,
          },
          take: 5, // Limit services for performance
        },
        verificationRequirements: {
          where: { status: 'APPROVED' },
          select: { status: true },
          take: 1, // Just need to know if any are approved
        },
      },
    }),
  ]);

  const totalPages = Math.ceil(total / params.pageSize);

  return {
    success: true,
    data: workers.map(transformToPublicData),
    pagination: {
      total,
      page: params.page,
      pageSize: params.pageSize,
      totalPages,
      hasNext: params.page < totalPages,
      hasPrev: params.page > 1,
    },
  };
}

/**
 * Execute distance-based worker search
 * Geocodes the location string, then filters by bounding box + Haversine
 * Falls back to standard search if geocoding fails
 */
async function searchWorkersWithDistance(params: SearchParams): Promise<SearchResponse> {
  // Run geocoding and service-term lookup in parallel to minimise latency
  const [coords, serviceTerms] = await Promise.all([
    geocodeLocation(params.location!),
    params.search ? getServiceTerms() : Promise.resolve(new Set<string>()),
  ])

  if (!coords) {
    // Geocoding failed — fall back to standard search (no location filter)
    return searchWorkers({ ...params, location: undefined })
  }

  const radiusKm = params.within ?? 50
  const bbox = getBoundingBox(coords.lat, coords.lng, radiusKm)
  const where = buildWhereClause(params, serviceTerms)

  // Add bounding box to narrow DB candidates (uses indexed lat/lng fields)
  where.latitude = { gte: bbox.minLat, lte: bbox.maxLat }
  where.longitude = { gte: bbox.minLng, lte: bbox.maxLng }

  const existingAnd = where.AND ? (Array.isArray(where.AND) ? where.AND : [where.AND]) : []
  where.AND = [
    ...existingAnd,
    { latitude: { not: null } },
    { longitude: { not: null } },
  ]

  const candidates = await prisma.workerProfile.findMany({
    where,
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photos: true,
      introduction: true,
      city: true,
      state: true,
      latitude: true,
      longitude: true,
      workerServices: {
        select: { categoryName: true, subcategoryNames: true },
        take: 5,
      },
      verificationRequirements: {
        where: { status: 'APPROVED' },
        select: { status: true },
        take: 1,
      },
    },
  })

  // Exact Haversine filter + sort by distance
  const filtered = candidates
    .map(worker => ({
      ...worker,
      distance: haversineDistance(coords.lat, coords.lng, worker.latitude!, worker.longitude!),
    }))
    .filter(w => w.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)

  const total = filtered.length
  const skip = (params.page - 1) * params.pageSize
  const paginated = filtered.slice(skip, skip + params.pageSize)
  const totalPages = Math.ceil(total / params.pageSize)

  return {
    success: true,
    data: paginated.map(transformToPublicData),
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
// API ROUTE HANDLER
// ============================================================================

export async function GET(request: NextRequest) {
  const startTime = Date.now();

  try {
    // 1. Rate limiting (prevents abuse)
    try {
      const rateLimitResult = await applyRateLimit(request, publicApiRateLimit);
      if (!rateLimitResult.success) {
        return rateLimitResult.response;
      }
    } catch {
      // Continue if rate limit check fails (fail open)
    }

    // 2. Authentication check
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 3. Role check (CLIENT or COORDINATOR only)
    const userRole = session.user.role;
    if (userRole !== UserRole.CLIENT && userRole !== UserRole.COORDINATOR) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }

    // 4. Parse search parameters
    const searchParams = request.nextUrl.searchParams;
    const params = parseSearchParams(searchParams);

    // 5. Check Redis cache first
    const cacheKey = generateCacheKey(params);
    let cachedResult: SearchResponse | null = null;

    try {
      if (redis) {
        const cached = await redis.get(cacheKey);
        if (cached) {
          cachedResult = JSON.parse(cached as string);
        }
      }
    } catch {
      // Cache miss or error - continue to database
    }

    if (cachedResult) {
      const duration = Date.now() - startTime;
      return NextResponse.json(
        { ...cachedResult, cached: true },
        {
          headers: {
            'X-Response-Time': `${duration}ms`,
            'X-Cache': 'HIT',
            'Cache-Control': 'private, max-age=60',
          },
        }
      );
    }

    // 6. Execute database search (distance-based if location provided)
    const result = params.location
      ? await searchWorkersWithDistance(params)
      : await searchWorkers(params);

    // 7. Cache the result
    try {
      if (redis) {
        await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(result));
      }
    } catch {
      // Cache write failed - continue without caching
    }

    // 8. Return response with performance headers
    const duration = Date.now() - startTime;

    return NextResponse.json(result, {
      headers: {
        'X-Response-Time': `${duration}ms`,
        'X-Cache': 'MISS',
        'Cache-Control': 'private, max-age=60',
      },
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Client Workers API] Error:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch workers',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      {
        status: 500,
        headers: {
          'X-Response-Time': `${duration}ms`,
        },
      }
    );
  }
}
