/**
 * Worker Registration API Endpoint
 *
 * Production-ready registration with:
 * - Password hashing (bcrypt)
 * - Duplicate email prevention
 * - Transaction safety
 * - Error handling
 * - Audit logging
 *
 * POST /api/auth/register
 *
 * Updated: 2025-10-22 - Added comprehensive logging for debugging
 */

import { NextResponse } from 'next/server';
import { authPrisma } from '@/lib/auth-prisma';
import { hashPassword } from '@/lib/password';
import { UserRole } from '@/types/auth';
import { geocodeWorkerLocation } from '@/lib/location-parser';
import { applyRateLimit, strictApiRateLimit } from '@/lib/ratelimit';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { uploadWorkerPhoto, generateFileName, validateImageFile } from '@/lib/blobStorage';

export async function POST(request: Request) {
  try {
    // Log that the function was called
    console.log('🚀 Registration endpoint called');
    console.log('📍 Environment:', process.env.NODE_ENV);
    console.log('🗄️ Database URL exists:', !!process.env.AUTH_DATABASE_URL || !!process.env.DATABASE_URL);

    // DEBUG: Return environment info in development
    if (process.env.NODE_ENV === 'development') {
      console.log('🔍 DEBUG MODE: Checking environment variables...');
    }

    // ============================================
    // RATE LIMITING (Security: Prevent spam/bot registrations)
    // ============================================
    try {
      const rateLimitResult = await applyRateLimit(request, strictApiRateLimit);
      if (!rateLimitResult.success) {
        console.log('⚠️ Rate limit exceeded');
        return rateLimitResult.response;
      }
      console.log('✅ Rate limit check passed');
    } catch (rateLimitError: any) {
      console.error('❌ Rate limit error:', rateLimitError);
      // Continue anyway - don't block registration if rate limit fails
    }

  try {
    console.log('📥 Parsing request body...');

    // Check if request is FormData (with photos) or JSON (without photos)
    const contentType = request.headers.get('content-type') || '';
    const isFormData = contentType.includes('multipart/form-data');

    let body: any = {};
    let photoFiles: File[] = [];

    if (isFormData) {
      // Parse FormData
      const formData = await request.formData();

      // Extract all non-file fields
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          photoFiles.push(value);
        } else {
          // Parse JSON fields (arrays, objects, booleans)
          try {
            body[key] = JSON.parse(value as string);
          } catch {
            // Keep as string if JSON.parse fails
            body[key] = value;
          }
        }
      }

      console.log('✅ FormData parsed successfully');
      console.log('📷 Photos to upload:', photoFiles.length);
    } else {
      // Parse JSON
      body = await request.json();
      console.log('✅ JSON body parsed successfully');
    }

    // Extract and validate data
    const {
      // Security
      recaptchaToken,

      // User credentials
      email,
      password,

      // Personal info
      firstName,
      lastName,
      mobile,

      // Worker details
      location,
      age,
      gender,
      genderIdentity,
      languages,
      services,
      supportWorkerCategories,
      experience,
      introduction,
      qualifications,
      hasVehicle,
      funFact,
      hobbies,
      uniqueService,
      whyEnjoyWork,
      additionalInfo,
      consentProfileShare,
      consentMarketing,
    } = body;

    // ============================================
    // RECAPTCHA VERIFICATION (Security: Prevent bot registrations)
    // ============================================

    if (recaptchaToken) {
      const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'register');
      if (!recaptchaResult.success) {
        return NextResponse.json(
          { error: 'reCAPTCHA verification failed. Please try again.' },
          { status: 400 }
        );
      }
      console.log('✅ reCAPTCHA verified:', { score: recaptchaResult.score });
    }

    // ============================================
    // VALIDATION
    // ============================================

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (!firstName || !lastName || !mobile) {
      return NextResponse.json(
        { error: 'First name, last name, and mobile are required' },
        { status: 400 }
      );
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // ============================================
    // CHECK FOR DUPLICATE EMAIL
    // ============================================

    const existingUser = await authPrisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 } // 409 Conflict
      );
    }

    // ============================================
    // HASH PASSWORD
    // ============================================

    const passwordHash = await hashPassword(password);

    // ============================================
    // UPLOAD PHOTOS TO VERCEL BLOB
    // ============================================

    let photoUrls: string[] = [];

    if (photoFiles.length > 0) {
      console.log(`📸 Uploading ${photoFiles.length} photos to Blob...`);

      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];

        // Validate file
        const validationError = validateImageFile(file);
        if (validationError) {
          console.error(`❌ Photo ${i + 1} validation failed:`, validationError);
          continue; // Skip invalid files
        }

        try {
          // Convert File to Buffer
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Generate unique filename
          const fileName = generateFileName(
            file.name,
            normalizedEmail.split('@')[0],
            'photo'
          );

          // Upload to Vercel Blob
          const url = await uploadWorkerPhoto(
            buffer,
            fileName,
            file.type,
            'workers'
          );

          photoUrls.push(url);
          console.log(`✅ Photo ${i + 1}/${photoFiles.length} uploaded:`, url);
        } catch (uploadError) {
          console.error(`❌ Failed to upload photo ${i + 1}:`, uploadError);
          // Continue with other photos even if one fails
        }
      }

      console.log(`✅ Uploaded ${photoUrls.length}/${photoFiles.length} photos successfully`);
    }

    // ============================================
    // GEOCODE WORKER LOCATION
    // ============================================

    let geocodedLocation: {
      city: string | null;
      state: string | null;
      postalCode: string | null;
      latitude: number | null;
      longitude: number | null;
    } = {
      city: null,
      state: null,
      postalCode: null,
      latitude: null,
      longitude: null,
    };

    if (location) {
      try {
        geocodedLocation = await geocodeWorkerLocation(location);
        console.log('✅ Location geocoded:', {
          location,
          latitude: geocodedLocation.latitude,
          longitude: geocodedLocation.longitude,
          city: geocodedLocation.city,
          state: geocodedLocation.state,
        });
      } catch (geocodeError) {
        console.error('⚠️ Geocoding failed:', geocodeError);
        // Don't fail registration if geocoding fails
        // Worker can still register, just won't have coordinates initially
      }
    }

    // ============================================
    // CREATE USER + WORKER PROFILE (TRANSACTION)
    // ============================================

    const user = await authPrisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        role: 'WORKER' as const,
        status: 'ACTIVE', // Active immediately
        updatedAt: new Date(),

        // Create worker profile in same transaction
        workerProfile: {
          create: {
            firstName,
            lastName,
            mobile,
            location,
            // Geocoded location data
            latitude: geocodedLocation.latitude,
            longitude: geocodedLocation.longitude,
            city: geocodedLocation.city,
            state: geocodedLocation.state,
            postalCode: geocodedLocation.postalCode,
            // Other worker data
            age,
            gender,
            genderIdentity,
            languages: languages || [],
            services: services || [],
            supportWorkerCategories: supportWorkerCategories || [],
            experience,
            introduction,
            qualifications,
            hasVehicle,
            funFact,
            hobbies,
            uniqueService,
            whyEnjoyWork,
            additionalInfo,
            // Photos: Array of Vercel Blob URLs stored as JSON
            // Use uploaded photo URLs if available, otherwise undefined
            photos: (photoUrls.length > 0) ? photoUrls : undefined,
            consentProfileShare: consentProfileShare || false,
            consentMarketing: consentMarketing || false,
            profileCompleted: true, // Registration form is complete
            isPublished: false, // Not published until verified
            verificationStatus: 'NOT_STARTED' as const, // Awaiting document upload
            updatedAt: new Date(),
          },
        },
      },
      include: {
        workerProfile: true,
      },
    });

    // Verify photos were saved
    console.log('✅ Worker created with photos:', {
      workerId: user.workerProfile?.id,
      photosInDb: user.workerProfile?.photos,
      photoCount: Array.isArray(user.workerProfile?.photos) ? user.workerProfile.photos.length : 0,
    });

    // ============================================
    // AUDIT LOG
    // ============================================

    await authPrisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'LOGIN_SUCCESS', // Registration counts as first action
        metadata: {
          registrationType: 'WORKER',
          emailSent: true,
        },
      },
    }).catch((error) => {
      // Don't fail if audit log fails
      console.error('Audit log error:', error);
    });

    // ============================================
    // SUCCESS RESPONSE
    // ============================================

    console.log('✅ Worker registered successfully:', {
      userId: user.id,
      email: normalizedEmail,
      role: user.role,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful! You can now log in.',
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          status: user.status,
        },
      },
      { status: 201 } // 201 Created
    );

  } catch (error: any) {
    console.error('❌ Registration error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack,
      name: error.name
    });

    // Handle Prisma unique constraint errors
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Return more detailed error info to help debug
    return NextResponse.json(
      {
        error: 'Registration failed',
        message: error?.message || 'Unknown error occurred',
        errorCode: error?.code,
        errorType: 'REGISTRATION_ERROR',
        timestamp: new Date().toISOString(),
        // Include more details in development
        ...(process.env.NODE_ENV === 'development' && {
          details: error?.message,
          stack: error?.stack,
          fullError: JSON.stringify(error, null, 2)
        })
      },
      { status: 500 }
    );
  }
  } catch (topLevelError: any) {
    // Catch any errors that happen before our main try-catch
    console.error('❌ TOP LEVEL ERROR in registration endpoint:', topLevelError);
    console.error('❌ TOP LEVEL ERROR details:', {
      message: topLevelError?.message,
      code: topLevelError?.code,
      stack: topLevelError?.stack,
      name: topLevelError?.name
    });

    // Always return detailed error to help debug
    return NextResponse.json(
      {
        error: 'Registration endpoint error',
        message: topLevelError?.message || 'Unknown error',
        errorType: 'TOP_LEVEL_ERROR',
        timestamp: new Date().toISOString(),
        ...(process.env.NODE_ENV === 'development' && {
          details: topLevelError?.message,
          code: topLevelError?.code,
          stack: topLevelError?.stack
        })
      },
      { status: 500 }
    );
  }
}
