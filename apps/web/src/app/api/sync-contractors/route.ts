import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { zohoService } from '@/lib/zoho'
import { generateFileName } from '@/lib/blobStorage'
import { geocodeContractorAddress } from '@/lib/geocoding'

// ============================================================================
// CONFIGURATION
// ============================================================================

const BATCH_SIZE = 50 // Process records in batches
const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

// ============================================================================
// TYPES
// ============================================================================

interface SyncStats {
  total: number
  synced: number
  created: number
  updated: number
  skipped: number
  errors: number
}

interface ProcessedResult {
  success: boolean
  action?: 'created' | 'updated' | 'skipped'
  contactId: string
  error?: string
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse name from Zoho contact with fallback logic
 */
function parseName(contact: any): { firstName: string; lastName: string } | null {
  let firstName = contact.First_Name || ''
  let lastName = contact.Last_Name || ''

  // Try Full_Name field if firstName/lastName missing
  if (!firstName && !lastName && contact.Full_Name) {
    if (contact.Full_Name.includes(',')) {
      const [last, first] = contact.Full_Name.split(',').map((s: string) => s.trim())
      firstName = first || ''
      lastName = last || ''
    } else {
      const parts = contact.Full_Name.split(' ').filter(Boolean)
      firstName = parts[0] || ''
      lastName = parts.slice(1).join(' ') || ''
    }
  }

  // Try Name field if still missing
  if (!firstName && !lastName && contact.Name) {
    if (contact.Name.includes(',')) {
      const [last, first] = contact.Name.split(',').map((s: string) => s.trim())
      firstName = first || ''
      lastName = last || ''
    } else {
      const parts = contact.Name.split(' ').filter(Boolean)
      firstName = parts[0] || ''
      lastName = parts.slice(1).join(' ') || ''
    }
  }

  // Handle comma in firstName field
  if (firstName?.includes(',') && !lastName) {
    const [first, last] = firstName.split(',').map((s: string) => s.trim())
    firstName = first
    lastName = last || ''
  }

  // Last resort: Use placeholders if we have at least something
  if (!firstName && lastName) {
    firstName = 'N/A'
  }
  if (firstName && !lastName) {
    lastName = 'N/A'
  }

  // Validate we have both names
  if (!firstName || !lastName) {
    return null
  }

  return { firstName, lastName }
}

/**
 * Convert boolean field (handles arrays from Zoho)
 */
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

/**
 * Upload profile picture (Record_Image) to Vercel Blob with retry logic
 */
async function uploadProfilePicture(contact: any, retries = MAX_RETRIES): Promise<string | null> {
  // Check if contact has a profile picture
  if (!zohoService.hasProfilePicture(contact)) {
    return null
  }

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      // Download profile picture from Zoho
      const imageBuffer = await zohoService.downloadProfilePicture(contact.id)

      if (!imageBuffer) {
        return null
      }

      // Generate file name
      const fileName = generateFileName('profile-picture.png', contact.id, 'avatar')

      // Upload to Vercel Blob
      const { uploadToBlob } = await import('@/lib/blobStorage')
      return await uploadToBlob(imageBuffer, fileName, 'image/png')
    } catch (error) {
      if (attempt === retries) {
        console.error(`Failed to upload profile picture for contact ${contact.id} after ${retries} attempts:`, error)
        return null
      }
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS * Math.pow(2, attempt - 1)))
    }
  }

  return null
}

/**
 * Transform Zoho contact data to database format
 */
async function transformContactData(contact: any): Promise<any | null> {
  try {
    // Parse name fields
    const names = parseName(contact)
    if (!names) {
      console.warn(`Contact ${contact.id}: Missing or invalid name fields`)
      return null
    }

    const { firstName, lastName } = names

    // Get email or generate placeholder with timestamp to ensure uniqueness
    const email = contact.Email || `no-email-${contact.id}-${Date.now()}@placeholder.local`

    // Parse boolean field
    const hasVehicleAccess = parseBoolean(contact.Do_you_drive_and_have_access_to_vehicle)

    // Upload profile picture (Record_Image) to Vercel Blob (async operation with retry)
    const profilePictureUrl = await uploadProfilePicture(contact)

    // Geocode address to get coordinates
    const city = contact.City || contact.Mailing_City || null
    const state = contact.State || contact.Mailing_State || null
    const postalZipCode = contact.Postal_Zip_Code || contact.Mailing_Zip || null

    let latitude = null
    let longitude = null

    if (city || state || postalZipCode) {
      const coords = await geocodeContractorAddress(city, state, postalZipCode)
      if (coords) {
        latitude = coords.latitude
        longitude = coords.longitude
      }
    }

    // Parse years of experience to integer
    let yearsOfExperience = null
    if (contact.Years_of_Experience) {
      const parsed = parseInt(contact.Years_of_Experience, 10)
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
        yearsOfExperience = parsed
      }
    }

    // Prepare contractor data with only essential fields
    const contractorData = {
      // Required fields
      zohoContactId: contact.id,
      firstName,
      lastName,
      email,

      // Personal details
      phone: contact.Phone || contact.Mobile || null,
      gender: contact.Gender || null,

      // Location
      city,
      state,
      postalZipCode,
      latitude,
      longitude,

      // Professional Details
      titleRole: contact.Title_Role || null,
      yearsOfExperience,

      // Qualifications & Skills
      qualificationsAndCertifications: contact.Qualifications_Certifications || null,
      languageSpoken: contact.Language_Spoken || null,
      hasVehicleAccess,

      // Personal details
      aboutYou: contact.About_You || null,
      funFact: contact.Fun_Fact_About_Yourself || null,
      hobbiesAndInterests: contact.Hobbies_Interests || null,
      whatMakesBusinessUnique: contact.What_Makes_Your_Service_unique || null,
      additionalInformation: contact.Additional_Info || null,

      // Profile Image
      profilePicture: profilePictureUrl,

      // System fields
      lastSyncedAt: new Date(),
    }

    return contractorData
  } catch (error) {
    console.error(`Error transforming contact ${contact.id}:`, error)
    return null
  }
}

/**
 * Process a single contractor with validation
 */
async function processContractor(contact: any): Promise<ProcessedResult> {
  const contactId = contact.id

  try {
    // Transform data
    const contractorData = await transformContactData(contact)

    if (!contractorData) {
      return {
        success: false,
        contactId,
        error: 'Failed to transform contact data',
      }
    }

    // Map fields to match database schema (only essential fields)
    const dbData = {
      // Basic Information
      firstName: contractorData.firstName,
      lastName: contractorData.lastName,
      email: contractorData.email,
      phone: contractorData.phone,
      gender: contractorData.gender,

      // Location
      city: contractorData.city,
      state: contractorData.state,
      postalZipCode: contractorData.postalZipCode,
      latitude: contractorData.latitude,
      longitude: contractorData.longitude,

      // Professional Details
      titleRole: contractorData.titleRole,
      yearsOfExperience: contractorData.yearsOfExperience,

      // Qualifications & Skills
      qualificationsAndCertifications: contractorData.qualificationsAndCertifications,
      languageSpoken: contractorData.languageSpoken,
      hasVehicleAccess: contractorData.hasVehicleAccess,

      // Personal Details
      aboutYou: contractorData.aboutYou,
      funFact: contractorData.funFact,
      hobbiesAndInterests: contractorData.hobbiesAndInterests,
      whatMakesBusinessUnique: contractorData.whatMakesBusinessUnique,
      additionalInformation: contractorData.additionalInformation,

      // Profile Image
      profilePicture: contractorData.profilePicture,

      // System Fields
      lastSyncedAt: contractorData.lastSyncedAt,
    }

    // Check if record exists by zohoContactId
    const existingRecord = await prisma.contractorProfile.findUnique({
      where: { zohoContactId: contactId },
      select: { id: true, email: true },
    })

    // Handle duplicate emails by appending Zoho ID if email is already taken by a different contact
    if (!existingRecord && dbData.email) {
      const emailExists = await prisma.contractorProfile.findUnique({
        where: { email: dbData.email },
        select: { zohoContactId: true },
      })

      // If email exists and belongs to a different contact, make email unique
      if (emailExists && emailExists.zohoContactId !== contactId) {
        dbData.email = `${dbData.email.split('@')[0]}-${contactId}@${dbData.email.split('@')[1]}`
      }
    }

    // Upsert with proper update tracking
    await prisma.contractorProfile.upsert({
      where: { zohoContactId: contactId },
      update: {
        ...dbData,
        updatedAt: new Date(),
      },
      create: {
        ...dbData,
        zohoContactId: contactId,
      },
    })

    return {
      success: true,
      action: existingRecord ? 'updated' : 'created',
      contactId,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`Error processing contact ${contactId}:`, errorMsg)

    return {
      success: false,
      contactId,
      error: errorMsg,
    }
  }
}

/**
 * Process contractors in batches for better performance
 */
async function processBatch(contacts: any[]): Promise<ProcessedResult[]> {
  const results = await Promise.all(
    contacts.map(contact => processContractor(contact))
  )
  return results
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * POST /api/sync-contractors
 * Sync contractors from Zoho to database
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // ========================================
    // 1. AUTHENTICATION
    // ========================================
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.SYNC_API_SECRET

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized',
          message: 'Invalid or missing authorization token',
        },
        { status: 401 }
      )
    }

    // ========================================
    // 2. FETCH DATA FROM ZOHO
    // ========================================
    const zohoContacts = await zohoService.getContractorContacts()

    if (zohoContacts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No contractors found in Zoho to sync',
        stats: {
          total: 0,
          synced: 0,
          created: 0,
          updated: 0,
          skipped: 0,
          errors: 0,
        },
        duration: Date.now() - startTime,
      })
    }

    // ========================================
    // 3. BATCH PROCESSING
    // ========================================
    const stats: SyncStats = {
      total: zohoContacts.length,
      synced: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
    }

    const errorMessages: string[] = []
    const warnings: string[] = []

    // Process in batches
    for (let i = 0; i < zohoContacts.length; i += BATCH_SIZE) {
      const batch = zohoContacts.slice(i, i + BATCH_SIZE)

      const results = await processBatch(batch)

      // Aggregate results
      for (const result of results) {
        if (result.success) {
          stats.synced++
          if (result.action === 'created') stats.created++
          if (result.action === 'updated') stats.updated++
          if (result.action === 'skipped') stats.skipped++
        } else {
          stats.errors++
          const errorMsg = `Contact ${result.contactId}: ${result.error}`
          errorMessages.push(errorMsg)
        }
      }
    }

    // ========================================
    // 4. RESPONSE
    // ========================================
    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      message: 'Contractor sync completed',
      stats,
      duration,
      ...(errorMessages.length > 0 && {
        errorMessages: errorMessages.slice(0, 10), // Limit to first 10 errors
      }),
      ...(warnings.length > 0 && { warnings }),
    })

  } catch (error) {
    const duration = Date.now() - startTime
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'

    console.error('[Sync] Fatal error:', errorMsg)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to sync contractors',
        message: errorMsg,
        duration,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/sync-contractors
 * Get sync status and statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Optional authentication for GET endpoint
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.SYNC_API_SECRET

    if (expectedToken && authHeader && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get database statistics
    const [totalContractors, lastSynced, recentSyncs] = await Promise.all([
      prisma.contractorProfile.count(),
      prisma.contractorProfile.findFirst({
        orderBy: { lastSyncedAt: 'desc' },
        select: {
          lastSyncedAt: true,
          firstName: true,
          lastName: true,
        },
      }),
      prisma.contractorProfile.findMany({
        orderBy: { lastSyncedAt: 'desc' },
        take: 5,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          city: true,
          state: true,
          lastSyncedAt: true,
        },
      }),
    ])

    return NextResponse.json({
      success: true,
      stats: {
        totalContractors,
        lastSyncedAt: lastSynced?.lastSyncedAt || null,
        lastSyncedContractor: lastSynced
          ? `${lastSynced.firstName} ${lastSynced.lastName}`
          : null,
      },
      recentSyncs,
    })
  } catch (error) {
    console.error('[Sync Status] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get sync status',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
