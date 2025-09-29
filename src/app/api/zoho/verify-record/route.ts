import { NextResponse } from 'next/server';

/**
 * GET /api/zoho/verify-record?id=RECORD_ID
 * Verify that a record was created with all fields populated
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const recordId = searchParams.get('id');

    if (!recordId) {
      return NextResponse.json({
        success: false,
        error: 'Record ID is required'
      }, { status: 400 });
    }

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

    // Retrieve the record from Contacts module
    const response = await fetch(`${process.env.ZOHO_CRM_API_URL}/Contacts/${recordId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Zoho-oauthtoken ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to retrieve record: ${response.status}`);
    }

    const result = await response.json();
    const record = result.data?.[0];

    if (!record) {
      throw new Error('Record not found');
    }

    // Check which profile fields are populated
    const profileFields = {
      'Name': record.Name,
      'Email': record.Email,
      'Mobile': record.Mobile,
      'Title_Role': record.Title_Role,
      'Services_Offered': record.Services_Offered,
      'Years_of_Experience': record.Years_of_Experience,
      'A_Fun_Fact_About_Yourself': record.A_Fun_Fact_About_Yourself,
      'Hobbies_and_or_Interests': record.Hobbies_and_or_Interests,
      'What_Makes_Your_Business_Unique': record.What_Makes_Your_Business_Unique,
      'Why_Do_You_Enjoy_Your_Work': record.Why_Do_You_Enjoy_Your_Work,
      'Additional_Information': record.Additional_Information,
      'Qualifications_and_Certifications': record.Qualifications_and_Certifications,
      'Do_you_drive_and_have_access_to_vehicle': record.Do_you_drive_and_have_access_to_vehicle,
      'Photo_Submission': record.Photo_Submission
    };

    const populatedFields = Object.entries(profileFields).filter(([key, value]) =>
      value !== null && value !== undefined && value !== '' && value !== []
    );

    const emptyFields = Object.entries(profileFields).filter(([key, value]) =>
      value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)
    );

    return NextResponse.json({
      success: true,
      recordId,
      message: `Record retrieved successfully - ${populatedFields.length}/${Object.keys(profileFields).length} fields populated`,
      profileFields,
      populatedFields: populatedFields.map(([key, value]) => ({ field: key, value })),
      emptyFields: emptyFields.map(([key]) => key),
      fullRecord: record
    });

  } catch (error) {
    console.error('❌ Record verification failed:', error);
    return NextResponse.json({
      success: false,
      error: 'Record verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}