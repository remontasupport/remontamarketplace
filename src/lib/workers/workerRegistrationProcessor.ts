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
    // GEOCODE LOCATION
    // ============================================
    let geocodedLocation = preGeocodedLocation || {
      city: null,
      state: null,
      postalCode: null,
      latitude: null,
      longitude: null,
    };

    // Only geocode if not already done
    if (location && !preGeocodedLocation) {
      try {
        geocodedLocation = await geocodeWorkerLocation(location);
      } catch (geocodeError) {
       
        // Continue anyway - worker can still register
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
    // CREATE WORKER SERVICE RECORDS
    // ============================================
    if (user.workerProfile && services && services.length > 0) {
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
                  workerProfileId: user.workerProfile.id,
                  categoryId,
                  categoryName: serviceName,
                  subcategoryId,
                  subcategoryName: subcategory.name,
                });
              }
            }
          } else {
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
        
        // Don't fail registration
      }
    }

    // ============================================
    // AUDIT LOG
    // ============================================
    await authPrisma.auditLog
      .create({
        data: {
          userId: user.id,
          action: 'LOGIN_SUCCESS',
          metadata: {
            registrationType: 'WORKER',
            emailSent: true,
          },
        },
      })
      .catch((error) => {
   
      });

    // ============================================
    // N8N WEBHOOK
    // ============================================
    if (process.env.N8N_WEBHOOK_URL) {
      const webhookData = {
        userId: user.id,
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
      }).catch((webhookError) => {
       
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
