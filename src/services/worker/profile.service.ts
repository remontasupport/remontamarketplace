"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { revalidatePath } from "next/cache";
import {
  updateWorkerNameSchema,
  type UpdateWorkerNameData,
  updateWorkerPhotoSchema,
  type UpdateWorkerPhotoData,
} from "@/schema/workerProfileSchema";
import { z } from "zod";
import { dbWriteRateLimit, checkServerActionRateLimit } from "@/lib/ratelimit";

/**
 * Backend Service: Worker Profile Management
 * Server actions for worker profile updates with Zod validation
 */

// Response types
export type ActionResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/**
 * Server Action: Update worker's name
 * Uses Zod schema validation and rate limiting
 */
export async function updateWorkerName(
  data: UpdateWorkerNameData
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

    // 3. Validate input data with Zod
    const validationResult = updateWorkerNameSchema.safeParse(data);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: fieldErrors as Record<string, string[]>,
      };
    }

    const validatedData = validationResult.data;

    // 4. Update worker profile in database
    const updatedProfile = await authPrisma.workerProfile.update({
      where: {
        userId: session.user.id,
      },
      data: {
        firstName: validatedData.firstName.trim(),
        middleName: validatedData.middleName?.trim() || null,
        lastName: validatedData.lastName.trim(),
      },
      select: {
        firstName: true,
        middleName: true,
        lastName: true,
      },
    });

    // 5. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/account/setup");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your name has been saved successfully!",
      data: updatedProfile,
    };
  } catch (error: any) {
    console.error("Error updating worker name:", error);
    return {
      success: false,
      error: "Failed to save your name. Please try again.",
    };
  }
}

/**
 * Server Action: Get worker profile data
 * Fetches current profile information for the authenticated user
 */
export async function getWorkerProfile(): Promise<ActionResponse> {
  try {
    // 1. Authentication check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return {
        success: false,
        error: "Unauthorized. Please log in.",
      };
    }

    // 2. Fetch worker profile
    const profile = await authPrisma.workerProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        firstName: true,
        middleName: true,
        lastName: true,
        photos: true,
      },
    });

    if (!profile) {
      return {
        success: false,
        error: "Worker profile not found",
      };
    }

    return {
      success: true,
      data: profile,
    };
  } catch (error: any) {
    console.error("Error fetching worker profile:", error);
    return {
      success: false,
      error: "Failed to load profile data",
    };
  }
}

/**
 * Server Action: Update worker's profile photo
 * Uses Zod schema validation and rate limiting
 * Photo should be uploaded to blob storage first, then URL saved here
 */
export async function updateWorkerPhoto(
  data: UpdateWorkerPhotoData
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

    // 3. Validate input data with Zod
    const validationResult = updateWorkerPhotoSchema.safeParse(data);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: fieldErrors as Record<string, string[]>,
      };
    }

    const validatedData = validationResult.data;

    // 4. Update worker profile photo in database
    const updatedProfile = await authPrisma.workerProfile.update({
      where: {
        userId: session.user.id,
      },
      data: {
        photos: validatedData.photo, // Now a string, not an array
      },
      select: {
        photos: true,
      },
    });

    // 5. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/account/setup");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your photo has been saved successfully!",
      data: updatedProfile,
    };
  } catch (error: any) {
    console.error("Error updating worker photo:", error);
    return {
      success: false,
      error: "Failed to save your photo. Please try again.",
    };
  }
}
