import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { applyRateLimit, publicApiRateLimit } from '@/lib/ratelimit'
import { geocodeAddress, calculateDistance, calculateBoundingBox } from '@/lib/geocoding'

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
 * - location: Combined location search (suburb/city/postcode/state)
 * - distance: Distance radius in km (e.g., 50 for 50km radius)
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
    const distanceParam = searchParams.get('distance') // Distance radius in km
    const city = searchParams.get('city')
    const state = searchParams.get('state')
    const postalCode = searchParams.get('postalCode')
    const gender = searchParams.get('gender')
    const supportType = searchParams.get('supportType')

    // Parse distance parameter
    let distance: number | null = null
    if (distanceParam) {
      const parsedDistance = parseFloat(distanceParam)
      if (isNaN(parsedDistance) || parsedDistance <= 0) {
        return NextResponse.json(
          { error: 'Invalid distance parameter. Must be a positive number.' },
          { status: 400 }
        )
      }
      distance = parsedDistance
    }

    // ============================================
    // 3. BUILD DATABASE QUERY WITH FILTERS
    // ============================================
    const where: any = {
      deletedAt: null, // Only fetch active (non-deleted) contractors
    }

    // Build AND conditions array to properly combine all filters
    const andConditions: any[] = []

    // Apply flexible location filter (handles "NSW 2148", "Parramatta", "2148", "Queensland", etc.)
    // Strategy: For distance-based searches (e.g., "Sydney"), we want to show ALL workers
    // and then sort by distance. Only apply strict text filters for state/postal searches.
    if (location && location.trim()) {
      const locationInput = location.trim()

      // ============================================
      // AUSTRALIAN STATE MAPPING (Full names + Abbreviations)
      // ============================================
      const stateMapping: { [key: string]: string } = {
        // New South Wales
        'new south wales': 'NSW',
        'newsouthwales': 'NSW',
        'nsw': 'NSW',

        // Victoria
        'victoria': 'VIC',
        'vic': 'VIC',

        // Queensland
        'queensland': 'QLD',
        'qld': 'QLD',

        // South Australia
        'south australia': 'SA',
        'southaustralia': 'SA',
        'sa': 'SA',

        // Western Australia
        'western australia': 'WA',
        'westernaustralia': 'WA',
        'wa': 'WA',

        // Tasmania
        'tasmania': 'TAS',
        'tas': 'TAS',

        // Northern Territory
        'northern territory': 'NT',
        'northernterritory': 'NT',
        'nt': 'NT',

        // Australian Capital Territory
        'australian capital territory': 'ACT',
        'australiancapitalterritory': 'ACT',
        'act': 'ACT',
      }

      // Parse the location input to extract state, city, and postal code
      const stateAbbrevPattern = /\b(NSW|VIC|QLD|SA|WA|TAS|NT|ACT)\b/i
      const stateFullPattern = /\b(New South Wales|Victoria|Queensland|South Australia|Western Australia|Tasmania|Northern Territory|Australian Capital Territory)\b/i
      const postalPattern = /\b\d{4}\b/ // Australian postal codes are 4 digits

      const stateAbbrevMatch = locationInput.match(stateAbbrevPattern)
      const stateFullMatch = locationInput.match(stateFullPattern)
      const postalMatch = locationInput.match(postalPattern)

      // Normalize state to abbreviation
      let normalizedState: string | null = null
      if (stateAbbrevMatch) {
        normalizedState = stateAbbrevMatch[0].toUpperCase()
      } else if (stateFullMatch) {
        const fullStateName = stateFullMatch[0].toLowerCase().replace(/\s+/g, '')
        normalizedState = stateMapping[fullStateName] || stateFullMatch[0]
      } else {
        // Check if the entire input is a state name (handles variations)
        const inputLower = locationInput.toLowerCase().replace(/\s+/g, '')
        if (stateMapping[inputLower]) {
          normalizedState = stateMapping[inputLower]
        }
      }

      // Build OR conditions for flexible matching
      const locationConditions: any[] = []

      // Strategy for location filtering:
      // - If ONLY state is provided (e.g., "NSW", "Queensland") → Filter by state
      // - If ONLY postal code is provided (e.g., "2148") → Filter by postal code
      // - If city/suburb with or without state/postal (e.g., "Sydney", "Sydney 2000", "Sydney NSW")
      //   → Don't filter, just geocode and sort by distance

      // Extract city/suburb name (everything that's not state or postal code)
      let cityPart = locationInput
        .replace(stateAbbrevPattern, '')
        .replace(stateFullPattern, '')
        .replace(postalPattern, '')
        .replace(/,/g, '') // Remove commas
        .trim()
        .replace(/\s+/g, ' ') // Normalize spaces

      // Determine if this is a pure state or postal search
      const isPureStateSearch = normalizedState && !cityPart && !postalMatch
      const isPurePostalSearch = postalMatch && !cityPart && !normalizedState

      // ONLY apply text filters for pure state or pure postal searches
      if (isPureStateSearch) {
        // Pure state search: "NSW" or "Queensland"
        locationConditions.push({
          state: { contains: normalizedState, mode: 'insensitive' }
        })
      } else if (isPurePostalSearch) {
        // Pure postal search: "2148"
        locationConditions.push({
          postalZipCode: { contains: postalMatch[0], mode: 'insensitive' }
        })
      }
      // For all other searches (city, city+state, city+postal, etc.),
      // don't filter - just geocode and sort by distance

      // Only add location conditions if we have filters
      if (locationConditions.length > 0) {
        andConditions.push({ OR: locationConditions })
      }
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
      andConditions.push({ gender: { equals: gender.trim(), mode: 'insensitive' } })
    }

    // Apply support type filter (using titleRole field)
    if (supportType && supportType.trim() && supportType !== 'All') {
      andConditions.push({ titleRole: { contains: supportType.trim(), mode: 'insensitive' } })
    }

    // Combine all AND conditions if there are any
    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    // ============================================
    // 3.5. GEOCODE SEARCH LOCATION FOR DISTANCE CALCULATIONS
    // ============================================
    // Strategy:
    // - If location is provided (e.g., "Sydney", "NSW 2000"), geocode it
    // - Calculate distances for all workers and sort by nearest
    // - If distance filter is set (e.g., 50km), only show workers within that radius
    // - If distance filter is "None", show all workers sorted by distance

    let searchCoordinates: { latitude: number; longitude: number } | null = null

    // Geocode the search location if provided (regardless of distance filter)
    if (location && location.trim()) {
      const geocoded = await geocodeAddress(location.trim())
      if (geocoded) {
        searchCoordinates = {
          latitude: geocoded.latitude,
          longitude: geocoded.longitude,
        }
      }
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
          latitude: true,
          longitude: true,

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
    // 4.5. CALCULATE DISTANCES AND APPLY FILTERING/SORTING
    // ============================================
    let filteredContractors = contractors

    if (searchCoordinates) {
      // Calculate distance for ALL contractors with valid coordinates
      const contractorsWithDistance = contractors
        .map((contractor) => {
          if (contractor.latitude && contractor.longitude) {
            const dist = calculateDistance(
              searchCoordinates.latitude,
              searchCoordinates.longitude,
              contractor.latitude,
              contractor.longitude
            )
            return {
              ...contractor,
              distance: Math.round(dist * 10) / 10, // Round to 1 decimal place
            }
          }
          // Return null for contractors without coordinates
          // They will be filtered out since we can't determine their distance
          return null
        })
        .filter((c): c is NonNullable<typeof c> => c !== null)

      // If distance filter is set (e.g., 50km), filter to only show workers within that radius
      if (distance) {
        filteredContractors = contractorsWithDistance
          .filter((c) => c.distance <= distance)
          .sort((a, b) => a.distance - b.distance) // Sort by distance (closest first)
      } else {
        // No distance filter (Within = "None") - show ALL workers with coordinates sorted by distance
        filteredContractors = contractorsWithDistance
          .sort((a, b) => a.distance - b.distance)
      }
    }

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
        contractors: filteredContractors,
        pagination: {
          total: filteredContractors.length, // Use filtered count if distance filtering applied
          limit: limit || total,
          offset,
          hasMore,
          totalPages,
          currentPage,
        },
        ...(searchCoordinates && {
          searchLocation: {
            latitude: searchCoordinates.latitude,
            longitude: searchCoordinates.longitude,
          },
        }),
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
