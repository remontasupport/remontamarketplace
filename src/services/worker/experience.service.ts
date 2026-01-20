"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { revalidatePath } from "next/cache";

/**
 * Backend Service: Worker Experience Management
 * Server actions for managing worker experience data
 */

// Response types
export type ActionResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

// Experience area data structure
export interface ExperienceArea {
  isProfessional: boolean;
  isPersonal: boolean;
  specificAreas: string[];    // Up to 3 specific areas
  description: string;         // 100-600 characters
  otherAreas: string[];        // Other areas of knowledge
}

// Complete experience data structure
export type ExperienceData = {
  [areaId: string]: ExperienceArea; // e.g., "aged-care", "disability", etc.
};

/**
 * Server Action: Get worker's experience
 * Fetches experience data from WorkerAdditionalInfo JSON field
 */
export async function getWorkerExperience(): Promise<ActionResponse<ExperienceData>> {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // Get worker profile with additional info
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        workerAdditionalInfo: true,
      },
    });

    if (!workerProfile) {
      return {
        success: false,
        error: "Worker profile not found.",
      };
    }

    // Get experience from JSON field
    const experienceData = (workerProfile.workerAdditionalInfo?.experience || {}) as ExperienceData;

    return {
      success: true,
      data: experienceData,
    };
  } catch (error: any) {
    console.error("Error fetching worker experience:", error);
    return {
      success: false,
      error: "Failed to fetch experience. Please try again.",
    };
  }
}

/**
 * Server Action: Save worker's experience
 * Saves experience data to JSON field in WorkerAdditionalInfo
 */
export async function saveWorkerExperience(
  experienceData: ExperienceData
): Promise<ActionResponse> {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // Get worker profile
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!workerProfile) {
      return {
        success: false,
        error: "Worker profile not found.",
      };
    }

    // Validate data structure
    if (typeof experienceData !== 'object' || experienceData === null) {
      return {
        success: false,
        error: "Invalid experience data format.",
      };
    }

    // Validate each experience area
    for (const [areaId, areaData] of Object.entries(experienceData)) {
      // Check required fields
      if (typeof areaData !== 'object' || areaData === null) {
        return {
          success: false,
          error: `Invalid data for ${areaId}.`,
        };
      }

      // Validate experience type selection
      if (!areaData.isProfessional && !areaData.isPersonal) {
        return {
          success: false,
          error: `Please select experience type (Professional or Personal) for ${areaId}.`,
        };
      }

      // Validate description length (100-600 characters)
      if (areaData.description && areaData.description.length < 100) {
        return {
          success: false,
          error: `Description for ${areaId} must be at least 100 characters.`,
        };
      }

      if (areaData.description && areaData.description.length > 600) {
        return {
          success: false,
          error: `Description for ${areaId} cannot exceed 600 characters.`,
        };
      }

      // Validate specific areas limit (max 3)
      if (areaData.specificAreas && areaData.specificAreas.length > 3) {
        return {
          success: false,
          error: `You can select up to 3 specific areas for ${areaId}.`,
        };
      }
    }

    // Upsert to WorkerAdditionalInfo
    await authPrisma.workerAdditionalInfo.upsert({
      where: {
        workerProfileId: workerProfile.id,
      },
      create: {
        workerProfileId: workerProfile.id,
        experience: experienceData,
      },
      update: {
        experience: experienceData,
      },
    });

    // Revalidate paths
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker/profile-preview");

    return {
      success: true,
      message: "Experience saved successfully!",
    };
  } catch (error: any) {
    console.error("Error saving worker experience:", error);
    return {
      success: false,
      error: "Failed to save experience. Please try again.",
    };
  }
}

/**
 * Server Action: Delete worker's experience for specific areas
 * Removes experience data for specified areas from JSON field
 */
export async function deleteWorkerExperience(
  areasToDelete: string[]
): Promise<ActionResponse> {
  try {
    // Get authenticated session
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // Get worker profile with additional info
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        workerAdditionalInfo: true,
      },
    });

    if (!workerProfile) {
      return {
        success: false,
        error: "Worker profile not found.",
      };
    }

    // Get current experience
    const currentExperience = (workerProfile.workerAdditionalInfo?.experience || {}) as ExperienceData;

    // Remove specified areas
    const updatedExperience: ExperienceData = { ...currentExperience };
    areasToDelete.forEach((areaId) => {
      delete updatedExperience[areaId];
    });

    // Update in database
    if (workerProfile.workerAdditionalInfo) {
      await authPrisma.workerAdditionalInfo.update({
        where: {
          workerProfileId: workerProfile.id,
        },
        data: {
          experience: updatedExperience,
        },
      });
    } else {
      // Create if doesn't exist
      await authPrisma.workerAdditionalInfo.create({
        data: {
          workerProfileId: workerProfile.id,
          experience: updatedExperience,
        },
      });
    }

    // Revalidate paths
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker/profile-preview");

    return {
      success: true,
      message: "Experience deleted successfully!",
    };
  } catch (error: any) {
    console.error("Error deleting worker experience:", error);
    return {
      success: false,
      error: "Failed to delete experience. Please try again.",
    };
  }
}
