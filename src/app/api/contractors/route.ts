import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const city = searchParams.get('city')
    const skill = searchParams.get('skill')
    const limitParam = searchParams.get('limit')
    const limit = limitParam === 'all' ? undefined : parseInt(limitParam || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const where: any = {}
    if (city) where.city = { contains: city, mode: 'insensitive' }
    if (skill) where.skills = { has: skill }

    const contractors = await prisma.contractorProfile.findMany({
      where,
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
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

        // Additional fields
        documentsUploads: true,
        qualificationsUploads: true,
        insuranceUploads: true,
        ndisWorkerCheck: true,
        policeCheck: true,
        workingWithChildrenCheck: true,
        ndisTrainingFileUpload: true,
        infectionControlTraining: true,
        emergencyContact1: true,
        emergencyContact2: true,
        emergencyPhone1: true,
        emergencyPhone2: true,
        emergencyEmail2: true,
        emergencyEmail3: true,
        emergencyRelationship: true,
        emergencyName: true,
        emergencyClinicName: true,
        profileTitle: true,
        servicesOffered: true,
        qualificationsAndCerts: true,
        languageSpoken: true,
        hasVehicleAccess: true,
        funFact: true,
        hobbiesAndInterests: true,
        businessUnique: true,
        whyEnjoyWork: true,
        additionalInformation: true,
        photoSubmission: true,
        signature2: true,
        dateSigned2: true,
      },
    })

    const total = await prisma.contractorProfile.count({ where })

    return NextResponse.json({
      contractors,
      pagination: {
        total,
        limit: limit || total,
        offset,
        hasMore: limit ? offset + limit < total : false,
      },
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch contractors' },
      { status: 500 }
    )
  }
}
