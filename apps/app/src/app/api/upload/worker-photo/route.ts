/**
 * Worker Photo Upload API Endpoint
 *
 * Uploads worker photo to Vercel Blob storage before registration
 * Returns the Blob URL to be included in registration data
 *
 * POST /api/upload/worker-photo
 */

import { NextResponse } from 'next/server';
import { uploadWorkerPhoto, generateFileName, validateImageFile } from '@/lib/blobStorage';

export async function POST(request: Request) {
  try {


    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('photo') as File | null;
    const email = formData.get('email') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No photo provided' },
        { status: 400 }
      );
    }

    // Validate file
    const validationError = validateImageFile(file);
    if (validationError) {
      return NextResponse.json(
        { error: validationError },
        { status: 400 }
      );
    }

  

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Generate unique filename
    const userIdentifier = email ? email.split('@')[0] : `user-${Date.now()}`;
    const fileName = generateFileName(file.name, userIdentifier, 'photo');

    // Upload to Vercel Blob
    const url = await uploadWorkerPhoto(
      buffer,
      fileName,
      file.type,
      'workers'
    );

   

    return NextResponse.json(
      {
        success: true,
        url,
        fileName,
        size: file.size,
      },
      { status: 200 }
    );

  } catch (error: any) {
    

    return NextResponse.json(
      {
        error: 'Failed to upload photo',
        message: error?.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
