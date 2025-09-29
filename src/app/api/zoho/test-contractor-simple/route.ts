import { NextResponse } from 'next/server';
import { zohoCRMService } from '@/lib/services/zoho-crm';

/**
 * GET /api/zoho/test-contractor-simple
 * Test creating a contractor record directly without using settings API
 */
export async function GET() {
  try {
    console.log('🧪 Testing Contractor Creation...');

    // Step 1: Get access token
    const storedRefreshToken = process.env.ZOHO_REFRESH_TOKEN;
    if (!storedRefreshToken) {
      throw new Error('No refresh token available');
    }

    const refreshedTokens = await zohoCRMService.refreshAccessToken(storedRefreshToken);
    console.log('✅ Token refresh successful');

    // Step 2: Try to create a test contractor record
    const testContractorData = {
      firstName: 'Test',
      lastName: 'Contractor',
      email: 'test@example.com',
      mobile: '0412345678',
      location: 'Sydney, NSW 2000',
      services: ['Support Worker', 'Cleaning Services'],
      experience: '2',
      availability: '3-4-hrs',
      startDate: 'immediately',
      funFact: 'I once climbed Mount Everest!',
      hobbies: 'Rock climbing, reading, cooking',
      uniqueService: 'I provide multilingual support and have 24/7 availability',
      whyEnjoyWork: 'I love helping people achieve independence and seeing their progress',
      additionalInfo: 'Available for emergency calls and have medical training',
      qualifications: 'Certificate III in Individual Support',
      hasVehicle: 'yes',
      consentProfileShare: true,
      consentMarketing: true,
      photos: []
    };

    console.log('📝 Creating test contractor record...');
    const result = await zohoCRMService.createContractor(testContractorData, refreshedTokens.access_token);

    return NextResponse.json({
      success: true,
      message: 'Test contractor created successfully',
      data: {
        tokenRefresh: '✅ Working',
        contractorCreation: '✅ Working',
        crmResponse: result,
        recordId: result.data?.[0]?.details?.id || 'Unknown'
      }
    });

  } catch (error) {
    console.error('❌ Test contractor creation failed:', error);

    // Check if it's a specific Zoho error
    let errorMessage = error instanceof Error ? error.message : 'Unknown error';
    let recommendations = [];

    if (errorMessage.includes('OAUTH_SCOPE_MISMATCH')) {
      recommendations.push('OAuth scope mismatch - your app needs proper CRM permissions');
      recommendations.push('Re-authorize your app with the required scopes');
    } else if (errorMessage.includes('INVALID_MODULE')) {
      recommendations.push('Contractors module does not exist in your Zoho CRM');
      recommendations.push('Create a Contractors module or use an existing module like Leads');
    } else if (errorMessage.includes('MANDATORY_NOT_FOUND')) {
      recommendations.push('Some required fields are missing from the record');
      recommendations.push('Check your Contractors module required fields');
    } else {
      recommendations.push('Check your Zoho CRM configuration');
      recommendations.push('Verify your refresh token is valid');
    }

    return NextResponse.json({
      success: false,
      error: 'Test contractor creation failed',
      details: errorMessage,
      recommendations
    }, { status: 500 });
  }
}