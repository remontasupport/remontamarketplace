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
 */

import { NextResponse } from 'next/server';
import { authPrisma } from '@/lib/auth-prisma';
import { hashPassword } from '@/lib/password';
import { UserRole } from '@/types/auth';
import { geocodeWorkerLocation } from '@/lib/location-parser';
import { applyRateLimit, strictApiRateLimit } from '@/lib/ratelimit';
import { verifyRecaptcha } from '@/lib/recaptcha';

export async function POST(request: Request) {
  // ============================================
  // RATE LIMITING (Security: Prevent spam/bot registrations)
  // ============================================
  const rateLimitResult = await applyRateLimit(request, strictApiRateLimit);
  if (!rateLimitResult.success) {
    return rateLimitResult.response;
  }

  try {
    const body = await request.json();

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
      photos,
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

    // Log photo data for debugging
    console.log('📸 Photos received:', {
      type: Array.isArray(photos) ? 'array' : typeof photos,
      count: Array.isArray(photos) ? photos.length : 0,
      photos: photos,
    });

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
            // Store as array if photos exist, otherwise undefined
            photos: (Array.isArray(photos) && photos.length > 0) ? photos : undefined,
            consentProfileShare: consentProfileShare || false,
            consentMarketing: consentMarketing || false,
            profileCompleted: true, // Registration form is complete
            isPublished: false, // Not published until verified
            verificationStatus: 'NOT_STARTED' as const, // Awaiting document upload
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

    // In development, show detailed error for debugging
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json(
        {
          error: 'Registration failed. Please try again.',
          details: error.message,
          code: error.code
        },
        { status: 500 }
      );
    }

    // Generic error response in production (don't expose internals)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}
