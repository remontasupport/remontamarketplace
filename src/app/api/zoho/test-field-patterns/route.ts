import { NextResponse } from 'next/server';
import { zohoCRMService } from '@/lib/services/zoho-crm';

/**
 * GET /api/zoho/test-field-patterns
 * Test different field naming patterns to find the correct ones
 */
export async function GET() {
  try {
    console.log('🧪 Testing different field naming patterns...');

    const storedRefreshToken = process.env.ZOHO_REFRESH_TOKEN;
    if (!storedRefreshToken) {
      throw new Error('No refresh token available');
    }

    const refreshedTokens = await zohoCRMService.refreshAccessToken(storedRefreshToken);

    // Test different field naming patterns
    const testPatterns = [
      {
        name: "Pattern 1: Exact Display Names",
        data: {
          Name: "Test Pattern 1",
          Email: "test1@example.com",
          Mobile: "0412345678",
          "Title/Role": "Support Worker",
          "Services Offered": "Support Worker",
          "Years of Experience": "2",
          "A Fun Fact About Yourself": "Test fun fact",
          "Hobbies and/or Interests": "Test hobbies",
          "What Makes Your Business Unique": "Test unique service",
          "Why Do You Enjoy Your Work?": "Test why enjoy",
          "Additional Information": "Test additional info",
          "Qualifications and Certifications": "Test qualifications",
          "Do you drive and have access to vehicle?": "yes"
        }
      },
      {
        name: "Pattern 2: Underscore Format",
        data: {
          Name: "Test Pattern 2",
          Email: "test2@example.com",
          Mobile: "0412345679",
          Title_Role: "Support Worker",
          Services_Offered: "Support Worker",
          Years_of_Experience: "2",
          A_Fun_Fact_About_Yourself: "Test fun fact",
          Hobbies_and_or_Interests: "Test hobbies",
          What_Makes_Your_Business_Unique: "Test unique service",
          Why_Do_You_Enjoy_Your_Work: "Test why enjoy",
          Additional_Information: "Test additional info",
          Qualifications_and_Certifications: "Test qualifications",
          Do_you_drive_and_have_access_to_vehicle: "yes"
        }
      },
      {
        name: "Pattern 3: CamelCase Format",
        data: {
          Name: "Test Pattern 3",
          Email: "test3@example.com",
          Mobile: "0412345680",
          TitleRole: "Support Worker",
          ServicesOffered: "Support Worker",
          YearsOfExperience: "2",
          AFunFactAboutYourself: "Test fun fact",
          HobbiesAndOrInterests: "Test hobbies",
          WhatMakesYourBusinessUnique: "Test unique service",
          WhyDoYouEnjoyYourWork: "Test why enjoy",
          AdditionalInformation: "Test additional info",
          QualificationsAndCertifications: "Test qualifications",
          DoYouDriveAndHaveAccessToVehicle: "yes"
        }
      }
    ];

    const results = [];

    for (const pattern of testPatterns) {
      try {
        console.log(`Testing ${pattern.name}...`);

        const response = await fetch(`${process.env.ZOHO_CRM_API_URL}/Contractors`, {
          method: 'POST',
          headers: {
            'Authorization': `Zoho-oauthtoken ${refreshedTokens.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: [pattern.data] }),
        });

        const result = await response.json();

        results.push({
          pattern: pattern.name,
          success: result.data?.[0]?.status === 'success',
          response: result,
          fieldData: pattern.data
        });

        console.log(`${pattern.name} result:`, result.data?.[0]?.status);

      } catch (error) {
        results.push({
          pattern: pattern.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Field pattern testing completed',
      results,
      summary: results.map(r => ({
        pattern: r.pattern,
        success: r.success,
        status: r.response?.data?.[0]?.status || 'error',
        code: r.response?.data?.[0]?.code || 'unknown'
      }))
    });

  } catch (error) {
    console.error('❌ Field pattern testing failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Field pattern testing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}