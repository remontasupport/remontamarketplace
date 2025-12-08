/**
 * Async Worker Registration API Endpoint
 *
 * Immediate processing registration that handles concurrent submissions
 *
 * Flow:
 * 1. User submits form
 * 2. Process registration immediately
 * 3. Return success/error response
 *
 * POST /api/auth/register-async
 */

import { NextResponse } from 'next/server';
import { applyRateLimit, strictApiRateLimit } from '@/lib/ratelimit';
import { verifyRecaptcha } from '@/lib/recaptcha';
import { processWorkerRegistration } from '@/lib/workers/workerRegistrationProcessor';
import type { WorkerRegistrationJobData } from '@/lib/queue';
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
      }
    }

    // ============================================
    // PROCESS REGISTRATION IMMEDIATELY
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

    // Process registration immediately (no queue)
    const result = await processWorkerRegistration(jobData);

    if (!result.success) {
      throw new Error(result.error || 'Registration failed');
    }

    // ============================================
    // SUCCESS RESPONSE TO USER
    // ============================================
    return NextResponse.json(
      {
        success: true,
        message: 'Registration successful! Please check your email to verify your account.',
        user: {
          id: result.userId,
          email: normalizedEmail,
        },
      },
      { status: 201 } // 201 Created
    );
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Failed to submit registration',
        message: error?.message || 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
