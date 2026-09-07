"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { revalidatePath } from "next/cache";
import { rebuildExperience, safeRebuild, W1_TX, DOMAIN_TO_SLUG } from "@/lib/w1/promote";

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
export type ExperienceArea = {
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

    // W1 P5 — reads come from worker_experience.
    //
    // Keyed by the original slug ("aged-care"), because the UI treats the
    // presence of a key as "this area is selected" and hydrates five fields
    // from it. The Json column is still written by the dual-write below and
    // remains the fallback: if this read is ever wrong, rolling the deployment
    // back restores the Json path with no data loss.
    const rows = await authPrisma.workerExperience.findMany({
      where: { workerProfileId: workerProfile.id },
    });

    const experienceData: ExperienceData = {};
    for (const row of rows) {
      const slug = DOMAIN_TO_SLUG[row.domain];
      // A domain with no slug mapping would silently vanish from the UI, so
      // skip it loudly rather than quietly.
      if (!slug) {
        console.warn(`[w1:read] experience: no slug for domain "${row.domain}"`);
        continue;
      }
      experienceData[slug] = {
        isProfessional: row.isProfessional,
        isPersonal: row.isPersonal,
        specificAreas: row.specificAreas,
        // description is String? in the table but `string` in the contract
        description: row.description ?? "",
        otherAreas: row.otherAreas,
      };
    }

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

    // The Json write is the save. It must succeed on its own terms.
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

    // W1 dual-write. Deliberately AFTER the save and unable to fail it: the Json
    // write is the save and must not be held hostage to the derived copy. Its
    // own transaction keeps the delete and insert atomic. Remove at phase P7.
    //
    // Reads now come from this table, so a failed rebuild means the worker sees
    // "saved successfully" and then their previous values. Not data loss — Json
    // remains authoritative and the reconcile repairs it — and failing the save
    // instead would be worse. Watch the logs for `[w1:experience] rebuild FAILED`.
    await safeRebuild("experience", workerProfile.id, () =>
      authPrisma.$transaction(
        (tx) => rebuildExperience(tx, workerProfile.id, experienceData),
        W1_TX,
      ),
    );

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

    // W1 dual-write, as above — after the save, unable to fail it.
    await safeRebuild("experience", workerProfile.id, () =>
      authPrisma.$transaction(
        (tx) => rebuildExperience(tx, workerProfile.id, updatedExperience),
        W1_TX,
      ),
    );

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
