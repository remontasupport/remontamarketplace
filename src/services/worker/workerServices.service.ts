"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { revalidatePath } from "next/cache";
import { dbWriteRateLimit, checkServerActionRateLimit } from "@/lib/ratelimit";

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

      return {
        success: true,
        message: `Removed ${subcategoryName}`,
        data: { action: "removed", subcategoryId },
      };
    } else {
      // Add the subcategory
      await authPrisma.workerService.create({
        data: {
          workerProfileId: workerProfile.id,
          categoryId,
          categoryName,
          subcategoryId,
          subcategoryName,
        },
      });

      // 5. Revalidate cache
      revalidatePath("/dashboard/worker/services/setup");
      revalidatePath("/dashboard/worker");

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

    // 4. Remove all existing subcategories for this category
    await authPrisma.workerService.deleteMany({
      where: {
        workerProfileId: workerProfile.id,
        categoryId,
      },
    });

    // 5. Add new subcategories
    if (subcategoryIds.length > 0) {
      const servicesToCreate = subcategoryIds.map((subcategoryId) => {
        const subcategory = subcategories.find((s) => s.id === subcategoryId);
        return {
          workerProfileId: workerProfile.id,
          categoryId,
          categoryName,
          subcategoryId,
          subcategoryName: subcategory?.name || "",
        };
      });

      await authPrisma.workerService.createMany({
        data: servicesToCreate,
      });
    }

    // 6. Revalidate cache
    revalidatePath("/dashboard/worker/services/setup");
    revalidatePath("/dashboard/worker");

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
