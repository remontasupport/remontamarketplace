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
  photos?: string[];
  introduction?: string;
  age?: string;
  gender?: string;
  languages?: string[];
  location?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  services?: string[];
  supportWorkerCategories?: string[];
  experience?: string;
  qualifications?: string;
  hasVehicle?: string;
  funFact?: string;
  hobbies?: string;
  uniqueService?: string;
  whyEnjoyWork?: string;
  additionalInfo?: string;
  profileCompleted?: boolean;
  isPublished?: boolean;
  verificationStatus?: string;
  abn?: string;
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

  return response.json();
}

async function updateProfileStep(updateData: UpdateStepData): Promise<void> {
  const response = await fetch("/api/worker/profile/update-step", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    throw new Error("Failed to update profile step");
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
 */
export function useWorkerProfile(userId: string | undefined) {
  return useQuery({
    queryKey: workerProfileKeys.detail(userId || ""),
    queryFn: () => fetchWorkerProfile(userId!),
    enabled: !!userId, // Only fetch if userId exists
    staleTime: 5 * 60 * 1000, // 5 minutes - data is fresh
    gcTime: 30 * 60 * 1000, // 30 minutes - keep in cache
    retry: 1, // Retry once on failure
  });
}

/**
 * Hook to update worker profile step with cache invalidation
 *
 * Features:
 * - Invalidates cache on successful mutation
 * - Triggers automatic refetch
 * - Error handling built-in
 */
export function useUpdateProfileStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfileStep,
    onSuccess: (_, variables) => {
      // Invalidate and refetch the profile data
      queryClient.invalidateQueries({
        queryKey: workerProfileKeys.detail(variables.userId),
      });
    },
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
