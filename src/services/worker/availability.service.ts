"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { revalidatePath } from "next/cache";

/**
 * Backend Service: Worker Availability Management
 * Server actions for managing worker preferred hours/availability
 * Now stores all availability in a single JSON field
 */

// Response types
export type ActionResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
};

// Day of week type
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

// Time slot type
export interface TimeSlot {
  startTime: string; // Format: "HH:mm"
  endTime: string;   // Format: "HH:mm"
}

// Availability record (for backward compatibility with UI)
export interface AvailabilityData {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

// Availability JSON structure stored in database
export type AvailabilityJSON = Partial<Record<DayOfWeek, TimeSlot>>;

/**
 * Server Action: Get worker's availability
 * Fetches availability from WorkerAdditionalInfo JSON field
 */
export async function getWorkerAvailability(): Promise<ActionResponse<AvailabilityData[]>> {
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

    // Get availability from JSON field
    const availabilityJSON = (workerProfile.workerAdditionalInfo?.availability || {}) as AvailabilityJSON;

    // Convert JSON to array format for UI compatibility
    const formattedData: AvailabilityData[] = [];

    for (const [day, timeSlot] of Object.entries(availabilityJSON)) {
      if (timeSlot && timeSlot.startTime && timeSlot.endTime) {
        formattedData.push({
          dayOfWeek: day as DayOfWeek,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
        });
      }
    }

    return {
      success: true,
      data: formattedData,
    };
  } catch (error: any) {
    console.error("Error fetching worker availability:", error);
    return {
      success: false,
      error: "Failed to fetch availability. Please try again.",
    };
  }
}

/**
 * Server Action: Save worker's availability
 * Saves availability to JSON field in WorkerAdditionalInfo
 */
export async function saveWorkerAvailability(
  availabilityData: AvailabilityData[]
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

    // Validate data
    if (!Array.isArray(availabilityData) || availabilityData.length === 0) {
      return {
        success: false,
        error: "No availability data provided.",
      };
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    for (const record of availabilityData) {
      if (!timeRegex.test(record.startTime) || !timeRegex.test(record.endTime)) {
        return {
          success: false,
          error: "Invalid time format. Use HH:mm format (e.g., 09:00).",
        };
      }

      // Validate that end time is after start time
      if (record.startTime >= record.endTime) {
        return {
          success: false,
          error: `End time must be after start time for ${record.dayOfWeek}.`,
        };
      }
    }

    // Convert array to JSON object
    const availabilityJSON: AvailabilityJSON = {};
    availabilityData.forEach((record) => {
      availabilityJSON[record.dayOfWeek] = {
        startTime: record.startTime,
        endTime: record.endTime,
      };
    });

    // Upsert to WorkerAdditionalInfo
    await authPrisma.workerAdditionalInfo.upsert({
      where: {
        workerProfileId: workerProfile.id,
      },
      create: {
        workerProfileId: workerProfile.id,
        availability: availabilityJSON,
      },
      update: {
        availability: availabilityJSON,
      },
    });

    // Revalidate paths
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker/profile-preview");

    return {
      success: true,
      message: "Availability saved successfully!",
    };
  } catch (error: any) {
    console.error("Error saving worker availability:", error);
    return {
      success: false,
      error: "Failed to save availability. Please try again.",
    };
  }
}

/**
 * Server Action: Delete worker's availability for specific days
 * Removes availability for specified days from JSON field
 */
export async function deleteWorkerAvailability(
  daysToDelete: DayOfWeek[]
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

    // Get current availability
    const currentAvailability = (workerProfile.workerAdditionalInfo?.availability || {}) as AvailabilityJSON;

    // Remove specified days
    const updatedAvailability: AvailabilityJSON = { ...currentAvailability };
    daysToDelete.forEach((day) => {
      delete updatedAvailability[day];
    });

    // Update in database
    if (workerProfile.workerAdditionalInfo) {
      await authPrisma.workerAdditionalInfo.update({
        where: {
          workerProfileId: workerProfile.id,
        },
        data: {
          availability: updatedAvailability,
        },
      });
    } else {
      // Create if doesn't exist
      await authPrisma.workerAdditionalInfo.create({
        data: {
          workerProfileId: workerProfile.id,
          availability: updatedAvailability,
        },
      });
    }

    // Revalidate paths
    revalidatePath("/dashboard/worker/profile-building");
    revalidatePath("/dashboard/worker/profile-preview");

    return {
      success: true,
      message: "Availability deleted successfully!",
    };
  } catch (error: any) {
    console.error("Error deleting worker availability:", error);
    return {
      success: false,
      error: "Failed to delete availability. Please try again.",
    };
  }
}
