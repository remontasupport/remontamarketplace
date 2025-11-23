import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// ============================================================================
// TYPES
// ============================================================================

interface PaginationParams {
  page: number
  pageSize: number
  search?: string
  sortBy: string
  sortOrder: 'asc' | 'desc'
  status?: 'active' | 'deleted' | 'all'
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
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse and validate pagination parameters from URL
 */
function parsePaginationParams(searchParams: URLSearchParams): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)))
  const search = searchParams.get('search') || undefined
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'
  const status = (searchParams.get('status') || 'active') as 'active' | 'deleted' | 'all'

  return {
    page,
    pageSize,
    search,
    sortBy,
    sortOrder,
    status,
  }
}

/**
 * Build Prisma where clause based on filters
 */
function buildWhereClause(params: PaginationParams) {
  const where: any = {}

  // Filter by status (active, deleted, or all)
  if (params.status === 'active') {
    where.deletedAt = null
  } else if (params.status === 'deleted') {
    where.deletedAt = { not: null }
  }
  // If 'all', don't add deletedAt filter

  // Search by name or email
  if (params.search) {
    where.OR = [
      { firstName: { contains: params.search, mode: 'insensitive' } },
      { lastName: { contains: params.search, mode: 'insensitive' } },
      { email: { contains: params.search, mode: 'insensitive' } },
      { phone: { contains: params.search, mode: 'insensitive' } },
    ]
  }

  return where
}

/**
 * Build Prisma orderBy clause
 */
function buildOrderByClause(params: PaginationParams) {
  const validSortFields = ['createdAt', 'firstName', 'lastName', 'email', 'city', 'state']
  const sortField = validSortFields.includes(params.sortBy) ? params.sortBy : 'createdAt'

  return { [sortField]: params.sortOrder }
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * GET /api/admin/contractors
 * Fetch paginated list of contractor profiles
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // ========================================
    // 1. PARSE PARAMETERS
    // ========================================
    const searchParams = request.nextUrl.searchParams
    const params = parsePaginationParams(searchParams)

    // ========================================
    // 2. BUILD QUERIES
    // ========================================
    const where = buildWhereClause(params)
    const orderBy = buildOrderByClause(params)

    // ========================================
    // 3. FETCH DATA (Parallel: count + data)
    // ========================================
    const [total, contractors] = await Promise.all([
      // Count total records matching filters
      prisma.contractorProfile.count({ where }),

      // Fetch paginated data
      prisma.contractorProfile.findMany({
        where,
        select: {
          id: true,
          zohoContactId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          city: true,
          state: true,
          postalZipCode: true,
          titleRole: true,
          yearsOfExperience: true,
          profilePicture: true,
          createdAt: true,
          updatedAt: true,
          lastSyncedAt: true,
          deletedAt: true,
        },
        skip: (params.page - 1) * params.pageSize,
        take: params.pageSize,
        orderBy,
      }),
    ])

    // ========================================
    // 4. BUILD RESPONSE
    // ========================================
    const totalPages = Math.ceil(total / params.pageSize)
    const hasNext = params.page < totalPages
    const hasPrev = params.page > 1

    const response: PaginatedResponse = {
      success: true,
      data: contractors,
      pagination: {
        total,
        page: params.page,
        pageSize: params.pageSize,
        totalPages,
        hasNext,
        hasPrev,
      },
    }

    const duration = Date.now() - startTime

    return NextResponse.json(response, {
      headers: {
        'X-Response-Time': `${duration}ms`,
      },
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'

    console.error('[Admin API] Error fetching contractors:', errorMsg)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch contractors',
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
