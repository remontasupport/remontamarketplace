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
      whyEnjoyWork,
      additionalInfo,
      consentProfileShare,
      consentMarketing,
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
    // ASYNC BACKGROUND OPERATIONS (Fire-and-forget)
    // ============================================
    // These operations run in the background WITHOUT blocking the response
    // User gets immediate feedback while we handle the rest

    // ASYNC: Geocode location and update profile
    if (location) {
      (async () => {
        try {
          const geocoded = await geocodeWorkerLocation(location);

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
        } catch (error) {
          // Silently fail - coordinates not critical for registration
        }
      })();
    }

    // ASYNC: Create worker service records
    if (services && services.length > 0) {
      // Fire-and-forget: Don't await
      (async () => {
        try {
          const categories = await authPrisma.category.findMany({
            include: {
              subcategories: true,
            },
          });

          const subcategoryToCategory = new Map();
          categories.forEach((category) => {
            category.subcategories.forEach((sub: any) => {
              subcategoryToCategory.set(sub.id, category);
            });
          });

          const workerServiceRecords = [];
          const subcategoryIds = supportWorkerCategories || [];

          for (const serviceName of services) {
            const category = categories.find((c) => c.name === serviceName);
            if (!category) continue;

            const categoryId = category.id;
            const relevantSubcategoryIds = subcategoryIds.filter((subId: string) => {
              const parentCategory = subcategoryToCategory.get(subId);
              return parentCategory?.id === categoryId;
            });

            if (relevantSubcategoryIds.length > 0) {
              for (const subcategoryId of relevantSubcategoryIds) {
                const subcategory = category.subcategories.find(
                  (sub: any) => sub.id === subcategoryId
                );
                if (subcategory) {
                  workerServiceRecords.push({
                    workerProfileId,
                    categoryId,
                    categoryName: serviceName,
                    subcategoryId,
                    subcategoryName: subcategory.name,
                  });
                }
              }
            } else {
              workerServiceRecords.push({
                workerProfileId,
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
          // Silently fail - user already registered successfully
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
