/**
 * Worker Photo Upload API
 *
 * Handles photo uploads to Vercel Blob storage
 * Used during worker registration
 *
 * POST /api/upload/worker-photos
 */

import { NextResponse } from 'next/server';
import { uploadWorkerPhoto, generateFileName, validateImageFile } from '@/lib/blobStorage';

export async function POST(request: Request) {
  try {
    console.log('📸 Photo upload endpoint called');
    console.log('📍 Environment:', process.env.NODE_ENV);
    console.log('🔑 Blob token exists:', !!process.env.BLOB_READ_WRITE_TOKEN);

    console.log('📥 Parsing form data...');
    const formData = await request.formData();
    const files = formData.getAll('photos') as File[];
    const email = formData.get('email') as string; // Worker identifier

    console.log('📧 Email:', email);
    console.log('📷 Files count:', files.length);

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required for photo upload' },
        { status: 400 }
      );
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No photos provided' },
        { status: 400 }
      );
    }

    if (files.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 photos allowed' },
        { status: 400 }
      );
    }

    // Validate and upload photos
    const uploadedUrls: string[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file
      const validationError = validateImageFile(file);
      if (validationError) {
        errors.push(`Photo ${i + 1}: ${validationError}`);
        continue;
      }

      try {
        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Generate unique filename
        const fileName = generateFileName(
          file.name,
          email.split('@')[0], // Use email prefix as identifier
          'photo'
        );

        // Upload to Vercel Blob
        const url = await uploadWorkerPhoto(
          buffer,
          fileName,
          file.type,
          'workers'
        );

        uploadedUrls.push(url);
        console.log(`✅ Photo ${i + 1} uploaded:`, url);
      } catch (uploadError) {
        console.error(`❌ Failed to upload photo ${i + 1}:`, uploadError);
        errors.push(`Photo ${i + 1}: Upload failed`);
      }
    }

    // Return response
    if (uploadedUrls.length === 0) {
      return NextResponse.json(
        {
          error: 'All photo uploads failed',
          details: errors,
        },
        { status: 500 }
      );
    }

    if (errors.length > 0) {
      return NextResponse.json(
        {
          success: true,
          message: 'Some photos uploaded successfully',
          urls: uploadedUrls,
          warnings: errors,
        },
        { status: 207 } // Multi-Status
      );
    }

    return NextResponse.json({
      success: true,
      message: `${uploadedUrls.length} photo(s) uploaded successfully`,
      urls: uploadedUrls,
    });
  } catch (error: any) {
    console.error('❌ Photo upload error:', error);
    console.error('❌ Photo upload error details:', {
      message: error?.message,
      code: error?.code,
      stack: error?.stack,
      name: error?.name
    });

    return NextResponse.json(
      {
        error: 'Failed to upload photos',
        message: error?.message || 'Unknown error',
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
          stack: error?.stack
        })
      },
      { status: 500 }
    );
  }
}
