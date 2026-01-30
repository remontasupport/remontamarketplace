/**
 * Participant API - Individual Participant
 *
 * GET /api/client/participants/[id] - Get a specific participant
 * PATCH /api/client/participants/[id] - Update participant profile
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

type RouteParams = {
  params: Promise<{ id: string }>
}

// Validation schema for updating participant
const updateParticipantSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional(),
  dateOfBirth: z.string().optional().nullable(),
  gender: z.string().optional().nullable(),
  relationshipToClient: z.enum(['PARENT', 'LEGAL_GUARDIAN', 'SPOUSE_PARTNER', 'CHILDREN', 'OTHER']).optional().nullable(),
  conditions: z.array(z.string()).optional(),
  additionalInfo: z.string().optional().nullable(),
})

// ============================================================================
// GET - Get Single Participant
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

    // 3. Fetch participant
    const participant = await authPrisma.participant.findUnique({
      where: { id },
      include: {
        serviceRequest: true,
      },
    })

    if (!participant) {
      return NextResponse.json(
        { success: false, error: 'Participant not found' },
        { status: 404 }
      )
    }

    // 4. Check ownership
    if (participant.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 5. Return response
    return NextResponse.json({
      success: true,
      data: participant,
    })
  } catch (error) {
    console.error('[Participant API] GET Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch participant',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
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

    // 3. Fetch existing participant
    const existingParticipant = await authPrisma.participant.findUnique({
      where: { id },
    })

    if (!existingParticipant) {
      return NextResponse.json(
        { success: false, error: 'Participant not found' },
        { status: 404 }
      )
    }

    // 4. Check ownership
    if (existingParticipant.userId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      )
    }

    // 5. Parse and validate request body
    const body = await request.json()
    const validationResult = updateParticipantSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: validationResult.error.issues,
        },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // 6. Update participant
    const updatedParticipant = await authPrisma.participant.update({
      where: { id },
      data: {
        ...(data.firstName !== undefined && { firstName: data.firstName }),
        ...(data.lastName !== undefined && { lastName: data.lastName }),
        ...(data.dateOfBirth !== undefined && {
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        }),
        ...(data.gender !== undefined && { gender: data.gender }),
        ...(data.relationshipToClient !== undefined && { relationshipToClient: data.relationshipToClient }),
        ...(data.conditions !== undefined && { conditions: data.conditions }),
        ...(data.additionalInfo !== undefined && { additionalInfo: data.additionalInfo }),
      },
      include: {
        serviceRequest: true,
      },
    })

    // 7. Audit log (fire-and-forget)
    authPrisma.auditLog
      .create({
        data: {
          userId: session.user.id,
          action: 'PROFILE_UPDATE',
          metadata: {
            type: 'PARTICIPANT_UPDATED',
            participantId: id,
          },
        },
      })
      .catch(() => {})

    // 8. Return response
    return NextResponse.json({
      success: true,
      message: 'Participant updated successfully',
      data: updatedParticipant,
    })
  } catch (error) {
    console.error('[Participant API] PATCH Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update participant',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
