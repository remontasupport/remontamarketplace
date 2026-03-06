/**
 * Service Request API
 *
 * POST /api/client/service-request - Create a new service request
 * GET  /api/client/service-request - List service requests for the current user
 *
 * SECURITY:
 * - Requires CLIENT or COORDINATOR role
 * - Rate limited to prevent abuse
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { authPrisma } from '@/lib/auth-prisma'
import { UserRole } from '@/types/auth'
import { applyRateLimit, publicApiRateLimit } from '@/lib/ratelimit'
import { createServiceRequestSchema, formatZodErrors } from '@/schema/serviceRequestSchema'

const ALLOWED_ROLES = new Set([UserRole.CLIENT, UserRole.COORDINATOR])
const VALID_STATUSES = ['PENDING', 'MATCHED', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const

async function authorizeUser(request: NextRequest) {
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
// POST - Create Service Request
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeUser(request)
    if ('error' in auth) return auth.error

    const body = await request.json()
    const parsed = createServiceRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: formatZodErrors(parsed.error) },
        { status: 400 }
      )
    }

    const data = parsed.data
    const { id: userId } = auth.session.user

    if (!data.participantId) {
      return NextResponse.json(
        { success: false, error: 'A participant must be selected to submit a request' },
        { status: 400 }
      )
    }

    const participant = await authPrisma.participant.findUnique({
      where: { id: data.participantId },
      select: { id: true, userId: true },
    })

    if (!participant) {
      return NextResponse.json({ success: false, error: 'Participant not found' }, { status: 404 })
    }
    if (participant.userId !== userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const result = await authPrisma.serviceRequest.create({
      data: {
        requesterId:   userId,
        participantId: participant.id,
        services:      data.services,
        details:       data.details,
        location:      data.location,
        status:        'PENDING',
      },
      include: { participant: true },
    })

    authPrisma.auditLog.create({
      data: {
        userId,
        action: 'PROFILE_UPDATE',
        metadata: {
          type:             'SERVICE_REQUEST_CREATED',
          serviceRequestId: result.id,
          participantId:    result.participantId,
          services:         Object.keys(data.services),
        },
      },
    }).catch(() => {})

    // Fire-and-forget — external latency must not block the response
    const webhookUrl = process.env.Request_Service_Webhook
    if (webhookUrl) {
      fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId:               result.requesterId,
          serviceRequestId:     result.id,
          services:             result.services,
          location:             result.location,
          details:              result.details,
          status:               result.status,
          participantId:        result.participant.id,
          firstName:            result.participant.firstName,
          lastName:             result.participant.lastName,
          dateOfBirth:          result.participant.dateOfBirth          ?? null,
          gender:               result.participant.gender               ?? null,
          relationshipToClient: result.participant.relationshipToClient ?? null,
          fundingType:          result.participant.fundingType          ?? null,
          conditions:           result.participant.conditions,
          additionalInfo:       result.participant.additionalInfo       ?? null,
        }),
      }).catch((err) => console.error('[Webhook] Request service webhook failed:', err))
    }

    return NextResponse.json(
      { success: true, message: 'Service request created successfully', data: result },
      { status: 201 }
    )
  } catch (error) {
    console.error('[Service Request API] POST Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create service request', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// GET - List Service Requests
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const auth = await authorizeUser(request)
    if ('error' in auth) return auth.error

    const searchParams = request.nextUrl.searchParams
    const status   = searchParams.get('status')
    const page     = Math.max(1, parseInt(searchParams.get('page')     || '1',  10))
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get('pageSize') || '10', 10)))

    const where: any = {
      requesterId: auth.session.user.id,
      // Exclude ARCHIVED — not in Prisma enum; causes deserialization error
      status: status ? status : { in: VALID_STATUSES },
    }

    const [total, serviceRequests] = await Promise.all([
      authPrisma.serviceRequest.count({ where }),
      authPrisma.serviceRequest.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { participant: true },
      }),
    ])

    const totalPages = Math.ceil(total / pageSize)

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
      { success: false, error: 'Failed to fetch service requests', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
