/**
 * Worker Photo Upload API Endpoint
 *
 * Uploads a worker photo to Vercel Blob storage for a signed-in screen (the admin photo picker)
 * Returns the Blob URL
 *
 * POST /api/upload/worker-photo
 */

import { NextResponse } from 'next/server';
import { uploadWorkerPhoto, generateFileName, validateImageFile } from '@/lib/blobStorage';
import { signInRequired } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    // Sign-in required (2026-11-20): anyone could upload to the production Blob store. The sign-up uploads through
    // apps/api; this route serves signed-in screens only (the admin photo picker, PhotoUpload's default).
    const denied = await signInRequired();
    if (denied) return denied;


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
