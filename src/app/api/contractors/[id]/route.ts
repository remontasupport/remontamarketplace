import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const contractor = await prisma.contractorProfile.findUnique({
      where: { id },
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
