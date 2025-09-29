import { NextResponse } from 'next/server';
import { zohoCRMService } from '@/lib/services/zoho-crm';

/**
 * GET /api/zoho/get-fields
 * Get actual API field names for Contractors module
 */
export async function GET() {
  try {
    console.log('🔍 Getting Contractors module fields...');

    // Get access token
    const storedRefreshToken = process.env.ZOHO_REFRESH_TOKEN;
    if (!storedRefreshToken) {
      throw new Error('No refresh token available');
    }

    const refreshedTokens = await zohoCRMService.refreshAccessToken(storedRefreshToken);
    console.log('✅ Token refresh successful');

    // Get fields for Contractors module
    const response = await fetch(`${process.env.ZOHO_CRM_API_URL}/settings/fields?module=Contractors`, {
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${refreshedTokens.access_token}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Fields API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });

      // If we get oauth scope error, try without the settings API
      if (errorText.includes('OAUTH_SCOPE_MISMATCH')) {
        return NextResponse.json({
          success: false,
          error: 'OAuth scope mismatch - cannot access fields API',
          message: 'Need to try direct record creation to determine field names',
          recommendation: 'Use field trial and error approach'
        });
      }

      throw new Error(`Failed to get fields: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();

    // Filter to show only the fields that might be relevant
    const relevantFields = result.fields?.filter((field: any) =>
      field.display_label?.toLowerCase().includes('fun') ||
      field.display_label?.toLowerCase().includes('hobby') ||
      field.display_label?.toLowerCase().includes('hobbies') ||
      field.display_label?.toLowerCase().includes('unique') ||
      field.display_label?.toLowerCase().includes('enjoy') ||
      field.display_label?.toLowerCase().includes('why') ||
      field.display_label?.toLowerCase().includes('additional') ||
      field.display_label?.toLowerCase().includes('service') ||
      field.display_label?.toLowerCase().includes('experience') ||
      field.display_label?.toLowerCase().includes('qualification') ||
      field.display_label?.toLowerCase().includes('vehicle') ||
      field.display_label?.toLowerCase().includes('photo') ||
      field.display_label?.toLowerCase().includes('title') ||
      field.display_label?.toLowerCase().includes('role')
    ) || [];

    return NextResponse.json({
      success: true,
      message: 'Retrieved Contractors module fields',
      data: {
        relevantFields: relevantFields.map((field: any) => ({
          api_name: field.api_name,
          display_label: field.display_label,
          data_type: field.data_type,
          required: field.required
        })),
        totalFields: result.fields?.length || 0,
        allFields: result.fields?.map((field: any) => ({
          api_name: field.api_name,
          display_label: field.display_label,
          data_type: field.data_type
        })) || []
      }
    });

  } catch (error) {
    console.error('❌ Failed to get fields:', error);

    return NextResponse.json({
      success: false,
      error: 'Failed to get fields',
      details: error instanceof Error ? error.message : 'Unknown error',
      recommendation: 'Try using common API field naming patterns'
    }, { status: 500 });
  }
}