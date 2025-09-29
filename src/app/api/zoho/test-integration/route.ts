import { NextResponse } from 'next/server';
import { zohoCRMService } from '@/lib/services/zoho-crm';

/**
 * GET /api/zoho/test-integration
 * Test the complete Zoho CRM integration
 */
export async function GET() {
  try {
    console.log('🧪 Testing Zoho CRM Integration...');

    // Step 1: Check environment variables
    const config = {
      clientId: process.env.ZOHO_CLIENT_ID || null,
      clientSecret: process.env.ZOHO_CLIENT_SECRET || null,
      redirectUri: process.env.ZOHO_REDIRECT_URI || null,
      accountsUrl: process.env.ZOHO_ACCOUNTS_URL || null,
      crmApiUrl: process.env.ZOHO_CRM_API_URL || null,
      refreshToken: process.env.ZOHO_REFRESH_TOKEN || null
    };

    const missingEnvVars = Object.entries(config)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingEnvVars.length > 0) {
      return NextResponse.json({
        success: false,
        error: 'Missing required environment variables',
        missing: missingEnvVars,
        message: 'Please set all required Zoho environment variables'
      }, { status: 400 });
    }

    // Step 2: Test token refresh
    console.log('🔑 Testing token refresh...');
    const refreshedTokens = await zohoCRMService.refreshAccessToken(config.refreshToken!);
    console.log('✅ Token refresh successful');

    // Step 3: Test getting modules
    console.log('📋 Testing module access...');
    const modules = await zohoCRMService.getModules(refreshedTokens.access_token);

    // Check if Contractors module exists
    const contractorsModule = modules.modules?.find((m: any) =>
      m.api_name === 'Contractors' || m.module_name === 'Contractors'
    );

    if (!contractorsModule) {
      return NextResponse.json({
        success: false,
        error: 'Contractors module not found in Zoho CRM',
        availableModules: modules.modules?.map((m: any) => ({
          name: m.module_name,
          api_name: m.api_name
        })) || [],
        message: 'You need to create a Contractors module in your Zoho CRM or use an existing module'
      }, { status: 404 });
    }

    // Step 4: Test getting Contractors module fields
    console.log('🏗️ Testing Contractors module fields...');
    const fields = await zohoCRMService.getModuleFields('Contractors', refreshedTokens.access_token);

    return NextResponse.json({
      success: true,
      message: 'Zoho CRM integration test successful',
      data: {
        tokenRefresh: '✅ Working',
        moduleAccess: '✅ Working',
        contractorsModule: {
          found: true,
          name: contractorsModule.module_name,
          api_name: contractorsModule.api_name
        },
        availableFields: fields.fields?.map((f: any) => ({
          api_name: f.api_name,
          display_label: f.display_label,
          data_type: f.data_type,
          required: f.required
        })) || [],
        recommendations: [
          'Your Zoho CRM integration is properly configured',
          'Test the contractor submission via /api/zoho/test-contractor',
          'Make sure field names in zoho-crm.ts match your actual CRM fields'
        ]
      }
    });

  } catch (error) {
    console.error('❌ Integration test failed:', error);

    return NextResponse.json({
      success: false,
      error: 'Integration test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      recommendations: [
        'Check your environment variables',
        'Verify your refresh token is still valid',
        'Ensure your Zoho app has proper permissions',
        'Check if Contractors module exists in your CRM'
      ]
    }, { status: 500 });
  }
}