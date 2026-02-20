/**
 * Zoho CRM Service — ZohoService Singleton
 *
 * Handles all Zoho CRM API interactions including:
 * - Automatic OAuth2 token refresh (refresh_token grant)
 * - Fetching Leads by stage from the Zoho Leads module
 *
 * Australian data center:
 *   Accounts: https://accounts.zoho.com.au
 *   API:      https://www.zohoapis.com.au/crm/v2
 */

// ============================================
// TYPES
// ============================================

interface ZohoTokenResponse {
  access_token: string
  expires_in: number
  token_type: string
  error?: string
}

/**
 * Raw Zoho Lead record.
 * We keep this open (Record<string, unknown>) so the test endpoint
 * returns the full unfiltered response — useful for discovering all
 * available field names before we lock down the mapping.
 */
export type ZohoLead = Record<string, unknown>

interface ZohoLeadsResponse {
  data?: ZohoLead[]
  info?: {
    more_records: boolean
    page: number
    per_page: number
    count: number
  }
  status?: string   // Zoho returns "error" here on failure
  code?: string
  message?: string
}

// ============================================
// SERVICE CLASS
// ============================================

class ZohoService {
  // In-memory token cache — survives across requests in a single serverless instance
  private accessToken: string | null = null
  private tokenExpiryTime: number | null = null

  // Read env vars lazily (safe for Next.js edge/serverless)
  private get clientId()     { return process.env.ZOHO_CLIENT_ID! }
  private get clientSecret() { return process.env.ZOHO_CLIENT_SECRET! }
  private get refreshToken() { return process.env.ZOHO_REFRESH_TOKEN! }
  private get accountsUrl()  { return process.env.ZOHO_ACCOUNTS_URL! }
  private get apiUrl()       { return process.env.ZOHO_CRM_API_URL! }

  // ============================================
  // TOKEN MANAGEMENT
  // ============================================

  /**
   * Returns a valid Zoho access token.
   * Uses cached token if still valid; otherwise refreshes automatically.
   * Token is treated as expired 5 minutes early to avoid race conditions.
   */
  async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (
      this.accessToken &&
      this.tokenExpiryTime &&
      Date.now() < this.tokenExpiryTime
    ) {
      return this.accessToken
    }

    // Build refresh request as query params (Zoho requirement for AU data center)
    const params = new URLSearchParams({
      refresh_token: this.refreshToken,
      client_id:     this.clientId,
      client_secret: this.clientSecret,
      grant_type:    'refresh_token',
    })

    const response = await fetch(
      `${this.accountsUrl}/oauth/v2/token?${params}`,
      { method: 'POST' }
    )

    const data: ZohoTokenResponse = await response.json()

    if (!data.access_token) {
      throw new Error(
        `Zoho token refresh failed — ${data.error ?? 'unknown error'}. ` +
        `Check ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, and ZOHO_REFRESH_TOKEN in .env.local`
      )
    }

    this.accessToken = data.access_token
    // Expire 5 minutes early for safety
    this.tokenExpiryTime = Date.now() + (data.expires_in - 300) * 1000

    return this.accessToken
  }

  // ============================================
  // LEADS — FETCH BY STAGE
  // ============================================

  /**
   * Fetches all Leads from Zoho CRM where Lead_Status equals the given stage.
   *
   * NOTE: Zoho Leads use `Lead_Status` as the standard status field.
   * If your Zoho instance has a *custom* field named "Stage", swap the
   * criteria field name to match (e.g., `Stage`, `Stage__s`, etc.).
   * You will see the correct API field names in the raw Postman response.
   *
   * @param stage - The stage value to filter on, e.g. "Recruitment End"
   * @returns Array of raw Zoho Lead records (paginated automatically)
   */
  async getLeadsByStage(stage: string): Promise<ZohoLead[]> {
    const token = await this.getAccessToken()
    const allLeads: ZohoLead[] = []
    let page = 1
    let moreRecords = true

    // Zoho search criteria syntax: (field:operator:value)
    // Using Lead_Status — the standard Zoho Leads stage field.
    // If this returns 0 results, check the raw field names in the response
    // and update this criteria to match your custom field.
    const criteria = encodeURIComponent(`(Lead_Status:equals:${stage})`)

    while (moreRecords) {
      const url = `${this.apiUrl}/Leads/search?criteria=${criteria}&page=${page}&per_page=200`

      const response = await fetch(url, {
        headers: {
          Authorization: `Zoho-oauthtoken ${token}`,
        },
      })

      // 204 = no records found for this criteria
      if (response.status === 204) {
        break
      }

      if (!response.ok) {
        const errorBody = await response.text()
        throw new Error(
          `Zoho Leads API error ${response.status}: ${errorBody}`
        )
      }

      const data: ZohoLeadsResponse = await response.json()

      // Handle Zoho-level errors (returned as 200 with error body)
      if (data.status === 'error') {
        throw new Error(
          `Zoho API returned error — code: ${data.code}, message: ${data.message}`
        )
      }

      if (data.data) {
        allLeads.push(...data.data)
      }

      moreRecords = data.info?.more_records ?? false
      page++
    }

    return allLeads
  }

  /**
   * Fetches a single page of raw Leads (no stage filter) — useful for
   * inspecting what field names your Zoho instance exposes.
   *
   * @param perPage - Number of records to fetch (max 200)
   */
  async getRawLeads(perPage: number = 5): Promise<ZohoLeadsResponse> {
    const token = await this.getAccessToken()

    const url = `${this.apiUrl}/Leads?per_page=${perPage}&page=1`

    const response = await fetch(url, {
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
      },
    })

    if (response.status === 204) {
      return { data: [] }
    }

    if (!response.ok) {
      const errorBody = await response.text()
      throw new Error(`Zoho Leads API error ${response.status}: ${errorBody}`)
    }

    return response.json() as Promise<ZohoLeadsResponse>
  }
}

// ============================================
// SINGLETON EXPORT
// ============================================

export const zohoService = new ZohoService()
