/**
 * Service Request API
 *
 * POST /api/client/service-request - Create a new service request
 * GET /api/client/service-request - Get service requests for the current user
 *
 * SECURITY:
 * - Requires CLIENT or COORDINATOR role
 * - Users can only view their own requests
 * - Rate limited to prevent abuse
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { authPrisma } from '@/lib/auth-prisma'
import { UserRole } from '@/types/auth'
import { applyRateLimit, publicApiRateLimit } from '@/lib/ratelimit'
import {
  createServiceRequestSchema,
  formatZodErrors,
} from '@/schema/serviceRequestSchema'

// ============================================================================
// POST - Create Service Request
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting
    try {
      const rateLimitResult = await applyRateLimit(request, publicApiRateLimit)
      if (!rateLimitResult.success) {
        return rateLimitResult.response
      }
    } catch {
      // Continue if rate limit check fails (fail open)
    }

    // 2. Authentication check
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 3. Role check (CLIENT or COORDINATOR only)
    const userRole = session.user.role
    if (userRole !== UserRole.CLIENT && userRole !== UserRole.COORDINATOR) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 4. Parse and validate request body
    const body = await request.json()

    // Debug logging
    console.log('=== SERVICE REQUEST DEBUG ===')
    console.log('Raw body received:', JSON.stringify(body, null, 2))

    const validationResult = createServiceRequestSchema.safeParse(body)

    if (!validationResult.success) {
      console.log('Validation failed!')
      console.log('Validation errors:', JSON.stringify(validationResult.error.errors, null, 2))
      console.log('Formatted errors:', JSON.stringify(formatZodErrors(validationResult.error), null, 2))

      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: formatZodErrors(validationResult.error),
        },
        { status: 400 }
      )
    }

    console.log('Validation passed!')
    console.log('Validated data:', JSON.stringify(validationResult.data, null, 2))

    const data = validationResult.data

    // 5. Create service request
    const serviceRequest = await authPrisma.serviceRequest.create({
      data: {
        requesterId: session.user.id,
        participant: data.participant,
        services: data.services,
        details: data.details,
        location: data.location,
        status: 'PENDING',
      },
    })

    // 6. Audit log (fire-and-forget)
    authPrisma.auditLog
      .create({
        data: {
          userId: session.user.id,
          action: 'PROFILE_UPDATE', // Using existing action type
          metadata: {
            type: 'SERVICE_REQUEST_CREATED',
            serviceRequestId: serviceRequest.id,
            services: Object.keys(data.services),
          },
        },
      })
      .catch(() => {
        // Don't fail if audit log fails
      })

    // 7. Return success response
    return NextResponse.json(
      {
        success: true,
        message: 'Service request created successfully',
        data: serviceRequest,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Service Request API] POST Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create service request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET - Get Service Requests
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // 1. Rate limiting
    try {
      const rateLimitResult = await applyRateLimit(request, publicApiRateLimit)
      if (!rateLimitResult.success) {
        return rateLimitResult.response
      }
    } catch {
      // Continue if rate limit check fails (fail open)
    }

    // 2. Authentication check
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 3. Role check (CLIENT or COORDINATOR only)
    const userRole = session.user.role
    if (userRole !== UserRole.CLIENT && userRole !== UserRole.COORDINATOR) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 4. Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)))

    // 5. Build where clause
    const where: any = {
      requesterId: session.user.id,
    }

    if (status) {
      where.status = status
    }

    // 6. Execute queries in parallel
    const [total, serviceRequests] = await Promise.all([
      authPrisma.serviceRequest.count({ where }),
      authPrisma.serviceRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ])

    const totalPages = Math.ceil(total / pageSize)

    // 7. Return response
    return NextResponse.json({
      success: true,
      data: serviceRequests,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error('[Service Request API] GET Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch service requests',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
