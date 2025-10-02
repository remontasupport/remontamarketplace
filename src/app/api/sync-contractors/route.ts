import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { zohoService } from '@/lib/zoho'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    // Optional: Add authentication to protect this endpoint
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.SYNC_API_SECRET

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting contractor sync from Zoho CRM...')

    // Fetch all contractor contacts from Zoho
    const zohoContacts = await zohoService.getContractorContacts()

    console.log(`Found ${zohoContacts.length} contractors in Zoho CRM`)

    let created = 0
    let updated = 0
    let errors = 0

    // Log first contact to see actual structure
    if (zohoContacts.length > 0) {
      console.log('Sample contact data:', JSON.stringify(zohoContacts[0], null, 2))
    }

    // Sync each contact to database
    for (const contact of zohoContacts) {
      try {
        // Parse name - prioritize First_Name/Last_Name, fallback to Name field
        let firstName = contact.First_Name || contact.First_Name_1
        let lastName = contact.Last_Name || contact.Last_Name_1

        // If we have a Name field but no firstName/lastName, try to parse it
        if (!firstName && !lastName && contact.Name) {
          // Handle comma-separated names (e.g., "Last, First")
          if (contact.Name.includes(',')) {
            const parts = contact.Name.split(',').map(s => s.trim())
            lastName = parts[0]
            firstName = parts[1] || 'N/A'
          } else {
            const nameParts = contact.Name.split(' ')
            if (nameParts.length >= 2) {
              firstName = nameParts[0]
              lastName = nameParts.slice(1).join(' ')
            } else {
              firstName = contact.Name
              lastName = 'N/A'
            }
          }
        }

        // Handle partial firstName (e.g., "Angie, Bennett" stored as firstName)
        if (firstName && firstName.includes(',') && !lastName) {
          const parts = firstName.split(',').map(s => s.trim())
          firstName = parts[0]
          lastName = parts[1] || 'N/A'
        }

        // Get email (can be null)
        const email = contact.Email || contact.Email_Address || null

        // Skip only if we don't have name fields
        if (!firstName || !lastName) {
          console.log(`Skipping contact ${contact.id} - missing required name fields (firstName: ${firstName}, lastName: ${lastName})`)
          errors++
          continue
        }

        // Generate a placeholder email if none exists (using Zoho ID to ensure uniqueness)
        const finalEmail = email || `no-email-${contact.id}@placeholder.local`

        // Parse service fields into skills array
        const skills: string[] = []
        if (contact.Primary_Service) skills.push(contact.Primary_Service)
        if (contact.Secondary_Service_s) {
          // Handle both array and string formats
          if (Array.isArray(contact.Secondary_Service_s)) {
            skills.push(...contact.Secondary_Service_s)
          } else if (typeof contact.Secondary_Service_s === 'string') {
            const secondaryServices = contact.Secondary_Service_s.split(',').map(s => s.trim())
            skills.push(...secondaryServices)
          }
        }

        // Parse MISC services into specializations
        const specializations: string[] = []
        if (contact.MISC_service) {
          // Handle both array and string formats
          if (Array.isArray(contact.MISC_service)) {
            specializations.push(...contact.MISC_service)
          } else if (typeof contact.MISC_service === 'string') {
            const miscServices = contact.MISC_service.split(',').map(s => s.trim())
            specializations.push(...miscServices)
          }
        }

        // Service areas - for now empty, can be added later
        const serviceAreas: string[] = []

        // Upsert contractor profile
        const result = await prisma.contractorProfile.upsert({
          where: {
            zohoContactId: contact.id,
          },
          update: {
            firstName,
            lastName,
            email: finalEmail,
            phone: contact.Phone || contact.Phone_1 || contact.Contact_Number || null,
            title: contact.Primary_Service || null,
            companyName: contact.Company_Lookup || null,
            yearsOfExperience: contact.Years_of_Experience || null,
            skills,
            specializations,
            city: contact.City || contact.City_1 || null,
            state: contact.State_Region_Province || contact.State_Region_Province_1 || contact.State || null,
            postcode: contact.Postal_Zip_Code || contact.Postal_Zip_Code_1 || null,
            serviceAreas,
            rating: contact.Rating || 0,
            reviewCount: contact.Review_Count || 0,
            isAvailable: contact.Is_Available ?? true,
            isVerified: contact.Is_Verified ?? false,
            profileImage: contact.Profile_Image || null,
            lastSyncedAt: new Date(),
            updatedAt: new Date(),
          },
          create: {
            zohoContactId: contact.id,
            firstName,
            lastName,
            email: finalEmail,
            phone: contact.Phone || contact.Phone_1 || contact.Contact_Number || null,
            title: contact.Primary_Service || null,
            companyName: contact.Company_Lookup || null,
            yearsOfExperience: contact.Years_of_Experience || null,
            skills,
            specializations,
            city: contact.City || contact.City_1 || null,
            state: contact.State_Region_Province || contact.State_Region_Province_1 || contact.State || null,
            postcode: contact.Postal_Zip_Code || contact.Postal_Zip_Code_1 || null,
            serviceAreas,
            rating: contact.Rating || 0,
            reviewCount: contact.Review_Count || 0,
            isAvailable: contact.Is_Available ?? true,
            isVerified: contact.Is_Verified ?? false,
            profileImage: contact.Profile_Image || null,
            lastSyncedAt: new Date(),
          },
        })

        // Check if it was created or updated
        const existingProfile = await prisma.contractorProfile.findUnique({
          where: { zohoContactId: contact.id },
          select: { createdAt: true, updatedAt: true },
        })

        if (existingProfile && existingProfile.createdAt === existingProfile.updatedAt) {
          created++
        } else {
          updated++
        }
      } catch (error) {
        console.error(`Error syncing contact ${contact.id}:`, {
          contactId: contact.id,
          firstName: contact.First_Name,
          lastName: contact.Last_Name,
          email: contact.Email || contact.Email_Address,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        })
        errors++
      }
    }

    console.log(`Sync completed: ${created} created, ${updated} updated, ${errors} errors`)

    return NextResponse.json(
      {
        message: 'Contractor sync completed successfully',
        stats: {
          total: zohoContacts.length,
          created,
          updated,
          errors,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error syncing contractors:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync contractors',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// GET endpoint to check sync status
export async function GET() {
  try {
    const totalContractors = await prisma.contractorProfile.count()
    const availableContractors = await prisma.contractorProfile.count({
      where: { isAvailable: true },
    })
    const lastSynced = await prisma.contractorProfile.findFirst({
      orderBy: { lastSyncedAt: 'desc' },
      select: { lastSyncedAt: true },
    })

    return NextResponse.json({
      totalContractors,
      availableContractors,
      lastSyncedAt: lastSynced?.lastSyncedAt || null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
