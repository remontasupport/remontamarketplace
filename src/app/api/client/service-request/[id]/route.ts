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

    // 4. Fetch existing service request with raw SQL to handle ARCHIVED status
    // (Prisma enum doesn't include ARCHIVED, so findUnique would throw for archived requests)
    const [existingRequest] = await authPrisma.$queryRaw<
      { id: string; requesterId: string; participantId: string }[]
    >`
      SELECT id, "requesterId", "participantId"
      FROM service_requests
      WHERE id = ${id}
    `

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

    // 6. Parse request body
    const body = await request.json()

    // Handle archive as a separate path — uses raw SQL to bypass Prisma enum validation
    if (body?.status === 'ARCHIVED') {
      await authPrisma.$executeRaw`UPDATE service_requests SET status = 'ARCHIVED'::"ServiceRequestStatus", "updatedAt" = NOW() WHERE id = ${id}`
      return NextResponse.json({ success: true, message: 'Request archived successfully' })
    }

    // Handle cancellation — allowed from any non-terminal status
    if (body?.status === 'CANCELLED') {
      await authPrisma.serviceRequest.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          selectedWorkers: [],
        },
      })
      return NextResponse.json({ success: true, message: 'Request cancelled successfully' })
    }

    // Use raw SQL to get the true status (Prisma enum doesn't include ARCHIVED)
    const [rawRow] = await authPrisma.$queryRaw<{ status: string; hidden: boolean }[]>`
      SELECT status, (details->>'_hidden' = 'true') AS hidden
      FROM service_requests WHERE id = ${id}
    `
    const actualStatus = rawRow?.status
    const isHiddenArchived = actualStatus === 'ARCHIVED' && rawRow?.hidden

    if (actualStatus !== 'PENDING' && !isHiddenArchived) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot update request',
          message: 'Only pending requests can be updated',
        },
        { status: 400 }
      )
    }

    // If editing a soft-deleted archived request, restore it to PENDING and clear the hidden flag
    if (isHiddenArchived) {
      await authPrisma.$executeRaw`
        UPDATE service_requests
        SET status = 'PENDING'::"ServiceRequestStatus",
            details = details - '_hidden',
            "updatedAt" = NOW()
        WHERE id = ${id}
      `
    }

    // 7. Validate request body
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

    // 8. Update sequentially (avoid $transaction — Neon's PgBouncer pooler doesn't support interactive transactions)
    // Update participant if provided
    if (data.participant && existingRequest.participantId) {
      await authPrisma.participant.update({
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

    // Update service request (no include — avoids Prisma enum error if status is ARCHIVED)
    const updatedRequest = await authPrisma.serviceRequest.update({
      where: { id },
      data: {
        ...(data.services && { services: data.services }),
        ...(data.details && { details: data.details }),
        ...(data.location && { location: data.location }),
        ...(data.status && { status: data.status }),
      },
    })


    // 11. Audit log (fire-and-forget)
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

    // 12. Webhook — fire-and-forget (mirrors the POST creation webhook)
    // Fetches fresh participant data after any participant updates above,
    // then sends the full edit payload to Zoho via Request_Service_Webhook.
    const webhookUrl = process.env.Request_Service_Webhook
    if (webhookUrl) {
      ;(async () => {
        try {
          const participant = await authPrisma.participant.findUnique({
            where: { id: existingRequest.participantId },
            select: {
              firstName: true,
              lastName: true,
              dateOfBirth: true,
              gender: true,
              relationshipToClient: true,
              fundingType: true,
              conditions: true,
              additionalInfo: true,
            },
          })

          await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'edit',
              zohoRecordId: updatedRequest.zohoRecordId ?? null,
              userId: session.user.id,
              serviceRequestId: id,
              services: updatedRequest.services,
              location: updatedRequest.location,
              details: updatedRequest.details,
              status: updatedRequest.status,
              participantId: existingRequest.participantId,
              firstName: participant?.firstName ?? null,
              lastName: participant?.lastName ?? null,
              dateOfBirth: participant?.dateOfBirth ?? null,
              gender: participant?.gender ?? null,
              relationshipToClient: participant?.relationshipToClient ?? null,
              fundingType: participant?.fundingType ?? null,
              conditions: participant?.conditions ?? [],
              additionalInfo: participant?.additionalInfo ?? null,
            }),
          })
        } catch (err) {
          console.error('[Webhook] Edit service request webhook failed:', err)
        }
      })()
    }

    // 13. Return response
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

    // 4. Fetch status + ownership via raw SQL (handles ARCHIVED which Prisma enum doesn't support)
    const [statusRow] = await authPrisma.$queryRaw<{ status: string; requesterId: string }[]>`
      SELECT status, "requesterId" FROM service_requests WHERE id = ${id}
    `

    if (!statusRow) {
      return NextResponse.json(
        { success: false, error: 'Service request not found' },
        { status: 404 }
      )
    }

    // 5. Check ownership
    if (statusRow.requesterId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 6. If ARCHIVED — soft-delete by flagging details._hidden = true
    // Keeps the record in DB so editing still works, but hides it from the archived list
    if (statusRow.status === 'ARCHIVED') {
      await authPrisma.$executeRaw`
        UPDATE service_requests
        SET details = COALESCE(details, '{}'::jsonb) || '{"_hidden": true}'::jsonb,
            "updatedAt" = NOW()
        WHERE id = ${id}
      `

      authPrisma.auditLog
        .create({
          data: {
            userId: session.user.id,
            action: 'PROFILE_UPDATE',
            metadata: {
              type: 'SERVICE_REQUEST_DELETED',
              serviceRequestId: id,
            },
          },
        })
        .catch(() => {})

      return NextResponse.json({
        success: true,
        message: 'Service request deleted successfully',
      })
    }

    // 7. For non-archived: fetch full record with Prisma for the cancel flow
    const existingRequest = await authPrisma.serviceRequest.findUnique({
      where: { id },
    })

    if (!existingRequest) {
      return NextResponse.json(
        { success: false, error: 'Service request not found' },
        { status: 404 }
      )
    }

    // 8. Check if request can be cancelled
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

    // 9. Cancel the request (soft delete - update status) and clear selected worker
    const cancelledRequest = await authPrisma.serviceRequest.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        selectedWorkers: [],
      },
      include: {
        participant: true,
      },
    })

    // 10. Audit log (fire-and-forget)
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

    // 11. Return response
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
