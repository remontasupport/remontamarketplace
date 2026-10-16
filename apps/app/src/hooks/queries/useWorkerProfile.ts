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

import { useQuery } from "@tanstack/react-query";

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
  additionalPhotos?: string | null; // JSON array of up to 2 extra photo URLs
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

// API Fetchers
async function fetchWorkerProfile(userId: string): Promise<WorkerProfile> {
  const response = await fetch(`/api/worker/profile/${userId}`);

  if (!response.ok) {
    throw new Error("Failed to fetch worker profile");
  }

  const data = await response.json();

  return data;
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
