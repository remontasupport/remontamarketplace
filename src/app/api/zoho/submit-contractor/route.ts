import { NextRequest, NextResponse } from 'next/server';
import { zohoCRMService } from '@/lib/services/zoho-crm';

/**
 * POST /api/zoho/submit-contractor
 * Submits contractor registration data to Zoho CRM
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📥 Received contractor registration request');
    const formData = await request.formData();

    // Extract contractor data from form
    const contractorData = {
      firstName: formData.get('firstName') as string,
      lastName: formData.get('lastName') as string,
      email: formData.get('email') as string,
      mobile: formData.get('mobile') as string,
      location: formData.get('location') as string,
      services: JSON.parse(formData.get('services') as string || '[]'),
      experience: formData.get('experience') as string || '',
      availability: formData.get('availability') as string || '',
      startDate: formData.get('startDate') as string || '',
      funFact: formData.get('funFact') as string || '',
      hobbies: formData.get('hobbies') as string || '',
      uniqueService: formData.get('uniqueService') as string || '',
      whyEnjoyWork: formData.get('whyEnjoyWork') as string || '',
      additionalInfo: formData.get('additionalInfo') as string || '',
      qualifications: formData.get('qualifications') as string,
      hasVehicle: formData.get('hasVehicle') as string,
      consentProfileShare: formData.get('consentProfileShare') === 'true',
      consentMarketing: formData.get('consentMarketing') === 'true',
      photos: [] as File[]
    };

    console.log('📋 Extracted contractor data:', {
      ...contractorData,
      photos: `${contractorData.photos.length} files`
    });

    // Extract photos
    const photoFiles: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('photo_') && value instanceof File) {
        photoFiles.push(value);
      }
    }
    contractorData.photos = photoFiles;

    console.log(`📸 Found ${photoFiles.length} photos to upload`);

    // Validate required fields
    if (!contractorData.firstName || !contractorData.lastName || !contractorData.email) {
      throw new Error('Missing required fields: firstName, lastName, or email');
    }

    // Get access token (you'll need to implement token storage/refresh)
    console.log('🔑 Getting Zoho access token...');
    const accessToken = await getValidAccessToken();
    console.log('✅ Access token obtained successfully');

    // Create contractor in Zoho CRM
    const crmResult = await zohoCRMService.createContractor(contractorData, accessToken);

    if (crmResult.data && crmResult.data[0]?.status === 'success') {
      const recordId = crmResult.data[0].details.id;

      // Upload photos if any
      let attachmentResults = [];
      if (contractorData.photos.length > 0) {
        try {
          attachmentResults = await zohoCRMService.uploadAttachments(
            recordId,
            contractorData.photos,
            accessToken
          );
        } catch (attachmentError) {
          console.error('Failed to upload attachments:', attachmentError);
          // Continue without failing the whole process
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Contractor registration submitted successfully to Zoho CRM',
        data: {
          crmRecordId: recordId,
          attachmentsUploaded: attachmentResults.length
        }
      });
    } else {
      throw new Error('Failed to create record in Zoho CRM');
    }

  } catch (error) {
    console.error('Error submitting to Zoho CRM:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to submit contractor registration to CRM',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Helper function to get a valid access token
 * In production, implement proper token storage and refresh logic
 */
async function getValidAccessToken(): Promise<string> {
  // For now, return the token from environment variables
  // In production, you should:
  // 1. Store tokens in your database
  // 2. Check if current token is expired
  // 3. Refresh token if needed
  // 4. Return valid access token

  const storedRefreshToken = process.env.ZOHO_REFRESH_TOKEN;

  if (!storedRefreshToken) {
    console.error('❌ No refresh token found in environment variables');
    throw new Error('No refresh token available. Please complete Zoho authorization first.');
  }

  try {
    console.log('🔄 Refreshing Zoho access token...');
    // Refresh the access token
    const refreshedTokens = await zohoCRMService.refreshAccessToken(storedRefreshToken);
    console.log('✅ Token refreshed successfully');
    return refreshedTokens.access_token;
  } catch (error) {
    console.error('❌ Failed to refresh token:', error);
    throw new Error(`Failed to refresh Zoho access token: ${error instanceof Error ? error.message : 'Unknown error'}. Please re-authorize.`);
  }
}