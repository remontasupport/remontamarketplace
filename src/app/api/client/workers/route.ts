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

// ============================================================================
// TYPES
// ============================================================================

interface SearchParams {
  page: number;
  pageSize: number;
  search?: string;
  location?: string;
  services?: string[];
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
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate cache key from search parameters
 * Creates a deterministic key for Redis caching
 */
function generateCacheKey(params: SearchParams): string {
  const keyParts = [
    `p${params.page}`,
    `ps${params.pageSize}`,
    params.search ? `s${params.search.toLowerCase().trim()}` : '',
    params.location ? `l${params.location.toLowerCase().trim()}` : '',
    params.services?.length ? `sv${params.services.sort().join(',')}` : '',
  ].filter(Boolean);

  return CACHE_PREFIX + keyParts.join(':');
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

  // Parse services (comma-separated)
  const servicesParam = searchParams.get('services');
  const services = servicesParam
    ? servicesParam.split(',').map(s => s.trim()).filter(Boolean)
    : undefined;

  return { page, pageSize, search, location, services };
}

/**
 * Build optimized WHERE clause for worker search
 * Uses indexed fields for fast queries
 */
function buildWhereClause(params: SearchParams): Prisma.WorkerProfileWhereInput {
  const conditions: Prisma.WorkerProfileWhereInput[] = [];

  // Base condition: Only ACTIVE users with completed profiles
  conditions.push({
    user: { status: 'ACTIVE' },
    firstName: { not: '' },
    lastName: { not: '' },
  });

  // Text search (name)
  if (params.search) {
    const searchTerm = params.search;
    conditions.push({
      OR: [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { introduction: { contains: searchTerm, mode: 'insensitive' } },
      ],
    });
  }

  // Location filter (city or state)
  if (params.location) {
    const locationTerm = params.location;
    conditions.push({
      OR: [
        { city: { contains: locationTerm, mode: 'insensitive' } },
        { state: { contains: locationTerm, mode: 'insensitive' } },
        { postalCode: { contains: locationTerm } },
      ],
    });
  }

  // Services filter
  if (params.services && params.services.length > 0) {
    conditions.push({
      workerServices: {
        some: {
          categoryName: { in: params.services },
        },
      },
    });
  }

  return { AND: conditions };
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
  const where = buildWhereClause(params);
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

    // 6. Execute database search
    const result = await searchWorkers(params);

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
