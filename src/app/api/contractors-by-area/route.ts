import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/contractors-by-area?area=Sydney,%20NSW
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const area = searchParams.get('area')

    // If no area specified, return all unique areas
    if (!area) {
      const uniqueAreas = await prisma.contractorsbyArea.findMany({
        select: {
          suburbState: true,
        },
        distinct: ['suburbState'],
        orderBy: {
          suburbState: 'asc',
        },
      })

      return NextResponse.json({
        success: true,
        areas: uniqueAreas.map(item => item.suburbState),
      })
    }

    // Fetch contractors for specific area
    const contractors = await prisma.contractorsbyArea.findMany({
      where: {
        suburbState: area,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    // Count total contractors for this area
    const count = contractors.length

    return NextResponse.json({
      success: true,
      area,
      count,
      contractors,
    })
  } catch (error) {
    console.error('Error fetching contractors by area:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch contractors',
      },
      { status: 500 }
    )
  }
}
