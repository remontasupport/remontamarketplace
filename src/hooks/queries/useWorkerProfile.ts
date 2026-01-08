/**
 * Worker Profile Query Hooks
 *
 * Implements data fetching best practices from Best_Fetching_Practic.md:
 * - Smart caching with 5-minute stale time
 * - Background refetching for fresh data
 * - Cache invalidation on mutations
 * - Optimistic updates for better UX
 */

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  updateWorkerName,
  updateWorkerPhoto,
  updateWorkerBio,
  updateWorkerAddress,
  updateWorkerPersonalInfo,
} from "@/services/worker/profile.service";
import {
  updateWorkerABN,
} from "@/services/worker/compliance.service";

// Query Keys - centralized for consistency
export const workerProfileKeys = {
  all: ["worker-profile"] as const,
  detail: (userId: string) => [...workerProfileKeys.all, userId] as const,
};

// Types
interface WorkerProfile {
  id: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  mobile?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  location?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  photos?: string | null; // Profile photo URL (changed from array to string)
  introduction?: string; // Bio
  age?: number;
  dateOfBirth?: string;
  gender?: string;
  hasVehicle?: string;
  abn?: string;
  services?: string[];
  supportWorkerCategories?: string[];
  profileCompleted?: boolean;
  isPublished?: boolean;
  verificationStatus?: string;
  setupProgress?: any; // JSONB field
  documentsByService?: Record<string, Record<string, string[]>>; // Service documents from VerificationRequirement table
}

interface UpdateStepData {
  userId: string;
  step: number;
  data: any;
}

// API Fetchers
async function fetchWorkerProfile(userId: string): Promise<WorkerProfile> {
  const response = await fetch(`/api/worker/profile/${userId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch worker profile");
  }

  const data = await response.json();

  return data;
}

async function updateProfileStep(updateData: UpdateStepData): Promise<void> {
  const { step, data } = updateData;

  // Check if this is an ABN update (compliance step - can be any step number)
  if (data.abn !== undefined) {
    const abnResult = await updateWorkerABN({
      abn: data.abn,
    });
    if (!abnResult.success) {
      throw new Error(abnResult.error || "Failed to update ABN");
    }
    return;
  }

  // Route to appropriate server action based on step
  switch (step) {
    case 1: // Name
      const nameResult = await updateWorkerName({
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
      });
      if (!nameResult.success) {
        throw new Error(nameResult.error || "Failed to update name");
      }
      break;

    case 2: // Photo
      const photoResult = await updateWorkerPhoto({
        photo: data.photo,
      });
      if (!photoResult.success) {
        throw new Error(photoResult.error || "Failed to update photo");
      }
      break;

    case 3: // Bio
      const bioResult = await updateWorkerBio({
        bio: data.bio,
      });
      if (!bioResult.success) {
        throw new Error(bioResult.error || "Failed to update bio");
      }
      break;

    case 4: // Address
      const addressResult = await updateWorkerAddress({
        streetAddress: data.streetAddress,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
      });
      if (!addressResult.success) {
        throw new Error(addressResult.error || "Failed to update address");
      }
      break;

    case 5: // Personal Info
      const personalInfoResult = await updateWorkerPersonalInfo({
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        hasVehicle: data.hasVehicle,
      });
      if (!personalInfoResult.success) {
        throw new Error(personalInfoResult.error || "Failed to update personal information");
      }
      break;

    default:
      // For steps not yet refactored (7, 101, 102, etc.), use the old API route
      const response = await fetch("/api/worker/profile/update-step", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile step");
      }
      break;
  }
}

// Hooks

/**
 * Hook to fetch worker profile with smart caching
 *
 * Features:
 * - Caches data for 5 minutes (staleTime)
 * - Keeps cached data for 30 minutes (gcTime)
 * - Automatic background refetching when stale
 * - Deduplicates simultaneous requests
 * - CRITICAL: Always refetches on window focus to ensure setupProgress checkmarks are current
 */
export function useWorkerProfile(userId: string | undefined, options?: {
  refetchInterval?: number | false;
  refetchOnMount?: boolean | 'always';
  refetchOnWindowFocus?: boolean;
}) {
  return useQuery({
    queryKey: workerProfileKeys.detail(userId || ""),
    queryFn: () => fetchWorkerProfile(userId!),
    enabled: !!userId, // Only fetch if userId exists
    staleTime: 0, // CRITICAL: Always fetch fresh data (setupProgress is calculated in real-time)
    gcTime: 5 * 60 * 1000, // 5 minutes - keep in memory for quick access
    retry: 1, // Retry once on failure
    refetchOnWindowFocus: options?.refetchOnWindowFocus ?? true, // Refetch when window gains focus
    refetchOnMount: options?.refetchOnMount ?? 'always', // CRITICAL: ALWAYS refetch on mount (even if data is fresh)
    refetchInterval: options?.refetchInterval ?? false, // Optional polling
  });
}

/**
 * Hook to update worker profile step (OPTIMIZED - no auto-refetch)
 *
 * Features:
 * - Fast mutations without blocking refetch
 * - Manual cache invalidation only when needed (e.g., on last step)
 * - Background sync updates setupProgress in database
 * - Error handling built-in
 *
 * PERFORMANCE: Removed automatic cache invalidation on every save
 * - Old: Save → Invalidate → Refetch (4 completion checks) → 500-1000ms total
 * - New: Save → Return immediately → ~100ms total
 * - Profile refetches automatically on dashboard mount via staleTime: 0
 */
export function useUpdateProfileStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfileStep,
    // REMOVED onSuccess invalidation - no auto-refetch on every save
    // Profile will refetch when user navigates to dashboard (staleTime: 0)
  });
}

/**
 * Hook for optimistic updates (optional - for better UX)
 *
 * Updates the UI immediately before the server responds
 */
export function useOptimisticProfileUpdate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfileStep,
    onMutate: async (updateData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: workerProfileKeys.detail(updateData.userId),
      });

      // Snapshot the previous value
      const previousProfile = queryClient.getQueryData(
        workerProfileKeys.detail(updateData.userId)
      );

      // Optimistically update to the new value
      queryClient.setQueryData(
        workerProfileKeys.detail(updateData.userId),
        (old: WorkerProfile | undefined) => {
          if (!old) return old;
          return { ...old, ...updateData.data };
        }
      );

      // Return context with the snapshot
      return { previousProfile };
    },
    onError: (err, updateData, context) => {
      // Rollback to the previous value on error
      if (context?.previousProfile) {
        queryClient.setQueryData(
          workerProfileKeys.detail(updateData.userId),
          context.previousProfile
        );
      }
    },
    onSettled: (_, __, variables) => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({
        queryKey: workerProfileKeys.detail(variables.userId),
      });
    },
  });
}
