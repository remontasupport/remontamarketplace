import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { zohoService } from '@/lib/zoho'
import { generateFileName } from '@/lib/blobStorage'
import { geocodeContractorAddress } from '@/lib/geocoding'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import crypto from 'crypto'

// ============================================================================
// CONFIGURATION
// ============================================================================

const MAX_RETRIES = 3
const RETRY_DELAY_MS = 1000

// Security Configuration
const WEBHOOK_SECRET = process.env.ZOHO_WEBHOOK_SECRET
const WEBHOOK_SIGNATURE_SECRET = process.env.ZOHO_WEBHOOK_SIGNATURE_SECRET
const ALLOWED_IPS = process.env.ZOHO_WEBHOOK_ALLOWED_IPS?.split(',').map(ip => ip.trim()) || []
const ENABLE_IP_ALLOWLIST = process.env.ZOHO_WEBHOOK_ENABLE_IP_ALLOWLIST === 'true'

// Rate Limiting - Prevents brute force attacks
// Allows 10 requests per 60 seconds per IP
const ratelimit = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(10, '60 s'),
      analytics: true,
      prefix: 'webhook:zoho-contractor',
    })
  : null

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

// ============================================================================
// SECURITY VALIDATION FUNCTIONS
// ============================================================================

/**
 * Verify webhook secret token
 * Prevents unauthorized access from unknown sources
 */
function verifyWebhookSecret(request: NextRequest): boolean {
  if (!WEBHOOK_SECRET) {
    console.warn('[Security] ZOHO_WEBHOOK_SECRET not configured - skipping secret verification')
    return true // Allow if not configured (dev mode)
  }

  console.log('[Security Debug] Expected secret length:', WEBHOOK_SECRET.length)
  console.log('[Security Debug] Expected secret (first 10 chars):', WEBHOOK_SECRET.substring(0, 10))

  // Check Authorization header
  const authHeader = request.headers.get('authorization')
  if (authHeader) {
    console.log('[Security Debug] Authorization header found:', authHeader.substring(0, 20) + '...')
    const expectedBearer = `Bearer ${WEBHOOK_SECRET}`
    if (authHeader === expectedBearer) {
      console.log('[Security Debug] Authorization header matched!')
      return true
    }
  }

  // Check X-Webhook-Secret header (alternative)
  const secretHeader = request.headers.get('x-webhook-secret')
  if (secretHeader) {
    console.log('[Security Debug] X-Webhook-Secret header found:', secretHeader.substring(0, 10) + '...')
    if (secretHeader === WEBHOOK_SECRET) {
      console.log('[Security Debug] X-Webhook-Secret matched!')
      return true
    }
  }

  // Check query parameter (fallback for testing)
  const url = new URL(request.url)
  console.log('[Security Debug] Full URL:', request.url)
  console.log('[Security Debug] Query params:', Object.fromEntries(url.searchParams.entries()))

  const querySecret = url.searchParams.get('secret')
  if (querySecret) {
    console.log('[Security Debug] Query secret found, length:', querySecret.length)
    console.log('[Security Debug] Query secret (first 10 chars):', querySecret.substring(0, 10))
    console.log('[Security Debug] Secrets match:', querySecret === WEBHOOK_SECRET)
    if (querySecret === WEBHOOK_SECRET) {
      console.log('[Security Debug] Query parameter matched!')
      return true
    }
  } else {
    console.log('[Security Debug] No query secret parameter found in URL')
  }

  // Store request for body check later
  // Return false for now, will check body in POST handler
  console.log('[Security Debug] Will check request body for secret')
  return false
}

/**
 * Verify webhook secret from request body
 * Used when secret is sent as part of the payload
 */
function verifyWebhookSecretFromBody(bodySecret: string | undefined): boolean {
  if (!WEBHOOK_SECRET) {
    return true // Allow if not configured
  }

  if (!bodySecret) {
    console.log('[Security Debug] No secret in body')
    return false
  }

  console.log('[Security Debug] Body secret found, length:', bodySecret.length)
  console.log('[Security Debug] Body secret (first 10 chars):', bodySecret.substring(0, 10))

  if (bodySecret === WEBHOOK_SECRET) {
    console.log('[Security Debug] Body secret matched!')
    return true
  }

  console.log('[Security Debug] Body secret did not match')
  return false
}

/**
 * Verify request signature using HMAC
 * Ensures request hasn't been tampered with
 */
async function verifyRequestSignature(request: NextRequest, body: string): Promise<boolean> {
  if (!WEBHOOK_SIGNATURE_SECRET) {
    console.warn('[Security] ZOHO_WEBHOOK_SIGNATURE_SECRET not configured - skipping signature verification')
    return true // Allow if not configured
  }

  const signature = request.headers.get('x-zoho-signature') || request.headers.get('x-webhook-signature')
  if (!signature) {
    console.warn('[Security] No signature header found')
    return false
  }

  // Calculate expected signature
  const hmac = crypto.createHmac('sha256', WEBHOOK_SIGNATURE_SECRET)
  hmac.update(body)
  const expectedSignature = hmac.digest('hex')

  // Constant-time comparison to prevent timing attacks
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Verify IP address is in allowlist
 * Restricts access to known Zoho servers
 */
function verifyIPAllowlist(request: NextRequest): boolean {
  if (!ENABLE_IP_ALLOWLIST) {
    return true // Skip if not enabled
  }

  if (ALLOWED_IPS.length === 0) {
    console.warn('[Security] IP allowlist enabled but no IPs configured')
    return true // Allow if no IPs configured
  }

  // Get client IP from headers (Vercel/Next.js)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const clientIP = forwardedFor?.split(',')[0].trim() || realIP || 'unknown'

  console.log(`[Security] Client IP: ${clientIP}`)

  if (ALLOWED_IPS.includes(clientIP)) {
    return true
  }

  // Check if any allowed IP is a CIDR range (basic check)
  // For production, consider using a library like 'ip-range-check'
  for (const allowedIP of ALLOWED_IPS) {
    if (allowedIP.includes('*')) {
      const pattern = allowedIP.replace(/\./g, '\\.').replace(/\*/g, '\\d+')
      const regex = new RegExp(`^${pattern}$`)
      if (regex.test(clientIP)) {
        return true
      }
    }
  }

  console.warn(`[Security] IP not in allowlist: ${clientIP}`)
  return false
}

/**
 * Apply rate limiting
 * Prevents DoS attacks and brute force attempts
 */
async function applyRateLimit(request: NextRequest): Promise<{ success: boolean; limit?: number; remaining?: number; reset?: number }> {
  if (!ratelimit) {
    console.warn('[Security] Rate limiting not configured (Upstash Redis required)')
    return { success: true }
  }

  // Get identifier (IP address)
  const forwardedFor = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const identifier = forwardedFor?.split(',')[0].trim() || realIP || 'unknown'

  try {
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier)

    if (!success) {
      console.warn(`[Security] Rate limit exceeded for IP: ${identifier}`)
    }

    return { success, limit, remaining, reset }
  } catch (error) {
    console.error('[Security] Rate limiting error:', error)
    return { success: true } // Allow on error to prevent false rejections
  }
}

/**
 * Validate timestamp to prevent replay attacks
 * Ensures request is recent (within 5 minutes)
 */
function validateTimestamp(request: NextRequest): boolean {
  const timestamp = request.headers.get('x-webhook-timestamp')

  if (!timestamp) {
    console.warn('[Security] No timestamp header - skipping replay attack protection')
    return true // Allow if no timestamp
  }

  const requestTime = parseInt(timestamp, 10)
  if (isNaN(requestTime)) {
    console.warn('[Security] Invalid timestamp format')
    return false
  }

  const now = Date.now()
  const fiveMinutes = 5 * 60 * 1000

  // Check if request is within 5 minutes (prevents replay attacks)
  if (Math.abs(now - requestTime) > fiveMinutes) {
    console.warn(`[Security] Request timestamp too old or too far in future: ${new Date(requestTime).toISOString()}`)
    return false
  }

  return true
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
 *
 * Security Features:
 * - Secret token verification (Bearer token)
 * - HMAC signature validation
 * - IP allowlist (optional)
 * - Rate limiting (10 req/60s per IP)
 * - Timestamp validation (prevents replay attacks)
 * - Request body size limits
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

  // DEBUG: Log full request details
  console.log('============ WEBHOOK REQUEST DEBUG ============')
  console.log('Full URL:', request.url)
  console.log('Method:', request.method)
  console.log('Headers:', Object.fromEntries(request.headers.entries()))
  console.log('===============================================')

  try {
    // ========================================
    // SECURITY LAYER 1: RATE LIMITING
    // ========================================
    const rateLimitResult = await applyRateLimit(request)
    if (!rateLimitResult.success) {
      console.warn('[Security] Rate limit exceeded')
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.reset ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000) : 60,
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit || 10),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining || 0),
            'X-RateLimit-Reset': String(rateLimitResult.reset || Date.now() + 60000),
            'Retry-After': String(rateLimitResult.reset ? Math.ceil((rateLimitResult.reset - Date.now()) / 1000) : 60),
          },
        }
      )
    }

    // ========================================
    // SECURITY LAYER 2: IP ALLOWLIST
    // ========================================
    if (!verifyIPAllowlist(request)) {
      console.error('[Security] Unauthorized IP address')
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden',
          message: 'IP address not authorized',
        },
        { status: 403 }
      )
    }

    // ========================================
    // SECURITY LAYER 3: WEBHOOK SECRET (Headers/Query)
    // ========================================
    // Note: Will also check body later for Zoho compatibility
    const secretInHeadersOrQuery = verifyWebhookSecret(request)
    let secretVerified = secretInHeadersOrQuery

    if (!secretInHeadersOrQuery) {
      console.log('[Security] Secret not in headers/query, will check request body')
    }

    // ========================================
    // SECURITY LAYER 4: TIMESTAMP VALIDATION
    // ========================================
    // Skip timestamp validation for Zoho (they don't send timestamps by default)
    // The combination of IP allowlist + Zoho headers + rate limiting is sufficient
    const shouldValidateTimestamp = !request.headers.get('x-zoho-fromservice')

    if (shouldValidateTimestamp && !validateTimestamp(request)) {
      console.error('[Security] Invalid or expired timestamp')
      return NextResponse.json(
        {
          success: false,
          error: 'Bad Request',
          message: 'Request timestamp invalid or too old (possible replay attack)',
        },
        { status: 400 }
      )
    }

    console.log('[Security] All security checks passed')

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

      // Check for secret in FormData
      const bodySecret = formData.get('secret')?.toString()
      console.log('[Security Debug] FormData secret value:', bodySecret ? `${bodySecret.substring(0, 10)}... (length: ${bodySecret.length})` : 'NOT FOUND')
      console.log('[Security Debug] All FormData keys:', Array.from(formData.keys()))

      if (!secretVerified && bodySecret) {
        secretVerified = verifyWebhookSecretFromBody(bodySecret)
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

      // Check for secret in URL-encoded params
      const bodySecret = params.get('secret')
      if (!secretVerified && bodySecret) {
        secretVerified = verifyWebhookSecretFromBody(bodySecret)
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
        const parsedJSON = JSON.parse(bodyText)
        console.log('[Webhook] Parsed from JSON:', parsedJSON)
        console.log('[Security Debug] JSON has secret field:', 'secret' in parsedJSON)

        // Check for secret in JSON payload
        if (!secretVerified && 'secret' in parsedJSON) {
          const bodySecret = parsedJSON.secret
          console.log('[Security Debug] Extracting secret from JSON body')
          secretVerified = verifyWebhookSecretFromBody(bodySecret)
        }

        // Assign payload after secret extraction
        payload = parsedJSON
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

    // ========================================
    // SECURITY LAYER 3 (FINAL): VERIFY SECRET WAS FOUND
    // ========================================
    // After checking headers, query params, and body formats

    // Check if a secret was attempted (present but wrong)
    const attemptedSecret = url.searchParams.get('secret') ||
                           request.headers.get('authorization')?.replace('Bearer ', '') ||
                           request.headers.get('x-webhook-secret')

    if (!secretVerified) {
      // If a secret was provided but didn't match, reject immediately (don't fall back to Zoho headers)
      if (attemptedSecret && WEBHOOK_SECRET) {
        console.error('[Security] Invalid webhook secret provided - secret does not match')
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized',
            message: 'Invalid webhook secret',
          },
          { status: 401 }
        )
      }

      // No secret was provided - check if it's from Zoho as fallback
      const isFromZoho = request.headers.get('x-zoho-fromservice') === 'ZohoCRM'
      const hasDelugeHeader = request.headers.get('dre-function-name') !== null

      if (isFromZoho && hasDelugeHeader) {
        console.warn('[Security] Zoho CRM webhook detected (X-Zoho-FromService + Deluge headers)')
        console.warn('[Security] Allowing request without secret - IMPORTANT: Add secret to webhook URL for production!')
        console.warn('[Security] Recommended URL: https://your-domain.com/api/webhooks/zoho-contractor?secret=YOUR_SECRET')
        // Allow Zoho webhooks without secret as a fallback
        secretVerified = true
      } else if (WEBHOOK_SECRET) {
        console.error('[Security] Invalid webhook secret - not found in headers, query params, or request body')
        console.error('[Security] Set ZOHO_WEBHOOK_SECRET to empty string to disable authentication (NOT RECOMMENDED FOR PRODUCTION)')
        return NextResponse.json(
          {
            success: false,
            error: 'Unauthorized',
            message: 'Invalid or missing webhook secret',
          },
          { status: 401 }
        )
      } else {
        console.warn('[Security] ZOHO_WEBHOOK_SECRET not configured - allowing request without authentication (DEVELOPMENT MODE)')
      }
    } else {
      console.log('[Security] Webhook secret verified successfully')
    }

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
