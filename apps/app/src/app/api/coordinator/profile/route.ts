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

    if (session.user.role !== UserRole.COORDINATOR) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const profile = await authPrisma.coordinatorProfile.findUnique({
      where: { userId: session.user.id },
      select: { firstName: true, lastName: true, mobile: true, organization: true },
    })

    return NextResponse.json({ success: true, data: profile })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== UserRole.COORDINATOR) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { firstName, lastName, mobile, organization } = body

    if (!firstName?.trim() || !lastName?.trim() || !mobile?.trim()) {
      return NextResponse.json(
        { success: false, error: 'First name, last name, and mobile are required' },
        { status: 400 }
      )
    }

    const updated = await authPrisma.coordinatorProfile.update({
      where: { userId: session.user.id },
      data: {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        mobile: mobile.trim(),
        organization: organization?.trim() || null,
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to update profile' }, { status: 500 })
  }
}
