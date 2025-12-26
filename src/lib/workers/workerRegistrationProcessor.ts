/**
 * Worker Registration Processor
 *
 * Background job processor that handles queued worker registrations
 * Runs independently from the API request - user gets instant response
 */

import { authPrisma } from '@/lib/auth-prisma';
import { hashPassword } from '@/lib/password';
import { geocodeWorkerLocation } from '@/lib/location-parser';
import type { WorkerRegistrationJobData } from '@/lib/queue';

/**
 * Process worker registration job
 *
 * This function handles the actual registration logic that was previously in the API route
 * Now it runs asynchronously in the background
 */
export async function processWorkerRegistration(
  data: WorkerRegistrationJobData
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const {
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
      photos,
      geocodedLocation: preGeocodedLocation,
    } = data;

    // ============================================
    // VALIDATION
    // ============================================
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    if (!firstName || !lastName || !mobile) {
      throw new Error('First name, last name, and mobile are required');
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // ============================================
    // HASH PASSWORD
    // ============================================
    const passwordHash = await hashPassword(password);

    // ============================================
    // GEOCODE LOCATION (CRITICAL - MUST COMPLETE)
    // ============================================
    // IMPORTANT: Geocode BEFORE creating user to ensure coordinates are saved
    // In serverless environments, fire-and-forget patterns cause data loss
    let geocodedLocation = preGeocodedLocation || {
      city: null,
      state: null,
      postalCode: null,
      latitude: null,
      longitude: null,
    };

    // Geocode location if provided and not already geocoded
    if (location && !preGeocodedLocation) {
      try {
        geocodedLocation = await geocodeWorkerLocation(location);
      } catch (geocodeError) {
        // Log error but continue with null coordinates - not critical enough to fail registration
        console.error('[Registration] Geocoding failed:', geocodeError);
        // geocodedLocation remains with null values
      }
    }

    // ============================================
    // CREATE USER + WORKER PROFILE (TRANSACTION)
    // ============================================
    let user;
    try {
      user = await authPrisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          role: 'WORKER' as const,
          status: 'ACTIVE',
          updatedAt: new Date(),

          workerProfile: {
            create: {
              firstName,
              lastName,
              mobile,
              location,
              latitude: geocodedLocation.latitude,
              longitude: geocodedLocation.longitude,
              city: geocodedLocation.city,
              state: geocodedLocation.state,
              postalCode: geocodedLocation.postalCode,
              age,
              gender,
              languages: languages || [],
              experience,
              introduction,
              qualifications,
              hasVehicle,
              funFact,
              hobbies,
              uniqueService,
              // Photos: Single photo URL as string (changed from array to string)
              photos: photos && photos.length > 0 ? (Array.isArray(photos) ? photos[0] : photos) : undefined,
              profileCompleted: true,
              isPublished: false,
              verificationStatus: 'NOT_STARTED' as const,
              updatedAt: new Date(),
            },
          },
        },
        include: {
          workerProfile: true,
        },
      });
    } catch (dbError: any) {
      // Handle unique constraint violation
      if (dbError.code === 'P2002') {
        throw new Error('An account with this email already exists');
      }
      throw dbError;
    }

    // ============================================
    // RETURN IMMEDIATELY - User doesn't need to wait!
    // ============================================
    // User + Profile created successfully → Return userId now
    // Background operations will complete asynchronously

    const userId = user.id;
    const workerProfileId = user.workerProfile!.id;

    // ============================================
    // CRITICAL BLOCKING OPERATIONS
    // ============================================
    // IMPORTANT: These operations MUST complete before returning
    // In serverless environments, fire-and-forget patterns will cause data loss
    // because the execution context terminates after response is sent

    // CRITICAL: Create worker service records (MUST be awaited)
    if (services && services.length > 0) {
      try {
        console.log('[Registration] ========== WORKER SERVICES CREATION START ==========');
        console.log('[Registration] Input data:', { services, supportWorkerCategories, workerProfileId });

        const categories = await authPrisma.category.findMany({
          include: {
            subcategories: true,
          },
        });

        console.log('[Registration] Database categories:', categories.map(c => ({ id: c.id, name: c.name })));

        const subcategoryToCategory = new Map();
        categories.forEach((category) => {
          category.subcategories.forEach((sub: any) => {
            subcategoryToCategory.set(sub.id, category);
          });
        });

        const workerServiceRecords = [];
        const subcategoryIds = supportWorkerCategories || [];

        for (const serviceId of services) {
          console.log(`[Registration] Processing service: "${serviceId}"`);
          const category = categories.find((c) => c.id === serviceId);

          if (!category) {
            console.error(`[Registration] ❌ MISMATCH: Service "${serviceId}" not found in database categories:`, categories.map(c => c.id));
            continue;
          }

          console.log(`[Registration] ✓ Matched category: ${category.id} - ${category.name}`);

          const categoryId = category.id;
          const relevantSubcategoryIds = subcategoryIds.filter((subId: string) => {
            const parentCategory = subcategoryToCategory.get(subId);
            return parentCategory?.id === categoryId;
          });

          if (relevantSubcategoryIds.length > 0) {
            console.log(`[Registration] Processing ${relevantSubcategoryIds.length} subcategories for ${category.name}`);
            for (const subcategoryId of relevantSubcategoryIds) {
              const subcategory = category.subcategories.find(
                (sub: any) => sub.id === subcategoryId
              );
              if (subcategory) {
                workerServiceRecords.push({
                  workerProfileId,
                  categoryId,
                  categoryName: category.name,
                  subcategoryId,
                  subcategoryName: subcategory.name,
                });
              }
            }
          } else {
            console.log(`[Registration] No subcategories for ${category.name}, creating category-only record`);
            workerServiceRecords.push({
              workerProfileId,
              categoryId,
              categoryName: category.name,
              subcategoryId: null,
              subcategoryName: null,
            });
          }
        }

        console.log('[Registration] Final worker service records:', JSON.stringify(workerServiceRecords, null, 2));

        if (workerServiceRecords.length > 0) {
          const result = await authPrisma.workerService.createMany({
            data: workerServiceRecords,
            skipDuplicates: true,
          });
          console.log('[Registration] ✅ Successfully created worker services. Count:', result.count);
        } else {
          console.error('[Registration] ❌ CRITICAL: No worker service records to create!');
          console.error('[Registration] This means services in form don\'t match database category IDs');
        }
        console.log('[Registration] ========== WORKER SERVICES CREATION END ==========');
      } catch (error) {
        // Log error but don't fail registration - services can be added later
        console.error('[Registration] ❌ FATAL ERROR creating worker services:', error);
        console.error('[Registration] Error details:', JSON.stringify(error, null, 2));
      }
    } else {
      console.error('[Registration] ❌ No services provided or services array is empty!');
    }

    // ============================================
    // ASYNC BACKGROUND OPERATIONS (Fire-and-forget)
    // ============================================
    // These operations can run in background - not critical for registration

    // ASYNC: Audit log (fire-and-forget)
    authPrisma.auditLog
      .create({
        data: {
          userId,
          action: 'LOGIN_SUCCESS',
          metadata: {
            registrationType: 'WORKER',
            emailSent: true,
          },
        },
      })
      .catch(() => {
        // Silently fail - not critical
      });

    // ASYNC: N8N webhook (fire-and-forget)
    if (process.env.N8N_WEBHOOK_URL) {
      const webhookData = {
        userId,
        email: normalizedEmail,
        role: user.role,
        registeredAt: new Date().toISOString(),
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
        city: geocodedLocation.city,
        state: geocodedLocation.state,
        postalCode: geocodedLocation.postalCode,
        latitude: geocodedLocation.latitude,
        longitude: geocodedLocation.longitude,
        photos: photos || [],
        verificationStatus: 'NOT_STARTED',
        profileCompleted: true,
        isPublished: false,
      };

      fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookData),
      }).catch(() => {
        // Silently fail - not critical
      });
    }

    return {
      success: true,
      userId: user.id,
    };
  } catch (error: any) {
    
    return {
      success: false,
      error: error.message || 'Unknown error',
    };
  }
}
