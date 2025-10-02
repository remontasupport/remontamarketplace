// Zoho CRM API Integration Service

interface ZohoTokenResponse {
  access_token: string
  expires_in: number
  api_domain: string
  token_type: string
}

interface ZohoContact {
  id: string

  // Personal Details
  Name?: string
  First_Name?: string
  Last_Name?: string
  First_Name_1?: string
  Last_Name_1?: string
  Email?: string
  Phone?: string
  Phone_1?: string
  Date_of_Birth?: string
  Email_Address?: string

  // Address fields
  Street_Address?: string
  Street_Address_1?: string
  Address_Line_2?: string
  City?: string
  City_1?: string
  State?: string
  State_Region_Province?: string
  State_Region_Province_1?: string
  Postal_Zip_Code?: string
  Postal_Zip_Code_1?: string

  // Contractor Information
  Contractor_Name?: string
  Contractor_Owner?: string
  Contact_Number?: string
  Company_Lookup?: string
  Layout?: {
    name: string
    id: string
    display_label: string
  }

  // Service Information
  Primary_Service?: string
  Secondary_Service_s?: string[] | string
  MISC_service?: string[] | string

  // Custom fields - Add any additional fields from your Zoho setup
  Title?: string
  Company?: string
  Years_of_Experience?: number
  Skills?: string
  Specializations?: string
  Service_Areas?: string
  Rating?: number
  Review_Count?: number
  Is_Available?: boolean
  Is_Verified?: boolean
  Profile_Image?: string

  // ID and Qualifications
  Documents_Uploads?: string
  Qualifications_Uploads?: string
  Insurance_Uploads?: string

  // Worker Checks
  NDIS_Worker_Check1?: string
  Police_Check_1?: string
  Working_With_Children_Check_1?: string

  // NDIS Mandatory Training
  File_Upload?: string
  Infection_Control_Training?: string

  // Emergency Contact
  Emergency_Contact_1?: string
  Emergency_Contact_2?: string
  Phone_1?: string
  Phone_2?: string
  Email_2?: string
  Email_3?: string
  Relationship_to_you?: string
  Name?: string
  Clinic_Name?: string

  // Profile Submission
  Title_Role?: string
  Services_Offered?: string[] | string
  Qualifications_and_Certifications?: string
  Years_of_Experience?: number
  Language_Spoken?: string
  Do_you_drive_and_have_access_to_vehicle?: boolean | string | string[]
  A_Fun_Fact_About_Yourself?: string
  Hobbies_and_or_Interests?: string
  What_Makes_Your_Business_Unique?: string
  Why_Do_You_Enjoy_Your_Work?: string
  Additional_Information?: string
  Photo_Submission?: string
  Signature_2?: string
  Date_Signed_2?: string
}

interface ZohoContactsResponse {
  data: ZohoContact[]
  info: {
    per_page: number
    count: number
    page: number
    more_records: boolean
  }
}

class ZohoService {
  private accessToken: string | null = null
  private tokenExpiryTime: number | null = null

  private get accountsUrl(): string {
    return process.env.ZOHO_ACCOUNTS_URL || 'https://accounts.zoho.com.au'
  }

  private get apiUrl(): string {
    return process.env.ZOHO_CRM_API_URL || 'https://www.zohoapis.com.au/crm/v2'
  }

  private get refreshToken(): string {
    const token = process.env.ZOHO_REFRESH_TOKEN
    if (!token) throw new Error('ZOHO_REFRESH_TOKEN not configured')
    return token
  }

  private get clientId(): string {
    const id = process.env.ZOHO_CLIENT_ID
    if (!id) throw new Error('ZOHO_CLIENT_ID not configured')
    return id
  }

  private get clientSecret(): string {
    const secret = process.env.ZOHO_CLIENT_SECRET
    if (!secret) throw new Error('ZOHO_CLIENT_SECRET not configured')
    return secret
  }

  /**
   * Get a valid access token (refreshes if expired)
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && this.tokenExpiryTime && Date.now() < this.tokenExpiryTime) {
      return this.accessToken
    }

    // Refresh the token
    const params = new URLSearchParams({
      refresh_token: this.refreshToken,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'refresh_token',
    })

    const response = await fetch(`${this.accountsUrl}/oauth/v2/token?${params}`, {
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`Failed to refresh Zoho access token: ${response.statusText}`)
    }

    const data: ZohoTokenResponse = await response.json()
    this.accessToken = data.access_token
    // Set expiry time to 5 minutes before actual expiry for safety
    this.tokenExpiryTime = Date.now() + (data.expires_in - 300) * 1000

    return this.accessToken
  }

  /**
   * Fetch all contractors from Zoho CRM Contractors module
   */
  async getContractorContacts(): Promise<ZohoContact[]> {
    const token = await this.getAccessToken()
    const allContacts: ZohoContact[] = []
    let page = 1
    let moreRecords = true

    while (moreRecords) {
      const response = await fetch(
        `${this.apiUrl}/Contractors?page=${page}&per_page=200`,
        {
          headers: {
            Authorization: `Zoho-oauthtoken ${token}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch contractors: ${response.statusText}`)
      }

      const data: ZohoContactsResponse = await response.json()

      if (data.data) {
        allContacts.push(...data.data)
      }

      moreRecords = data.info?.more_records || false
      page++
    }

    return allContacts
  }

  /**
   * Fetch a single contractor by ID
   */
  async getContactById(contactId: string): Promise<ZohoContact | null> {
    const token = await this.getAccessToken()

    const response = await fetch(`${this.apiUrl}/Contractors/${contactId}`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`Failed to fetch contractor: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data?.[0] || null
  }
}

// Export a singleton instance
export const zohoService = new ZohoService()
