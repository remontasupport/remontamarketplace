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
      services,
      supportWorkerCategories,
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
    // GEOCODE LOCATION - SKIP FOR NOW (will do in background)
    // ============================================
    // OPTIMIZATION: Create profile with NULL coordinates first
    // Update coordinates asynchronously in background (doesn't block response)
    const geocodedLocation = preGeocodedLocation || {
      city: null,
      state: null,
      postalCode: null,
      latitude: null,
      longitude: null,
    };

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
              whyEnjoyWork,
              additionalInfo,
              photos: photos && photos.length > 0 ? photos : undefined,
              consentProfileShare: consentProfileShare || false,
              consentMarketing: consentMarketing || false,
              profileCompleted: true,
              isPublished: false,
              verificationStatus: 'NOT_STARTED' as const,
              updatedAt: new Date(),
            },
          },
        },
        include: {
          workerProfile: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
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

    console.log('[REGISTRATION] User created successfully:', userId);
    console.log('[REGISTRATION] Worker Profile ID:', workerProfileId);
    console.log('[REGISTRATION] Services data received:', services);
    console.log('[REGISTRATION] Support Worker Categories data received:', supportWorkerCategories);

    // ============================================
    // ASYNC BACKGROUND OPERATIONS (Fire-and-forget)
    // ============================================
    // These operations run in the background WITHOUT blocking the response
    // User gets immediate feedback while we handle the rest

    // ASYNC: Create worker services (fire-and-forget)
    if (services && services.length > 0) {
      (async () => {
        try {
          console.log('[WORKER-SERVICES] Starting to save services:', services);
          console.log('[WORKER-SERVICES] Worker Profile ID:', workerProfileId);

          // Fetch category details from database
          const categories = await authPrisma.category.findMany({
            where: {
              id: {
                in: services,
              },
            },
            select: {
              id: true,
              name: true,
            },
          });

          console.log('[WORKER-SERVICES] Found categories from DB:', categories);

          // First, determine which categories have subcategories selected
          let categoriesWithSubcategories = new Set<string>();

          // If support worker subcategories are selected
          if (supportWorkerCategories && supportWorkerCategories.length > 0) {
            console.log('[WORKER-SERVICES] Processing subcategories:', supportWorkerCategories);

            // Fetch subcategory details from database
            const subcategories = await authPrisma.subcategory.findMany({
              where: {
                id: {
                  in: supportWorkerCategories,
                },
              },
              select: {
                id: true,
                name: true,
                categoryId: true,
              },
            });

            console.log('[WORKER-SERVICES] Found subcategories from DB:', subcategories);

            // Track which categories have subcategories
            subcategories.forEach(sub => categoriesWithSubcategories.add(sub.categoryId));

            // Fetch the category names for subcategories
            const subcategoryCategoryIds = subcategories.map((sub) => sub.categoryId);
            const subcategoryCategories = await authPrisma.category.findMany({
              where: {
                id: {
                  in: subcategoryCategoryIds,
                },
              },
              select: {
                id: true,
                name: true,
              },
            });

            const categoryMap = new Map(subcategoryCategories.map((cat) => [cat.id, cat.name]));

            // Create worker service records for each selected subcategory
            const subcategoryRecords = subcategories.map((subcategory) => ({
              workerProfileId,
              categoryId: subcategory.categoryId,
              categoryName: categoryMap.get(subcategory.categoryId) || subcategory.categoryId,
              subcategoryId: subcategory.id,
              subcategoryName: subcategory.name,
            }));

            console.log('[WORKER-SERVICES] Subcategory records to create:', subcategoryRecords);

            if (subcategoryRecords.length > 0) {
              await authPrisma.workerService.createMany({
                data: subcategoryRecords,
                skipDuplicates: true,
              });
              console.log('[WORKER-SERVICES] Successfully created subcategory records');
            }
          }

          // Create worker service records ONLY for categories WITHOUT subcategories
          // This prevents duplicate entries where a category appears both with null subcategoryId and with actual subcategoryIds
          const serviceRecords = categories
            .filter(category => !categoriesWithSubcategories.has(category.id))
            .map((category) => ({
              workerProfileId,
              categoryId: category.id,
              categoryName: category.name,
              subcategoryId: null,
              subcategoryName: null,
            }));

          console.log('[WORKER-SERVICES] Service records to create (excluding categories with subcategories):', serviceRecords);

          if (serviceRecords.length > 0) {
            await authPrisma.workerService.createMany({
              data: serviceRecords,
              skipDuplicates: true,
            });
            console.log('[WORKER-SERVICES] Successfully created service records');
          }
        } catch (serviceError) {
          console.error('[WORKER-SERVICES] Error creating worker services:', serviceError);
        }
      })();
    } else {
      console.log('[WORKER-SERVICES] No services to save - services array is empty or undefined');
    }

    // ASYNC: Geocode location and update profile
    if (location) {
      (async () => {
        try {
          console.log('[GEOCODING] Starting geocoding for location:', location);
          const geocoded = await geocodeWorkerLocation(location);
          console.log('[GEOCODING] Geocoding result:', geocoded);

          if (geocoded && (geocoded.latitude || geocoded.city)) {
            // Update worker profile with geocoded coordinates
            await authPrisma.workerProfile.update({
              where: { id: workerProfileId },
              data: {
                city: geocoded.city,
                state: geocoded.state,
                postalCode: geocoded.postalCode,
                latitude: geocoded.latitude,
                longitude: geocoded.longitude,
              },
            });
            console.log('[GEOCODING] Successfully updated worker profile with geocoded data');
          } else {
            console.error('[GEOCODING] Geocoding returned null or invalid data');
          }
        } catch (error) {
          console.error('[GEOCODING] Error during geocoding:', error);
        }
      })();
    }

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
        experience,
        introduction,
        qualifications,
        hasVehicle,
        funFact,
        hobbies,
        uniqueService,
        whyEnjoyWork,
        additionalInfo,
        city: geocodedLocation.city,
        state: geocodedLocation.state,
        postalCode: geocodedLocation.postalCode,
        latitude: geocodedLocation.latitude,
        longitude: geocodedLocation.longitude,
        photos: photos || [],
        consentProfileShare,
        consentMarketing,
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
