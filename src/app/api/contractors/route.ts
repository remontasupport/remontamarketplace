import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Query parameters for filtering
    const city = searchParams.get('city')
    const skill = searchParams.get('skill')
    const isAvailable = searchParams.get('available')
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where clause
    const where: any = {}

    if (city) {
      where.city = {
        contains: city,
        mode: 'insensitive',
      }
    }

    if (skill) {
      where.skills = {
        has: skill,
      }
    }

    if (isAvailable !== null) {
      where.isAvailable = isAvailable === 'true'
    }

    // Fetch contractors
    const contractors = await prisma.contractorProfile.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: [
        { isVerified: 'desc' },
        { rating: 'desc' },
        { reviewCount: 'desc' },
      ],
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profileImage: true,
        title: true,
        companyName: true,
        yearsOfExperience: true,
        skills: true,
        specializations: true,
        city: true,
        state: true,
        postcode: true,
        serviceAreas: true,
        rating: true,
        reviewCount: true,
        isAvailable: true,
        isVerified: true,
      },
    })

    // Get total count for pagination
    const total = await prisma.contractorProfile.count({ where })

    return NextResponse.json({
      contractors,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching contractors:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contractors' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
