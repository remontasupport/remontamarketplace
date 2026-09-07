"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth.config";
import { authPrisma } from "@/lib/auth-prisma";
import { revalidatePath } from "next/cache";
import { rebuildAvailability, safeRebuild, W1_TX, fromMinutes } from "@/lib/w1/promote";

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
export type TimeSlot = {
  startTime: string; // Format: "HH:mm"
  endTime: string;   // Format: "HH:mm"
}

// Availability record (for backward compatibility with UI)
export interface AvailabilityData {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

// Availability JSON structure stored in database (supports multiple time slots per day)
export type AvailabilityJSON = Partial<Record<DayOfWeek, TimeSlot | TimeSlot[]>>;

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

    // W1 P5 — reads come from worker_availability.
    //
    // Returns a flat array of { dayOfWeek, startTime, endTime }. The UI groups
    // by day itself, so order across days is irrelevant, but slot order within
    // a day is preserved via sortOrder. dayOfWeek must stay UPPERCASE: the UI
    // renders it with charAt(0) + slice(1).toLowerCase().
    //
    // The Json column is still written by the dual-write below and remains the
    // fallback: rolling the deployment back restores the Json path.
    const rows = await authPrisma.workerAvailability.findMany({
      where: { workerProfileId: workerProfile.id },
      // Postgres orders an enum by its declaration order, so this is
      // MONDAY..SUNDAY rather than alphabetical.
      orderBy: [{ dayOfWeek: "asc" }, { sortOrder: "asc" }, { startMinute: "asc" }],
    });

    return {
      success: true,
      data: rows.map((row) => ({
        dayOfWeek: row.dayOfWeek as DayOfWeek,
        // Zero-padded: the UI parses this as dayjs('2000-01-01T' + value).
        startTime: fromMinutes(row.startMinute),
        endTime: fromMinutes(row.endMinute),
      })),
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

    // Convert array to JSON object, grouping multiple time slots per day
    const availabilityJSON: AvailabilityJSON = {};

    // Group by day
    const dayGroups = availabilityData.reduce((acc, record) => {
      if (!acc[record.dayOfWeek]) {
        acc[record.dayOfWeek] = [];
      }
      acc[record.dayOfWeek].push({
        startTime: record.startTime,
        endTime: record.endTime,
      });
      return acc;
    }, {} as Record<DayOfWeek, TimeSlot[]>);

    // Store as single object if only one slot, otherwise as array
    Object.entries(dayGroups).forEach(([day, slots]) => {
      availabilityJSON[day as DayOfWeek] = slots.length === 1 ? slots[0] : slots;
    });

    // The Json write is the save. It must succeed on its own terms.
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

    // W1 dual-write. Deliberately AFTER the save and unable to fail it: the Json
    // write is the save and must not be held hostage to the derived copy. Its
    // own transaction keeps the delete and insert atomic. Remove at phase P7.
    //
    // Reads now come from this table, so a failed rebuild means the worker sees
    // "saved successfully" and then their previous hours. Not data loss — Json
    // stays authoritative and the reconcile repairs it — but watch the logs for
    // `[w1:availability] rebuild FAILED`.
    await safeRebuild("availability", workerProfile.id, () =>
      authPrisma.$transaction(
        (tx) => rebuildAvailability(tx, workerProfile.id, availabilityJSON),
        W1_TX,
      ),
    );

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

    // W1 dual-write, as above — after the save, unable to fail it.
    await safeRebuild("availability", workerProfile.id, () =>
      authPrisma.$transaction(
        (tx) => rebuildAvailability(tx, workerProfile.id, updatedAvailability),
        W1_TX,
      ),
    );

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
