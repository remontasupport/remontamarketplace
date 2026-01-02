"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";

/**
 * Backend Service: Profile Preview Data
 * Fetches comprehensive profile data from multiple tables for profile preview
 */

// Response type
export type ProfilePreviewResponse = {
  success: boolean;
  message?: string;
  data?: {
    // From worker_profiles table
    profile: {
      firstName: string | null;
      lastName: string | null;
      photos: string | null;
      introduction: string | null;
      createdAt: Date;
      location: string | null;
      hasVehicle: boolean | null;
    };
    // From worker_services table (grouped by category)
    services: Array<{
      categoryId: string;
      categoryName: string;
      subcategories: Array<{
        subcategoryId: string;
        subcategoryName: string;
      }>;
    }>;
    // From verification_requirements table (worker-selected qualifications)
    qualifications: Array<{
      requirementType: string;
      requirementName: string;
      status: string;
    }>;
    // From worker_additional_info table
    additionalInfo: {
      languages: any;
      culturalBackground: any;
      religion: any;
      interests: any;
      workPreferences: any;
      bankAccount: any;
      jobHistory: any;
      education: any;
      lgbtqiaSupport: boolean | null;
      uniqueService: string | null;
      funFact: string | null;
      personality: any;
      nonSmoker: boolean | null;
      petFriendly: boolean | null;
    } | null;
  };
  error?: string;
};

/**
 * Server Action: Get comprehensive profile preview data
 * Fetches data from 4 tables in optimized queries:
 * - worker_profiles (name, photo, bio, created date)
 * - worker_services (services grouped by category)
 * - verification_requirements (worker-selected qualifications)
 * - worker_additional_info (languages, interests, etc.)
 */
export async function getProfilePreviewData(): Promise<ProfilePreviewResponse> {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // 2. Fetch worker profile with related data (single query for performance)
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        photos: true,
        introduction: true,
        createdAt: true,
        location: true,
        hasVehicle: true,
        workerAdditionalInfo: {
          select: {
            languages: true,
            culturalBackground: true,
            religion: true,
            interests: true,
            workPreferences: true,
            bankAccount: true,
            jobHistory: true,
            education: true,
            lgbtqiaSupport: true,
            uniqueService: true,
            funFact: true,
            personality: true,
            nonSmoker: true,
            petFriendly: true,
          },
        },
        verificationRequirements: {
          where: {
            isRequired: false, // Worker-selected qualifications only
          },
          select: {
            requirementType: true,
            requirementName: true,
            status: true,
          },
          orderBy: {
            requirementName: 'asc',
          },
        },
      },
    });

    if (!workerProfile) {
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    // 3. Fetch worker services and group by category
    const workerServices = await authPrisma.workerService.findMany({
      where: {
        workerProfileId: workerProfile.id,
      },
      select: {
        categoryId: true,
        categoryName: true,
        subcategoryId: true,
        subcategoryName: true,
      },
      orderBy: {
        categoryName: 'asc',
      },
    });

    // 4. Group services by category
    const servicesGrouped = workerServices.reduce((acc, service) => {
      const existingCategory = acc.find(cat => cat.categoryId === service.categoryId);

      if (existingCategory) {
        existingCategory.subcategories.push({
          subcategoryId: service.subcategoryId,
          subcategoryName: service.subcategoryName,
        });
      } else {
        acc.push({
          categoryId: service.categoryId,
          categoryName: service.categoryName,
          subcategories: [{
            subcategoryId: service.subcategoryId,
            subcategoryName: service.subcategoryName,
          }],
        });
      }

      return acc;
    }, [] as Array<{
      categoryId: string;
      categoryName: string;
      subcategories: Array<{
        subcategoryId: string;
        subcategoryName: string;
      }>;
    }>);

    // 5. Return comprehensive data
    return {
      success: true,
      data: {
        profile: {
          firstName: workerProfile.firstName,
          lastName: workerProfile.lastName,
          photos: workerProfile.photos,
          introduction: workerProfile.introduction,
          createdAt: workerProfile.createdAt,
          location: workerProfile.location,
          hasVehicle: workerProfile.hasVehicle,
        },
        services: servicesGrouped,
        qualifications: workerProfile.verificationRequirements || [],
        additionalInfo: workerProfile.workerAdditionalInfo || null,
      },
    };
  } catch (error) {
  
    return {
      success: false,
      error: "Failed to fetch profile preview data",
    };
  }
}
