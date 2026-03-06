/**
 * Participant API - Individual Participant
 *
 * GET    /api/client/participants/[id] - Get a specific participant
 * PATCH  /api/client/participants/[id] - Update participant profile
 * DELETE /api/client/participants/[id] - Disconnect participant from coordinator
 *
 * SECURITY:
 * - Requires CLIENT or COORDINATOR role
 * - Users can only access their own participants
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth.config'
import { authPrisma } from '@/lib/auth-prisma'
import { UserRole } from '@/types/auth'
import { z } from 'zod'

type RouteParams = { params: Promise<{ id: string }> }

const updateParticipantSchema = z.object({
  firstName:             z.string().min(1, 'First name is required').optional(),
  lastName:              z.string().min(1, 'Last name is required').optional(),
  dateOfBirth:           z.string().optional().nullable(),
  gender:                z.string().optional().nullable(),
  relationshipToClient:  z.string().optional().nullable(),
  fundingType:           z.string().optional().nullable(),
  conditions:            z.array(z.string()).optional(),
  additionalInfo:        z.string().optional().nullable(),
})

// ============================================================================
// SHARED AUTH HELPER
// ============================================================================

type AuthResult =
  | { error: NextResponse }
  | { session: NonNullable<Awaited<ReturnType<typeof getServerSession>>>; participant: Awaited<ReturnType<typeof authPrisma.participant.findUnique>> & object }

/**
 * Validates session, role, participant existence, and ownership in one step.
 * Returns either { error } to short-circuit, or { session, participant }.
 */
async function authorizeParticipant(id: string, coordinatorOnly = false): Promise<AuthResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return { error: NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 }) }
  }

  const { role } = session.user
  const allowed = coordinatorOnly
    ? role === UserRole.COORDINATOR
    : role === UserRole.CLIENT || role === UserRole.COORDINATOR

  if (!allowed) {
    return { error: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }) }
  }

  const participant = await authPrisma.participant.findUnique({ where: { id } })
  if (!participant) {
    return { error: NextResponse.json({ success: false, error: 'Participant not found' }, { status: 404 }) }
  }

  if (participant.userId !== session.user.id) {
    return { error: NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 }) }
  }

  return { session, participant }
}

// ============================================================================
// GET - Get Single Participant
// ============================================================================

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const auth = await authorizeParticipant(id)
    if ('error' in auth) return auth.error

    // Fetch service request via raw SQL — Prisma enum doesn't include ARCHIVED status
    type RawServiceRequest = {
      id: string
      services: Record<string, unknown>
      details: Record<string, unknown>
      location: string
      status: string
      assignedWorker: unknown
      selectedWorkers: string[]
      createdAt: Date
      updatedAt: Date
    }
    const [serviceRequest] = await authPrisma.$queryRaw<RawServiceRequest[]>`
      SELECT id, services, details, location, status, "assignedWorker", "selectedWorkers", "createdAt", "updatedAt"
      FROM service_requests
      WHERE "participantId" = ${id}
    `

    return NextResponse.json({
      success: true,
      data: { ...auth.participant, serviceRequest: serviceRequest ?? null },
    })
  } catch (error) {
    console.error('[Participant API] GET Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch participant', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE - Disconnect Participant from Coordinator (sets userId = null)
// ============================================================================

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const auth = await authorizeParticipant(id, true) // coordinator only
    if ('error' in auth) return auth.error

    await authPrisma.participant.update({ where: { id }, data: { userId: null } })

    authPrisma.auditLog.create({
      data: {
        userId: auth.session.user.id,
        action: 'PROFILE_UPDATE',
        metadata: { type: 'PARTICIPANT_DISCONNECTED', participantId: id },
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, message: 'Participant disconnected successfully' })
  } catch (error) {
    console.error('[Participant API] DELETE Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to disconnect participant', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH - Update Participant Profile
// ============================================================================

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const auth = await authorizeParticipant(id)
    if ('error' in auth) return auth.error

    const body = await request.json()
    const parsed = updateParticipantSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const data = parsed.data

    const updatedParticipant = await authPrisma.participant.update({
      where: { id },
      data: {
        ...(data.firstName            !== undefined && { firstName: data.firstName }),
        ...(data.lastName             !== undefined && { lastName: data.lastName }),
        ...(data.dateOfBirth          !== undefined && { dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null }),
        ...(data.gender               !== undefined && { gender: data.gender }),
        ...(data.relationshipToClient !== undefined && { relationshipToClient: data.relationshipToClient }),
        ...(data.fundingType          !== undefined && { fundingType: data.fundingType }),
        ...(data.conditions           !== undefined && { conditions: data.conditions }),
        ...(data.additionalInfo       !== undefined && { additionalInfo: data.additionalInfo }),
      },
    })

    // Sync name to clientProfile — CLIENT is the participant (1:1 relationship)
    if (auth.session.user.role === UserRole.CLIENT && (data.firstName !== undefined || data.lastName !== undefined)) {
      await authPrisma.clientProfile.update({
        where: { userId: auth.session.user.id },
        data: {
          ...(data.firstName !== undefined && { firstName: data.firstName }),
          ...(data.lastName  !== undefined && { lastName: data.lastName }),
        },
      })
    }

    authPrisma.auditLog.create({
      data: {
        userId: auth.session.user.id,
        action: 'PROFILE_UPDATE',
        metadata: { type: 'PARTICIPANT_UPDATED', participantId: id },
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, message: 'Participant updated successfully', data: updatedParticipant })
  } catch (error) {
    console.error('[Participant API] PATCH Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update participant', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
