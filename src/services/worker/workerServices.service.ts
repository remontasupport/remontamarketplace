"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { revalidatePath } from "next/cache";
import { dbWriteRateLimit, checkServerActionRateLimit } from "@/lib/ratelimit";
import { autoUpdateServicesCompletion } from "./setupProgress.service";

/**
 * Backend Service: Worker Services Management
 * Server actions for managing worker service subcategories with TanStack Query
 */

// Response types
export type ActionResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

/**
 * Server Action: Toggle a subcategory for a worker
 * Adds if not present, removes if present
 */
export async function toggleWorkerSubcategory(
  categoryId: string,
  categoryName: string,
  subcategoryId: string,
  subcategoryName: string
): Promise<ActionResponse> {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // 2. Rate limiting check (protect Neon DB)
    const rateLimitCheck = await checkServerActionRateLimit(
      session.user.id,
      dbWriteRateLimit
    );
    if (!rateLimitCheck.success) {
      return {
        success: false,
        error: rateLimitCheck.error,
      };
    }

    // 3. Get worker profile
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!workerProfile) {
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    // 4. Check if this subcategory already exists
    const existingService = await authPrisma.workerService.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        categoryId,
        subcategoryId,
      },
    });

    if (existingService) {
      // Remove the subcategory
      await authPrisma.workerService.delete({
        where: { id: existingService.id },
      });

      // 5. Revalidate cache
      revalidatePath("/dashboard/worker/services/setup");
      revalidatePath("/dashboard/worker");

      // 6. Auto-update Services completion status (synchronous for cache consistency)
      await autoUpdateServicesCompletion().catch((error) => {
        console.error("Failed to auto-update services completion:", error);
        // Don't fail the main operation if this fails
      });

      return {
        success: true,
        message: `Removed ${subcategoryName}`,
        data: { action: "removed", subcategoryId },
      };
    } else {
      // Add the subcategory
      // First, check if there's existing metadata for this category (e.g., nursing registration)
      const existingCategoryService = await authPrisma.workerService.findFirst({
        where: {
          workerProfileId: workerProfile.id,
          categoryId,
        },
        select: { metadata: true },
      });

      // Preserve existing metadata when creating new subcategory row
      await authPrisma.workerService.create({
        data: {
          workerProfileId: workerProfile.id,
          categoryId,
          categoryName,
          subcategoryId,
          subcategoryName,
          metadata: existingCategoryService?.metadata ?? undefined,
        },
      });

      // 5. Revalidate cache
      revalidatePath("/dashboard/worker/services/setup");
      revalidatePath("/dashboard/worker");

      // 6. Auto-update Services completion status (synchronous for cache consistency)
      await autoUpdateServicesCompletion().catch((error) => {
        console.error("Failed to auto-update services completion:", error);
        // Don't fail the main operation if this fails
      });

      return {
        success: true,
        message: `Added ${subcategoryName}`,
        data: { action: "added", subcategoryId },
      };
    }
  } catch (error: any) {
    console.error("Error toggling worker subcategory:", error);
    return {
      success: false,
      error: "Failed to update service. Please try again.",
    };
  }
}

/**
 * Server Action: Bulk update worker subcategories for a category
 * Used when saving all offerings for a specific service
 */
export async function updateWorkerSubcategories(
  categoryId: string,
  categoryName: string,
  subcategoryIds: string[],
  subcategories: Array<{ id: string; name: string }>
): Promise<ActionResponse> {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // 2. Rate limiting check (protect Neon DB)
    const rateLimitCheck = await checkServerActionRateLimit(
      session.user.id,
      dbWriteRateLimit
    );
    if (!rateLimitCheck.success) {
      return {
        success: false,
        error: rateLimitCheck.error,
      };
    }

    // 3. Get worker profile
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!workerProfile) {
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    // 4. Fetch existing metadata before deleting (e.g., nursing registration)
    const existingCategoryService = await authPrisma.workerService.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        categoryId,
      },
      select: { metadata: true },
    });

    const existingMetadata = existingCategoryService?.metadata;

    // 5. Remove all existing subcategories for this category
    await authPrisma.workerService.deleteMany({
      where: {
        workerProfileId: workerProfile.id,
        categoryId,
      },
    });

    // 6. Add new subcategories with preserved metadata
    if (subcategoryIds.length > 0) {
      const servicesToCreate = subcategoryIds.map((subcategoryId) => {
        const subcategory = subcategories.find((s) => s.id === subcategoryId);
        return {
          workerProfileId: workerProfile.id,
          categoryId,
          categoryName,
          subcategoryId,
          subcategoryName: subcategory?.name || "",
          metadata: existingMetadata ?? undefined,
        };
      });

      // Note: createMany doesn't support Prisma.JsonValue for metadata, so we use individual creates
      await Promise.all(
        servicesToCreate.map((serviceData) =>
          authPrisma.workerService.create({ data: serviceData })
        )
      );
    }

    // 7. Revalidate cache
    revalidatePath("/dashboard/worker/services/setup");
    revalidatePath("/dashboard/worker");

    // 8. Auto-update Services completion status (synchronous for cache consistency)
    await autoUpdateServicesCompletion().catch((error) => {
      console.error("Failed to auto-update services completion:", error);
      // Don't fail the main operation if this fails
    });

    return {
      success: true,
      message: `Updated service offerings for ${categoryName}`,
      data: { categoryId, subcategoryIds },
    };
  } catch (error: any) {
    console.error("Error updating worker subcategories:", error);
    return {
      success: false,
      error: "Failed to update services. Please try again.",
    };
  }
}

/**
 * Server Action: Save nursing registration data
 * Stores nursing registration information in worker_services.metadata
 */
export interface NursingRegistrationData {
  nursingType: "registered" | "enrolled";
  hasExperience: boolean;
  registrationNumber: string;
  expiryDay: string;
  expiryMonth: string;
  expiryYear: string;
}

export async function saveNursingRegistration(
  data: NursingRegistrationData
): Promise<ActionResponse> {
  try {
    console.log("[Nursing] Saving nursing registration data:", data);

    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // 2. Rate limiting check
    const rateLimitCheck = await checkServerActionRateLimit(
      session.user.id,
      dbWriteRateLimit
    );
    if (!rateLimitCheck.success) {
      return {
        success: false,
        error: rateLimitCheck.error,
      };
    }

    // 3. Get worker profile
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!workerProfile) {
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    // 4. Convert expiry date to ISO format
    // Convert month name to month number
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthNumber = monthNames.indexOf(data.expiryMonth) + 1;
    const monthString = monthNumber > 0 ? monthNumber.toString().padStart(2, "0") : "01";

    const expiryDate = `${data.expiryYear}-${monthString}-${data.expiryDay.padStart(2, "0")}`;

    // 5. Prepare metadata
    const metadata = {
      nursingType: data.nursingType,
      hasExperience: data.hasExperience,
      registrationNumber: data.registrationNumber,
      expiryDate,
    };

    // 6. Find existing nursing services entry
    // Note: Nursing services can have multiple subcategories (nursing specialties)
    // The registration data should be stored on ALL nursing service entries
    const existingNursingServices = await authPrisma.workerService.findMany({
      where: {
        workerProfileId: workerProfile.id,
        categoryId: "nursing-services",
      },
    });

    if (existingNursingServices.length === 0) {
      // User hasn't selected nursing services yet - create a base entry
      const workerService = await authPrisma.workerService.create({
        data: {
          workerProfileId: workerProfile.id,
          categoryId: "nursing-services",
          categoryName: "Nursing Services",
          subcategoryId: null,
          subcategoryName: null,
          metadata,
        },
      });

      console.log("[Nursing] Created new nursing service entry with registration:", workerService.id);
    } else {
      // Update ALL existing nursing service entries with the registration metadata
      await authPrisma.workerService.updateMany({
        where: {
          workerProfileId: workerProfile.id,
          categoryId: "nursing-services",
        },
        data: {
          metadata,
          updatedAt: new Date(),
        },
      });

      console.log("[Nursing] Updated", existingNursingServices.length, "nursing service entries with registration");
    }

    // 7. Revalidate cache
    revalidatePath("/dashboard/worker/services/setup");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Nursing registration saved successfully!",
      data: { metadata },
    };
  } catch (error: any) {
    console.error("[Nursing] Error saving registration:", error);
    return {
      success: false,
      error: "Failed to save nursing registration. Please try again.",
    };
  }
}

/**
 * Server Action: Fetch nursing registration data
 * Retrieves nursing registration information from worker_services.metadata
 */
export async function getNursingRegistration(): Promise<ActionResponse<NursingRegistrationData | null>> {
  try {
    console.log("[Nursing] Fetching nursing registration data");

    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // 2. Get worker profile
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!workerProfile) {
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    // 3. Find ANY nursing service entry (registration is stored on all nursing entries)
    const nursingService = await authPrisma.workerService.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        categoryId: "nursing-services",
      },
      select: {
        metadata: true,
      },
    });

    if (!nursingService || !nursingService.metadata) {
      console.log("[Nursing] No registration data found");
      return {
        success: true,
        data: null,
      };
    }

    const metadata = nursingService.metadata as any;

    // 4. Parse expiry date
    let expiryDay = "";
    let expiryMonth = "";
    let expiryYear = "";

    if (metadata.expiryDate) {
      const dateParts = metadata.expiryDate.split("-");
      if (dateParts.length === 3) {
        expiryYear = dateParts[0];

        // Convert month number to month name
        const monthNames = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        const monthNumber = parseInt(dateParts[1], 10);
        expiryMonth = monthNames[monthNumber - 1] || "";

        // Remove leading zeros from day (e.g., "08" -> "8")
        expiryDay = parseInt(dateParts[2], 10).toString();
      }
    }

    const registrationData: NursingRegistrationData = {
      nursingType: metadata.nursingType || "registered",
      hasExperience: metadata.hasExperience || false,
      registrationNumber: metadata.registrationNumber || "",
      expiryDay,
      expiryMonth,
      expiryYear,
    };

    console.log("[Nursing] Registration data retrieved:", registrationData);

    return {
      success: true,
      data: registrationData,
    };
  } catch (error: any) {
    console.error("[Nursing] Error fetching registration:", error);
    return {
      success: false,
      error: "Failed to fetch nursing registration data.",
    };
  }
}

/**
 * Server Action: Save therapeutic registration data
 * Stores therapeutic registration information in worker_services.metadata
 */
export interface TherapeuticRegistrationData {
  registrationNumber: string;
  expiryDay: string;
  expiryMonth: string;
  expiryYear: string;
}

export async function saveTherapeuticRegistration(
  data: TherapeuticRegistrationData
): Promise<ActionResponse> {
  try {
    console.log("[Therapeutic] Saving therapeutic registration data:", data);

    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // 2. Rate limiting check
    const rateLimitCheck = await checkServerActionRateLimit(
      session.user.id,
      dbWriteRateLimit
    );
    if (!rateLimitCheck.success) {
      return {
        success: false,
        error: rateLimitCheck.error,
      };
    }

    // 3. Get worker profile
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!workerProfile) {
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    // 4. Convert expiry date to ISO format
    // Convert month name to month number
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const monthNumber = monthNames.indexOf(data.expiryMonth) + 1;
    const monthString = monthNumber > 0 ? monthNumber.toString().padStart(2, "0") : "01";

    const expiryDate = `${data.expiryYear}-${monthString}-${data.expiryDay.padStart(2, "0")}`;

    // 5. Prepare metadata
    const metadata = {
      registrationNumber: data.registrationNumber,
      expiryDate,
    };

    // 6. Find existing therapeutic supports entry
    const existingTherapeuticServices = await authPrisma.workerService.findMany({
      where: {
        workerProfileId: workerProfile.id,
        categoryId: "therapeutic-supports",
      },
    });

    if (existingTherapeuticServices.length === 0) {
      // User hasn't selected therapeutic supports yet - create a base entry
      const workerService = await authPrisma.workerService.create({
        data: {
          workerProfileId: workerProfile.id,
          categoryId: "therapeutic-supports",
          categoryName: "Therapeutic Supports",
          subcategoryId: null,
          subcategoryName: null,
          metadata,
        },
      });

      console.log("[Therapeutic] Created new therapeutic support entry with registration:", workerService.id);
    } else {
      // Update ALL existing therapeutic support entries with the registration metadata
      await authPrisma.workerService.updateMany({
        where: {
          workerProfileId: workerProfile.id,
          categoryId: "therapeutic-supports",
        },
        data: {
          metadata,
          updatedAt: new Date(),
        },
      });

      console.log("[Therapeutic] Updated", existingTherapeuticServices.length, "therapeutic support entries with registration");
    }

    // 7. Revalidate cache
    revalidatePath("/dashboard/worker/services/setup");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Therapeutic registration saved successfully!",
      data: { metadata },
    };
  } catch (error: any) {
    console.error("[Therapeutic] Error saving registration:", error);
    return {
      success: false,
      error: "Failed to save therapeutic registration. Please try again.",
    };
  }
}

/**
 * Server Action: Fetch therapeutic registration data
 * Retrieves therapeutic registration information from worker_services.metadata
 */
export async function getTherapeuticRegistration(): Promise<ActionResponse<TherapeuticRegistrationData | null>> {
  try {
    console.log("[Therapeutic] Fetching therapeutic registration data");

    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // 2. Get worker profile
    const workerProfile = await authPrisma.workerProfile.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });

    if (!workerProfile) {
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    // 3. Find ANY therapeutic support entry (registration is stored on all entries)
    const therapeuticService = await authPrisma.workerService.findFirst({
      where: {
        workerProfileId: workerProfile.id,
        categoryId: "therapeutic-supports",
      },
      select: {
        metadata: true,
      },
    });

    if (!therapeuticService || !therapeuticService.metadata) {
      console.log("[Therapeutic] No registration data found");
      return {
        success: true,
        data: null,
      };
    }

    const metadata = therapeuticService.metadata as any;

    // 4. Parse expiry date
    let expiryDay = "";
    let expiryMonth = "";
    let expiryYear = "";

    if (metadata.expiryDate) {
      const dateParts = metadata.expiryDate.split("-");
      if (dateParts.length === 3) {
        expiryYear = dateParts[0];

        // Convert month number to month name
        const monthNames = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        const monthNumber = parseInt(dateParts[1], 10);
        expiryMonth = monthNames[monthNumber - 1] || "";

        // Remove leading zeros from day (e.g., "08" -> "8")
        expiryDay = parseInt(dateParts[2], 10).toString();
      }
    }

    const registrationData: TherapeuticRegistrationData = {
      registrationNumber: metadata.registrationNumber || "",
      expiryDay,
      expiryMonth,
      expiryYear,
    };

    console.log("[Therapeutic] Registration data retrieved:", registrationData);

    return {
      success: true,
      data: registrationData,
    };
  } catch (error: any) {
    console.error("[Therapeutic] Error fetching registration:", error);
    return {
      success: false,
      error: "Failed to fetch therapeutic registration data.",
    };
  }
}
