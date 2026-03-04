/**
 * Participants List API
 *
 * GET /api/client/participants - List all participants for the current user
 * POST /api/client/participants - Create a new participant (no service request)
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

export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role
    if (userRole !== UserRole.CLIENT && userRole !== UserRole.COORDINATOR) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    // Use raw SQL to safely check service request status without Prisma enum issues (ARCHIVED)
    type RawRow = { id: string; firstName: string; lastName: string; hasPendingRequest: boolean }

    const participants = await authPrisma.$queryRaw<RawRow[]>`
      SELECT
        p.id,
        p."firstName",
        p."lastName",
        COALESCE(
          BOOL_OR(sr.status IN ('PENDING', 'MATCHED', 'ACTIVE')),
          false
        ) AS "hasPendingRequest"
      FROM participants p
      LEFT JOIN service_requests sr ON sr."participantId" = p.id
      WHERE p."userId" = ${session.user.id}
      GROUP BY p.id, p."firstName", p."lastName", p."createdAt"
      ORDER BY p."createdAt" DESC
    `

    return NextResponse.json({ success: true, data: participants })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch participants' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const userRole = session.user.role
    if (userRole !== UserRole.CLIENT && userRole !== UserRole.COORDINATOR) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { firstName, lastName, dateOfBirth, gender, relationshipToClient, fundingType, conditions, additionalInfo } = body

    if (!firstName?.trim() || !lastName?.trim()) {
      return NextResponse.json(
        { success: false, error: 'First name and last name are required' },
        { status: 400 }
      )
    }

    const participant = await authPrisma.participant.create({
      data: {
        userId: session.user.id,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
        gender: gender || null,
        relationshipToClient: relationshipToClient || null,
        fundingType: fundingType || null,
        conditions: conditions || [],
        additionalInfo: additionalInfo || null,
      },
    })

    // Sync firstName/lastName to clientProfile for CLIENT users (1:1 relationship)
    if (userRole === UserRole.CLIENT) {
      await authPrisma.clientProfile.update({
        where: { userId: session.user.id },
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
        },
      })
    }

    return NextResponse.json({ success: true, data: participant }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to create participant' },
      { status: 500 }
    )
  }
}
