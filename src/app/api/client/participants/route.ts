/**
 * Participants List API
 *
 * GET  /api/client/participants - List all participants for the current user
 * POST /api/client/participants - Create a new participant
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
import { getOrFetch, invalidateCache, CACHE_KEYS, CACHE_TTL } from '@/lib/redis'

const ALLOWED_ROLES = new Set([UserRole.CLIENT, UserRole.COORDINATOR])

const createParticipantSchema = z.object({
  firstName:            z.string().min(1, 'First name is required'),
  lastName:             z.string().min(1, 'Last name is required'),
  dateOfBirth:          z.string().optional().nullable(),
  gender:               z.string().optional().nullable(),
  relationshipToClient: z.string().optional().nullable(),
  fundingType:          z.string().optional().nullable(),
  conditions:           z.array(z.string()).default([]),
  additionalInfo:       z.string().optional().nullable(),
})

async function authorizeUser() {
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
// GET - List Participants
// ============================================================================

export async function GET() {
  try {
    const auth = await authorizeUser()
    if ('error' in auth) return auth.error

    const userId = auth.session.user.id
    type RawRow = { id: string; firstName: string; lastName: string; hasPendingRequest: boolean }
    const participants = await getOrFetch<RawRow[]>(
      CACHE_KEYS.participantsList(userId),
      () => authPrisma.$queryRaw<RawRow[]>`
        SELECT
          p.id,
          p."firstName",
          p."lastName",
          COALESCE(BOOL_OR(sr.status IN ('PENDING', 'MATCHED', 'ACTIVE')), false) AS "hasPendingRequest"
        FROM participants p
        LEFT JOIN service_requests sr ON sr."participantId" = p.id
        WHERE p."userId" = ${userId}
        GROUP BY p.id, p."firstName", p."lastName", p."createdAt"
        ORDER BY p."createdAt" DESC
      `,
      CACHE_TTL.PARTICIPANTS_LIST
    )

    return NextResponse.json({ success: true, data: participants })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to fetch participants' }, { status: 500 })
  }
}

// ============================================================================
// POST - Create Participant
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    const auth = await authorizeUser()
    if ('error' in auth) return auth.error

    const body = await request.json()
    const parsed = createParticipantSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed', details: parsed.error.issues },
        { status: 400 }
      )
    }

    const data = parsed.data
    const { id: userId, role } = auth.session.user

    const participant = await authPrisma.participant.create({
      data: {
        userId,
        firstName:            data.firstName.trim(),
        lastName:             data.lastName.trim(),
        dateOfBirth:          data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender:               data.gender               ?? null,
        relationshipToClient: data.relationshipToClient ?? null,
        fundingType:          data.fundingType          ?? null,
        conditions:           data.conditions,
        additionalInfo:       data.additionalInfo        ?? null,
      },
    })

    // Sync name to clientProfile — CLIENT is the participant (1:1 relationship), fire-and-forget
    if (role === UserRole.CLIENT) {
      authPrisma.clientProfile.update({
        where: { userId },
        data: { firstName: data.firstName.trim(), lastName: data.lastName.trim() },
      }).catch(() => {})
    }

    invalidateCache(CACHE_KEYS.participantsList(userId)).catch(() => {})

    authPrisma.auditLog.create({
      data: {
        userId,
        action: 'PROFILE_UPDATE',
        metadata: { type: 'PARTICIPANT_CREATED', participantId: participant.id },
      },
    }).catch(() => {})

    return NextResponse.json({ success: true, data: participant }, { status: 201 })
  } catch {
    return NextResponse.json({ success: false, error: 'Failed to create participant' }, { status: 500 })
  }
}
