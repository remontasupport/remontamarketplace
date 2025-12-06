/**
 * Async Worker Registration API Endpoint
 *
 * Queue-based registration that handles 1000+ concurrent submissions
 *
 * Flow:
 * 1. User submits form → Instant response (202 Accepted)
 * 2. Job queued in database
 * 3. Background worker processes queue
 * 4. User receives confirmation email when complete
 *
 * POST /api/auth/register-async
 */

import { NextResponse } from 'next/server';
import { applyRateLimit, strictApiRateLimit } from '@/lib/ratelimit';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { queueWorkerRegistration, type WorkerRegistrationJobData } from '@/lib/queue';
import { geocodeWorkerLocation } from '@/lib/location-parser';

export async function POST(request: Request) {
  try {
    // ============================================
    // RATE LIMITING
    // ============================================
    try {
      const rateLimitResult = await applyRateLimit(request, strictApiRateLimit);
      if (!rateLimitResult.success) {
        return rateLimitResult.response;
      }
    } catch (rateLimitError: any) {
      // Continue anyway - don't block registration
    }

    // ============================================
    // PARSE REQUEST BODY
    // ============================================
    const body = await request.json();

    const {
      recaptchaToken,
      email,
      password,
      firstName,
      lastName,
      mobile,
      location,
      age,
      gender,
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
      photos,
    } = body;

    // ============================================
    // RECAPTCHA VERIFICATION
    // ============================================
    if (recaptchaToken) {
      const recaptchaResult = await verifyRecaptcha(recaptchaToken, 'register');
      if (!recaptchaResult.success) {
        return NextResponse.json(
          { error: 'reCAPTCHA verification failed. Please try again.' },
          { status: 400 }
        );
      }
    }

    // ============================================
    // BASIC VALIDATION
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
    // GEOCODE LOCATION (Optional - speeds up background processing)
    // ============================================
    let geocodedLocation = undefined;

    if (location) {
      try {
        geocodedLocation = await geocodeWorkerLocation(location);
      } catch (geocodeError) {
        // Will be geocoded in background worker if it fails here
        console.error('⚠️ Geocoding failed (will retry in background):', geocodeError);
      }
    }

    // ============================================
    // QUEUE REGISTRATION JOB
    // ============================================
    const jobData: WorkerRegistrationJobData = {
      email: normalizedEmail,
      password,
      firstName,
      lastName,
      mobile,
      location,
      age,
      gender,
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
      geocodedLocation,
    };

    const jobId = await queueWorkerRegistration(jobData);

    // ============================================
    // INSTANT RESPONSE TO USER
    // ============================================
    return NextResponse.json(
      {
        success: true,
        message: 'Registration received! We are processing your account. You will receive a confirmation email shortly.',
        jobId, // Can be used to check status later
      },
      { status: 202 } // 202 Accepted - Processing asynchronously
    );
  } catch (error: any) {
    console.error('❌ Registration queue error:', error);

    return NextResponse.json(
      {
        error: 'Failed to submit registration',
        message: error?.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
