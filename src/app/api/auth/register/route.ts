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
    // DEBUG: Return environment info in development
    if (process.env.NODE_ENV === 'development') {
    }

    // ============================================
    // RATE LIMITING (Security: Prevent spam/bot registrations)
    // ============================================
    try {
      const rateLimitResult = await applyRateLimit(request, strictApiRateLimit);
      if (!rateLimitResult.success) {
       
        return rateLimitResult.response;
      }
     
    } catch (rateLimitError: any) {

      // Continue anyway - don't block registration if rate limit fails
    }

  try {
    

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

    } else {
      // Parse JSON
      body = await request.json();
    
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
      photos, // Photo URLs (already uploaded to Blob)
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
    // HASH PASSWORD (Before Database Operations)
    // ============================================
    // Hash password BEFORE database transaction to reduce lock time
    const passwordHash = await hashPassword(password);

    // ============================================
    // HANDLE PHOTOS (Already uploaded or upload now)
    // ============================================

    let photoUrls: string[] = [];

    // Check if photos are already uploaded (URLs provided in JSON body)
    if (photos && Array.isArray(photos) && photos.length > 0 && typeof photos[0] === 'string') {
      // Photos are already uploaded - use the URLs directly
      photoUrls = photos;
     
    } else if (photoFiles.length > 0) {
      // Legacy support: Photos sent as files - upload them now
   

      for (let i = 0; i < photoFiles.length; i++) {
        const file = photoFiles[i];

        // Validate file
        const validationError = validateImageFile(file);
        if (validationError) {
        
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
         
        } catch (uploadError) {
         
          // Continue with other photos even if one fails
        }
      }

     
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
      } catch (geocodeError) {
       
        // Don't fail registration if geocoding fails
        // Worker can still register, just won't have coordinates initially
      }
    }

    // ============================================
    // CREATE USER + WORKER PROFILE (TRANSACTION)
    // ============================================
    // Uses database unique constraint for race condition protection
    // If duplicate email, will throw P2002 error handled in catch block

    let user;
    try {
      user = await authPrisma.user.create({
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
              languages: languages || [],
              // DO NOT save services/supportWorkerCategories arrays for new registrations
              // New workers use WorkerService table only
              services: [],
              supportWorkerCategories: [],
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
    } catch (dbError: any) {
      // Handle unique constraint violation (race condition)
      if (dbError.code === 'P2002') {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        );
      }
      // Re-throw other database errors
      throw dbError;
    }

    // Verify photos were saved
   

    // ============================================
    // CREATE WORKER SERVICE RECORDS (Normalized)
    // ============================================
    if (user.workerProfile && services && services.length > 0) {
      try {
        // Get all categories from database to map subcategories to their parent categories
        const categories = await authPrisma.category.findMany({
          include: {
            subcategories: true,
          },
        });

        // Build a map: subcategoryId -> categoryId
        const subcategoryToCategory = new Map();
        categories.forEach(category => {
          category.subcategories.forEach((sub: any) => {
            subcategoryToCategory.set(sub.id, category);
          });
        });

        // Create WorkerService records
        const workerServiceRecords = [];
        const subcategoryIds = supportWorkerCategories || [];

        for (const serviceName of services) {
          // Find category by name
          const category = categories.find(c => c.name === serviceName);
          if (!category) continue;

          const categoryId = category.id;

          // Find subcategories that belong to this category
          const relevantSubcategoryIds = subcategoryIds.filter((subId: string) => {
            const parentCategory = subcategoryToCategory.get(subId);
            return parentCategory?.id === categoryId;
          });

          if (relevantSubcategoryIds.length > 0) {
            // Service has subcategories - create one record per subcategory
            for (const subcategoryId of relevantSubcategoryIds) {
              const subcategory = category.subcategories.find((sub: any) => sub.id === subcategoryId);
              if (subcategory) {
                workerServiceRecords.push({
                  workerProfileId: user.workerProfile.id,
                  categoryId,
                  categoryName: serviceName,
                  subcategoryId,
                  subcategoryName: subcategory.name,
                });
              }
            }
          } else {
            // Service has no subcategories - create one record without subcategory
            workerServiceRecords.push({
              workerProfileId: user.workerProfile.id,
              categoryId,
              categoryName: serviceName,
              subcategoryId: null,
              subcategoryName: null,
            });
          }
        }

        if (workerServiceRecords.length > 0) {
          await authPrisma.workerService.createMany({
            data: workerServiceRecords,
            skipDuplicates: true,
          });
       
        }
      } catch (error) {
        // Don't fail registration if WorkerService creation fails
       
      }
    }

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
    
    });

    // ============================================
    // N8N WEBHOOK - SEND TO ZOHO CRM
    // ============================================

    // Send data to n8n webhook asynchronously (fire and forget)
    // This won't block the registration response
    if (process.env.N8N_WEBHOOK_URL) {
      const webhookData = {
        // User Information
        userId: user.id,
        email: normalizedEmail,
        role: user.role,
        registeredAt: new Date().toISOString(),

        // Worker Profile Data
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

        // Geocoded Location
        city: geocodedLocation.city,
        state: geocodedLocation.state,
        postalCode: geocodedLocation.postalCode,
        latitude: geocodedLocation.latitude,
        longitude: geocodedLocation.longitude,

        // Photos (URLs)
        photos: photoUrls,

        // Consent
        consentProfileShare,
        consentMarketing,

        // Status
        verificationStatus: 'NOT_STARTED',
        profileCompleted: true,
        isPublished: false,
      };

      // Send to n8n webhook (async, non-blocking)
      fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      })
        .then(() => {
         
        })
        .catch((webhookError) => {
          // Don't fail registration if webhook fails
        
        });
    } else {
      
    }

    // ============================================
    // SUCCESS RESPONSE
    // ============================================

   

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
