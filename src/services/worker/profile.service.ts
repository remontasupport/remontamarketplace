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
  updateWorkerBioSchema,
  type UpdateWorkerBioData,
  updateWorkerAddressSchema,
  type UpdateWorkerAddressData,
} from "@/schema/workerProfileSchema";
import { z } from "zod";
import { dbWriteRateLimit, checkServerActionRateLimit } from "@/lib/ratelimit";
import { geocodeAddress } from "@/lib/geocoding";

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

/**
 * Server Action: Update worker's bio
 * Uses Zod schema validation and rate limiting
 * Saves to the introduction column with minimum 200 characters requirement
 */
export async function updateWorkerBio(
  data: UpdateWorkerBioData
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
    const validationResult = updateWorkerBioSchema.safeParse(data);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: fieldErrors as Record<string, string[]>,
      };
    }

    const validatedData = validationResult.data;

    // 4. Update worker profile bio in database
    const updatedProfile = await authPrisma.workerProfile.update({
      where: {
        userId: session.user.id,
      },
      data: {
        introduction: validatedData.bio.trim(),
      },
      select: {
        introduction: true,
      },
    });

    // 5. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/account/setup");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your bio has been saved successfully!",
      data: updatedProfile,
    };
  } catch (error: any) {
    console.error("Error updating worker bio:", error);
    return {
      success: false,
      error: "Failed to save your bio. Please try again.",
    };
  }
}

/**
 * Server Action: Update worker's address
 * Uses Zod schema validation and rate limiting
 * Automatically geocodes the address to get latitude/longitude
 */
export async function updateWorkerAddress(
  data: UpdateWorkerAddressData
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
    const validationResult = updateWorkerAddressSchema.safeParse(data);

    if (!validationResult.success) {
      const fieldErrors = validationResult.error.flatten().fieldErrors;
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: fieldErrors as Record<string, string[]>,
      };
    }

    const validatedData = validationResult.data;

    // 4. Build location string (concatenate address parts)
    const locationParts = [
      validatedData.streetAddress,
      validatedData.city,
      validatedData.state,
      validatedData.postalCode
    ].filter(Boolean);
    const location = locationParts.join(", ");

    // 5. Geocode the address to get latitude/longitude
    let latitude: number | null = null;
    let longitude: number | null = null;

    try {
      const geocodeResult = await geocodeAddress(location);
      if (geocodeResult) {
        latitude = geocodeResult.latitude;
        longitude = geocodeResult.longitude;
        console.log(`[Geocoding] Successfully geocoded: ${location} -> (${latitude}, ${longitude})`);
      } else {
        console.warn(`[Geocoding] Failed to geocode address: ${location}`);
        // Don't fail the entire request if geocoding fails
        // The address will still be saved without coordinates
      }
    } catch (geocodeError) {
      console.error(`[Geocoding] Error during geocoding:`, geocodeError);
      // Continue without coordinates rather than failing
    }

    // 6. Update worker profile in database
    const updatedProfile = await authPrisma.workerProfile.update({
      where: {
        userId: session.user.id,
      },
      data: {
        location,
        city: validatedData.city,
        state: validatedData.state,
        postalCode: validatedData.postalCode,
        latitude,
        longitude,
      },
      select: {
        location: true,
        city: true,
        state: true,
        postalCode: true,
        latitude: true,
        longitude: true,
      },
    });

    // 7. Revalidate the profile page cache
    revalidatePath("/dashboard/worker/account/setup");
    revalidatePath("/dashboard/worker");

    return {
      success: true,
      message: "Your address has been saved successfully!",
      data: updatedProfile,
    };
  } catch (error: any) {
    console.error("Error updating worker address:", error);
    return {
      success: false,
      error: "Failed to save your address. Please try again.",
    };
  }
}
