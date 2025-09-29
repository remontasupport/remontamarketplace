interface ZohoTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

interface ZohoRefreshTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface ContractorData {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  location: string;
  services: string[];
  experience?: string;
  availability?: string;
  startDate?: string;
  funFact?: string;
  hobbies?: string;
  uniqueService?: string;
  whyEnjoyWork?: string;
  additionalInfo?: string;
  qualifications: string;
  hasVehicle: string;
  photos: File[];
  consentProfileShare: boolean;
  consentMarketing?: boolean;
}

class ZohoCRMService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private baseUrl: string;
  private accountsUrl: string;

  constructor() {
    this.clientId = process.env.ZOHO_CLIENT_ID!;
    this.clientSecret = process.env.ZOHO_CLIENT_SECRET!;
    this.redirectUri = process.env.ZOHO_REDIRECT_URI!;
    this.baseUrl = process.env.ZOHO_CRM_API_URL!;
    this.accountsUrl = process.env.ZOHO_ACCOUNTS_URL!;
  }

  /**
   * Step 1: Generate authorization URL for initial setup
   */
  getAuthorizationUrl(): string {
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: this.clientId,
      scope: 'ZohoCRM.modules.ALL,ZohoCRM.settings.modules.ALL,ZohoCRM.settings.fields.ALL',
      redirect_uri: this.redirectUri,
      access_type: 'offline',
      prompt: 'consent'
    });

    return `${this.accountsUrl}/oauth/v2/auth?${params.toString()}`;
  }

  /**
   * Step 2: Exchange authorization code for tokens
   */
  async getAccessToken(authCode: string): Promise<ZohoTokenResponse> {
    const response = await fetch(`${this.accountsUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
        code: authCode,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get access token: ${error}`);
    }

    return response.json();
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<ZohoRefreshTokenResponse> {
    const response = await fetch(`${this.accountsUrl}/oauth/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: this.clientId,
        client_secret: this.clientSecret,
        refresh_token: refreshToken,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    return response.json();
  }

  /**
   * Create a contractor record in Zoho CRM
   */
  async createContractor(contractorData: ContractorData, accessToken: string): Promise<any> {
    console.log('Creating contractor with data:', contractorData);

    // Map form data to Zoho CRM Contractors module fields
    const zohoCRMData = {
      data: [
        {
          // Standard fields for Contacts module
          First_Name: contractorData.firstName,
          Last_Name: contractorData.lastName,
          Email: contractorData.email,
          Mobile: contractorData.mobile,

          // Custom fields mapped to actual Zoho CRM API field names (from retrieved record)
          Title_Role: contractorData.services.length > 0 ? contractorData.services[0] : '',
          Location: contractorData.location,
          Services_Offered: contractorData.services.join(', '),
          Years_of_Experience: contractorData.experience || '',
          Weekly_Availability: contractorData.availability || '',
          Preferred_Start_Date: contractorData.startDate || '',
          A_Fun_Fact_About_Yourself: contractorData.funFact || '',
          Hobbies_and_or_Interests: contractorData.hobbies || '',
          What_Makes_Your_Business_Unique: contractorData.uniqueService || '',
          Why_Do_You_Enjoy_Your_Work: contractorData.whyEnjoyWork || '',
          Additional_Information: contractorData.additionalInfo || '',
          Qualifications_and_Certifications: contractorData.qualifications,
          Do_you_drive_and_have_access_to_vehicle: [contractorData.hasVehicle],
          Photo_Submission: contractorData.photos.length > 0 ? `${contractorData.photos.length}` : '0',
          Profile_Sharing_Consent: contractorData.consentProfileShare,
          Marketing_Consent: contractorData.consentMarketing || false,

          // Additional tracking fields
          Client_Type: 'Contact',
          Coordinator: false,
          Registration_Source: 'LocalAid Website',
          Registration_Date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
          Status: 'New Application',
          Description: `New contractor registration from LocalAid platform.\nServices: ${contractorData.services.join(', ')}\nQualifications: ${contractorData.qualifications}\n${contractorData.uniqueService ? '\nUnique Service: ' + contractorData.uniqueService : ''}${contractorData.funFact ? '\nFun Fact: ' + contractorData.funFact : ''}`,
        }
      ]
    };

    console.log('Sending to Zoho CRM:', JSON.stringify(zohoCRMData, null, 2));

    // Submit to Contacts module with Contractor layout
    const response = await fetch(`${this.baseUrl}/Contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(zohoCRMData),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Zoho CRM API Error Response:', error);
      throw new Error(`Failed to create contractor in CRM: ${response.status} ${response.statusText} - ${error}`);
    }

    const result = await response.json();
    console.log('Zoho CRM API Success Response:', result);
    return result;
  }

  /**
   * Upload contractor photos as attachments to Contractors module
   */
  async uploadAttachments(recordId: string, photos: File[], accessToken: string): Promise<any[]> {
    const uploadPromises = photos.map(async (photo, index) => {
      const formData = new FormData();
      formData.append('file', photo);
      formData.append('type', 'profile_photo');

      // Upload to Contacts module with Contractor layout
      const response = await fetch(`${this.baseUrl}/Contacts/${recordId}/Attachments`, {
        method: 'POST',
        headers: {
          'Authorization': `Zoho-oauthtoken ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        console.error(`Failed to upload photo ${index + 1}:`, await response.text());
        return null;
      }

      return response.json();
    });

    const results = await Promise.allSettled(uploadPromises);
    return results
      .filter((result): result is PromiseFulfilledResult<any> => result.status === 'fulfilled')
      .map(result => result.value)
      .filter(Boolean);
  }

  /**
   * Get CRM modules and fields (for debugging/setup)
   */
  async getModules(accessToken: string): Promise<any> {
    console.log(`Making request to: ${this.baseUrl}/settings/modules`);
    const response = await fetch(`${this.baseUrl}/settings/modules`, {
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Zoho modules API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Failed to get modules: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response.json();
  }

  /**
   * Get fields for a specific module
   */
  async getModuleFields(moduleName: string, accessToken: string): Promise<any> {
    const response = await fetch(`${this.baseUrl}/settings/fields?module=${moduleName}`, {
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get fields for module: ${moduleName}`);
    }

    return response.json();
  }
}

export const zohoCRMService = new ZohoCRMService();
export type { ContractorData, ZohoTokenResponse };