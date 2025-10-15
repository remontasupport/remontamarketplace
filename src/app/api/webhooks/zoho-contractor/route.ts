import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { zohoService } from '@/lib/zoho'
import { generateFileName } from '@/lib/blobStorage'
import { geocodeContractorAddress } from '@/lib/geocoding'

// ============================================================================
// CONFIGURATION
// ============================================================================

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

// ============================================================================
// TYPES
// ============================================================================

interface ZohoWebhookPayload {
  module: string
  ids: (string | number)[] // Zoho can send IDs as numbers or strings
  operation: 'insert' | 'update' | 'delete'
  query_params?: Record<string, string>
  token?: string
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
      const { generateFileName: genFileName } = await import('@/lib/blobStorage')
      const fileName = genFileName('profile-picture.png', contact.id, 'avatar')

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

    // Prepare contractor data
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
 * Process single contact from webhook
 */
async function processWebhookContact(contactId: string | number): Promise<{ success: boolean; error?: string }> {
  try {
    // Convert contactId to string (Zoho can send as number or string)
    const contactIdStr = String(contactId)

    // Fetch full contact details from Zoho
    const contact = await zohoService.getContactById(contactIdStr)

    if (!contact) {
      return { success: false, error: 'Contact not found in Zoho' }
    }

    // Transform data
    const contractorData = await transformContactData(contact)

    if (!contractorData) {
      return { success: false, error: 'Failed to transform contact data' }
    }

    // Prepare database data
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

    // Check if record exists
    const existingRecord = await prisma.contractorProfile.findUnique({
      where: { zohoContactId: contactIdStr },
      select: { id: true, email: true },
    })

    // Handle duplicate emails
    if (!existingRecord && dbData.email) {
      const emailExists = await prisma.contractorProfile.findUnique({
        where: { email: dbData.email },
        select: { zohoContactId: true },
      })

      // If email exists and belongs to a different contact, make email unique
      if (emailExists && emailExists.zohoContactId !== contactIdStr) {
        dbData.email = `${dbData.email.split('@')[0]}-${contactIdStr}@${dbData.email.split('@')[1]}`
      }
    }

    // Upsert the record
    await prisma.contractorProfile.upsert({
      where: { zohoContactId: contactIdStr },
      update: {
        ...dbData,
        updatedAt: new Date(),
      },
      create: {
        ...dbData,
        zohoContactId: contactIdStr,
      },
    })

    return { success: true }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    console.error(`Error processing webhook contact ${contactIdStr}:`, errorMsg)
    return { success: false, error: errorMsg }
  }
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

/**
 * POST /api/webhooks/zoho-contractor
 * Webhook endpoint for Zoho CRM Contact updates
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    // ========================================
    // 1. PARSE WEBHOOK PAYLOAD
    // ========================================

    const contentType = request.headers.get('content-type') || ''
    const url = new URL(request.url)
    const queryParams = Object.fromEntries(url.searchParams.entries())

    // Check if data is in headers (Zoho workflow webhooks send params as headers)
    const idsHeader = request.headers.get('ids') || request.headers.get('id')
    const moduleHeader = request.headers.get('module')
    const operationHeader = request.headers.get('operation')

    console.log('[Webhook] Request received:', {
      contentType,
      hasQueryParams: Object.keys(queryParams).length > 0,
      queryParams,
      headers: {
        ids: idsHeader,
        module: moduleHeader,
        operation: operationHeader,
      },
    })

    // Check if data is in headers first (Zoho workflow sends params as headers with merge field placeholders)
    if (idsHeader && idsHeader.includes('${') && idsHeader.includes('}')) {
      console.log('[Webhook] Detected merge field in headers - syncing recently modified contacts')

      // Fetch contacts modified in the last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

      try {
        // Get recently modified contacts from Zoho
        const recentContacts = await zohoService.getRecentlyModifiedContacts(fiveMinutesAgo)

        console.log(`[Webhook] Found ${recentContacts.length} recently modified contacts`)

        // Process each contact
        const results = await Promise.all(
          recentContacts.map(contact => processWebhookContact(contact.id))
        )

        const stats = {
          total: results.length,
          success: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
        }

        const errors = results
          .filter(r => !r.success)
          .map((r, i) => `Contact ${recentContacts[i].id}: ${r.error}`)

        const duration = Date.now() - startTime

        console.log(`[Webhook] Synced recent contacts in ${duration}ms - Success: ${stats.success}, Failed: ${stats.failed}`)

        return NextResponse.json({
          success: true,
          message: 'Synced recently modified contacts',
          stats,
          duration,
          ...(errors.length > 0 && { errors }),
        })
      } catch (error) {
        console.error('[Webhook] Error syncing recent contacts:', error)
        return NextResponse.json({
          success: false,
          error: 'Failed to sync recent contacts',
          message: error instanceof Error ? error.message : 'Unknown error',
        }, { status: 500 })
      }
    }

    let bodyText = ''
    let formData: FormData | null = null

    // Try to get form data first if content type is form-encoded
    if (contentType.includes('application/x-www-form-urlencoded')) {
      try {
        formData = await request.formData()
        console.log('[Webhook] Form data entries:', Array.from(formData.entries()))
      } catch (e) {
        // If formData() fails, try text()
        console.log('[Webhook] FormData parsing failed, trying text()')
        bodyText = await request.text()
      }
    } else {
      bodyText = await request.text()
    }

    console.log('[Webhook] Body details:', {
      bodyText: bodyText.substring(0, 200),
      formDataKeys: formData ? Array.from(formData.keys()) : null,
    })

    // Handle empty body text - check headers, form data, or query params
    if ((!bodyText || bodyText.trim() === '') && !formData) {
      console.log('[Webhook] Empty body - checking headers and query parameters')

      // Try to get params from headers first (Zoho workflow webhooks)
      let id = idsHeader
      let module = moduleHeader
      let operation = operationHeader

      // If not in headers, try query string
      if (!id) {
        id = url.searchParams.get('id') || url.searchParams.get('ids') || null
        module = url.searchParams.get('module') || null
        operation = url.searchParams.get('operation') || url.searchParams.get('event') || null
      }

      // Check if we got a merge field placeholder instead of actual ID (fallback check)
      // Zoho sends "${Contacts.id}" when merge fields don't work in Custom Parameters
      if (id && id.includes('${') && id.includes('}')) {
        console.log('[Webhook] Merge field not expanded - syncing recently modified contacts instead')

        // Fetch contacts modified in the last 5 minutes
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

        try {
          // Get recently modified contacts from Zoho
          const recentContacts = await zohoService.getRecentlyModifiedContacts(fiveMinutesAgo)

          console.log(`[Webhook] Found ${recentContacts.length} recently modified contacts`)

          // Process each contact
          const results = await Promise.all(
            recentContacts.map(contact => processWebhookContact(contact.id))
          )

          const stats = {
            total: results.length,
            success: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
          }

          const errors = results
            .filter(r => !r.success)
            .map((r, i) => `Contact ${recentContacts[i].id}: ${r.error}`)

          const duration = Date.now() - startTime

          console.log(`[Webhook] Synced recent contacts in ${duration}ms - Success: ${stats.success}, Failed: ${stats.failed}`)

          return NextResponse.json({
            success: true,
            message: 'Synced recently modified contacts',
            stats,
            duration,
            ...(errors.length > 0 && { errors }),
          })
        } catch (error) {
          console.error('[Webhook] Error syncing recent contacts:', error)
          return NextResponse.json({
            success: false,
            error: 'Failed to sync recent contacts',
            message: error instanceof Error ? error.message : 'Unknown error',
          }, { status: 500 })
        }
      }

      if (!id) {
        console.warn('[Webhook] No ID in body, headers, form data, or query params - ignoring')
        return NextResponse.json({
          success: true,
          message: 'Empty webhook payload - ignoring',
        })
      }

      // Build payload from query params
      const payload: ZohoWebhookPayload = {
        module: module || 'Contacts',
        ids: id.includes(',') ? id.split(',') : [id],
        operation: (operation as any) || 'update',
      }

      console.log('[Webhook] Using query parameters:', payload)

      // Jump to processing
      const results = await Promise.all(
        payload.ids.map(contactId => processWebhookContact(contactId))
      )

      const stats = {
        total: results.length,
        success: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
      }

      const errors = results
        .filter(r => !r.success)
        .map((r, i) => `Contact ${payload.ids[i]}: ${r.error}`)

      const duration = Date.now() - startTime

      console.log(`[Webhook] Completed in ${duration}ms - Success: ${stats.success}, Failed: ${stats.failed}`)

      return NextResponse.json({
        success: true,
        message: 'Webhook processed from query params',
        operation: payload.operation,
        stats,
        duration,
        ...(errors.length > 0 && { errors }),
      })
    }

    // Parse payload based on content type
    let payload: ZohoWebhookPayload

    // Check if we have FormData
    if (formData) {
      console.log('[Webhook] Parsing from FormData object')

      const idsParam = formData.get('ids')?.toString() || formData.get('id')?.toString()
      const moduleParam = formData.get('module')?.toString()
      const operationParam = formData.get('operation')?.toString() || formData.get('event')?.toString()

      // Handle single ID or comma-separated IDs
      let ids: string[] = []
      if (idsParam) {
        // Check if it's a JSON string (Deluge sends it as '["id1","id2"]')
        if (idsParam.startsWith('[') && idsParam.endsWith(']')) {
          try {
            const parsed = JSON.parse(idsParam)
            ids = Array.isArray(parsed) ? parsed : [idsParam]
          } catch (e) {
            // If JSON parse fails, treat as regular string
            ids = idsParam.includes(',') ? idsParam.split(',') : [idsParam]
          }
        } else {
          ids = idsParam.includes(',') ? idsParam.split(',') : [idsParam]
        }
      }

      payload = {
        module: moduleParam || 'Contacts',
        ids,
        operation: (operationParam as any) || 'update',
      }

      console.log('[Webhook] Parsed from FormData:', payload)
    }
    // Check if it's URL-encoded form data (Zoho sometimes sends this)
    else if (contentType.includes('application/x-www-form-urlencoded') && bodyText) {
      console.log('[Webhook] Parsing URL-encoded form data from body text')
      const params = new URLSearchParams(bodyText)

      // Zoho might send data in various formats
      const idsParam = params.get('ids') || params.get('id')
      const moduleParam = params.get('module')
      const operationParam = params.get('operation') || params.get('event')

      // Handle single ID or comma-separated IDs
      let ids: string[] = []
      if (idsParam) {
        ids = idsParam.includes(',') ? idsParam.split(',') : [idsParam]
      }

      payload = {
        module: moduleParam || 'Contacts',
        ids,
        operation: (operationParam as any) || 'update',
      }

      console.log('[Webhook] Parsed from URL params:', payload)
    } else {
      // Try parsing as JSON
      try {
        payload = JSON.parse(bodyText)
        console.log('[Webhook] Parsed from JSON:', payload)
      } catch (parseError) {
        console.error('[Webhook] JSON parse error:', parseError)
        console.error('[Webhook] Body that failed to parse:', bodyText)
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid payload format',
            receivedBody: bodyText.substring(0, 200),
            contentType,
          },
          { status: 400 }
        )
      }
    }

    console.log('[Webhook] Parsed Zoho webhook:', {
      module: payload.module,
      operation: payload.operation,
      contactIds: payload.ids,
    })

    // Validate module
    if (payload.module !== 'Contacts') {
      return NextResponse.json(
        { success: false, error: 'Invalid module - expected Contacts' },
        { status: 400 }
      )
    }

    // Validate contact IDs
    if (!payload.ids || !Array.isArray(payload.ids) || payload.ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No contact IDs provided' },
        { status: 400 }
      )
    }

    // ========================================
    // 2. PROCESS CONTACTS
    // ========================================

    // Handle DELETE operation (soft delete)
    if (payload.operation === 'delete') {
      console.log('[Webhook] Processing SOFT DELETE operation for contacts:', payload.ids)

      const deleteResults = await Promise.all(
        payload.ids.map(async (contactId) => {
          try {
            // Convert contactId to string (Zoho sends as number, DB expects string)
            const contactIdStr = String(contactId)

            // Soft delete - set deletedAt timestamp
            await prisma.contractorProfile.update({
              where: { zohoContactId: contactIdStr },
              data: { deletedAt: new Date() }
            })
            return { success: true, contactId: contactIdStr }
          } catch (error) {
            // If record doesn't exist, that's fine
            if (error instanceof Error && error.message.includes('Record to update not found')) {
              return { success: true, contactId: String(contactId), note: 'Record does not exist' }
            }
            return {
              success: false,
              contactId: String(contactId),
              error: error instanceof Error ? error.message : 'Unknown error'
            }
          }
        })
      )

      const deleteStats = {
        total: deleteResults.length,
        success: deleteResults.filter(r => r.success).length,
        failed: deleteResults.filter(r => !r.success).length,
      }

      const duration = Date.now() - startTime
      console.log(`[Webhook] Soft delete completed in ${duration}ms - Success: ${deleteStats.success}, Failed: ${deleteStats.failed}`)

      return NextResponse.json({
        success: true,
        message: 'Soft delete operation completed',
        operation: 'delete',
        stats: deleteStats,
        duration,
      })
    }

    // Handle CREATE/UPDATE operations
    const results = await Promise.all(
      payload.ids.map(contactId => processWebhookContact(contactId))
    )

    // ========================================
    // 3. AGGREGATE RESULTS
    // ========================================
    const stats = {
      total: results.length,
      success: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
    }

    const errors = results
      .filter(r => !r.success)
      .map((r, i) => `Contact ${payload.ids[i]}: ${r.error}`)

    const duration = Date.now() - startTime

    console.log(`[Webhook] Completed in ${duration}ms - Success: ${stats.success}, Failed: ${stats.failed}`)

    // ========================================
    // 4. RESPONSE
    // ========================================
    return NextResponse.json({
      success: true,
      message: 'Webhook processed',
      operation: payload.operation,
      stats,
      duration,
      ...(errors.length > 0 && { errors }),
    })

  } catch (error) {
    const duration = Date.now() - startTime
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'

    console.error('[Webhook] Fatal error:', errorMsg)

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process webhook',
        message: errorMsg,
        duration,
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/webhooks/zoho-contractor
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Zoho Contractor Webhook endpoint is running',
    timestamp: new Date().toISOString(),
  })
}
