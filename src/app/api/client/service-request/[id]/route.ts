/**
 * Service Request API - Individual Request
 *
 * GET /api/client/service-request/[id] - Get a specific service request
 * PATCH /api/client/service-request/[id] - Update a service request
 * DELETE /api/client/service-request/[id] - Cancel a service request
 *
 * SECURITY:
 * - Requires CLIENT or COORDINATOR role
 * - Users can only access their own requests
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { authPrisma } from '@/lib/auth-prisma'
import { UserRole } from '@/types/auth'
import { applyRateLimit, publicApiRateLimit } from '@/lib/ratelimit'
import {
  updateServiceRequestSchema,
  formatZodErrors,
} from '@/schema/serviceRequestSchema'

type RouteParams = {
  params: Promise<{ id: string }>
}

// ============================================================================
// GET - Get Single Service Request
// ============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // 1. Authentication check
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Role check
    const userRole = session.user.role
    if (userRole !== UserRole.CLIENT && userRole !== UserRole.COORDINATOR) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 3. Fetch service request with participant
    const serviceRequest = await authPrisma.serviceRequest.findUnique({
      where: { id },
      include: {
        participant: true,
      },
    })

    if (!serviceRequest) {
      return NextResponse.json(
        { success: false, error: 'Service request not found' },
        { status: 404 }
      )
    }

    // 4. Check ownership
    if (serviceRequest.requesterId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 5. Return response
    return NextResponse.json({
      success: true,
      data: serviceRequest,
    })
  } catch (error) {
    console.error('[Service Request API] GET Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch service request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH - Update Service Request
// ============================================================================

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // 1. Rate limiting
    try {
      const rateLimitResult = await applyRateLimit(request, publicApiRateLimit)
      if (!rateLimitResult.success) {
        return rateLimitResult.response
      }
    } catch {
      // Continue if rate limit check fails
    }

    // 2. Authentication check
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 3. Role check
    const userRole = session.user.role
    if (userRole !== UserRole.CLIENT && userRole !== UserRole.COORDINATOR) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 4. Fetch existing service request
    const existingRequest = await authPrisma.serviceRequest.findUnique({
      where: { id },
      include: { participant: true },
    })

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Service request not found' },
        { status: 404 }
      )
    }

    // 5. Check ownership
    if (existingRequest.requesterId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 6. Check if request can be updated (only PENDING requests)
    if (existingRequest.status !== 'PENDING') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot update request',
          message: 'Only pending requests can be updated',
        },
        { status: 400 }
      )
    }

    // 7. Parse and validate request body
    const body = await request.json()
    const validationResult = updateServiceRequestSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: formatZodErrors(validationResult.error),
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // 8. Update in a transaction
    const updatedRequest = await authPrisma.$transaction(async (tx) => {
      // Update participant if provided
      if (data.participant && existingRequest.participantId) {
        await tx.participant.update({
          where: { id: existingRequest.participantId },
          data: {
            ...(data.participant.firstName && { firstName: data.participant.firstName }),
            ...(data.participant.lastName && { lastName: data.participant.lastName }),
            ...(data.participant.dateOfBirth && { dateOfBirth: new Date(data.participant.dateOfBirth) }),
            ...(data.participant.gender !== undefined && { gender: data.participant.gender }),
            ...(data.participant.fundingType && { fundingType: data.participant.fundingType }),
            ...(data.participant.conditions && { conditions: data.participant.conditions }),
            ...(data.participant.additionalInfo !== undefined && { additionalInfo: data.participant.additionalInfo }),
          },
        })
      }

      // Update service request
      const updated = await tx.serviceRequest.update({
        where: { id },
        data: {
          ...(data.services && { services: data.services }),
          ...(data.details && { details: data.details }),
          ...(data.location && { location: data.location }),
        },
        include: {
          participant: true,
        },
      })

      return updated
    })

    // 9. Audit log (fire-and-forget)
    authPrisma.auditLog
      .create({
        data: {
          userId: session.user.id,
          action: 'PROFILE_UPDATE',
          metadata: {
            type: 'SERVICE_REQUEST_UPDATED',
            serviceRequestId: id,
          },
        },
      })
      .catch(() => {})

    // 10. Return response
    return NextResponse.json({
      success: true,
      message: 'Service request updated successfully',
      data: updatedRequest,
    })
  } catch (error) {
    console.error('[Service Request API] PATCH Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update service request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Cancel Service Request
// ============================================================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params

    // 1. Rate limiting
    try {
      const rateLimitResult = await applyRateLimit(request, publicApiRateLimit)
      if (!rateLimitResult.success) {
        return rateLimitResult.response
      }
    } catch {
      // Continue if rate limit check fails
    }

    // 2. Authentication check
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 3. Role check
    const userRole = session.user.role
    if (userRole !== UserRole.CLIENT && userRole !== UserRole.COORDINATOR) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 4. Fetch existing service request
    const existingRequest = await authPrisma.serviceRequest.findUnique({
      where: { id },
    })

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Service request not found' },
        { status: 404 }
      )
    }

    // 5. Check ownership
    if (existingRequest.requesterId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 6. Check if request can be cancelled
    if (existingRequest.status === 'COMPLETED' || existingRequest.status === 'CANCELLED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot cancel request',
          message: 'This request has already been completed or cancelled',
        },
        { status: 400 }
      )
    }

    // 7. Cancel the request (soft delete - update status)
    const cancelledRequest = await authPrisma.serviceRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
      },
      include: {
        participant: true,
      },
    })

    // 8. Audit log (fire-and-forget)
    authPrisma.auditLog
      .create({
        data: {
          userId: session.user.id,
          action: 'PROFILE_UPDATE',
          metadata: {
            type: 'SERVICE_REQUEST_CANCELLED',
            serviceRequestId: id,
          },
        },
      })
      .catch(() => {})

    // 9. Return response
    return NextResponse.json({
      success: true,
      message: 'Service request cancelled successfully',
      data: cancelledRequest,
    })
  } catch (error) {
    console.error('[Service Request API] DELETE Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to cancel service request',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
