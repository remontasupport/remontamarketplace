import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { zohoService } from '@/lib/zoho'
import { uploadFromUrl, generateFileName } from '@/lib/blobStorage'

// Helper: Parse name from Zoho contact
function parseName(contact: any): { firstName: string; lastName: string } {
  let firstName = contact.First_Name || contact.First_Name_1 || ''
  let lastName = contact.Last_Name || contact.Last_Name_1 || ''

  // Parse from Name field if firstName/lastName missing
  if (!firstName && !lastName && contact.Name) {
    if (contact.Name.includes(',')) {
      const [last, first] = contact.Name.split(',').map((s: string) => s.trim())
      firstName = first || 'N/A'
      lastName = last
    } else {
      const parts = contact.Name.split(' ')
      firstName = parts[0]
      lastName = parts.slice(1).join(' ') || 'N/A'
    }
  }

  // Handle comma in firstName field
  if (firstName?.includes(',') && !lastName) {
    const [first, last] = firstName.split(',').map((s: string) => s.trim())
    firstName = first
    lastName = last || 'N/A'
  }

  return { firstName, lastName }
}

// Helper: Parse array or string field to array
function parseToArray(value: any): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  return value.split(',').map((s: string) => s.trim())
}

// Helper: Convert boolean field (handles arrays from Zoho)
function parseBoolean(value: any): boolean | null {
  if (typeof value === 'boolean') return value
  if (Array.isArray(value)) {
    const first = value[0]
    if (first === 'Yes' || first === 'yes' || first === 'true') return true
    if (first === 'No' || first === 'no' || first === 'false') return false
  }
  if (value === 'Yes' || value === 'yes' || value === 'true') return true
  if (value === 'No' || value === 'no' || value === 'false') return false
  return null
}

// Helper: Process file upload field to JSON string
function processFileUpload(value: any): string | null {
  if (!value || !Array.isArray(value) || value.length === 0) return null
  return JSON.stringify(value)
}

// Helper: Upload photo to Vercel Blob
async function uploadPhoto(contact: any): Promise<string | null> {
  const photoSubmission = contact.Photo_Submission
  if (!photoSubmission || !Array.isArray(photoSubmission) || photoSubmission.length === 0) {
    return null
  }

  try {
    const photo = photoSubmission[0]
    if (!photo.preview_Url && !photo.download_Url) return null

    const token = await (zohoService as any).getAccessToken()
    const apiUrl = process.env.ZOHO_CRM_API_URL || 'https://www.zohoapis.com.au/crm/v2'
    const fullUrl = `${apiUrl}/Contractors/${contact.id}/Attachments/${photo.attachment_Id}`
    const fileName = generateFileName(photo.file_Name || 'photo.jpg', contact.id, 'profile')

    return await uploadFromUrl(fullUrl, fileName, token)
  } catch (error) {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.SYNC_API_SECRET

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all contractor contacts from Zoho
    const zohoContacts = await zohoService.getContractorContacts()

    let created = 0
    let updated = 0
    let errors = 0
    const errorMessages: string[] = []

    // Sync each contact to database
    for (const contact of zohoContacts) {
      try {
        // Parse name fields
        const { firstName, lastName } = parseName(contact)

        if (!firstName || !lastName) {
          errors++
          errorMessages.push(`Contact ${contact.id}: Missing name fields`)
          continue
        }

        // Get email or generate placeholder
        const email = contact.Email || contact.Email_Address || `no-email-${contact.id}@placeholder.local`

        // Parse skills and specializations
        const skills = [
          contact.Primary_Service,
          ...parseToArray(contact.Secondary_Service_s)
        ].filter((s): s is string => Boolean(s))

        const specializations = parseToArray(contact.MISC_service).filter((s): s is string => Boolean(s))
        const servicesOffered = parseToArray(contact.Services_Offered).filter((s): s is string => Boolean(s))

        // Parse boolean field
        const hasVehicleAccess = parseBoolean(contact.Do_you_drive_and_have_access_to_vehicle)

        // Upload photo to Blob
        const photoSubmissionUrl = await uploadPhoto(contact)

        // Process file upload fields
        const documentsUploads = processFileUpload(contact.Documents_Uploads)
        const qualificationsUploads = processFileUpload(contact.Qualifications_Uploads)
        const insuranceUploads = processFileUpload(contact.Insurance_Uploads)
        const ndisWorkerCheck = processFileUpload(contact.NDIS_Worker_Check1)
        const policeCheck = processFileUpload(contact.Police_Check_1)
        const workingWithChildrenCheck = processFileUpload(contact.Working_With_Children_Check_1)
        const ndisTrainingFileUpload = processFileUpload(contact.File_Upload)
        const infectionControlTraining = processFileUpload(contact.Infection_Control_Training)

        // Prepare contractor data
        const contractorData = {
          firstName,
          lastName,
          email,
          phone: contact.Phone || contact.Phone_1 || contact.Contact_Number || null,
          title: contact.Primary_Service || null,
          companyName: contact.Company_Lookup || null,
          yearsOfExperience: contact.Years_of_Experience || null,
          skills,
          specializations,
          city: contact.City || contact.City_1 || null,
          state: contact.State_Region_Province || contact.State_Region_Province_1 || contact.State || null,
          postcode: contact.Postal_Zip_Code || contact.Postal_Zip_Code_1 || null,
          profileImage: contact.Profile_Image || null,
          documentsUploads,
          qualificationsUploads,
          insuranceUploads,
          ndisWorkerCheck,
          policeCheck,
          workingWithChildrenCheck,
          ndisTrainingFileUpload,
          infectionControlTraining,
          emergencyContact1: contact.Emergency_Contact_1 || null,
          emergencyContact2: contact.Emergency_Contact_2 || null,
          emergencyPhone1: contact.Phone_1 || null,
          emergencyPhone2: contact.Phone_2 || null,
          emergencyEmail2: contact.Email_2 || null,
          emergencyEmail3: contact.Email_3 || null,
          emergencyRelationship: contact.Relationship_to_you || null,
          emergencyName: contact.Name || null,
          emergencyClinicName: contact.Clinic_Name || null,
          profileTitle: contact.Title_Role || null,
          servicesOffered,
          qualificationsAndCerts: contact.Qualifications_and_Certifications || null,
          languageSpoken: contact.Language_Spoken || null,
          hasVehicleAccess,
          funFact: contact.A_Fun_Fact_About_Yourself || null,
          hobbiesAndInterests: contact.Hobbies_and_or_Interests || null,
          businessUnique: contact.What_Makes_Your_Business_Unique || null,
          whyEnjoyWork: contact.Why_Do_You_Enjoy_Your_Work || null,
          additionalInformation: contact.Additional_Information || null,
          photoSubmission: photoSubmissionUrl,
          signature2: contact.Signature_2 || null,
          dateSigned2: contact.Date_Signed_2 ? new Date(contact.Date_Signed_2) : null,
          lastSyncedAt: new Date(),
        }

        // Upsert contractor profile
        await prisma.contractorProfile.upsert({
          where: { zohoContactId: contact.id },
          update: { ...contractorData, updatedAt: new Date() },
          create: { ...contractorData, zohoContactId: contact.id },
        })

        updated++
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error)
        errors++
        errorMessages.push(`Contact ${contact.id}: ${errorMsg}`)
      }
    }

    return NextResponse.json({
      message: 'Contractor sync completed successfully',
      stats: {
        total: zohoContacts.length,
        synced: updated,
        errors,
      },
      ...(errors > 0 && { errorMessages: errorMessages.slice(0, 5) }),
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to sync contractors',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check sync status
export async function GET() {
  try {
    const totalContractors = await prisma.contractorProfile.count()
    const lastSynced = await prisma.contractorProfile.findFirst({
      orderBy: { lastSyncedAt: 'desc' },
      select: { lastSyncedAt: true },
    })

    return NextResponse.json({
      totalContractors,
      lastSyncedAt: lastSynced?.lastSyncedAt || null,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    )
  }
}
