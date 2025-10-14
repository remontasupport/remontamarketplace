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
 * - postalCode: Filter by postal/zip code (exact or partial match)
 * - gender: Filter by gender (Male, Female, or All)
 * - supportType: Filter by title/role (case-insensitive partial match)
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
    const location = searchParams.get('location') // Combined location search
    const city = searchParams.get('city')
    const state = searchParams.get('state')
    const postalCode = searchParams.get('postalCode')
    const gender = searchParams.get('gender')
    const supportType = searchParams.get('supportType')

    // ============================================
    // 3. BUILD DATABASE QUERY WITH FILTERS
    // ============================================
    const where: any = {
      deletedAt: null, // Only fetch active (non-deleted) contractors
    }

    // Apply flexible location filter (handles "NSW 2148", "Parramatta", "2148", etc.)
    if (location && location.trim()) {
      const locationInput = location.trim()

      // Parse the location input to extract state, city, and postal code
      const statePattern = /\b(NSW|VIC|QLD|SA|WA|TAS|NT|ACT)\b/i
      const postalPattern = /\b\d{4}\b/ // Australian postal codes are 4 digits

      const stateMatch = locationInput.match(statePattern)
      const postalMatch = locationInput.match(postalPattern)

      // Extract city/suburb name (everything that's not state or postal code)
      let cityPart = locationInput
        .replace(statePattern, '')
        .replace(postalPattern, '')
        .trim()
        .replace(/\s+/g, ' ') // Normalize spaces

      // Build OR conditions for flexible matching
      const locationConditions: any[] = []

      // If postal code found, add it as primary search
      if (postalMatch) {
        locationConditions.push({
          postalZipCode: { contains: postalMatch[0], mode: 'insensitive' }
        })
      }

      // If state found, add it to search
      if (stateMatch) {
        locationConditions.push({
          state: { contains: stateMatch[0], mode: 'insensitive' }
        })
      }

      // If city/suburb part found, add fuzzy city search
      if (cityPart) {
        locationConditions.push({
          city: { contains: cityPart, mode: 'insensitive' }
        })
      }

      // If we couldn't parse specific parts, do a broad search across all location fields
      if (locationConditions.length === 0) {
        locationConditions.push(
          { city: { contains: locationInput, mode: 'insensitive' } },
          { state: { contains: locationInput, mode: 'insensitive' } },
          { postalZipCode: { contains: locationInput, mode: 'insensitive' } }
        )
      }

      // Add OR condition to match any location field
      where.OR = locationConditions
    }

    // Legacy support for separate city/state/postalCode parameters
    if (!location) {
      // Apply city filter (case-insensitive partial match)
      if (city && city.trim()) {
        where.city = { contains: city.trim(), mode: 'insensitive' }
      }

      // Apply state filter (case-insensitive partial match)
      if (state && state.trim()) {
        where.state = { contains: state.trim(), mode: 'insensitive' }
      }

      // Apply postal code filter (partial match)
      if (postalCode && postalCode.trim()) {
        where.postalZipCode = { contains: postalCode.trim(), mode: 'insensitive' }
      }
    }

    // Apply gender filter (exact match, case-insensitive)
    if (gender && gender.trim() && gender !== 'All') {
      where.gender = { equals: gender.trim(), mode: 'insensitive' }
    }

    // Apply support type filter (using titleRole field)
    if (supportType && supportType.trim() && supportType !== 'All') {
      where.titleRole = { contains: supportType.trim(), mode: 'insensitive' }
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
          gender: true,

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
          profilePicture: true,

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
