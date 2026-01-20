/**
 * Certificate Upload API
 *
 * Handles certificate/document uploads to Vercel Blob storage
 * Accepts PDFs and images
 *
 * POST /api/upload/certificates
 */

import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth.config';
import { authPrisma } from '@/lib/auth-prisma';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

export async function POST(request: Request) {
  try {
    // 1. Authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const qualificationType = formData.get('qualificationType') as string;
    const serviceTitle = formData.get('serviceTitle') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!qualificationType || !serviceTitle) {
      return NextResponse.json(
        { error: 'Qualification type and service title are required' },
        { status: 400 }
      );
    }

    // 3. Validate file
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, JPG, PNG, WebP, and HEIC are allowed.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      );
    }

    // 4. Get worker profile
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!workerProfile) {
      return NextResponse.json({ error: 'Worker profile not found' }, { status: 404 });
    }

    // 5. Upload to Vercel Blob
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const blobPath = `certificates/${session.user.id}/${qualificationType}-${timestamp}-${sanitizedFileName}`;

    const blob = await put(blobPath, buffer, {
      access: 'public',
      contentType: file.type,
      addRandomSuffix: false,
    });



    // 6. Find or create VerificationRequirement
    let requirement = await authPrisma.verificationRequirement.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        requirementType: qualificationType,
      },
    });

    if (!requirement) {
      // Create new requirement if it doesn't exist
      requirement = await authPrisma.verificationRequirement.create({
        data: {
          workerProfileId: workerProfile.id,
          requirementType: qualificationType,
          requirementName: serviceTitle + ' - ' + qualificationType,
          isRequired: false,
          status: 'SUBMITTED',
          documentUrl: blob.url,
          documentUploadedAt: new Date(),
          submittedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } else {
      // Update existing requirement
      requirement = await authPrisma.verificationRequirement.update({
        where: { id: requirement.id },
        data: {
          documentUrl: blob.url,
          documentUploadedAt: new Date(),
          status: 'SUBMITTED',
          submittedAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }



    return NextResponse.json({
      success: true,
      url: blob.url,
      requirementId: requirement.id,
    });
  } catch (error: any) {

    return NextResponse.json(
      {
        error: 'Failed to upload certificate',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
