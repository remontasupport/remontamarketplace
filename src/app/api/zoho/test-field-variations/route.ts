import { NextResponse } from 'next/server';

/**
 * GET /api/zoho/test-field-variations
 * Test different field name variations to find working ones
 */
export async function GET() {
  try {
    console.log('🧪 Testing field name variations...');

    const storedRefreshToken = process.env.ZOHO_REFRESH_TOKEN;
    if (!storedRefreshToken) {
      throw new Error('No refresh token available');
    }

    // Get access token
    const tokenResponse = await fetch(`${process.env.ZOHO_ACCOUNTS_URL}/oauth/v2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: process.env.ZOHO_CLIENT_ID!,
        client_secret: process.env.ZOHO_CLIENT_SECRET!,
        refresh_token: storedRefreshToken,
      }),
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Test different field name variations
    const fieldVariations = [
      {
        name: "Variation 1: Simple names",
        data: {
          Name: "Test Variation 1",
          Email: "test1@example.com",
          Mobile: "0412345678",
          Title_Role: "Support Worker",
          Services_Offered: "Support Worker",
          Years_of_Experience: "2",
          Fun_Fact: "Test fun fact",
          Hobbies: "Test hobbies",
          Unique_Service: "Test unique",
          Why_Enjoy_Work: "Test why",
          Additional_Info: "Test additional",
          Qualifications: "Test qualifications",
          Vehicle_Access: "yes"
        }
      },
      {
        name: "Variation 2: CF prefixed (Custom Fields)",
        data: {
          Name: "Test Variation 2",
          Email: "test2@example.com",
          Mobile: "0412345679",
          CF_Title_Role: "Support Worker",
          CF_Services_Offered: "Support Worker",
          CF_Years_of_Experience: "2",
          CF_Fun_Fact: "Test fun fact",
          CF_Hobbies: "Test hobbies",
          CF_Unique_Service: "Test unique",
          CF_Why_Enjoy_Work: "Test why",
          CF_Additional_Info: "Test additional",
          CF_Qualifications: "Test qualifications",
          CF_Vehicle_Access: "yes"
        }
      },
      {
        name: "Variation 3: Numbers suffix",
        data: {
          Name: "Test Variation 3",
          Email: "test3@example.com",
          Mobile: "0412345680",
          Title_Role1: "Support Worker",
          Services_Offered1: "Support Worker",
          Years_of_Experience1: "2",
          Fun_Fact1: "Test fun fact",
          Hobbies1: "Test hobbies",
          Unique_Service1: "Test unique",
          Why_Enjoy_Work1: "Test why",
          Additional_Info1: "Test additional",
          Qualifications1: "Test qualifications",
          Vehicle_Access1: "yes"
        }
      },
      {
        name: "Variation 4: Compact names",
        data: {
          Name: "Test Variation 4",
          Email: "test4@example.com",
          Mobile: "0412345681",
          Title: "Support Worker",
          Services: "Support Worker",
          Experience: "2",
          FunFact: "Test fun fact",
          Hobbies: "Test hobbies",
          UniqueService: "Test unique",
          WhyEnjoyWork: "Test why",
          AdditionalInfo: "Test additional",
          Qualifications: "Test qualifications",
          VehicleAccess: "yes"
        }
      }
    ];

    const results = [];

    for (const variation of fieldVariations) {
      try {
        console.log(`Testing ${variation.name}...`);

        const response = await fetch(`${process.env.ZOHO_CRM_API_URL}/Contractors`, {
          method: 'POST',
          headers: {
            'Authorization': `Zoho-oauthtoken ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ data: [variation.data] }),
        });

        const result = await response.json();

        results.push({
          variation: variation.name,
          success: result.data?.[0]?.status === 'success',
          recordId: result.data?.[0]?.details?.id || null,
          response: result,
          fieldData: variation.data
        });

        console.log(`${variation.name} result:`, result.data?.[0]?.status);

        // If successful, try to retrieve the record to see which fields were actually populated
        if (result.data?.[0]?.status === 'success' && result.data?.[0]?.details?.id) {
          const recordId = result.data[0].details.id;

          try {
            const retrieveResponse = await fetch(`${process.env.ZOHO_CRM_API_URL}/Contractors/${recordId}`, {
              method: 'GET',
              headers: {
                'Authorization': `Zoho-oauthtoken ${accessToken}`,
              },
            });

            if (retrieveResponse.ok) {
              const recordData = await retrieveResponse.json();
              results[results.length - 1].retrievedRecord = recordData.data?.[0] || null;
            }
          } catch (retrieveError) {
            console.log(`Could not retrieve record ${recordId}:`, retrieveError);
          }
        }

      } catch (error) {
        results.push({
          variation: variation.name,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Field variation testing completed',
      results,
      summary: results.map(r => ({
        variation: r.variation,
        success: r.success,
        recordId: r.recordId,
        hasRetrievedData: !!r.retrievedRecord,
        populatedFields: r.retrievedRecord ? Object.keys(r.retrievedRecord).filter(key =>
          r.retrievedRecord[key] &&
          r.retrievedRecord[key] !== '' &&
          !['id', 'Created_Time', 'Modified_Time', 'Created_By', 'Modified_By', 'Owner'].includes(key)
        ) : []
      }))
    });

  } catch (error) {
    console.error('❌ Field variation testing failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Field variation testing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}