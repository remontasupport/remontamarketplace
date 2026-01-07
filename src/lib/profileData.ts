/**
 * Profile Data Utility
 * Pure database query functions (non-server-action)
 * Can be used in both server actions and API routes
 */

import { authPrisma } from "@/lib/auth-prisma";

export type ProfilePreviewData = {
  profile: {
    firstName: string | null;
    lastName: string | null;
    photos: string | null;
    introduction: string | null;
    createdAt: Date;
    location: string | null;
    hasVehicle: boolean | null;
  };
  services: Array<{
    categoryId: string;
    categoryName: string;
    subcategories: Array<{
      subcategoryId: string;
      subcategoryName: string;
    }>;
  }>;
  qualifications: Array<{
    requirementType: string;
    requirementName: string;
    status: string;
  }>;
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
    availability: any;
    experience: any;
  } | null;
};

/**
 * Fetch comprehensive profile preview data by userId
 * This is a pure database query function (not a server action)
 */
export async function fetchProfileByUserId(userId: string): Promise<ProfilePreviewData | null> {
  try {
    // Fetch worker profile with related data
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: {
        userId: userId,
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
            availability: true,
            experience: true,
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
      return null;
    }

    // Fetch worker services and group by category
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

    // Group services by category
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

    // Return comprehensive data
    return {
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
    };
  } catch (error) {
    console.error('Error fetching profile by userId:', error);
    return null;
  }
}
