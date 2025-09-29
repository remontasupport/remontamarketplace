import { NextRequest, NextResponse } from 'next/server';
import { zohoCRMService } from '@/lib/services/zoho-crm';

/**
 * POST /api/zoho/test-contractor
 * Test creating a sample contractor record in Zoho CRM
 */
export async function POST() {
  try {
    // Get access token
    const storedRefreshToken = process.env.ZOHO_REFRESH_TOKEN;

    if (!storedRefreshToken) {
      return NextResponse.json(
        {
          error: 'No refresh token available',
          message: 'Please complete Zoho authorization first'
        },
        { status: 401 }
      );
    }

    // Refresh the access token
    const refreshedTokens = await zohoCRMService.refreshAccessToken(storedRefreshToken);
    const accessToken = refreshedTokens.access_token;

    // Create test contractor data
    const testContractorData = {
      firstName: 'Test',
      lastName: 'Contractor',
      email: 'test.contractor@localaid.com.au',
      mobile: '0412345678',
      location: 'Sydney, NSW',
      services: ['Personal Care', 'Household Tasks'],
      experience: '2 years',
      availability: 'Weekdays',
      startDate: '2024-01-15',
      qualifications: 'Certificate III in Individual Support, First Aid Certificate',
      hasVehicle: 'yes',
      consentProfileShare: true,
      consentMarketing: true,
      photos: [] // No photos for test
    };

    // Create contractor in CRM
    const result = await zohoCRMService.createContractor(testContractorData, accessToken);

    return NextResponse.json({
      success: true,
      message: 'Test contractor created successfully in Contractors module',
      data: result,
      testData: testContractorData
    });

  } catch (error) {
    console.error('Error creating test contractor:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create test contractor',
        details: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check if field names match your Contractors module fields'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/zoho/test-contractor
 * Get information about testing the contractor creation
 */
export async function GET() {
  return NextResponse.json({
    message: 'Use POST to create a test contractor record',
    instructions: [
      '1. Send a POST request to this endpoint',
      '2. It will create a test contractor record in your Contractors module',
      '3. Check the response to see if field mapping is correct',
      '4. If fields fail, update the field names in zoho-crm.ts'
    ],
    testData: {
      firstName: 'Test',
      lastName: 'Contractor',
      email: 'test.contractor@localaid.com.au',
      mobile: '0412345678',
      location: 'Sydney, NSW',
      services: ['Personal Care', 'Household Tasks'],
      experience: '2 years',
      qualifications: 'Certificate III in Individual Support'
    }
  });
}