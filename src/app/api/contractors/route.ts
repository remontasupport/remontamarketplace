import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { applyRateLimit, publicApiRateLimit } from '@/lib/ratelimit'

// ============================================
// PRODUCTION-READY CONTRACTOR LISTING API
// ============================================
// Supports pagination, filtering, and optimized queries
// Designed to handle high traffic with proper caching and rate limiting

// Configuration constants
const DEFAULT_LIMIT = 10
const MAX_LIMIT = 100 // Prevent abuse by limiting max records per request
const DEFAULT_OFFSET = 0

/**
 * GET /api/contractors
 *
 * Query Parameters:
 * - limit: Number of records to return (default: 10, max: 100)
 * - offset: Number of records to skip for pagination (default: 0)
 * - city: Filter by city (case-insensitive partial match)
 * - state: Filter by state (case-insensitive partial match)
 *
 * Response Format:
 * {
 *   contractors: [...],
 *   pagination: {
 *     total: number,
 *     limit: number,
 *     offset: number,
 *     hasMore: boolean,
 *     totalPages: number
 *   }
 * }
 */
export async function GET(request: NextRequest) {
  try {
    // ============================================
    // 1. APPLY RATE LIMITING
    // ============================================
    const rateLimitResult = await applyRateLimit(request, publicApiRateLimit)
    if (!rateLimitResult.success) {
      return rateLimitResult.response
    }

    // ============================================
    // 2. PARSE AND VALIDATE QUERY PARAMETERS
    // ============================================
    const { searchParams } = new URL(request.url)

    // Parse pagination parameters with validation
    const limitParam = searchParams.get('limit')
    let limit: number | undefined = DEFAULT_LIMIT

    if (limitParam === 'all') {
      limit = undefined // Fetch all records (use cautiously)
    } else if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10)
      // Validate limit is a positive number and doesn't exceed max
      if (isNaN(parsedLimit) || parsedLimit < 1) {
        return NextResponse.json(
          { error: 'Invalid limit parameter. Must be a positive number or "all".' },
          { status: 400 }
        )
      }
      limit = Math.min(parsedLimit, MAX_LIMIT) // Enforce maximum limit
    }

    const offsetParam = searchParams.get('offset')
    let offset = DEFAULT_OFFSET

    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam, 10)
      // Validate offset is a non-negative number
      if (isNaN(parsedOffset) || parsedOffset < 0) {
        return NextResponse.json(
          { error: 'Invalid offset parameter. Must be a non-negative number.' },
          { status: 400 }
        )
      }
      offset = parsedOffset
    }

    // Parse filter parameters
    const city = searchParams.get('city')
    const state = searchParams.get('state')

    // ============================================
    // 3. BUILD DATABASE QUERY WITH FILTERS
    // ============================================
    const where: any = {
      deletedAt: null, // Only fetch active (non-deleted) contractors
    }

    // Apply city filter (case-insensitive partial match)
    if (city && city.trim()) {
      where.city = { contains: city.trim(), mode: 'insensitive' }
    }

    // Apply state filter (case-insensitive partial match)
    if (state && state.trim()) {
      where.state = { contains: state.trim(), mode: 'insensitive' }
    }

    // ============================================
    // 4. EXECUTE OPTIMIZED DATABASE QUERIES
    // ============================================
    // Run count and data fetch in parallel for better performance
    const [contractors, total] = await Promise.all([
      prisma.contractorProfile.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' }, // Newest contractors first
        select: {
          // System identifiers
          id: true,
          zohoContactId: true,

          // Basic Information (always needed for display)
          firstName: true,
          lastName: true,
          email: true,
          phone: true,

          // Location (for filtering and display)
          city: true,
          state: true,
          postalZipCode: true,

          // Professional Details
          titleRole: true,
          yearsOfExperience: true,

          // Qualifications & Skills
          qualificationsAndCertifications: true,
          languageSpoken: true,
          hasVehicleAccess: true,

          // Personal Details
          aboutYou: true,
          funFact: true,
          hobbiesAndInterests: true,
          whatMakesBusinessUnique: true,
          additionalInformation: true,

          // Profile Image
          profileSubmission: true,

          // System Fields (for debugging and admin purposes)
          lastSyncedAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.contractorProfile.count({ where }),
    ])

    // ============================================
    // 5. BUILD RESPONSE WITH PAGINATION METADATA
    // ============================================
    const totalPages = limit ? Math.ceil(total / limit) : 1
    const currentPage = limit ? Math.floor(offset / limit) + 1 : 1
    const hasMore = limit ? offset + limit < total : false

    // ============================================
    // 6. RETURN SUCCESS RESPONSE
    // ============================================
    return NextResponse.json(
      {
        success: true,
        contractors,
        pagination: {
          total,
          limit: limit || total,
          offset,
          hasMore,
          totalPages,
          currentPage,
        },
      },
      {
        status: 200,
        headers: {
          // Cache for 60 seconds on client, revalidate in background
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    )
  } catch (error) {
    // ============================================
    // 7. ERROR HANDLING
    // ============================================
    console.error('[API Error] Failed to fetch contractors:', error)

    // Log additional details for debugging (remove in production if too verbose)
    if (error instanceof Error) {
      console.error('[API Error] Message:', error.message)
      console.error('[API Error] Stack:', error.stack)
    }

    // Return generic error to client (don't expose internal details)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch contractors. Please try again later.',
        // Include error code for debugging
        code: 'CONTRACTORS_FETCH_ERROR',
      },
      { status: 500 }
    )
  }
}

// ============================================
// NEXT.JS ROUTE CONFIGURATION
// ============================================
// Enable ISR (Incremental Static Regeneration) for better performance
// Revalidate every 60 seconds to keep data fresh without hitting DB every time
export const revalidate = 60 // seconds
