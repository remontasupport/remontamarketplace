import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { signInRequired } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Sign-in required (2026-11-20): this route had no check.
    const denied = await signInRequired()
    if (denied) return denied
    const { id } = await params

    const contractor = await prisma.contractorProfile.findFirst({
      where: {
        id,
        deletedAt: null, // Only fetch if not deleted
      },
    })

    if (!contractor) {
      return NextResponse.json(
        { error: 'Contractor not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ contractor })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch contractor' },
      { status: 500 }
    )
  }
}
