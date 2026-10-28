/**
 * Service Request API - Individual Request
 *
 * GET    /api/client/service-request/[id] - Get a specific service request
 * PATCH  /api/client/service-request/[id] - Update a service request
 * DELETE /api/client/service-request/[id] - Cancel / archive a service request
 *
 * SECURITY:
 * - Requires CLIENT or COORDINATOR role
 * - Users can only access their own requests
 */

import { NextRequest, NextResponse, after } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { authPrisma } from '@/lib/auth-prisma'
import { UserRole } from '@/types/auth'
import { applyRateLimit, publicApiRateLimit } from '@/lib/ratelimit'
import { updateServiceRequestSchema, formatZodErrors } from '@/schema/serviceRequestSchema'
import { ARCHIVABLE_STATUSES, isEditable } from '@/features/service-requests/status'

type RouteParams = { params: Promise<{ id: string }> }

const ALLOWED_ROLES = new Set([UserRole.CLIENT, UserRole.COORDINATOR])

// ============================================================================
// SHARED AUTH HELPER
// ============================================================================

async function authorizeRequest(request: NextRequest) {
  try {
    const rl = await applyRateLimit(request, publicApiRateLimit)
    if (!rl.success) return { error: rl.response }
  } catch {}

  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) }
  }
  if (!ALLOWED_ROLES.has(session.user.role as UserRole)) {
    return { error: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }) }
  }
  return { session }
}

// ============================================================================
// GET - Get Single Service Request
// ============================================================================

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const auth = await authorizeRequest(request)
    if ('error' in auth) return auth.error

    const serviceRequest = await authPrisma.serviceRequest.findUnique({
      where: { id },
      include: { participant: true },
    })

    if (!serviceRequest) {
      return NextResponse.json({ success: false, error: 'Service request not found' }, { status: 404 })
    }
    if (serviceRequest.requesterId !== auth.session.user.id) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ success: true, data: serviceRequest })
  } catch (error) {
    console.error('[Service Request API] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch service request', message: error instanceof Error ? error.message : 'Unknown error' },
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
    const auth = await authorizeRequest(request)
    if ('error' in auth) return auth.error

    const userId = auth.session.user.id
    const body = await request.json()

    // Archive — a completed or cancelled request only; ownership and status in one conditional UPDATE
    if (body?.status === 'ARCHIVED') {
      const { count } = await authPrisma.serviceRequest.updateMany({
        where: { id, requesterId: userId, status: { in: [...ARCHIVABLE_STATUSES] } },
        data: { status: 'ARCHIVED' },
      })
      if (count === 0) {
        const owned = await authPrisma.serviceRequest.findFirst({ where: { id, requesterId: userId }, select: { id: true } })
        return owned
          ? NextResponse.json({ success: false, error: 'Only completed or cancelled requests can be archived' }, { status: 400 })
          : NextResponse.json({ success: false, error: 'Service request not found or forbidden' }, { status: 404 })
      }
      return NextResponse.json({ success: true, message: 'Request archived successfully' })
    }

    // Cancellation — updateMany combines ownership check + update in one Prisma call (safe types)
    if (body?.status === 'CANCELLED') {
      const { count } = await authPrisma.serviceRequest.updateMany({
        where: { id, requesterId: userId },
        data: { status: 'CANCELLED', selectedWorkers: [] },
      })
      if (count === 0) return NextResponse.json({ success: false, error: 'Service request not found or forbidden' }, { status: 404 })

      // after() keeps the function alive until the webhook is sent; a bare promise is dropped once Vercel freezes it.
      after(async () => {
        try {
          const sr = await authPrisma.serviceRequest.findUnique({ where: { id }, select: { zohoRecordId: true } })
          const zohoRecordId = sr?.zohoRecordId ?? null

          if (body.reason) {
            // ACTIVE cancel — fire Active_Request_Cancellation with full details
            const url = process.env.Active_Request_Cancellation
            if (url) await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ requestId: id, zohoRecordId, userId, reason: body.reason, details: body.details ?? null }),
            })
          } else {
            // Non-ACTIVE cancel — fire Cancel_Archive_Webhook
            const url = process.env.Cancel_Archive_Webhook
            if (url) await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ action: 'Cancel', zohoRecordId }),
            })
          }
        } catch (err) {
          console.error('[Webhook] Cancel service request webhook failed:', err)
        }
      })

      return NextResponse.json({ success: true, message: 'Request cancelled successfully' })
    }

    // General edit — SELECT needed for status/hidden check
    type RequestRow = {
      id: string
      requesterId: string
      participantId: string
      zohoRecordId: string | null
      status: string
      hidden: boolean
    }
    const [existing] = await authPrisma.$queryRaw<RequestRow[]>`
      SELECT
        id, "requesterId", "participantId", "zohoRecordId", status,
        (details->>'_hidden' = 'true') AS hidden
      FROM service_requests
      WHERE id = ${id}
    `

    if (!existing) {
      return NextResponse.json({ success: false, error: 'Service request not found' }, { status: 404 })
    }
    if (existing.requesterId !== userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Only PENDING or MATCHING (or hidden-archived) can be edited
    const isHiddenArchived = existing.status === 'ARCHIVED' && existing.hidden
    if (existing.status === 'ACTIVE') {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot update request: this service is active. Please contact jesse.b@remontaservices.com.au',
          message: 'Active requests cannot be updated',
        },
        { status: 400 }
      )
    }
    if (!isEditable(existing.status) && !isHiddenArchived) {
      return NextResponse.json(
        { success: false, error: 'Cannot update request', message: 'Only pending or matching requests can be updated' },
        { status: 400 }
      )
    }

    // Restore hidden-archived request to PENDING
    if (isHiddenArchived) {
      await authPrisma.$executeRaw`
        UPDATE service_requests
        SET status = 'PENDING'::"ServiceRequestStatus",
            details = details - '_hidden',
            "updatedAt" = NOW()
        WHERE id = ${id}
      `
    }

    const parsed = updateServiceRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: formatZodErrors(parsed.error) },
        { status: 400 }
      )
    }

    const data = parsed.data

    // Update participant first (if provided) — sequential to avoid Neon PgBouncer interactive tx issues
    if (data.participant && existing.participantId) {
      await authPrisma.participant.update({
        where: { id: existing.participantId },
        data: {
          ...(data.participant.firstName     && { firstName:     data.participant.firstName }),
          ...(data.participant.lastName      && { lastName:      data.participant.lastName }),
          ...(data.participant.dateOfBirth   && { dateOfBirth:   new Date(data.participant.dateOfBirth) }),
          ...(data.participant.gender        !== undefined && { gender:       data.participant.gender }),
          ...(data.participant.fundingType   && { fundingType:   data.participant.fundingType }),
          ...(data.participant.conditions    && { conditions:    data.participant.conditions }),
          ...(data.participant.additionalInfo !== undefined && { additionalInfo: data.participant.additionalInfo }),
        },
      })
    }

    const updatedRequest = await authPrisma.serviceRequest.update({
      where: { id },
      data: {
        ...(data.services  && { services:  data.services }),
        ...(data.details   && { details:   data.details }),
        ...(data.location  && { location:  data.location }),
        ...(data.status    && { status:    data.status }),
      },
    })

    authPrisma.auditLog.create({
      data: {
        userId,
        action: 'PROFILE_UPDATE',
        metadata: { type: 'SERVICE_REQUEST_UPDATED', serviceRequestId: id },
      },
    }).catch(() => {})

    // Fire-and-forget webhook — fetch fresh participant data after any updates.
    // Edits (the Save Changes button) go to the same n8n workflow as Cancel/Archive/Renew, as action 'Edit'.
    // after() keeps the function alive until the webhook is sent; a bare promise is dropped once Vercel freezes it.
    const webhookUrl = process.env.Cancel_Archive_Webhook
    if (webhookUrl) {
      after(async () => {
        try {
          const participant = await authPrisma.participant.findUnique({
            where: { id: existing.participantId },
            select: {
              firstName: true, lastName: true, dateOfBirth: true, gender: true,
              relationshipToClient: true, fundingType: true, conditions: true, additionalInfo: true,
            },
          })
          const res = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action:               'Edit',
              zohoRecordId:         updatedRequest.zohoRecordId ?? null,
              userId,
              serviceRequestId:     id,
              services:             updatedRequest.services,
              location:             updatedRequest.location,
              details:              updatedRequest.details,
              status:               updatedRequest.status,
              participantId:        existing.participantId,
              firstName:            participant?.firstName            ?? null,
              lastName:             participant?.lastName             ?? null,
              dateOfBirth:          participant?.dateOfBirth          ?? null,
              gender:               participant?.gender               ?? null,
              relationshipToClient: participant?.relationshipToClient ?? null,
              fundingType:          participant?.fundingType          ?? null,
              conditions:           participant?.conditions           ?? [],
              additionalInfo:       participant?.additionalInfo       ?? null,
            }),
          })
          if (!res.ok) console.error('[Webhook] Edit service request webhook returned', res.status)
        } catch (err) {
          console.error('[Webhook] Edit service request webhook failed:', err)
        }
      })
    }

    return NextResponse.json({ success: true, message: 'Service request updated successfully', data: updatedRequest })
  } catch (error) {
    console.error('[Service Request API] PATCH Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update service request', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Cancel or Archive Service Request
// ============================================================================

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const auth = await authorizeRequest(request)
    if ('error' in auth) return auth.error

    const userId = auth.session.user.id

    // Fetch status + ownership via raw SQL (handles ARCHIVED which Prisma enum doesn't support)
    const [row] = await authPrisma.$queryRaw<{ status: string; requesterId: string }[]>`
      SELECT status, "requesterId" FROM service_requests WHERE id = ${id}
    `

    if (!row) {
      return NextResponse.json({ success: false, error: 'Service request not found' }, { status: 404 })
    }
    if (row.requesterId !== userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Soft-delete archived request by flagging _hidden = true
    if (row.status === 'ARCHIVED') {
      await authPrisma.$executeRaw`
        UPDATE service_requests
        SET details = COALESCE(details, '{}'::jsonb) || '{"_hidden": true}'::jsonb,
            "updatedAt" = NOW()
        WHERE id = ${id}
      `
      authPrisma.auditLog.create({
        data: {
          userId,
          action: 'PROFILE_UPDATE',
          metadata: { type: 'SERVICE_REQUEST_DELETED', serviceRequestId: id },
        },
      }).catch(() => {})

      return NextResponse.json({ success: true, message: 'Service request deleted successfully' })
    }

    if (row.status === 'COMPLETED' || row.status === 'CANCELLED') {
      return NextResponse.json(
        { success: false, error: 'Cannot cancel request', message: 'This request has already been completed or cancelled' },
        { status: 400 }
      )
    }

    const cancelled = await authPrisma.serviceRequest.update({
      where: { id },
      data: { status: 'CANCELLED', selectedWorkers: [] },
      include: { participant: true },
    })

    authPrisma.auditLog.create({
      data: {
        userId,
        action: 'PROFILE_UPDATE',
        metadata: { type: 'SERVICE_REQUEST_CANCELLED', serviceRequestId: id },
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, message: 'Service request cancelled successfully', data: cancelled })
  } catch (error) {
    console.error('[Service Request API] DELETE Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to cancel service request', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
